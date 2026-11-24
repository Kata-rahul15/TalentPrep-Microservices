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
            "/api/csrf",
            "/actuator/health",
            "/actuator/**",
            "/health"
    };

    private static final String[] IDENTITY_HEADERS = {
            "X-Authenticated-User-Id",
            "X-Authenticated-User-Email",
            "X-User-Id",
            "X-User-Email",
            "X-Authenticated-Token-Expires-At"
    };

    private final JwtUtil jwtUtil;

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        // Always remove identity headers supplied by the caller before making any trust decision.
        ServerHttpRequest sanitizedRequest = exchange.getRequest().mutate()
                .headers(headers -> {
                    for (String header : IDENTITY_HEADERS) {
                        headers.remove(header);
                    }
                })
                .build();
        ServerWebExchange sanitizedExchange = exchange.mutate().request(sanitizedRequest).build();

        if (exchange.getRequest().getMethod() == org.springframework.http.HttpMethod.OPTIONS) {
            return chain.filter(sanitizedExchange);
        }

        for (String publicPath : PUBLIC_PATHS) {
            if (pathMatcher.match(publicPath, path)) {
                return chain.filter(sanitizedExchange);
            }
        }

        // The same filter protects ordinary HTTP routes and the WebSocket HTTP handshake.
        String token = extractTokenFromCookie(sanitizedRequest);
        if (token == null || token.isBlank()) {
            log.debug("Protected request to {} is missing AccessToken cookie.", path);
            return handleUnauthorized(sanitizedExchange, "Authentication required");
        }

        return jwtUtil.validateToken(token)
                .flatMap(jwt -> {
                    String email = jwt.getSubject();
                    Object userIdClaim = jwt.getClaim("userId");
                    String userId = userIdClaim == null ? null : userIdClaim.toString();

                    // A valid signature alone is insufficient for TalentPrep: downstream services
                    // require a stable UUID and subject to establish resource ownership.
                    if (email == null || email.isBlank() || userId == null || userId.isBlank()) {
                        return handleUnauthorized(sanitizedExchange, "Token is missing required identity claims");
                    }
                    try {
                        java.util.UUID.fromString(userId);
                    } catch (IllegalArgumentException invalidUserId) {
                        return handleUnauthorized(sanitizedExchange, "Token contains an invalid user identity");
                    }

                    log.debug("JWT validated for authenticated user id {}", userId);
                    ServerHttpRequest authenticatedRequest = sanitizedRequest.mutate()
                            .headers(headers -> {
                                headers.set("X-Authenticated-User-Id", userId);
                                headers.set("X-User-Id", userId);
                                headers.set("X-Authenticated-User-Email", email);
                                headers.set("X-User-Email", email);
                                if (jwt.getExpiresAt() != null) {
                                    headers.set("X-Authenticated-Token-Expires-At",
                                            Long.toString(jwt.getExpiresAt().getEpochSecond()));
                                }
                            })
                            .build();
                    return chain.filter(sanitizedExchange.mutate().request(authenticatedRequest).build());
                })
                .onErrorResume(ex -> {
                    log.warn("JWT validation failed for path {}: {}", path, ex.getClass().getSimpleName());
                    if (ex instanceof com.example.api_gateway.security.TokenRevocationStoreUnavailableException) {
                        return handleServiceUnavailable(sanitizedExchange,
                                "Authentication revocation checks are temporarily unavailable");
                    }
                    return handleUnauthorized(sanitizedExchange, "Invalid, expired, or revoked token");
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


    private Mono<Void> handleServiceUnavailable(ServerWebExchange exchange, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.SERVICE_UNAVAILABLE);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        String jsonBody = String.format("{\"status\":503,\"error\":\"Service Unavailable\",\"message\":\"%s\"}", message);
        DataBuffer buffer = response.bufferFactory().wrap(jsonBody.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }

    @Override
    public int getOrder() {
        return -100;
    }
}
