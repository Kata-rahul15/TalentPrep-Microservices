package com.Resume.Ai.controller;

import com.Resume.Ai.jobsearch.JobSearchService;
import com.Resume.Ai.profile.ResumeProfile;
import com.Resume.Ai.profile.ResumeProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.JsonNode;

import java.util.UUID;

@RestController
@RequestMapping("/api/resumes/jobs")
public class JobSearchController {
    private static final String AUTH_HEADER = "X-Authenticated-User-Id";
    private static final String FALLBACK_HEADER = "X-User-Id";
    private final JobSearchService jobs;
    private final ResumeProfileService profiles;

    public JobSearchController(JobSearchService jobs, ResumeProfileService profiles) {
        this.jobs = jobs;
        this.profiles = profiles;
    }

    @GetMapping("/search")
    public ResponseEntity<JsonNode> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer days,
            @RequestParam(required = false) Integer limit,
            @RequestHeader(name = AUTH_HEADER, required = false) UUID authenticated,
            @RequestHeader(name = FALLBACK_HEADER, required = false) UUID fallback) {
        UUID userId = authenticated != null ? authenticated : fallback;
        if (userId != null && isPersonalizedIntent(q)) {
            ResumeProfile profile = profiles.getActiveProfile(userId);
            return ResponseEntity.ok(jobs.searchForTargetRoles(profile.getTargetRoles(), location, days, limit));
        }
        return ResponseEntity.ok(jobs.search(q, location, days, limit));
    }

    /** Explicit resume-aware endpoint for the AI Find Jobs for Me action. */
    @GetMapping("/for-me")
    public ResponseEntity<JsonNode> findJobsForMe(
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer days,
            @RequestParam(required = false) Integer limit,
            @RequestHeader(name = AUTH_HEADER, required = false) UUID authenticated,
            @RequestHeader(name = FALLBACK_HEADER, required = false) UUID fallback) {
        UUID userId = authenticated != null ? authenticated : fallback;
        if (userId == null) throw new IllegalArgumentException("Missing authenticated user identity.");
        ResumeProfile profile = profiles.getActiveProfile(userId);
        return ResponseEntity.ok(jobs.searchForTargetRoles(profile.getTargetRoles(), location, days, limit));
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<JsonNode> getJob(@PathVariable String jobId) {
        return ResponseEntity.ok(jobs.getJob(jobId));
    }

    private boolean isPersonalizedIntent(String query) {
        if (query == null || query.isBlank()) return true;
        String normalized = query.trim().toLowerCase(java.util.Locale.ROOT).replaceAll("\\s+", " ");
        return java.util.Set.of("software engineer developer", "find jobs for me", "ai find jobs for me",
                "jobs for me", "recommended jobs", "jobs based on my resume", "find jobs based on my resume")
                .contains(normalized);
    }
}
