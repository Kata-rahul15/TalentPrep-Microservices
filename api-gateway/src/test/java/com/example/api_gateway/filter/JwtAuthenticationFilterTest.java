package com.example.api_gateway.filter;

import com.example.api_gateway.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.http.HttpCookie;
import org.springframework.http.HttpStatus;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class JwtAuthenticationFilterTest {

    private JwtUtil jwtUtil;
    private JwtAuthenticationFilter filter;
    private GatewayFilterChain filterChain;

    @BeforeEach
    void setUp() {
        jwtUtil = Mockito.mock(JwtUtil.class);
        filter = new JwtAuthenticationFilter(jwtUtil);
        filterChain = Mockito.mock(GatewayFilterChain.class);
        when(filterChain.filter(any(ServerWebExchange.class))).thenReturn(Mono.empty());
    }

    @Test
    void testPublicRoutePassesThroughAndStripsIdentityHeaders() {
        MockServerHttpRequest request = MockServerHttpRequest.post("/api/auth/login")
                .header("X-Authenticated-User-Id", "attacker-id")
                .header("X-Authenticated-User-Email", "attacker@example.com")
                .header("X-User-Email", "attacker@example.com")
                .header("X-User-Id", "attacker-id")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();

        verify(filterChain).filter(Mockito.argThat(ex -> {
            assertNull(ex.getRequest().getHeaders().getFirst("X-Authenticated-User-Id"));
            assertNull(ex.getRequest().getHeaders().getFirst("X-Authenticated-User-Email"));
            assertNull(ex.getRequest().getHeaders().getFirst("X-User-Id"));
            assertNull(ex.getRequest().getHeaders().getFirst("X-User-Email"));
            return true;
        }));
    }

    @Test
    void testProtectedRouteWithoutCookieReturns401() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/resumes/me").build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void testProtectedRouteWithInvalidCookieReturns401() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/resumes/me")
                .cookie(new HttpCookie("AccessToken", "invalid.jwt.token"))
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        when(jwtUtil.validateToken("invalid.jwt.token"))
                .thenReturn(Mono.error(new RuntimeException("Invalid token")));

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void testProtectedRouteWithBlacklistedCookieReturns401() {
        MockServerHttpRequest request = MockServerHttpRequest.get("/api/resumes/me")
                .cookie(new HttpCookie("AccessToken", "blacklisted.jwt.token"))
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        when(jwtUtil.validateToken("blacklisted.jwt.token"))
                .thenReturn(Mono.error(new IllegalArgumentException("Token has been revoked")));

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();

        assertEquals(HttpStatus.UNAUTHORIZED, exchange.getResponse().getStatusCode());
    }

    @Test
    void testProtectedRouteWithValidCookieInjectsIdentityAndStripsSpoofedHeaders() {
        String testUserId = UUID.randomUUID().toString();
        String testEmail = "realuser@example.com";

        MockServerHttpRequest request = MockServerHttpRequest.get("/api/resumes/me")
                .cookie(new HttpCookie("AccessToken", "valid.jwt.token"))
                .header("X-Authenticated-User-Id", "attacker-id")
                .header("X-Authenticated-User-Email", "attacker@example.com")
                .header("X-User-Email", "attacker@example.com")
                .header("X-User-Id", "attacker-id")
                .build();
        MockServerWebExchange exchange = MockServerWebExchange.from(request);

        Jwt jwt = new Jwt(
                "valid.jwt.token",
                Instant.now(),
                Instant.now().plusSeconds(900),
                Map.of("alg", "HS256"),
                Map.of("sub", testEmail, "userId", testUserId)
        );

        when(jwtUtil.validateToken("valid.jwt.token")).thenReturn(Mono.just(jwt));

        StepVerifier.create(filter.filter(exchange, filterChain))
                .verifyComplete();

        verify(filterChain).filter(Mockito.argThat(ex -> {
            String passedAuthUserId = ex.getRequest().getHeaders().getFirst("X-Authenticated-User-Id");
            String passedAuthEmail = ex.getRequest().getHeaders().getFirst("X-Authenticated-User-Email");
            String passedUserId = ex.getRequest().getHeaders().getFirst("X-User-Id");
            String passedEmail = ex.getRequest().getHeaders().getFirst("X-User-Email");

            return testUserId.equals(passedAuthUserId) &&
                   testEmail.equals(passedAuthEmail) &&
                   testUserId.equals(passedUserId) &&
                   testEmail.equals(passedEmail);
        }));
    }
}
