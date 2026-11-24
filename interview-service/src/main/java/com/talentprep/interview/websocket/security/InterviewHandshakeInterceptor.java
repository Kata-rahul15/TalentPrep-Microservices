package com.talentprep.interview.websocket.security;

import com.talentprep.interview.identity.AuthenticatedUser;
import com.talentprep.interview.identity.GatewayIdentityFilter;
import jakarta.servlet.http.Cookie;
import org.springframework.http.HttpCookie;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;


import java.util.Map;
import java.util.UUID;

/**
 * The API Gateway authenticates the HttpOnly JWT cookie and injects identity headers.
 * This interceptor only accepts those headers because the service is private-network only.
 */
public class InterviewHandshakeInterceptor implements HandshakeInterceptor {
    public static final String USER_ID_ATTRIBUTE = "talentprep.authenticatedUserId";
    public static final String EMAIL_ATTRIBUTE = "talentprep.authenticatedUserEmail";
    public static final String CSRF_ATTRIBUTE = "talentprep.csrfToken";
    public static final String TOKEN_EXPIRY_ATTRIBUTE = "talentprep.tokenExpiryEpochSeconds";

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {

        // Only allow Servlet-based HTTP requests
        if (!(request instanceof ServletServerHttpRequest servletRequest)) {
            return false;
        }

        // Get authenticated identity established by the API Gateway filter
        Object identity = servletRequest.getServletRequest()
                .getAttribute(GatewayIdentityFilter.AUTHENTICATED_USER_ATTRIBUTE);

        if (!(identity instanceof AuthenticatedUser authenticatedUser)
                || authenticatedUser.getUserId() == null) {
            return false;
        }

        // Store authenticated user ID
        UUID userId = authenticatedUser.getUserId();
        attributes.put(USER_ID_ATTRIBUTE, userId.toString());

        // Store authenticated email if available
        if (authenticatedUser.getEmail() != null) {
            attributes.put(EMAIL_ATTRIBUTE, authenticatedUser.getEmail());
        }

        // Validate token expiry forwarded by API Gateway
        String expiry = request.getHeaders()
                .getFirst("X-Authenticated-Token-Expires-At");

        if (expiry == null || expiry.isBlank()) {
            return false;
        }

        try {
            attributes.put(
                    TOKEN_EXPIRY_ATTRIBUTE,
                    Long.parseLong(expiry)
            );
        } catch (NumberFormatException invalidExpiry) {
            return false;
        }

        // Extract CSRF cookie from the incoming HTTP handshake request
        Cookie[] cookies = servletRequest.getServletRequest().getCookies();

        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if ("XSRF-TOKEN".equals(cookie.getName())) {
                    attributes.put(CSRF_ATTRIBUTE, cookie.getValue());
                    break;
                }
            }
        }

        return true;
    }
    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                               WebSocketHandler wsHandler, Exception exception) {
        // No post-handshake work required.
    }
}
