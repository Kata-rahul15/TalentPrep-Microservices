package com.Resume.Ai.config;

import org.springframework.context.annotation.Configuration;

/**
 * Jackson 3 is provided and configured by Spring Boot 4. Do not create a
 * Jackson 2 ObjectMapper here because Spring AI 2 uses tools.jackson.
 */
@Configuration
public class JacksonConfig {
}
