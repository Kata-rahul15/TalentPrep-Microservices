package com.example.api_gateway.filter;

import com.example.api_gateway.security.JwtUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.core.io.buffer.DataBuffer;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.http.server.reactive.ServerHttpResponse;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class JwtAuthenticationFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthenticationFilter.class);
    private static final AntPathMatcher pathMatcher = new AntPathMatcher();

    private static final String[] PUBLIC_PATHS = {
            "/api/auth/**",
            "/actuator/health",
            "/actuator/**",
            "/health"
    };

    private static final String[] IDENTITY_HEADERS = {
            "X-Authenticated-User-Id",
            "X-Authenticated-User-Email",
            "X-User-Id",
            "X-User-Email"
    };

    private final JwtUtil jwtUtil;

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        // Check if route is public
        for (String publicPath : PUBLIC_PATHS) {
            if (pathMatcher.match(publicPath, path)) {
                // Anti-spoofing: Strip client-supplied identity headers on public routes
                ServerHttpRequest cleanedRequest = exchange.getRequest().mutate()
                        .headers(headers -> {
                            for (String header : IDENTITY_HEADERS) {
                                headers.remove(header);
                            }
                        })
                        .build();
                return chain.filter(exchange.mutate().request(cleanedRequest).build());
            }
        }

        // Protected route logic: Extract token from cookie (AccessToken or accessToken)
        String token = extractTokenFromCookie(exchange.getRequest());

        if (token == null || token.isBlank()) {
            log.debug("Protected request to {} missing AccessToken cookie.", path);
            return handleUnauthorized(exchange, "Authentication required");
        }

        return jwtUtil.validateToken(token)
                .flatMap(jwt -> {
                    String email = jwt.getSubject();
                    Object userIdClaim = jwt.getClaim("userId");
                    String userId = userIdClaim != null ? userIdClaim.toString() : null;

                    log.debug("JWT validated successfully for email: {}, userId: {}", email, userId);

                    // Anti-spoofing: Remove client identity headers and inject validated identity
                    ServerHttpRequest mutatedRequest = exchange.getRequest().mutate()
                            .headers(headers -> {
                                for (String header : IDENTITY_HEADERS) {
                                    headers.remove(header);
                                }
                                if (userId != null) {
                                    headers.set("X-Authenticated-User-Id", userId);
                                    headers.set("X-User-Id", userId);
                                }
                                if (email != null) {
                                    headers.set("X-Authenticated-User-Email", email);
                                    headers.set("X-User-Email", email);
                                }
                            })
                            .build();

                    return chain.filter(exchange.mutate().request(mutatedRequest).build());
                })
                .onErrorResume(ex -> {
                    log.debug("JWT validation failed for path {}: {}", path, ex.getMessage());
                    return handleUnauthorized(exchange, "Invalid or expired token");
                });
    }

    private String extractTokenFromCookie(ServerHttpRequest request) {
        List<HttpCookie> cookies = request.getCookies().get("AccessToken");
        if (cookies == null || cookies.isEmpty()) {
            cookies = request.getCookies().get("accessToken");
        }
        if (cookies != null && !cookies.isEmpty()) {
            return cookies.get(0).getValue();
        }
        return null;
    }

    private Mono<Void> handleUnauthorized(ServerWebExchange exchange, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String jsonBody = String.format("{\"status\":401,\"error\":\"Unauthorized\",\"message\":\"%s\"}", message);
        DataBuffer buffer = response.bufferFactory().wrap(jsonBody.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return -100;
    }
}
