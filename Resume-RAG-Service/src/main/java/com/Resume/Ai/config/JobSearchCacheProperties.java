package com.Resume.Ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "job-search.cache")
@Getter
@Setter
public class JobSearchCacheProperties {
    private boolean enabled = true;
    private long ttlMinutes = 30;
    private String keyPrefix = "jobs:search:v1:";
    private String jobDetailsKeyPrefix = "jobs:details:v1:";
}
