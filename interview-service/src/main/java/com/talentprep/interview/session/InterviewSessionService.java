package com.talentprep.interview.session;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentprep.interview.agent.dto.ConversationTurn;
import com.talentprep.interview.coding.CodeExecutionService;
import com.talentprep.interview.coding.service.CodingSubmissionService;
import com.talentprep.interview.coding.dto.CodeRunRequest;
import com.talentprep.interview.coding.dto.CodeRunResult;
import com.talentprep.interview.context.CandidateContextService;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.dto.request.CodeSubmissionRequest;
import com.talentprep.interview.dto.request.CreateInterviewRequest;
import com.talentprep.interview.dto.request.InterviewRespondRequest;
import com.talentprep.interview.dto.request.SubmitAnswerRequest;
import com.talentprep.interview.dto.response.*;
import com.talentprep.interview.entity.*;
import com.talentprep.interview.entity.enums.*;
import com.talentprep.interview.evaluation.ReportGenerationService;
import com.talentprep.interview.exception.InterviewNotFoundException;
import com.talentprep.interview.exception.InvalidSessionStateException;
import com.talentprep.interview.exception.ResumeIntegrationException;
import com.talentprep.interview.exception.UnauthorizedSessionException;
import com.talentprep.interview.repository.*;
import com.talentprep.interview.usage.EntitlementService;
import com.talentprep.interview.agent.FollowUpDecisionWorker;
import com.talentprep.interview.evaluation.AnswerEvaluationWorker;
import com.talentprep.interview.websocket.dto.InterviewEvent;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class InterviewSessionService {

    private static final Logger log = LoggerFactory.getLogger(InterviewSessionService.class);

    private final InterviewSessionRepository sessionRepository;
    private final InterviewRoundRepository roundRepository;
    private final InterviewQuestionRepository questionRepository;
    private final CandidateContextSnapshotRepository snapshotRepository;

    private final CandidateContextService candidateContextService;
    private final EntitlementService entitlementService;
    private final InterviewQuestionService questionService;
    private final InterviewAnswerService answerService;
    private final ReportGenerationService reportGenerationService;
    private final CodeExecutionService codeExecutionService;
    private final CodingSubmissionService codingSubmissionService;
    private final ObjectMapper objectMapper;
    private final AnswerEvaluationWorker evaluationWorker;
    private final FollowUpDecisionWorker followUpWorker;
    private final QuestionPreparationWorker questionPreparationWorker;
    private final QuestionFlowCoordinator questionFlowCoordinator;
    private final SimpMessagingTemplate messagingTemplate;
    private final AsyncInterviewTaskRepository taskRepository;

    public InterviewSessionService(
            InterviewSessionRepository sessionRepository,
            InterviewRoundRepository roundRepository,
            InterviewQuestionRepository questionRepository,
            CandidateContextSnapshotRepository snapshotRepository,
            CandidateContextService candidateContextService,
            EntitlementService entitlementService,
            InterviewQuestionService questionService,
            InterviewAnswerService answerService,
            ReportGenerationService reportGenerationService,
            CodeExecutionService codeExecutionService,
            CodingSubmissionService codingSubmissionService,
            ObjectMapper objectMapper,
            AnswerEvaluationWorker evaluationWorker,
            FollowUpDecisionWorker followUpWorker,
            QuestionPreparationWorker questionPreparationWorker,
            QuestionFlowCoordinator questionFlowCoordinator,
            SimpMessagingTemplate messagingTemplate,
            AsyncInterviewTaskRepository taskRepository) {
        this.sessionRepository = sessionRepository;
        this.roundRepository = roundRepository;
        this.questionRepository = questionRepository;
        this.snapshotRepository = snapshotRepository;
        this.candidateContextService = candidateContextService;
        this.entitlementService = entitlementService;
        this.questionService = questionService;
        this.answerService = answerService;
        this.reportGenerationService = reportGenerationService;
        this.codeExecutionService = codeExecutionService;
        this.codingSubmissionService = codingSubmissionService;
        this.objectMapper = objectMapper;
        this.evaluationWorker = evaluationWorker;
        this.followUpWorker = followUpWorker;
        this.questionPreparationWorker = questionPreparationWorker;
        this.questionFlowCoordinator = questionFlowCoordinator;
        this.messagingTemplate = messagingTemplate;
        this.taskRepository = taskRepository;
    }

    private static final long SETUP_SNAPSHOT_TTL_MINUTES = 2;
    private final ConcurrentHashMap<String, CompletableFuture<CandidateSetupDetailsResponse>> inFlightSetupRequests = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, CompletableFuture<InterviewSessionResponse>> inFlightSessionCreations = new ConcurrentHashMap<>();

    @Transactional
    public CandidateSetupDetailsResponse getSetupDetails(UUID resumeId, UUID userId) {
        // Reuse a recently prepared context. The setup screen is commonly mounted/refreshed
        // more than once; it should not trigger another Resume Service round-trip each time.
        Optional<CandidateContextSnapshot> cachedSnapshot = (resumeId != null)
                ? snapshotRepository.findFirstByUserIdAndResumeIdOrderByCreatedAtDesc(userId, resumeId)
                : snapshotRepository.findFirstByUserIdOrderByCreatedAtDesc(userId);

        if (cachedSnapshot.isPresent()
                && cachedSnapshot.get().getCreatedAt() != null
                && cachedSnapshot.get().getCreatedAt().isAfter(LocalDateTime.now().minusMinutes(SETUP_SNAPSHOT_TTL_MINUTES))) {
            CandidateContextSnapshot snapshot = cachedSnapshot.get();
            CandidateContext context = objectMapper.convertValue(snapshot.getContextData(), CandidateContext.class);
            log.info("Reusing interview setup snapshot: user={}, resumeId={}, snapshotId={}",
                    userId, snapshot.getResumeId(), snapshot.getId());
            return buildSetupResponse(context, userId);
        }

        // In-flight concurrency deduplication: coalesce multiple parallel requests for the same user/resume
        String deduplicationKey = userId + ":" + (resumeId != null ? resumeId : "active");
        CompletableFuture<CandidateSetupDetailsResponse> future = new CompletableFuture<>();
        CompletableFuture<CandidateSetupDetailsResponse> existing = inFlightSetupRequests.putIfAbsent(deduplicationKey, future);
        if (existing != null) {
            log.info("Joining in-flight setup request: key={}", deduplicationKey);
            try {
                return existing.join();
            } catch (CompletionException ce) {
                Throwable cause = ce.getCause() != null ? ce.getCause() : ce;
                if (cause instanceof RuntimeException re) throw re;
                throw new ResumeIntegrationException("Failed to load interview setup details: " + cause.getMessage(), cause);
            }
        }

        try {
            CandidateSetupDetailsResponse resp = fetchAndPersistSetupDetails(resumeId, userId);
            future.complete(resp);
            return resp;
        } catch (Throwable t) {
            future.completeExceptionally(t);
            if (t instanceof RuntimeException re) throw re;
            throw new ResumeIntegrationException("Failed to load interview setup details: " + t.getMessage(), t);
        } finally {
            inFlightSetupRequests.remove(deduplicationKey);
        }
    }

    private CandidateSetupDetailsResponse fetchAndPersistSetupDetails(UUID resumeId, UUID userId) {
        // Re-check snapshot inside supplier in case another thread recently persisted it
        Optional<CandidateContextSnapshot> cachedSnapshot = (resumeId != null)
                ? snapshotRepository.findFirstByUserIdAndResumeIdOrderByCreatedAtDesc(userId, resumeId)
                : snapshotRepository.findFirstByUserIdOrderByCreatedAtDesc(userId);

        CandidateContext context;
        if (cachedSnapshot.isPresent()
                && cachedSnapshot.get().getCreatedAt() != null
                && cachedSnapshot.get().getCreatedAt().isAfter(LocalDateTime.now().minusMinutes(SETUP_SNAPSHOT_TTL_MINUTES))) {
            CandidateContextSnapshot snapshot = cachedSnapshot.get();
            context = objectMapper.convertValue(snapshot.getContextData(), CandidateContext.class);
            log.info("Reusing freshly committed interview setup snapshot: user={}, resumeId={}", userId, snapshot.getResumeId());
            return buildSetupResponse(context, userId);
        }

        log.info("Building candidate context via CandidateContextService: user={}, resumeId={}", userId, resumeId);
        context = candidateContextService.buildContext(resumeId, userId);

        // Persist the context so createSession can use it without calling Resume Service.
        Map<String, Object> contextData = objectMapper.convertValue(
                context, new TypeReference<Map<String, Object>>() {});
        CandidateContextSnapshot setupSnapshot = CandidateContextSnapshot.builder()
                .userId(userId)
                .resumeId(context.getResumeId())
                .candidateName(context.getCandidateName())
                .targetRole(context.getTargetRole())
                .experienceLevel(context.getExperienceLevel())
                .contextData(contextData)
                .build();
        snapshotRepository.save(setupSnapshot);

        return buildSetupResponse(context, userId);
    }

    private CandidateSetupDetailsResponse buildSetupResponse(CandidateContext context, UUID userId) {
        boolean enforced = entitlementService.isEnforced();
        int remaining = -1;
        String planType = "UNLIMITED";

        if (enforced) {
            InterviewUsage usage = entitlementService.getUserUsage(userId);
            int maxAllowed = (usage.getPlanType() == PlanType.PRO) ? usage.getMonthlyAllowance() : 3;
            remaining = Math.max(0, maxAllowed - (usage.getSessionsReserved() + usage.getSessionsConsumed()));
            planType = usage.getPlanType().name();
        }

        return CandidateSetupDetailsResponse.builder()
                .resumeId(context.getResumeId())
                .resumeAvailable(context.isResumeAvailable())
                .candidateName(context.getCandidateName())
                .targetRole(context.getTargetRole())
                .availableTargetRoles(context.getTargetRoles())
                .experienceLevel(context.getExperienceLevel())
                .skills(context.getSkills())
                .projects(context.getProjects())
                .experience(context.getExperience())
                .certifications(context.getCertifications())
                .availableSessionsRemaining(remaining)
                .planType(planType)
                .unlimitedAccess(!enforced)
                .build();
    }

    public InterviewSessionResponse createSession(CreateInterviewRequest request, UUID userId) {
        log.info("Creating interview session for user: {}", userId);

        String rawIdempotencyKey = request.getIdempotencyKey();
        String idempotencyKey = (rawIdempotencyKey != null && !rawIdempotencyKey.isBlank())
                ? rawIdempotencyKey.trim()
                : null;

        if (idempotencyKey != null) {
            // 0. Check if a session was already committed for this user & idempotencyKey
            Optional<InterviewSession> existingByIdempotency = sessionRepository
                    .findByUserIdAndIdempotencyKey(userId, idempotencyKey);
            if (existingByIdempotency.isPresent()) {
                InterviewSession existing = existingByIdempotency.get();
                log.info("Idempotent createSession hit: returning existing session {} for user {}",
                        existing.getId(), userId);
                existing.setRounds(roundRepository.findAllBySessionIdOrderByRoundOrderAsc(existing.getId()));
                return toSessionResponse(existing);
            }

            // In-flight concurrency guard: coalesce simultaneous requests with the same idempotencyKey
            String inFlightKey = userId + ":" + idempotencyKey;
            CompletableFuture<InterviewSessionResponse> future = new CompletableFuture<>();
            CompletableFuture<InterviewSessionResponse> existingFuture = inFlightSessionCreations.putIfAbsent(inFlightKey, future);
            if (existingFuture != null) {
                log.info("Joining in-flight session creation for user {} with idempotencyKey {}", userId, idempotencyKey);
                try {
                    return existingFuture.join();
                } catch (CompletionException ce) {
                    Throwable cause = ce.getCause() != null ? ce.getCause() : ce;
                    if (cause instanceof RuntimeException re) throw re;
                    throw new RuntimeException("Failed creating interview session: " + cause.getMessage(), cause);
                }
            }

            try {
                InterviewSessionResponse created = executeCreateSession(request, userId, idempotencyKey);
                future.complete(created);
                return created;
            } catch (Throwable t) {
                future.completeExceptionally(t);
                // Handle potential race condition that hit database unique constraint
                if (isUniqueConstraintViolation(t)) {
                    log.warn("Concurrent duplicate insert detected for user {} and idempotencyKey {}; retrieving winning session",
                            userId, idempotencyKey);
                    Optional<InterviewSession> winning = sessionRepository.findByUserIdAndIdempotencyKey(userId, idempotencyKey);
                    if (winning.isPresent()) {
                        InterviewSession s = winning.get();
                        s.setRounds(roundRepository.findAllBySessionIdOrderByRoundOrderAsc(s.getId()));
                        return toSessionResponse(s);
                    }
                }
                if (t instanceof RuntimeException re) throw re;
                throw new RuntimeException("Failed creating interview session: " + t.getMessage(), t);
            } finally {
                inFlightSessionCreations.remove(inFlightKey);
            }
        }

        return executeCreateSession(request, userId, null);
    }

    @Transactional
    public InterviewSessionResponse executeCreateSession(CreateInterviewRequest request, UUID userId, String idempotencyKey) {
        // 1. Atomic quota check & reservation (SELECT FOR UPDATE)
        entitlementService.reserveSessionQuota(userId);

        // 2. Reuse candidate context already retrieved during setup (backend-managed setup context)
        UUID requestedResumeId = request.getResumeId();
        Optional<CandidateContextSnapshot> setupSnapshotOpt;
        if (requestedResumeId != null) {
            setupSnapshotOpt = snapshotRepository.findFirstByUserIdAndResumeIdOrderByCreatedAtDesc(userId, requestedResumeId);
        } else {
            setupSnapshotOpt = snapshotRepository.findFirstByUserIdOrderByCreatedAtDesc(userId);
        }

        if (setupSnapshotOpt.isEmpty()) {
            throw new ResumeIntegrationException("No valid resume setup context found. Please initialize interview setup first.");
        }

        CandidateContextSnapshot setupSnapshot = setupSnapshotOpt.get();

        // Validate ownership & requested resumeId
        if (!userId.equals(setupSnapshot.getUserId())) {
            throw new ResumeIntegrationException("Access denied: You do not own the requested resume.");
        }
        if (requestedResumeId != null && setupSnapshot.getResumeId() != null && !requestedResumeId.equals(setupSnapshot.getResumeId())) {
            throw new ResumeIntegrationException("Requested resumeId does not match the active setup context.");
        }

        // 3. Store an immutable resume analysis snapshot for this interview session
        CandidateContextSnapshot sessionSnapshot = CandidateContextSnapshot.builder()
                .userId(userId)
                .resumeId(setupSnapshot.getResumeId())
                .candidateName(setupSnapshot.getCandidateName())
                .targetRole(request.getTargetRole() != null && !request.getTargetRole().isBlank()
                        ? request.getTargetRole() : setupSnapshot.getTargetRole())
                .experienceLevel(setupSnapshot.getExperienceLevel())
                .contextData(setupSnapshot.getContextData())
                .build();
        sessionSnapshot = snapshotRepository.save(sessionSnapshot);

        // 4. Create interview session
        int resolvedDuration = request.getDurationMinutes() != null && request.getDurationMinutes() > 0
                ? request.getDurationMinutes()
                : 45;
        InterviewSession session = InterviewSession.builder()
                .userId(userId)
                .snapshot(sessionSnapshot)
                .status(InterviewStatus.CREATED)
                .difficulty(request.getDifficulty())
                .mode(request.getMode())
                .targetRole(sessionSnapshot.getTargetRole())
                .targetJobDescription(request.getTargetJobDescription())
                .durationMinutes(resolvedDuration)
                .currentRoundIndex(0)
                .idempotencyKey(idempotencyKey)
                .expiresAt(LocalDateTime.now().plusHours(24))
                .build();
        session = sessionRepository.save(session);

        // 5. Initialize rounds
        List<InterviewRound> rounds = new ArrayList<>();
        int order = 1;
        int totalRounds = request.getRounds().size();
        for (RoundType roundType : request.getRounds()) {
            InterviewRound round = InterviewRound.builder()
                    .session(session)
                    .roundOrder(order++)
                    .roundType(roundType)
                    .status(RoundStatus.PENDING)
                    .targetQuestionCount(computeTargetQuestionCount(roundType, resolvedDuration, totalRounds))
                    .completedQuestionCount(0)
                    .build();
            rounds.add(round);
        }
        roundRepository.saveAll(rounds);
        session.setRounds(rounds);

        return toSessionResponse(session);
    }

    private boolean isUniqueConstraintViolation(Throwable t) {
        Throwable curr = t;
        while (curr != null) {
            String msg = curr.getMessage() != null ? curr.getMessage() : "";
            if (curr instanceof org.springframework.dao.DataIntegrityViolationException
                    || curr instanceof org.hibernate.exception.ConstraintViolationException
                    || msg.contains("uq_interview_sessions_user_idempotency")
                    || msg.contains("duplicate key value")) {
                return true;
            }
            curr = curr.getCause();
        }
        return false;
    }

    @Transactional
    public InterviewQuestionResponse startSession(UUID sessionId, UUID userId) {
        InterviewSession session = requireOwnedSession(sessionId, userId);

        if (session.getStatus() != InterviewStatus.CREATED) {
            throw new InvalidSessionStateException("Session cannot be started from state: " + session.getStatus());
        }

        // Consume reserved quota on formal start
        entitlementService.consumeSessionQuota(userId);

        session.setStatus(InterviewStatus.IN_PROGRESS);
        session.setStartedAt(LocalDateTime.now());

        List<InterviewRound> rounds = roundRepository.findAllBySessionIdOrderByRoundOrderAsc(sessionId);
        if (rounds.isEmpty()) {
            throw new InvalidSessionStateException("Interview session has no rounds configured.");
        }

        InterviewRound firstRound = rounds.get(0);
        firstRound.setStatus(RoundStatus.IN_PROGRESS);
        firstRound.setStartedAt(LocalDateTime.now());
        roundRepository.save(firstRound);
        sessionRepository.save(session);

        CandidateContext context = restoreCandidateContext(session);
        InterviewQuestionResponse q1 = questionService.generateQuestion(session, firstRound, context, List.of(), 1);
        publishEvent(session, "INTERVIEW_STARTED", q1);
        publishEvent(session, "NEXT_QUESTION_READY", q1);
        return q1;
    }

    @Transactional
    public InterviewQuestionResponse getNextQuestion(UUID sessionId, UUID userId) {
        InterviewSession session = requireOwnedSession(sessionId, userId);

        if (session.getStatus() != InterviewStatus.IN_PROGRESS && session.getStatus() != InterviewStatus.ROUND_TRANSITION) {
            throw new InvalidSessionStateException("Cannot get next question when session is: " + session.getStatus());
        }

        List<InterviewRound> rounds = roundRepository.findAllBySessionIdOrderByRoundOrderAsc(sessionId);
        int currentIdx = session.getCurrentRoundIndex();
        if (currentIdx >= rounds.size()) {
            return null; // All rounds completed
        }

        if (session.isTimeExpired(LocalDateTime.now())) {
            log.info("Session {} reached configured duration ({} min); completing session",
                    sessionId, session.getDurationMinutes());
            completeSessionOnExpiry(session, rounds);
            return null;
        }

        InterviewRound currentRound = rounds.get(currentIdx);

        // 1. Check if there is already a PENDING question (prevents duplicate generation on refresh/double clicks)
        List<InterviewQuestion> existingQuestions = questionRepository.findAllByRoundIdOrderByQuestionOrderAsc(currentRound.getId());
        for (InterviewQuestion q : existingQuestions) {
            if (q.getQuestionStatus() == QuestionStatus.PENDING) {
                return questionService.toResponse(q, currentRound, session);
            }
        }

        // 2. Check if an asynchronous follow-up question was generated and is READY
        for (InterviewQuestion q : existingQuestions) {
            if (q.getQuestionStatus() == QuestionStatus.READY && Boolean.TRUE.equals(q.getIsFollowUp())) {
                q = questionRepository.findByIdForUpdate(q.getId()).orElse(q);
                if (q.getQuestionStatus() != QuestionStatus.READY) {
                    continue;
                }
                q.setQuestionStatus(QuestionStatus.PENDING);
                q.setDeliveredAt(LocalDateTime.now());
                questionRepository.save(q);
                session.setCurrentQuestionId(q.getId());
                int nextSeq = (session.getTurnSequence() != null ? session.getTurnSequence() : 0) + 1;
                session.setTurnSequence(nextSeq);
                sessionRepository.save(session);

                InterviewQuestionResponse response = questionService.toResponse(q, currentRound, session);
                publishEvent(session, "NEXT_QUESTION_READY", response);
                return response;
            }
        }

        // Do not advance the round while an answer's independent follow-up decision /
        // main-question preparation is still unresolved (only applies to conversational rounds, not coding).
        boolean unresolvedFlow = currentRound.getRoundType() != RoundType.CODING && existingQuestions.stream().anyMatch(q ->
                !Boolean.TRUE.equals(q.getIsFollowUp())
                        && q.getAnswer() != null
                        && q.getFollowUpDecision() == null);
        if (unresolvedFlow) {
            return null;
        }

        boolean mainPreparationStillRunning = currentRound.getRoundType() != RoundType.CODING && existingQuestions.stream()
                .filter(q -> !Boolean.TRUE.equals(q.getIsFollowUp())
                        && q.getAnswer() != null
                        && "MOVE_ON".equals(q.getFollowUpDecision()))
                .anyMatch(q -> {
                    if (questionRepository.existsByPreparedForQuestionId(q.getId())) return false;
                    return taskRepository.findByAnswerIdAndTaskType(
                                    q.getAnswer().getId(), TaskType.MAIN_QUESTION_PREPARATION)
                            .map(task -> task.getStatus() == TaskStatus.PENDING || task.getStatus() == TaskStatus.RUNNING)
                            .orElse(false);
                });
        if (mainPreparationStillRunning) {
            return null;
        }

        // 3. If target count reached for this round, advance round or finish interview
        if (currentRound.getCompletedQuestionCount() >= currentRound.getTargetQuestionCount()) {
            currentRound.setStatus(RoundStatus.COMPLETED);
            currentRound.setCompletedAt(LocalDateTime.now());
            roundRepository.save(currentRound);

            if (currentIdx + 1 < rounds.size()) {
                session.setCurrentRoundIndex(currentIdx + 1);
                session.setStatus(InterviewStatus.IN_PROGRESS);
                InterviewRound nextRound = rounds.get(currentIdx + 1);
                nextRound.setStatus(RoundStatus.IN_PROGRESS);
                nextRound.setStartedAt(LocalDateTime.now());
                roundRepository.save(nextRound);
                sessionRepository.save(session);
                currentRound = nextRound;
                existingQuestions = List.of();
            } else {
                session.setStatus(InterviewStatus.COMPLETED);
                session.setCompletedAt(LocalDateTime.now());
                sessionRepository.save(session);
                reportGenerationService.generateReport(session);
                publishEvent(session, "INTERVIEW_COMPLETED", Map.of("sessionId", session.getId()));
                publishEvent(session, "REPORT_READY", Map.of("sessionId", session.getId()));
                return null;
            }
        }

        // 4. Generate next base question in sequence
        List<ConversationTurn> history = buildConversationHistory(existingQuestions);
        CandidateContext context = restoreCandidateContext(session);
        int nextOrder = existingQuestions.size() + 1;

        InterviewQuestionResponse nextQuestion = questionService.generateQuestion(session, currentRound, context, history, nextOrder);
        publishEvent(session, "NEXT_QUESTION_READY", nextQuestion);
        return nextQuestion;
    }

    /**
     * V1 Asynchronous Answer Submission:
     * 1. Validates ownership and active session.
     * 2. Atomically persists answer and registers durable async tasks (idempotent).
     * 3. Publishes ANSWER_RECEIVED and INTERVIEWER_THINKING over WebSocket.
     * 4. Dispatches independent async workers for evaluation and follow-up generation.
     * 5. Returns HTTP 202 Accepted immediately.
     */
    @Transactional
    public AnswerAcceptedResponse submitAnswer(UUID sessionId, SubmitAnswerRequest request, UUID userId) {
        InterviewQuestion question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new IllegalArgumentException("Question not found: " + request.getQuestionId()));
        requireQuestionBelongsToSession(question, sessionId);

        InterviewRound round = question.getRound();
        InterviewSession session = requireOwnedSession(round.getSession().getId(), userId);

        if (session.getStatus() != InterviewStatus.IN_PROGRESS) {
            throw new InvalidSessionStateException("Cannot submit answer to session in status: " + session.getStatus());
        }
        if (question.getQuestionStatus() != QuestionStatus.PENDING) {
            throw new InvalidSessionStateException("Question has already been answered or skipped.");
        }

        var submissionResult = answerService.saveAnswerAndRegisterTasks(question, request, sessionId);
        InterviewAnswer answer = submissionResult.answer();

        int nextTurn = (session.getTurnSequence() != null ? session.getTurnSequence() : 0) + 1;
        session.setTurnSequence(nextTurn);
        sessionRepository.save(session);

        round.setCompletedQuestionCount(round.getCompletedQuestionCount() + 1);
        roundRepository.save(round);

        // Dispatch only after the answer and durable task rows have committed. Otherwise
        // an async worker can race the submitting transaction and fail to see its rows.
        if (!submissionResult.isExisting()) {
            CandidateContext context = restoreCandidateContext(session);
            List<InterviewQuestion> roundQuestions = questionRepository.findAllByRoundIdOrderByQuestionOrderAsc(round.getId());
            List<ConversationTurn> history = buildConversationHistory(roundQuestions);
            long remainingSeconds = session.computeRemainingSeconds(LocalDateTime.now());

            UUID asyncRoundId = round.getId();
            afterCommit(() -> dispatchAsyncProcessing(
                    session, asyncRoundId, question, answer,
                    submissionResult.evaluationTask(), submissionResult.followUpTask(),
                    submissionResult.preparationTask(), context, history, remainingSeconds, session.getDifficulty()));
        }

        return AnswerAcceptedResponse.builder()
                .answerId(answer.getId())
                .status("RECEIVED")
                .sessionId(sessionId)
                .build();
    }

    /**
     * Authoritative session state for client reconnect reconciliation.
     */
    @Transactional(readOnly = true)
    public CurrentInterviewStateResponse getCurrentState(UUID sessionId, UUID userId) {
        InterviewSession session = requireOwnedSession(sessionId, userId);
        boolean isCompleted = session.getStatus() == InterviewStatus.COMPLETED
                || session.getStatus() == InterviewStatus.FAILED;

        InterviewQuestionResponse currentQuestion = null;
        if (!isCompleted) {
            List<InterviewRound> rounds = roundRepository.findAllBySessionIdOrderByRoundOrderAsc(sessionId);
            int currentIdx = session.getCurrentRoundIndex();
            if (currentIdx < rounds.size()) {
                InterviewRound currentRound = rounds.get(currentIdx);
                List<InterviewQuestion> questions = questionRepository
                        .findAllByRoundIdOrderByQuestionOrderAsc(currentRound.getId());
                for (InterviewQuestion q : questions) {
                    if (q.getQuestionStatus() == QuestionStatus.PENDING) {
                        currentQuestion = questionService.toResponse(q, currentRound, session);
                        break;
                    }
                }
            }
        }

        var runningTasks = taskRepository.findAllBySessionIdAndStatus(sessionId, TaskStatus.RUNNING);
        var pendingTasks = taskRepository.findAllBySessionIdAndStatus(sessionId, TaskStatus.PENDING);
        boolean isThinking = !runningTasks.isEmpty() || !pendingTasks.isEmpty();

        return CurrentInterviewStateResponse.builder()
                .sessionId(session.getId())
                .status(session.getStatus().name())
                .turnSequence(session.getTurnSequence() != null ? session.getTurnSequence() : 0)
                .currentQuestion(currentQuestion)
                .isInterviewerThinking(isThinking)
                .isEvaluating(isThinking)
                .isCompleted(isCompleted)
                .remainingSeconds(session.computeRemainingSeconds(LocalDateTime.now()))
                .build();
    }

    private void afterCommit(Runnable action) {
        if (org.springframework.transaction.support.TransactionSynchronizationManager.isSynchronizationActive()) {
            org.springframework.transaction.support.TransactionSynchronizationManager.registerSynchronization(
                    new org.springframework.transaction.support.TransactionSynchronization() {
                        @Override public void afterCommit() { action.run(); }
                    });
        } else {
            action.run();
        }
    }

    private void dispatchAsyncProcessing(
            InterviewSession submittedSession,
            UUID roundId,
            InterviewQuestion question,
            InterviewAnswer answer,
            AsyncInterviewTask evaluationTask,
            AsyncInterviewTask followUpTask,
            AsyncInterviewTask preparationTask,
            CandidateContext context,
            List<ConversationTurn> history,
            long remainingSeconds,
            DifficultyLevel difficulty) {

        UUID sessionId = submittedSession.getId();
        InterviewSession eventSession = sessionRepository.findById(sessionId).orElse(submittedSession);
        publishEvent(eventSession, "ANSWER_SUBMITTED",
                Map.of("answerId", answer.getId(), "questionId", question.getId()));
        // Keep the legacy name during frontend migration.
        publishEvent(eventSession, "ANSWER_RECEIVED",
                Map.of("answerId", answer.getId(), "questionId", question.getId()));
        publishEvent(eventSession, "INTERVIEWER_THINKING",
                Map.of("questionId", question.getId()));

        try {
            evaluationWorker.processEvaluationAsync(evaluationTask.getId(), answer.getId(), context, history);
        } catch (RuntimeException dispatchError) {
            markDispatchFailed(evaluationTask, dispatchError);
            answer.setEvaluationStatus("FAILED");
            questionFlowCoordinator.publishError(question.getId(), "EVALUATION_DISPATCH_FAILED", safeErrorMessage(dispatchError));
        }

        if (!Boolean.TRUE.equals(question.getIsFollowUp()) && preparationTask != null) {
            try {
                questionPreparationWorker.prepareNextMainQuestionAsync(
                        preparationTask.getId(), sessionId, roundId, question.getId(), context, history);
            } catch (RuntimeException dispatchError) {
                markDispatchFailed(preparationTask, dispatchError);
                questionFlowCoordinator.publishError(question.getId(), "QUESTION_PREPARATION_DISPATCH_FAILED", safeErrorMessage(dispatchError));
            }
        }

        try {
            followUpWorker.processFollowUpAsync(
                    followUpTask.getId(), answer.getId(), question.getId(), answer.getAnswerText(),
                    context, history, remainingSeconds, difficulty);
        } catch (RuntimeException dispatchError) {
            markDispatchFailed(followUpTask, dispatchError);
            UUID rootId = question.getParentQuestionId() != null
                    ? question.getParentQuestionId() : question.getId();
            questionFlowCoordinator.resolveRootDecision(rootId, "MOVE_ON");
            questionFlowCoordinator.publishError(question.getId(), "FOLLOW_UP_DISPATCH_FAILED", safeErrorMessage(dispatchError));
        }
    }

    private void markDispatchFailed(AsyncInterviewTask task, RuntimeException error) {
        if (task == null) return;
        task.setStatus(TaskStatus.FAILED);
        task.setCompletedAt(LocalDateTime.now());
        task.setLastErrorCode(error.getClass().getSimpleName());
        task.setLastErrorMessage(safeErrorMessage(error));
        taskRepository.save(task);
    }

    private String safeErrorMessage(Exception error) {
        String message = error.getMessage();
        if (message == null || message.isBlank()) return "Background task could not be scheduled.";
        return message.length() > 250 ? message.substring(0, 250) : message;
    }

    private void publishEvent(InterviewSession session, String eventType, Object payload) {
        try {
            int seq = session.getTurnSequence() != null ? session.getTurnSequence() : 0;
            InterviewEvent event = InterviewEvent.of(eventType, session.getId(), seq, payload);
            messagingTemplate.convertAndSend("/topic/interviews/" + session.getId(), event);
            messagingTemplate.convertAndSendToUser(session.getUserId().toString(), "/queue/interviews/events", event);
        } catch (Exception ex) {
            log.warn("Failed to publish WebSocket event {} for session {}: {}", eventType, session.getId(), ex.getMessage());
        }
    }

    @Transactional
    public AnswerEvaluationResponseDto submitAnswerSync(UUID sessionId, SubmitAnswerRequest request, UUID userId) {
        InterviewQuestion question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new IllegalArgumentException("Question not found: " + request.getQuestionId()));
        requireQuestionBelongsToSession(question, sessionId);

        InterviewRound round = question.getRound();
        InterviewSession session = requireOwnedSession(round.getSession().getId(), userId);

        if (session.getStatus() != InterviewStatus.IN_PROGRESS) {
            throw new InvalidSessionStateException("Cannot submit answer to session in status: " + session.getStatus());
        }
        if (question.getQuestionStatus() != QuestionStatus.PENDING) {
            throw new InvalidSessionStateException("Question has already been answered or skipped.");
        }

        CandidateContext context = restoreCandidateContext(session);
        List<InterviewQuestion> roundQuestions = questionRepository.findAllByRoundIdOrderByQuestionOrderAsc(round.getId());
        List<InterviewQuestion> priorQuestions = roundQuestions == null ? List.of() : roundQuestions.stream()
                .filter(existing -> !existing.getId().equals(question.getId())).toList();
        List<ConversationTurn> history = buildConversationHistory(priorQuestions);

        AnswerEvaluation eval = answerService.submitAndEvaluate(question, request, context, history);

        round.setCompletedQuestionCount(round.getCompletedQuestionCount() + 1);
        roundRepository.save(round);

        boolean timeExpired = session.isTimeExpired(LocalDateTime.now());
        boolean roundDone = round.getCompletedQuestionCount() >= round.getTargetQuestionCount() || timeExpired;
        boolean interviewDone = false;

        if (roundDone) {
            round.setStatus(RoundStatus.COMPLETED);
            round.setCompletedAt(LocalDateTime.now());
            roundRepository.save(round);

            List<InterviewRound> allRounds = roundRepository.findAllBySessionIdOrderByRoundOrderAsc(session.getId());
            if (!timeExpired && session.getCurrentRoundIndex() + 1 < allRounds.size()) {
                session.setCurrentRoundIndex(session.getCurrentRoundIndex() + 1);
                session.setStatus(InterviewStatus.ROUND_TRANSITION);
                sessionRepository.save(session);
            } else {
                session.setStatus(InterviewStatus.COMPLETED);
                session.setCompletedAt(LocalDateTime.now());
                sessionRepository.save(session);
                reportGenerationService.generateReport(session);
                interviewDone = true;
            }
        }

        return AnswerEvaluationResponseDto.builder()
                .evaluationId(eval.getId())
                .questionId(question.getId())
                .score(eval.getScore())
                .technicalAccuracy(eval.getTechnicalAccuracy())
                .completeness(eval.getCompleteness())
                .clarity(eval.getClarity())
                .problemSolving(eval.getProblemSolving())
                .feedback(eval.getFeedback())
                .strengths(eval.getStrengths())
                .improvements(eval.getImprovements())
                .suggestedIdealAnswer(eval.getSuggestedIdealAnswer())
                .roundCompleted(roundDone)
                .interviewCompleted(interviewDone)
                .currentRoundIndex(session.getCurrentRoundIndex())
                .build();
    }

    @Transactional
    public InterviewRespondResponse respond(UUID sessionId, InterviewRespondRequest request, UUID userId) {
        if (request == null || request.getMessage() == null || request.getMessage().isBlank()) {
            throw new IllegalArgumentException("Message must not be blank.");
        }

        InterviewSession session = requireOwnedSession(sessionId, userId);
        if (session.getStatus() != InterviewStatus.IN_PROGRESS && session.getStatus() != InterviewStatus.ROUND_TRANSITION) {
            throw new InvalidSessionStateException("Cannot respond when session is in status: " + session.getStatus());
        }

        if (session.isTimeExpired(LocalDateTime.now())) {
            List<InterviewRound> rounds = roundRepository.findAllBySessionIdOrderByRoundOrderAsc(sessionId);
            completeSessionOnExpiry(session, rounds);
            return InterviewRespondResponse.builder()
                    .sessionId(sessionId)
                    .response("Interview session duration has expired. The interview has been completed.")
                    .message("Interview session duration has expired. The interview has been completed.")
                    .turnSequence(session.getTurnSequence() != null ? session.getTurnSequence() : 0)
                    .completed(true)
                    .build();
        }

        CandidateContext context = restoreCandidateContext(session);

        List<InterviewRound> rounds = roundRepository.findAllBySessionIdOrderByRoundOrderAsc(sessionId);
        int currentIdx = session.getCurrentRoundIndex();
        if (currentIdx >= rounds.size()) {
            return InterviewRespondResponse.builder()
                    .sessionId(sessionId)
                    .response("All interview rounds have been completed.")
                    .message("All interview rounds have been completed.")
                    .turnSequence(session.getTurnSequence() != null ? session.getTurnSequence() : 0)
                    .completed(true)
                    .build();
        }

        InterviewRound currentRound = rounds.get(currentIdx);
        List<InterviewQuestion> roundQuestions = questionRepository.findAllByRoundIdOrderByQuestionOrderAsc(currentRound.getId());

        // Locate currently pending question to evaluate
        InterviewQuestion pendingQuestion = null;
        for (InterviewQuestion q : roundQuestions) {
            if (q.getQuestionStatus() == QuestionStatus.PENDING) {
                pendingQuestion = q;
                break;
            }
        }

        String aiResponseText;
        boolean completed = false;

        if (pendingQuestion != null) {
            final UUID pendingId = pendingQuestion.getId();
            List<InterviewQuestion> priorQuestions = roundQuestions.stream()
                    .filter(existing -> !existing.getId().equals(pendingId))
                    .toList();
            List<ConversationTurn> history = buildConversationHistory(priorQuestions);

            SubmitAnswerRequest answerRequest = SubmitAnswerRequest.builder()
                    .questionId(pendingQuestion.getId())
                    .answerText(request.getMessage().trim())
                    .clientRequestId("respond-" + System.currentTimeMillis())
                    .timeTakenSeconds(0)
                    .build();

            AnswerEvaluation eval = answerService.submitAndEvaluate(pendingQuestion, answerRequest, context, history);

            currentRound.setCompletedQuestionCount(currentRound.getCompletedQuestionCount() + 1);
            roundRepository.save(currentRound);

            boolean timeExpired = session.isTimeExpired(LocalDateTime.now());
            boolean roundDone = currentRound.getCompletedQuestionCount() >= currentRound.getTargetQuestionCount() || timeExpired;

            if (roundDone) {
                currentRound.setStatus(RoundStatus.COMPLETED);
                currentRound.setCompletedAt(LocalDateTime.now());
                roundRepository.save(currentRound);

                int nextIdx = currentIdx + 1;
                if (nextIdx < rounds.size() && !timeExpired) {
                    session.setCurrentRoundIndex(nextIdx);
                    session.setStatus(InterviewStatus.ROUND_TRANSITION);
                    sessionRepository.save(session);

                    InterviewRound nextRound = rounds.get(nextIdx);
                    nextRound.setStatus(RoundStatus.IN_PROGRESS);
                    nextRound.setStartedAt(LocalDateTime.now());
                    roundRepository.save(nextRound);

                    InterviewQuestionResponse nextQ = questionService.generateQuestion(session, nextRound, context, List.of(), 1);
                    session.setCurrentQuestionId(nextQ.getQuestionId());
                    session.setStatus(InterviewStatus.IN_PROGRESS);
                    session.setTurnSequence((session.getTurnSequence() != null ? session.getTurnSequence() : 0) + 1);
                    sessionRepository.save(session);
                    aiResponseText = nextQ.getQuestionText();
                } else {
                    session.setStatus(InterviewStatus.COMPLETED);
                    session.setCompletedAt(LocalDateTime.now());
                    sessionRepository.save(session);
                    reportGenerationService.generateReport(session);
                    completed = true;
                    aiResponseText = "Thank you. You have completed all questions for this interview session.";
                }
            } else {
                // Next question or follow up in current round
                InterviewQuestionResponse nextQ = getNextQuestion(sessionId, userId);
                if (nextQ != null) {
                    aiResponseText = nextQ.getQuestionText();
                } else {
                    aiResponseText = "Your answer has been evaluated: " + (eval.getFeedback() != null ? eval.getFeedback() : "Good.");
                }
            }
        } else {
            // No pending question; generate next question
            InterviewQuestionResponse nextQ = getNextQuestion(sessionId, userId);
            if (nextQ != null) {
                aiResponseText = nextQ.getQuestionText();
            } else {
                completed = true;
                aiResponseText = "All questions in this interview have been completed.";
            }
        }

        return InterviewRespondResponse.builder()
                .sessionId(sessionId)
                .response(aiResponseText)
                .message(aiResponseText)
                .turnSequence(session.getTurnSequence() != null ? session.getTurnSequence() : 0)
                .completed(completed)
                .build();
    }

    @Transactional
    public CodeRunResult runCode(UUID sessionId, CodeSubmissionRequest request, UUID userId) {
        return codingSubmissionService.runCode(sessionId, request, userId);
    }

    @Transactional
    public AnswerEvaluationResponseDto submitCode(UUID sessionId, CodeSubmissionRequest request, UUID userId) {
        return codingSubmissionService.submitCode(sessionId, request, userId);
    }

    private void requireQuestionBelongsToSession(InterviewQuestion question, UUID sessionId) {
        if (question.getRound() == null || question.getRound().getSession() == null
                || !sessionId.equals(question.getRound().getSession().getId())) {
            throw new IllegalArgumentException("Question does not belong to the requested interview session.");
        }
    }

    private InterviewSession requireOwnedSession(UUID sessionId, UUID userId) {
        InterviewSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new InterviewNotFoundException(sessionId));
        if (!session.getUserId().equals(userId)) {
            throw new UnauthorizedSessionException(sessionId, userId);
        }
        return session;
    }

    private CandidateContext restoreCandidateContext(InterviewSession session) {
        CandidateContextSnapshot snapshot = session.getSnapshot();
        return objectMapper.convertValue(snapshot.getContextData(), CandidateContext.class);
    }

    private List<ConversationTurn> buildConversationHistory(List<InterviewQuestion> questions) {
        List<ConversationTurn> history = new ArrayList<>();
        if (questions == null) return history;

        for (InterviewQuestion q : questions) {
            InterviewAnswer a = q.getAnswer();
            AnswerEvaluation eval = a != null ? a.getEvaluation() : null;

            history.add(ConversationTurn.builder()
                    .questionId(q.getId())
                    .order(q.getQuestionOrder())
                    .questionText(q.getQuestionText())
                    .questionCategory(q.getQuestionCategory())
                    .difficulty(q.getDifficulty())
                    .isFollowUp(q.getIsFollowUp())
                    .candidateAnswer(a != null ? a.getAnswerText() : null)
                    .score(eval != null ? eval.getScore() : null)
                    .feedback(eval != null ? eval.getFeedback() : null)
                    .triggersFollowUp(eval != null ? eval.getTriggersFollowUp() : false)
                    .followUpReason(eval != null ? eval.getFollowUpReason() : null)
                    .build());
        }
        return history;
    }

    private InterviewSessionResponse toSessionResponse(InterviewSession session) {
        List<InterviewRound> rounds = roundRepository.findAllBySessionIdOrderByRoundOrderAsc(session.getId());
        List<InterviewRoundResponse> roundResponses = rounds.stream()
                .map(r -> InterviewRoundResponse.builder()
                        .id(r.getId())
                        .roundOrder(r.getRoundOrder())
                        .roundType(r.getRoundType())
                        .status(r.getStatus())
                        .targetQuestionCount(r.getTargetQuestionCount())
                        .completedQuestionCount(r.getCompletedQuestionCount())
                        .roundScore(r.getRoundScore())
                        .build())
                .toList();

        LocalDateTime now = LocalDateTime.now();
        return InterviewSessionResponse.builder()
                .id(session.getId())
                .userId(session.getUserId())
                .resumeId(session.getSnapshot() != null ? session.getSnapshot().getResumeId() : null)
                .status(session.getStatus())
                .difficulty(session.getDifficulty())
                .mode(session.getMode())
                .targetRole(session.getTargetRole())
                .durationMinutes(session.getDurationMinutes())
                .currentRoundIndex(session.getCurrentRoundIndex())
                .totalRounds(rounds.size())
                .startedAt(session.getStartedAt())
                .completedAt(session.getCompletedAt())
                .pausedAt(session.getPausedAt())
                .totalPausedSeconds(session.getTotalPausedSeconds())
                .remainingSeconds(session.computeRemainingSeconds(now))
                .endsAt(session.computeEffectiveEndsAt())
                .createdAt(session.getCreatedAt())
                .rounds(roundResponses)
                .build();
    }

    private int computeTargetQuestionCount(RoundType roundType, int durationMinutes, int roundCount) {
        int effectivePerRoundMinutes = Math.max(10, durationMinutes / Math.max(1, roundCount));
        if (roundType == RoundType.CODING) {
            if (effectivePerRoundMinutes <= 20) return 1;
            if (effectivePerRoundMinutes <= 60) return 2;
            return 3;
        }
        if (effectivePerRoundMinutes <= 20) return 3;
        if (effectivePerRoundMinutes <= 35) return 4;
        if (effectivePerRoundMinutes <= 50) return 5;
        return 6;
    }

    private void completeSessionOnExpiry(InterviewSession session, List<InterviewRound> rounds) {
        LocalDateTime now = LocalDateTime.now();
        for (InterviewRound r : rounds) {
            if (r.getStatus() == RoundStatus.IN_PROGRESS || r.getStatus() == RoundStatus.PENDING) {
                r.setStatus(RoundStatus.COMPLETED);
                if (r.getCompletedAt() == null) {
                    r.setCompletedAt(now);
                }
                roundRepository.save(r);
            }
        }
        session.setStatus(InterviewStatus.COMPLETED);
        session.setCompletedAt(now);
        session.setPausedAt(null);
        sessionRepository.save(session);
        reportGenerationService.generateReport(session);
    }

}

