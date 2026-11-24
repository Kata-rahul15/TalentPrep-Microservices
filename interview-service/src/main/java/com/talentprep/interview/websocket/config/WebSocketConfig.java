
package com.talentprep.interview.websocket.config;

import com.talentprep.interview.websocket.security.InterviewHandshakeHandler;
import com.talentprep.interview.websocket.security.InterviewHandshakeInterceptor;
import com.talentprep.interview.websocket.security.InterviewStompAuthorizationInterceptor;
import com.talentprep.interview.websocket.security.JwtExpiryWebSocketHandlerDecoratorFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

import java.util.Arrays;
import java.util.concurrent.ScheduledExecutorService;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${talentprep.websocket.allowed-origins:http://localhost:5173}")
    private String allowedOrigins;

    private final InterviewStompAuthorizationInterceptor authorizationInterceptor =
            new InterviewStompAuthorizationInterceptor();

    private final ScheduledExecutorService expiryScheduler;

    public WebSocketConfig(
            ScheduledExecutorService interviewWebSocketExpiryScheduler) {
        this.expiryScheduler = interviewWebSocketExpiryScheduler;
    }

    /**
     * Dedicated scheduler for STOMP broker heartbeats.
     * Uses a custom name to avoid conflicting with Spring's internal scheduler.
     */
    @Bean(name = "interviewBrokerTaskScheduler")
    public ThreadPoolTaskScheduler interviewBrokerTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("interview-broker-heartbeat-");
        scheduler.setRemoveOnCancelPolicy(true);
        return scheduler;
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {

        String[] patterns = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .toArray(String[]::new);

        registry.addEndpoint("/ws/interviews")
                .addInterceptors(new InterviewHandshakeInterceptor())
                .setHandshakeHandler(new InterviewHandshakeHandler())
                .setAllowedOriginPatterns(patterns);
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {

        registry.enableSimpleBroker("/queue", "/topic")
                .setTaskScheduler(interviewBrokerTaskScheduler())
                .setHeartbeatValue(new long[]{10000, 10000});

        registry.setApplicationDestinationPrefixes("/app");
        registry.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(authorizationInterceptor);
    }

    @Override
    public void configureWebSocketTransport(
            WebSocketTransportRegistration registration) {

        registration.addDecoratorFactory(
                new JwtExpiryWebSocketHandlerDecoratorFactory(expiryScheduler)
        );
    }
}
