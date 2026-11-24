package com.talentprep.interview.controller;

import com.talentprep.interview.coding.dto.CodeRunResult;
import com.talentprep.interview.dto.request.CodeSubmissionRequest;
import com.talentprep.interview.dto.request.CreateInterviewRequest;
import com.talentprep.interview.dto.request.InterviewRespondRequest;
import com.talentprep.interview.dto.request.SubmitAnswerRequest;
import com.talentprep.interview.dto.response.*;
import com.talentprep.interview.identity.GatewayIdentityHelper;
import com.talentprep.interview.session.InterviewSessionService;
import com.talentprep.interview.session.InterviewSessionQueryService;
import com.talentprep.interview.session.InterviewSessionLifecycleService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/interviews")
public class InterviewController {

    private static final Logger log = LoggerFactory.getLogger(InterviewController.class);

    private final InterviewSessionService sessionService;
    private final InterviewSessionQueryService queryService;
    private final InterviewSessionLifecycleService lifecycleService;
    private final GatewayIdentityHelper identityHelper;

    public InterviewController(
            InterviewSessionService sessionService,
            InterviewSessionQueryService queryService,
            InterviewSessionLifecycleService lifecycleService,
            GatewayIdentityHelper identityHelper) {
        this.sessionService = sessionService;
        this.queryService = queryService;
        this.lifecycleService = lifecycleService;
        this.identityHelper = identityHelper;
    }

    /**
     * Pre-populates the setup form by retrieving saved resume AI analysis from Resume Service.
     */
    @GetMapping("/setup")
    public ResponseEntity<CandidateSetupDetailsResponse> getSetupDetails(
            @RequestParam(required = false) UUID resumeId) {
        UUID userId = identityHelper.requireCurrentUserId();
        log.info("[InterviewController] Incoming setup request: user={}, resumeId={}", userId, resumeId);
        return ResponseEntity.ok(sessionService.getSetupDetails(resumeId, userId));
    }

    /**
     * Creates an interview session, reserves user quota atomically, and snapshots candidate context.
     */
    @PostMapping
    public ResponseEntity<InterviewSessionResponse> createSession(
            @Valid @RequestBody CreateInterviewRequest request) {
        UUID userId = identityHelper.requireCurrentUserId();
        log.info("POST /api/interviews — user={}, rounds={}", userId, request.getRounds());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(sessionService.createSession(request, userId));
    }

    /**
     * Retrieves session overview, state, and rounds.
     */
    @GetMapping("/{id}")
    public ResponseEntity<InterviewSessionResponse> getSession(@PathVariable UUID id) {
        UUID userId = identityHelper.requireCurrentUserId();
        return ResponseEntity.ok(queryService.getSession(id, userId));
    }

    /**
     * Starts the interview session and generates the very first question.
     */
    @PostMapping("/{id}/start")
    public ResponseEntity<InterviewQuestionResponse> startSession(@PathVariable UUID id) {
        UUID userId = identityHelper.requireCurrentUserId();
        log.info("POST /api/interviews/{}/start — user={}", id, userId);
        return ResponseEntity.ok(sessionService.startSession(id, userId));
    }

