package com.talentprep.interview.websocket.security;

import org.springframework.http.server.ServerHttpRequest;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.support.DefaultHandshakeHandler;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

public class InterviewHandshakeHandler extends DefaultHandshakeHandler {
    @Override
    protected Principal determineUser(ServerHttpRequest request, WebSocketHandler wsHandler,
                                      Map<String, Object> attributes) {
        Object rawId = attributes.get(InterviewHandshakeInterceptor.USER_ID_ATTRIBUTE);
        if (!(rawId instanceof String userId)) return null;
        Object rawEmail = attributes.get(InterviewHandshakeInterceptor.EMAIL_ATTRIBUTE);
        return new InterviewPrincipal(UUID.fromString(userId), rawEmail instanceof String email ? email : null);
    }
}
