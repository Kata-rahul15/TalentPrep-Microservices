package com.Resume.Ai.controller;

import com.Resume.Ai.dto.*;
import com.Resume.Ai.services.ResumeService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/resumes")
public class ResumeController {

    private static final Logger log = LoggerFactory.getLogger(ResumeController.class);
    private static final String AUTH_USER_ID_HEADER = "X-Authenticated-User-Id";
    private static final String FALLBACK_USER_ID_HEADER = "X-User-Id";

    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    private UUID resolveUserId(UUID authUserId, UUID fallbackUserId) {
        UUID effectiveId = authUserId != null ? authUserId : fallbackUserId;
        if (effectiveId == null) {
            throw new IllegalArgumentException(
                    "Missing authenticated user ID header (" + AUTH_USER_ID_HEADER + " / " + FALLBACK_USER_ID_HEADER + ")"
            );
        }
        return effectiveId;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ResumeResponse> uploadResume(
            @RequestHeader(name = AUTH_USER_ID_HEADER, required = false) UUID authUserId,
            @RequestHeader(name = FALLBACK_USER_ID_HEADER, required = false) UUID fallbackUserId,
            @RequestParam("resumeName") String resumeName,
            @RequestParam("file") MultipartFile file) {

        UUID userId = resolveUserId(authUserId, fallbackUserId);

        if (resumeName == null || resumeName.isBlank()) {
            throw new IllegalArgumentException("resumeName must not be blank.");
        }

        ResumeRequest request = ResumeRequest.builder()
                .userId(userId)
                .resumeName(resumeName.trim())
                .file(file)
                .build();

        log.info("POST /api/resumes/upload — user={}, file={}", userId,
                file != null ? file.getOriginalFilename() : "null");

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(resumeService.uploadResume(request));
    }

    @GetMapping("/{resumeId}")
    public ResponseEntity<ResumeResponse> getResume(
            @RequestHeader(name = AUTH_USER_ID_HEADER, required = false) UUID authUserId,
            @RequestHeader(name = FALLBACK_USER_ID_HEADER, required = false) UUID fallbackUserId,
            @PathVariable UUID resumeId) {
        UUID userId = resolveUserId(authUserId, fallbackUserId);
        return ResponseEntity.ok(resumeService.getResume(resumeId, userId));
    }

    @GetMapping("/me")
    public ResponseEntity<List<ResumeSummaryResponse>> getMyResumes(
            @RequestHeader(name = AUTH_USER_ID_HEADER, required = false) UUID authUserId,
            @RequestHeader(name = FALLBACK_USER_ID_HEADER, required = false) UUID fallbackUserId) {
        UUID userId = resolveUserId(authUserId, fallbackUserId);
        return ResponseEntity.ok(resumeService.getUserResumes(userId));
    }

    /**
     * Full parsed/AI-structured resume details for the user's active/latest resume.
     */
    @GetMapping("/details")
    public ResponseEntity<ResumeDetailsResponse> getResumeDetails(
            @RequestHeader(name = AUTH_USER_ID_HEADER, required = false) UUID authUserId,
            @RequestHeader(name = FALLBACK_USER_ID_HEADER, required = false) UUID fallbackUserId) {
        UUID userId = resolveUserId(authUserId, fallbackUserId);
        return ResponseEntity.ok(resumeService.getResumeDetails(userId));
    }

    @GetMapping("/{resumeId}/details")
    public ResponseEntity<ResumeDetailsResponse> getResumeDetailsById(
            @RequestHeader(name = AUTH_USER_ID_HEADER, required = false) UUID authUserId,
            @RequestHeader(name = FALLBACK_USER_ID_HEADER, required = false) UUID fallbackUserId,
            @PathVariable UUID resumeId) {
        UUID userId = resolveUserId(authUserId, fallbackUserId);
        return ResponseEntity.ok(resumeService.getResumeDetails(resumeId, userId));
    }

    /**
     * Dashboard data. This endpoint is DB-only after upload; it never calls the LLM.
     */
    @GetMapping("/overview")
    public ResponseEntity<ResumeOverviewResponse> getResumeOverview(
            @RequestHeader(name = AUTH_USER_ID_HEADER, required = false) UUID authUserId,
            @RequestHeader(name = FALLBACK_USER_ID_HEADER, required = false) UUID fallbackUserId) {
        UUID userId = resolveUserId(authUserId, fallbackUserId);
        return ResponseEntity.ok(resumeService.getResumeOverview(userId));
    }

    @GetMapping("/{resumeId}/overview")
    public ResponseEntity<ResumeOverviewResponse> getResumeOverviewById(
            @RequestHeader(name = AUTH_USER_ID_HEADER, required = false) UUID authUserId,
            @RequestHeader(name = FALLBACK_USER_ID_HEADER, required = false) UUID fallbackUserId,
            @PathVariable UUID resumeId) {
        UUID userId = resolveUserId(authUserId, fallbackUserId);
        return ResponseEntity.ok(resumeService.getResumeOverview(resumeId, userId));
    }

    /**
     * General ATS evaluation persisted during upload. No new AI call occurs here.
     */
    @GetMapping("/ats-analysis")
    public ResponseEntity<ResumeAtsResponse> getResumeAts(
            @RequestHeader(name = AUTH_USER_ID_HEADER, required = false) UUID authUserId,
            @RequestHeader(name = FALLBACK_USER_ID_HEADER, required = false) UUID fallbackUserId) {
        UUID userId = resolveUserId(authUserId, fallbackUserId);
        return ResponseEntity.ok(resumeService.getResumeAts(userId));
    }

    @GetMapping("/{resumeId}/ats-analysis")
    public ResponseEntity<ResumeAtsResponse> getResumeAtsById(
            @RequestHeader(name = AUTH_USER_ID_HEADER, required = false) UUID authUserId,
            @RequestHeader(name = FALLBACK_USER_ID_HEADER, required = false) UUID fallbackUserId,
            @PathVariable UUID resumeId) {
        UUID userId = resolveUserId(authUserId, fallbackUserId);
        return ResponseEntity.ok(resumeService.getResumeAts(resumeId, userId));
    }

    @PatchMapping("/{resumeId}")
    public ResponseEntity<ResumeResponse> updateResume(
            @RequestHeader(name = AUTH_USER_ID_HEADER, required = false) UUID authUserId,
            @RequestHeader(name = FALLBACK_USER_ID_HEADER, required = false) UUID fallbackUserId,
            @PathVariable UUID resumeId,
            @RequestBody UpdateResumeRequest request) {
        UUID userId = resolveUserId(authUserId, fallbackUserId);
        return ResponseEntity.ok(resumeService.updateResume(resumeId, userId, request));
    }

    @DeleteMapping("/{resumeId}")
    public ResponseEntity<Void> deleteResume(
            @RequestHeader(name = AUTH_USER_ID_HEADER, required = false) UUID authUserId,
            @RequestHeader(name = FALLBACK_USER_ID_HEADER, required = false) UUID fallbackUserId,
            @PathVariable UUID resumeId) {
        UUID userId = resolveUserId(authUserId, fallbackUserId);
        resumeService.deleteResume(resumeId, userId);
        return ResponseEntity.noContent().build();
    }
}
