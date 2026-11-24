package com.Resume.Ai.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/**
 * Authenticates marked service-to-service calls.
 *
 * Browser requests continue to use the Gateway-injected user identity headers.
 * Calls marked as interview-service must additionally present the shared
 * internal credential. Keep this service private behind the API Gateway.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 5)
public class InternalServiceAuthenticationFilter extends OncePerRequestFilter {

    public static final String SERVICE_NAME_HEADER = "X-Internal-Service-Name";
    public static final String SERVICE_TOKEN_HEADER = "X-Internal-Service-Token";
    private static final String INTERVIEW_SERVICE = "interview-service";

    private final String expectedToken;

    public InternalServiceAuthenticationFilter(
            @Value("${security.internal-services.interview-token:}") String expectedToken) {
        this.expectedToken = expectedToken == null ? "" : expectedToken.trim();
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.equals("/health")
                || path.equals("/actuator/health")
                || path.startsWith("/actuator/health/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain) throws ServletException, IOException {
        String callingService = request.getHeader(SERVICE_NAME_HEADER);

        // Only explicitly marked service requests enter this authentication path.
        // Unmarked browser requests still require Gateway identity at controller level.
        String suppliedToken = request.getHeader(SERVICE_TOKEN_HEADER);
        if ((callingService == null || callingService.isBlank())
                && (suppliedToken == null || suppliedToken.isBlank())) {
            chain.doFilter(request, response);
            return;
        }

        if (callingService == null
                || !INTERVIEW_SERVICE.equals(callingService.trim())
                || expectedToken.isBlank()
                || !constantTimeEquals(expectedToken, suppliedToken)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.setCharacterEncoding(StandardCharsets.UTF_8.name());
            response.getWriter().write("{\"status\":401,\"error\":\"INVALID_INTERNAL_SERVICE_CREDENTIAL\","
                    + "\"message\":\"The internal service credential is missing or invalid.\"}");
            return;
        }

        chain.doFilter(request, response);
    }

    private boolean constantTimeEquals(String expected, String actual) {
        if (actual == null || actual.isBlank()) return false;
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.trim().getBytes(StandardCharsets.UTF_8));
    }
}
