package com.Resume.Ai.agent.api;

import com.Resume.Ai.agent.service.ResumeAgentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/resumes/{resumeId}/agent")
public class ResumeAgentController {
    private static final String AUTH_HEADER = "X-Authenticated-User-Id";
    private static final String FALLBACK_HEADER = "X-User-Id";
    private final ResumeAgentService service;

    public ResumeAgentController(ResumeAgentService service) { this.service = service; }

    @PostMapping("/chat")
    public ResponseEntity<ResumeAgentChatResponse> chat(
            @RequestHeader(name = AUTH_HEADER, required = false) UUID authenticated,
            @RequestHeader(name = FALLBACK_HEADER, required = false) UUID fallback,
            @PathVariable UUID resumeId,
            @Valid @RequestBody ResumeAgentChatRequest request) {
        UUID userId = authenticated != null ? authenticated : fallback;
        if (userId == null) throw new IllegalArgumentException("Missing authenticated user identity.");
        return ResponseEntity.ok(service.chat(userId, resumeId, request));
    }

    @DeleteMapping("/conversations/{conversationId}")
    public ResponseEntity<Void> clear(
            @RequestHeader(name = AUTH_HEADER, required = false) UUID authenticated,
            @RequestHeader(name = FALLBACK_HEADER, required = false) UUID fallback,
            @PathVariable UUID resumeId, @PathVariable UUID conversationId) {
        UUID userId = authenticated != null ? authenticated : fallback;
        if (userId == null) throw new IllegalArgumentException("Missing authenticated user identity.");
        service.clearConversation(userId, resumeId, conversationId);
        return ResponseEntity.noContent().build();
    }
}
