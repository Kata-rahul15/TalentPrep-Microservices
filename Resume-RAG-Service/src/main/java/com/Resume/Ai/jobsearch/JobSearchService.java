package com.Resume.Ai.jobsearch;

import com.Resume.Ai.config.JobSearchCacheProperties;
import com.Resume.Ai.jobsearch.provider.JobSearchProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;

/** Provider-agnostic facade with Redis caching and controlled Google Jobs fallbacks. */
@Service
public class JobSearchService {
    private static final Logger log = LoggerFactory.getLogger(JobSearchService.class);

    private final JobSearchProvider provider;
    private final RedisTemplate<String, String> redis;
    private final JobSearchCacheProperties cacheProperties;
    private final ObjectMapper mapper;

    public JobSearchService(JobSearchProvider provider,
                            @Qualifier("jobRedisTemplate") RedisTemplate<String, String> redis,
                            JobSearchCacheProperties cacheProperties,
                            ObjectMapper mapper) {
        this.provider = provider;
        this.redis = redis;
        this.cacheProperties = cacheProperties;
        this.mapper = mapper;
    }

    public JsonNode search(String query, String location, Integer days, Integer limit) {
        String normalizedQuery = JobSearchQueryPolicy.aiSafeQuery(query);
        if (normalizedQuery.isBlank()) {
            throw new IllegalArgumentException("q is required for Google Jobs search.");
        }

        int safeDays = days == null ? 30 : Math.max(1, Math.min(days, 365));
        int safeLimit = limit == null ? 10 : Math.max(1, Math.min(limit, 50));
        String normalizedLocation = normalizeLocation(location);

        List<String> candidates = JobSearchQueryPolicy.fallbackQueries(normalizedQuery);
        // The first candidate is the broad, AI-safe query. At most one fallback
        // is attempted to avoid multiplying SerpApi usage.
        List<String> attempts = new ArrayList<>();
        attempts.add(normalizedQuery);
        for (String candidate : candidates) {
            if (!candidate.equalsIgnoreCase(normalizedQuery)) {
                attempts.add(candidate);
                break;
            }
        }

        RuntimeException lastFailure = null;
        for (int i = 0; i < attempts.size(); i++) {
            String candidate = attempts.get(i);
            try {
                JsonNode cached = getCached(candidate, normalizedLocation, safeDays, safeLimit);
                if (cached != null) {
                    log.info("[JOB-SEARCH] Redis HIT q='{}' location='{}' days={} limit={}", candidate, normalizedLocation, safeDays, safeLimit);
                    return cached;
                }

                log.info("[JOB-SEARCH] Redis MISS q='{}' location='{}' days={} limit={}", candidate, normalizedLocation, safeDays, safeLimit);
                JsonNode result = provider.search(candidate, normalizedLocation, safeDays, safeLimit);
                if (hasJobs(result)) {
                    putCached(candidate, normalizedLocation, safeDays, safeLimit, result);
                    return result;
                }
            } catch (RuntimeException ex) {
                lastFailure = ex;
                if (!isNoResultsFailure(ex) || i == attempts.size() - 1) {
                    throw ex;
                }
                log.warn("[JOB-SEARCH] No results for q='{}'. Trying broader fallback query.", candidate);
            }
        }

        if (lastFailure != null && !isNoResultsFailure(lastFailure)) {
            throw lastFailure;
        }

        // Return a stable empty response instead of a 500 when Google returns no jobs.
        var empty = mapper.createObjectNode();
        empty.put("provider", provider.providerName());
        empty.put("query", normalizedQuery);
        if (!normalizedLocation.isBlank()) empty.put("location", normalizedLocation);
        empty.put("days", safeDays);
        empty.put("count", 0);
        empty.set("jobs", mapper.createArrayNode());
        empty.put("cached", false);
        empty.put("message", "No jobs were returned for the selected search. Try a broader role or location.");
        return empty;
    }

    public JsonNode getJob(String jobId) {
        String safeId = jobId == null ? "" : jobId.trim();
        if (safeId.isBlank()) throw new IllegalArgumentException("jobId is required.");
        String key = cacheProperties.getJobDetailsKeyPrefix() + sha256(safeId);
        if (cacheProperties.isEnabled()) {
            try {
                String cached = redis.opsForValue().get(key);
                if (cached != null && !cached.isBlank()) {
                    log.info("[JOB-DETAILS] Redis HIT jobId={}", safeId);
                    return mapper.readTree(cached);
                }
            } catch (Exception ex) {
                log.warn("[JOB-DETAILS] Redis read failed; continuing without cache", ex);
            }
        }
        JsonNode result = provider.getJob(safeId);
        if (cacheProperties.isEnabled() && result != null) {
            try {
                redis.opsForValue().set(key, result.toString(), ttl());
            } catch (Exception ex) {
                log.warn("[JOB-DETAILS] Redis write failed; returning provider result", ex);
            }
        }
        return result;
    }

    private JsonNode getCached(String query, String location, int days, int limit) {
        if (!cacheProperties.isEnabled()) return null;
        try {
            String value = redis.opsForValue().get(cacheKey(query, location, days, limit));
            return value == null || value.isBlank() ? null : mapper.readTree(value);
        } catch (Exception ex) {
            log.warn("[JOB-SEARCH] Redis read failed; continuing without cache", ex);
            return null;
        }
    }

    private void putCached(String query, String location, int days, int limit, JsonNode result) {
        if (!cacheProperties.isEnabled() || result == null) return;
        try {
            redis.opsForValue().set(cacheKey(query, location, days, limit), result.toString(), ttl());
        } catch (Exception ex) {
            log.warn("[JOB-SEARCH] Redis write failed; returning provider result", ex);
        }
    }

    private String cacheKey(String query, String location, int days, int limit) {
        String material = query.toLowerCase() + "|" + location.toLowerCase() + "|" + days + "|" + limit;
        return cacheProperties.getKeyPrefix() + sha256(material);
    }

    private Duration ttl() {
        return Duration.ofMinutes(Math.max(1, cacheProperties.getTtlMinutes()));
    }

    private boolean hasJobs(JsonNode result) {
        return result != null && result.path("jobs").isArray() && result.path("jobs").size() > 0;
    }

    private boolean isNoResultsFailure(RuntimeException ex) {
        String message = ex.getMessage();
        if (message == null) return false;
        String lower = message.toLowerCase();
        return lower.contains("google hasn't returned any results") || lower.contains("no results");
    }

    private String normalizeLocation(String location) {
        String normalized = location == null ? "" : location.replaceAll("\\s+", " ").trim();
        // TalentPrep currently targets the India job market by default.
        // Keeping a non-empty location also prevents AI-triggered searches
        // from accidentally falling back to an unscoped Google Jobs request.
        return normalized.isBlank() ? "India" : normalized;
    }

    private String sha256(String value) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256")
                    .digest(value.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (Exception ex) {
            throw new IllegalStateException("Unable to build job-search cache key.", ex);
        }
    }
}
