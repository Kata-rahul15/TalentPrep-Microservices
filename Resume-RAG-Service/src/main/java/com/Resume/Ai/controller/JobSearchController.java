package com.Resume.Ai.controller;

import com.Resume.Ai.jobsearch.JobSearchService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import tools.jackson.databind.JsonNode;

@RestController
@RequestMapping("/api/resumes/jobs")
public class JobSearchController {
    private final JobSearchService jobs;

    public JobSearchController(JobSearchService jobs) { this.jobs = jobs; }

    @GetMapping("/search")
    public ResponseEntity<JsonNode> search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String location,
            @RequestParam(required = false) Integer days,
            @RequestParam(required = false) Integer limit) {
        return ResponseEntity.ok(jobs.search(q, location, days, limit));
    }

    @GetMapping("/{jobId}")
    public ResponseEntity<JsonNode> getJob(@PathVariable String jobId) {
        return ResponseEntity.ok(jobs.getJob(jobId));
    }
}
