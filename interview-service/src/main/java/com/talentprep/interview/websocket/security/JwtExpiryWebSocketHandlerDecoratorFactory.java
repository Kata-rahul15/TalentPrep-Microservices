package com.talentprep.interview.websocket.security;

import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.WebSocketHandlerDecorator;
import org.springframework.web.socket.handler.WebSocketHandlerDecoratorFactory;

import java.time.Instant;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

/** Closes an authenticated WebSocket when the access JWT used at handshake expires. */
public class JwtExpiryWebSocketHandlerDecoratorFactory implements WebSocketHandlerDecoratorFactory {
    private final ScheduledExecutorService scheduler;

    public JwtExpiryWebSocketHandlerDecoratorFactory(ScheduledExecutorService scheduler) {
        this.scheduler = scheduler;
    }

    @Override
    public WebSocketHandler decorate(WebSocketHandler handler) {
        return new WebSocketHandlerDecorator(handler) {
            @Override
            public void afterConnectionEstablished(WebSocketSession session) throws Exception {
                super.afterConnectionEstablished(session);
                Object rawExpiry = session.getAttributes().get(InterviewHandshakeInterceptor.TOKEN_EXPIRY_ATTRIBUTE);
                if (!(rawExpiry instanceof Long expiryEpochSeconds)) {
                    session.close(CloseStatus.POLICY_VIOLATION.withReason("Missing access-token expiry"));
                    return;
                }
                long delaySeconds = Math.max(0L, expiryEpochSeconds - Instant.now().getEpochSecond());
                scheduler.schedule(() -> {
                    if (session.isOpen()) {
                        try {
                            session.close(CloseStatus.POLICY_VIOLATION.withReason("Access token expired; reconnect"));
                        } catch (Exception ignored) {
                            // Session may already have been closed by the peer or server.
                        }
                    }
                }, delaySeconds, TimeUnit.SECONDS);
            }
        };
    }
}