    /**
     * Fetches current pending question or generates next question in sequence.
     */
    @GetMapping("/{id}/next-question")
    public ResponseEntity<InterviewQuestionResponse> getNextQuestion(@PathVariable UUID id) {
        UUID userId = identityHelper.requireCurrentUserId();
        InterviewQuestionResponse question = sessionService.getNextQuestion(id, userId);
        if (question == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(question);
    }

    /**
     * Submits a candidate answer asynchronously, persists answer & durable tasks, and triggers background workers.
     * Returns HTTP 202 Accepted immediately.
     */
    @PostMapping("/{id}/answers")
    public ResponseEntity<AnswerAcceptedResponse> submitAnswer(
            @PathVariable UUID id,
            @Valid @RequestBody SubmitAnswerRequest request) {
        UUID userId = identityHelper.requireCurrentUserId();
        log.info("POST /api/interviews/{}/answers — user={}, question={}", id, userId, request.getQuestionId());
        return ResponseEntity.status(HttpStatus.ACCEPTED)
                .body(sessionService.submitAnswer(id, request, userId));
    }

    /**
     * Returns authoritative session state and current active question for reconnect reconciliation.
     */
    @GetMapping("/{id}/current-state")
    public ResponseEntity<CurrentInterviewStateResponse> getCurrentState(@PathVariable UUID id) {
        UUID userId = identityHelper.requireCurrentUserId();
        return ResponseEntity.ok(sessionService.getCurrentState(id, userId));
    }

    /**
     * Accepts a plain text response from the candidate, loads session context & conversation history,
     * passes text to the AI agent, and returns the AI text response.
     */
    @PostMapping("/{id}/respond")
    public ResponseEntity<InterviewRespondResponse> respond(
            @PathVariable UUID id,
            @Valid @RequestBody InterviewRespondRequest request) {
        UUID userId = identityHelper.requireCurrentUserId();
        log.info("POST /api/interviews/{}/respond — user={}", id, userId);
        return ResponseEntity.ok(sessionService.respond(id, request, userId));
    }

    /**
     * Returns code execution status. A real isolated runner is not configured in this build, so this
     * endpoint reports execution as unavailable rather than pretending the code ran.
     */
    @PostMapping("/{id}/code/run")
    public ResponseEntity<CodeRunResult> runCode(
            @PathVariable UUID id,
            @Valid @RequestBody CodeSubmissionRequest request) {
        UUID userId = identityHelper.requireCurrentUserId();
        return ResponseEntity.ok(sessionService.runCode(id, request, userId));
    }

    /**
     * Submits source code for AI review. This does not imply that the code was compiled or executed.
     */
    @PostMapping("/{id}/code/submit")
    public ResponseEntity<AnswerEvaluationResponseDto> submitCode(
            @PathVariable UUID id,
            @Valid @RequestBody CodeSubmissionRequest request) {
        UUID userId = identityHelper.requireCurrentUserId();
        return ResponseEntity.ok(sessionService.submitCode(id, request, userId));
    }

    /**
     * Pauses the interview session.
     */
    @PostMapping("/{id}/pause")
    public ResponseEntity<Void> pauseSession(@PathVariable UUID id) {
        UUID userId = identityHelper.requireCurrentUserId();
        lifecycleService.pauseSession(id, userId);
        return ResponseEntity.ok().build();
    }

    /**
     * Resumes a paused interview session.
     */
    @PostMapping("/{id}/resume")
    public ResponseEntity<Void> resumeSession(@PathVariable UUID id) {
        UUID userId = identityHelper.requireCurrentUserId();
        lifecycleService.resumeSession(id, userId);
        return ResponseEntity.ok().build();
    }

    /**
     * Skips current question.
     */
    @PostMapping("/{id}/skip")
    public ResponseEntity<Void> skipQuestion(
            @PathVariable UUID id,
            @RequestParam UUID questionId) {
        UUID userId = identityHelper.requireCurrentUserId();
        lifecycleService.skipQuestion(id, questionId, userId);
        return ResponseEntity.ok().build();
    }

    /**
     * Ends the interview early and triggers final report aggregation.
     */
    @PostMapping("/{id}/end")
    public ResponseEntity<InterviewReportResponse> endSession(@PathVariable UUID id) {
        UUID userId = identityHelper.requireCurrentUserId();
        log.info("POST /api/interviews/{}/end — user={}", id, userId);
        return ResponseEntity.ok(lifecycleService.endSessionEarly(id, userId));
    }

    /**
     * Full conversational transcript of all questions and answers.
     */
    @GetMapping("/{id}/transcript")
    public ResponseEntity<InterviewTranscriptResponse> getTranscript(@PathVariable UUID id) {
        UUID userId = identityHelper.requireCurrentUserId();
        return ResponseEntity.ok(queryService.getTranscript(id, userId));
    }

    /**
     * Final comprehensive interview performance report.
     */
    @GetMapping("/{id}/report")
    public ResponseEntity<InterviewReportResponse> getReport(@PathVariable UUID id) {
        UUID userId = identityHelper.requireCurrentUserId();
        return ResponseEntity.ok(queryService.getReport(id, userId));
    }

    /**
     * Retrieves interview history for the authenticated user.
     */
    @GetMapping("/history")
    public ResponseEntity<java.util.List<InterviewHistoryItemResponse>> getInterviewHistory() {
        UUID userId = identityHelper.requireCurrentUserId();
        log.info("GET /api/interviews/history — user={}", userId);
        return ResponseEntity.ok(queryService.getInterviewHistory(userId));
    }

    /**
     * Retrieves full interview details and review for any completed or ongoing interview.
     */
    @GetMapping("/{id}/detail")
    public ResponseEntity<InterviewDetailReviewResponse> getInterviewDetail(@PathVariable UUID id) {
        UUID userId = identityHelper.requireCurrentUserId();
        log.info("GET /api/interviews/{}/detail — user={}", id, userId);
        return ResponseEntity.ok(queryService.getInterviewDetail(id, userId));
    }
}

