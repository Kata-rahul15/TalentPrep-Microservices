package com.Resume.Ai.controller;

import com.Resume.Ai.profile.ResumeProfile;
import com.Resume.Ai.profile.ResumeProfileService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/resumes")
public class ResumeProfileController {
    private static final String AUTH_HEADER = "X-Authenticated-User-Id";
    private static final String FALLBACK_HEADER = "X-User-Id";
    private final ResumeProfileService service;

    public ResumeProfileController(ResumeProfileService service) { this.service = service; }

    @GetMapping("/{resumeId}/profile")
    public ResponseEntity<ResumeProfile> getProfile(
            @RequestHeader(name = AUTH_HEADER, required = false) UUID authenticated,
            @RequestHeader(name = FALLBACK_HEADER, required = false) UUID fallback,
            @PathVariable UUID resumeId) {
        UUID userId = authenticated != null ? authenticated : fallback;
        if (userId == null) throw new IllegalArgumentException("Missing authenticated user identity.");
        return ResponseEntity.ok(service.getProfile(resumeId, userId));
    }
}
