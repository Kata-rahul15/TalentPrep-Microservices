package com.Resume.Ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConfigurationProperties(prefix = "job-search.serpapi")
@Getter
@Setter
public class SerpApiProperties {
    private String baseUrl = "https://serpapi.com/search.json";
    private String apiKey = "";
    private String engine = "google_jobs";
    private String listingEngine = "google_jobs_listing";
    private String language = "en";
    private String country = "in";
    private int timeoutSeconds = 20;
}
