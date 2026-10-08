package com.Resume.Ai.controller;

import com.Resume.Ai.builder.ResumeVersionResponse;
import com.Resume.Ai.builder.ResumeVersionService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/resumes/{resumeId}/versions")
public class ResumeVersionController {
    private static final String AUTH_USER_ID_HEADER = "X-Authenticated-User-Id";
    private static final String FALLBACK_USER_ID_HEADER = "X-User-Id";
    private final ResumeVersionService service;

    public ResumeVersionController(ResumeVersionService service) { this.service = service; }

    private UUID userId(UUID authenticated, UUID fallback) {
        UUID id = authenticated != null ? authenticated : fallback;
        if (id == null) throw new IllegalArgumentException("Missing authenticated user identity.");
        return id;
    }

    @PostMapping
    public ResponseEntity<ResumeVersionResponse> create(
            @RequestHeader(name = AUTH_USER_ID_HEADER, required = false) UUID authenticated,
            @RequestHeader(name = FALLBACK_USER_ID_HEADER, required = false) UUID fallback,
            @PathVariable UUID resumeId,
            @RequestBody(required = false) CreateVersionRequest request) {
        ResumeVersionResponse response = service.create(resumeId, userId(authenticated, fallback),
                request == null ? null : request.getLabel());
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping
    public ResponseEntity<List<ResumeVersionResponse>> list(
            @RequestHeader(name = AUTH_USER_ID_HEADER, required = false) UUID authenticated,
            @RequestHeader(name = FALLBACK_USER_ID_HEADER, required = false) UUID fallback,
            @PathVariable UUID resumeId) {
        return ResponseEntity.ok(service.list(resumeId, userId(authenticated, fallback)));
    }

    @PostMapping("/{versionId}/restore")
    public ResponseEntity<ResumeVersionResponse> restore(
            @RequestHeader(name = AUTH_USER_ID_HEADER, required = false) UUID authenticated,
            @RequestHeader(name = FALLBACK_USER_ID_HEADER, required = false) UUID fallback,
            @PathVariable UUID resumeId, @PathVariable UUID versionId) {
        return ResponseEntity.ok(service.restore(resumeId, versionId, userId(authenticated, fallback)));
    }

    public static class CreateVersionRequest {
        private String label;
        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
    }
}
