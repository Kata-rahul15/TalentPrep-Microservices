package com.Resume.Ai.controller;

import com.Resume.Ai.dto.CreateJobDescriptionRequest;
import com.Resume.Ai.dto.JobDescriptionResponse;
import com.Resume.Ai.jobdesc.service.JobDescriptionService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/job-descriptions")
public class JobDescriptionController {

    private static final Logger log = LoggerFactory.getLogger(JobDescriptionController.class);
    private static final String AUTH_USER_ID_HEADER = "X-Authenticated-User-Id";

    private final JobDescriptionService jobDescriptionService;

    public JobDescriptionController(JobDescriptionService jobDescriptionService) {
        this.jobDescriptionService = jobDescriptionService;
    }

    @PostMapping
    public ResponseEntity<JobDescriptionResponse> createJobDescription(
            @RequestHeader(value = AUTH_USER_ID_HEADER) UUID userId,
            @Valid @RequestBody CreateJobDescriptionRequest request) {

        log.info("POST /api/job-descriptions — user={}, title={}", userId, request.getTitle());
        JobDescriptionResponse response = jobDescriptionService.createJobDescription(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<JobDescriptionResponse> getJobDescription(
            @RequestHeader(AUTH_USER_ID_HEADER) UUID userId,
            @PathVariable("id") UUID id) {

        log.info("GET /api/job-descriptions/{} — user={}", id, userId);
        return ResponseEntity.ok(jobDescriptionService.getJobDescription(id, userId));
    }

    @GetMapping("/me")
    public ResponseEntity<List<JobDescriptionResponse>> getMyJobDescriptions(
            @RequestHeader(AUTH_USER_ID_HEADER) UUID userId) {

        log.info("GET /api/job-descriptions/me — user={}", userId);
        return ResponseEntity.ok(jobDescriptionService.getUserJobDescriptions(userId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteJobDescription(
            @RequestHeader(AUTH_USER_ID_HEADER) UUID userId,
            @PathVariable("id") UUID id) {

        log.info("DELETE /api/job-descriptions/{} — user={}", id, userId);
        jobDescriptionService.deleteJobDescription(id, userId);
        return ResponseEntity.noContent().build();
    }
}
