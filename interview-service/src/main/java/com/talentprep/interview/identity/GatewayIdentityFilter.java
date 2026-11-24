package com.talentprep.interview.identity;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Reads identity headers that the API Gateway has already authenticated and injected.
 * This filter does NOT validate JWTs. The service must only be reachable through a trusted gateway.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
public class GatewayIdentityFilter extends OncePerRequestFilter {

    public static final String AUTH_USER_ID_HEADER = "X-Authenticated-User-Id";
    public static final String FALLBACK_USER_ID_HEADER = "X-User-Id";
    public static final String AUTH_USER_EMAIL_HEADER = "X-Authenticated-User-Email";
    public static final String FALLBACK_USER_EMAIL_HEADER = "X-User-Email";
    public static final String AUTHENTICATED_USER_ATTRIBUTE = GatewayIdentityFilter.class.getName() + ".AUTHENTICATED_USER";

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        String path = request.getRequestURI();
        return path.equals("/health") || path.equals("/actuator/health") || path.startsWith("/actuator/health/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String rawUserId = firstNonBlank(
                request.getHeader(AUTH_USER_ID_HEADER), request.getHeader(FALLBACK_USER_ID_HEADER));

        if (rawUserId == null) {
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "MISSING_GATEWAY_IDENTITY",
                    "Missing trusted gateway identity.");
            return;
        }

        final UUID userId;
        try {
            userId = UUID.fromString(rawUserId.trim());
        } catch (IllegalArgumentException ex) {
            writeError(response, HttpServletResponse.SC_BAD_REQUEST, "INVALID_GATEWAY_USER_ID",
                    "Invalid authenticated user ID format.");
            return;
        }

        String email = firstNonBlank(
                request.getHeader(AUTH_USER_EMAIL_HEADER), request.getHeader(FALLBACK_USER_EMAIL_HEADER));
        request.setAttribute(AUTHENTICATED_USER_ATTRIBUTE, new AuthenticatedUser(userId, email));
        chain.doFilter(request, response);
    }

    private void writeError(HttpServletResponse response, int status, String code, String message)
            throws IOException {
        response.setStatus(status);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("{\"status\":" + status + ",\"error\":\"" + code
                + "\",\"message\":\"" + message + "\"}");
    }

    private String firstNonBlank(String primary, String fallback) {
        if (primary != null && !primary.isBlank()) return primary;
        if (fallback != null && !fallback.isBlank()) return fallback;
        return null;
    }
}
