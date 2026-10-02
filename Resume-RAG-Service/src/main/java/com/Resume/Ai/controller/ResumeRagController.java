package com.Resume.Ai.controller;

import com.Resume.Ai.dto.ResumeChatRequest;
import com.Resume.Ai.dto.ResumeChatResponse;
import com.Resume.Ai.rag.ResumeRagService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/resumes")
public class ResumeRagController {

    private static final Logger log =
            LoggerFactory.getLogger(
                    ResumeRagController.class
            );

    private static final String AUTH_USER_ID_HEADER =
            "X-Authenticated-User-Id";

    private static final String FALLBACK_USER_ID_HEADER =
            "X-User-Id";

    private final ResumeRagService resumeRagService;

    public ResumeRagController(
            ResumeRagService resumeRagService) {

        this.resumeRagService =
                resumeRagService;
    }

    /**
     * POST /api/resumes/chat
     *
     * The frontend sends ONLY the question.
     *
     * The authenticated user ID comes from the trusted
     * gateway header.
     *
     * Flow:
     *
     * Frontend
     *      ↓
     * question
     *      ↓
     * API Gateway
     *      ↓
     * authenticated user ID
     *      ↓
     * Resume Service
     *      ↓
     * userId → active resume → resumeId
     *      ↓
     * vector search
     */
    @PostMapping("/chat")
    public ResponseEntity<ResumeChatResponse> chat(
            @RequestHeader(
                    name = AUTH_USER_ID_HEADER,
                    required = false
            )
            UUID authenticatedUserId,

            @RequestHeader(
                    name = FALLBACK_USER_ID_HEADER,
                    required = false
            )
            UUID fallbackUserId,

            @Valid
            @RequestBody
            ResumeChatRequest request) {

        UUID userId =
                resolveUserId(
                        authenticatedUserId,
                        fallbackUserId
                );

        log.info(
                "POST /api/resumes/chat — user={}",
                userId
        );

        ResumeChatResponse response =
                resumeRagService.answerQuestion(
                        userId,
                        request
                );

        return ResponseEntity.ok(response);
    }

    /**
     * Uses the same trusted-user-ID resolution strategy
     * as the rest of the Resume Service.
     */
    private UUID resolveUserId(
            UUID authenticatedUserId,
            UUID fallbackUserId) {

        UUID effectiveUserId =
                authenticatedUserId != null
                        ? authenticatedUserId
                        : fallbackUserId;

        if (effectiveUserId == null) {

            throw new IllegalArgumentException(
                    "Missing authenticated user ID header (" +
                            AUTH_USER_ID_HEADER +
                            " / " +
                            FALLBACK_USER_ID_HEADER +
                            ")"
            );
        }

        return effectiveUserId;
    }
}