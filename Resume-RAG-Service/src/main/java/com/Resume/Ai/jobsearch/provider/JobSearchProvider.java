package com.Resume.Ai.jobsearch.provider;

import tools.jackson.databind.JsonNode;

/**
 * Provider boundary for live job search.
 * Add a new implementation (Adzuna, JSearch, etc.) without changing controllers or agent tools.
 */
public interface JobSearchProvider {
    String providerName();
    JsonNode search(String query, String location, Integer days, Integer limit);
    JsonNode getJob(String jobId);
}
