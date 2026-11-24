package com.talentprep.interview.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

/**
 * Configures separate bounded executors for asynchronous answer evaluation
 * and follow-up decision generation. Ensures evaluation tasks cannot starve
 * follow-up generation.
 */
@Configuration
@EnableAsync
public class InterviewAsyncConfig {

    private static final Logger log = LoggerFactory.getLogger(InterviewAsyncConfig.class);

    @Bean(name = "evaluationExecutor")
    public Executor evaluationExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("eval-exec-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(30);
        executor.setRejectedExecutionHandler((runnable, threadPoolExecutor) -> {
            log.error("Evaluation executor rejected task execution: pool busy or full.");
            throw new RuntimeException("Evaluation executor queue full; task rejected.");
        });
        executor.initialize();
        return executor;
    }

    @Bean(name = "followUpExecutor")
    public Executor followUpExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(4);
        executor.setMaxPoolSize(8);
        executor.setQueueCapacity(100);
        executor.setThreadNamePrefix("followup-exec-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(20);
        executor.setRejectedExecutionHandler((runnable, threadPoolExecutor) -> {
            log.error("Follow-up executor rejected task execution: pool busy or full.");
            throw new RuntimeException("Follow-up executor queue full; task rejected.");
        });
        executor.initialize();
        return executor;
    }

    @Bean(name = "questionExecutor")
    public Executor questionExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(2);
        executor.setMaxPoolSize(4);
        executor.setQueueCapacity(50);
        executor.setThreadNamePrefix("question-exec-");
        executor.setWaitForTasksToCompleteOnShutdown(true);
        executor.setAwaitTerminationSeconds(20);
        executor.setRejectedExecutionHandler((runnable, pool) -> {
            log.error("Question preparation executor rejected task execution.");
            throw new RuntimeException("Question preparation executor queue full; task rejected.");
        });
        executor.initialize();
        return executor;
    }

}

