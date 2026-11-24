package com.talentprep.interview.websocket.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;

@Configuration
public class InterviewWebSocketExecutorConfig {
    @Bean(name = "interviewWebSocketExecutor")
    public ThreadPoolTaskExecutor interviewWebSocketExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("interview-ws-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(20);
        return executor;
    }

    @Bean(destroyMethod = "shutdown")
    public ScheduledExecutorService interviewWebSocketExpiryScheduler() {
        return Executors.newSingleThreadScheduledExecutor(runnable -> {
            Thread thread = new Thread(runnable, "interview-ws-expiry");
            thread.setDaemon(true);
            return thread;
        });
    }
}
