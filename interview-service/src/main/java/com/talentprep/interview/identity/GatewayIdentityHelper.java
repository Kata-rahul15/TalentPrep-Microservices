package com.talentprep.interview.identity;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import java.util.UUID;

/** Small adapter for retrieving the identity injected by GatewayIdentityFilter. */
@Component
public class GatewayIdentityHelper {

    public UUID requireCurrentUserId() {
        return requireCurrentUser().getUserId();
    }

    public AuthenticatedUser getCurrentUser() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (!(attributes instanceof ServletRequestAttributes servletAttributes)) return null;
        HttpServletRequest request = servletAttributes.getRequest();
        Object principal = request.getAttribute(GatewayIdentityFilter.AUTHENTICATED_USER_ATTRIBUTE);
        return principal instanceof AuthenticatedUser user ? user : null;
    }

    private AuthenticatedUser requireCurrentUser() {
        AuthenticatedUser user = getCurrentUser();
        if (user == null || user.getUserId() == null) {
            throw new MissingGatewayIdentityException("A trusted user identity from the API Gateway is required.");
        }
        return user;
    }
}
