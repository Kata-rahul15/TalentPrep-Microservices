package com.Resume.Ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "resume.rag")
@Getter
@Setter
public class RagProperties {

    private int topK = 5;
    private double similarityThreshold = 0.40;
}
