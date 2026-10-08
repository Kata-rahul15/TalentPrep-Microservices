package com.Resume.Ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "jobvetta")
@Getter
@Setter
public class JobvettaProperties {
    private String baseUrl = "https://api.jobvetta.com/v1";
    private String apiKey = "";
    private int timeoutSeconds = 15;
}
