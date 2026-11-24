package com.talentprep.interview.client;

import feign.RequestInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class FeignClientConfig {

    @Value("${services.resume.internal-token:}")
    private String internalServiceToken;

    @Bean
    public RequestInterceptor internalServiceAuthInterceptor() {
        return requestTemplate -> {
            requestTemplate.header("X-Internal-Service-Name", "interview-service");
            if (internalServiceToken != null && !internalServiceToken.isBlank()) {
                requestTemplate.header("X-Internal-Service-Token", internalServiceToken.trim());
            }
        };
    }
}

