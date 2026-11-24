package com.talentprep.interview.websocket.security;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Map;

/** Restricts STOMP destinations and validates the double-submit CSRF token on CONNECT. */
public class InterviewStompAuthorizationInterceptor implements ChannelInterceptor {
    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null) return message;

        StompCommand command = accessor.getCommand();
        if (command == StompCommand.CONNECT || command == StompCommand.SEND || command == StompCommand.SUBSCRIBE) {
            ensureTokenNotExpired(accessor);
        }
        if (command == StompCommand.CONNECT) {
            if (accessor.getUser() == null) throw new IllegalArgumentException("Authenticated WebSocket principal required");
            Map<String, Object> session = accessor.getSessionAttributes();
            Object expected = session == null ? null : session.get(InterviewHandshakeInterceptor.CSRF_ATTRIBUTE);
            String supplied = accessor.getFirstNativeHeader("X-XSRF-TOKEN");
            if (!(expected instanceof String expectedToken) || supplied == null || !constantTimeEquals(expectedToken, supplied)) {
                throw new IllegalArgumentException("Missing or invalid WebSocket CSRF token");
            }
        } else if (command == StompCommand.SEND) {
            String destination = accessor.getDestination();
            if (accessor.getUser() == null || destination == null || !destination.startsWith("/app/interviews/")) {
                throw new IllegalArgumentException("STOMP SEND destination is not allowed");
            }
        } else if (command == StompCommand.SUBSCRIBE) {
            String destination = accessor.getDestination();
            if (accessor.getUser() == null || destination == null ||
                    (!destination.equals("/user/queue/interviews/events") && !destination.startsWith("/topic/interviews/"))) {
                throw new IllegalArgumentException("STOMP SUBSCRIBE destination is not allowed");
            }
        }
        return message;
    }

    private void ensureTokenNotExpired(StompHeaderAccessor accessor) {
        Map<String, Object> session = accessor.getSessionAttributes();
        Object rawExpiry = session == null ? null : session.get(InterviewHandshakeInterceptor.TOKEN_EXPIRY_ATTRIBUTE);
        if (!(rawExpiry instanceof Long expiry) || expiry <= Instant.now().getEpochSecond()) {
            throw new IllegalArgumentException("WebSocket access token has expired");
        }
    }

    private boolean constantTimeEquals(String expected, String supplied) {
        return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), supplied.getBytes(StandardCharsets.UTF_8));
    }
}
