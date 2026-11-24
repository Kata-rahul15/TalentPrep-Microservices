package com.talentprep.interview.coding.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.time.Duration;

@Data
@Component
@ConfigurationProperties(prefix = "code-execution")
public class CodeExecutionProperties {
    private String provider = "onlinecompiler";
    private String baseUrl = "https://api.onlinecompiler.io";
    private String apiKey = "";
    private Duration connectTimeout = Duration.ofSeconds(5);
    private Duration responseTimeout = Duration.ofSeconds(35);
    private int maxCodeSizeBytes = 65536; // 64 KB max
}
