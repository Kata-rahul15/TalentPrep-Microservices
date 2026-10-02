package com.Resume.Ai.controller;

import com.Resume.Ai.dto.JobMatchRequest;
import com.Resume.Ai.dto.JobMatchResponse;
import com.Resume.Ai.matching.JobMatchingService;

import jakarta.validation.Valid;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/resumes")
public class JobMatchingController {

    private static final Logger log =
            LoggerFactory.getLogger(JobMatchingController.class);

    private static final String AUTH_USER_ID_HEADER =
            "X-Authenticated-User-Id";

    private final JobMatchingService jobMatchingService;

    public JobMatchingController(
            JobMatchingService jobMatchingService) {

        this.jobMatchingService = jobMatchingService;
    }

    @PostMapping("/{resumeId}/match")
    public ResponseEntity<JobMatchResponse> matchResumeToJob(
            @RequestHeader(
                    value = AUTH_USER_ID_HEADER,
                    required = false
            )
            UUID userId,

            @PathVariable("resumeId")
            UUID resumeId,

            @Valid
            @RequestBody
            JobMatchRequest request) {

        log.info(
                "POST /api/resumes/{}/match — user={}, jobDescriptionId={}",
                resumeId,
                userId,
                request.getJobDescriptionId()
        );

        JobMatchResponse response =
                jobMatchingService.startMatch(
                        userId,
                        resumeId,
                        request
                );

        return ResponseEntity
                .accepted()
                .body(response);
    }

    @GetMapping("/{resumeId}/match/{matchId}")
    public ResponseEntity<JobMatchResponse> getMatchStatus(
            @RequestHeader(
                    value = AUTH_USER_ID_HEADER,
                    required = false
            )
            UUID userId,

            @PathVariable("resumeId")
            UUID resumeId,

            @PathVariable("matchId")
            UUID matchId) {

        JobMatchResponse response =
                jobMatchingService.getMatchStatus(
                        userId,
                        resumeId,
                        matchId
                );

        return ResponseEntity.ok(response);
    }
}
