package com.talentprep.interview;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentprep.interview.agent.InterviewAgent;
import com.talentprep.interview.agent.dto.AgentQuestionResponse;
import com.talentprep.interview.coding.CodeExecutionService;
import com.talentprep.interview.context.CandidateContextService;
import com.talentprep.interview.agent.FollowUpDecisionWorker;
import com.talentprep.interview.dto.response.AnswerAcceptedResponse;
import com.talentprep.interview.evaluation.AnswerEvaluationWorker;
import com.talentprep.interview.repository.AsyncInterviewTaskRepository;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.dto.request.CreateInterviewRequest;
import com.talentprep.interview.dto.request.InterviewRespondRequest;
import com.talentprep.interview.dto.request.SubmitAnswerRequest;
import com.talentprep.interview.dto.response.AnswerAcceptedResponse;
import com.talentprep.interview.dto.response.AnswerEvaluationResponseDto;
import com.talentprep.interview.dto.response.CandidateSetupDetailsResponse;
import com.talentprep.interview.dto.response.InterviewQuestionResponse;
import com.talentprep.interview.dto.response.InterviewRespondResponse;
import com.talentprep.interview.dto.response.InterviewSessionResponse;
import com.talentprep.interview.entity.*;
import com.talentprep.interview.entity.enums.*;
import com.talentprep.interview.evaluation.AnswerEvaluationService;
import com.talentprep.interview.evaluation.ReportGenerationService;
import com.talentprep.interview.exception.InvalidSessionStateException;
import com.talentprep.interview.exception.ResumeIntegrationException;
import com.talentprep.interview.exception.UnauthorizedSessionException;
import com.talentprep.interview.repository.*;
import com.talentprep.interview.session.InterviewSessionService;
import com.talentprep.interview.session.InterviewQuestionService;
import com.talentprep.interview.session.InterviewAnswerService;
import com.talentprep.interview.session.QuestionPreparationWorker;
import com.talentprep.interview.usage.EntitlementService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class InterviewSessionServiceTest {

    private InterviewSessionRepository sessionRepository;
    private InterviewRoundRepository roundRepository;
    private InterviewQuestionRepository questionRepository;
    private InterviewAnswerRepository answerRepository;
    private CandidateContextSnapshotRepository snapshotRepository;
    private CandidateContextService candidateContextService;
    private EntitlementService entitlementService;
    private InterviewAgent interviewAgent;
    private AnswerEvaluationService evaluationService;
    private InterviewQuestionService questionService;
    private InterviewAnswerService answerService;
    private ReportGenerationService reportGenerationService;
    private CodeExecutionService codeExecutionService;
    private ObjectMapper objectMapper;
    private AnswerEvaluationWorker evaluationWorker;
    private FollowUpDecisionWorker followUpWorker;
    private QuestionPreparationWorker questionPreparationWorker;
    private com.talentprep.interview.session.QuestionFlowCoordinator questionFlowCoordinator;
    private SimpMessagingTemplate messagingTemplate;
    private AsyncInterviewTaskRepository taskRepository;

    private InterviewSessionService sessionService;

    @BeforeEach
    void setUp() {
        sessionRepository = Mockito.mock(InterviewSessionRepository.class);
        roundRepository = Mockito.mock(InterviewRoundRepository.class);
        questionRepository = Mockito.mock(InterviewQuestionRepository.class);
        answerRepository = Mockito.mock(InterviewAnswerRepository.class);
        snapshotRepository = Mockito.mock(CandidateContextSnapshotRepository.class);
        candidateContextService = Mockito.mock(CandidateContextService.class);
        entitlementService = Mockito.mock(EntitlementService.class);
        interviewAgent = Mockito.mock(InterviewAgent.class);
        evaluationService = Mockito.mock(AnswerEvaluationService.class);
        taskRepository = Mockito.mock(AsyncInterviewTaskRepository.class);
        evaluationWorker = Mockito.mock(AnswerEvaluationWorker.class);
        followUpWorker = Mockito.mock(FollowUpDecisionWorker.class);
        questionPreparationWorker = Mockito.mock(QuestionPreparationWorker.class);
        questionFlowCoordinator = Mockito.mock(com.talentprep.interview.session.QuestionFlowCoordinator.class);
        messagingTemplate = Mockito.mock(SimpMessagingTemplate.class);
        questionService = new InterviewQuestionService(questionRepository, interviewAgent, roundRepository);
        answerService = new InterviewAnswerService(answerRepository, questionRepository, evaluationService, taskRepository);
        reportGenerationService = Mockito.mock(ReportGenerationService.class);
        codeExecutionService = Mockito.mock(CodeExecutionService.class);
        com.talentprep.interview.coding.service.CodingSubmissionService codingSubmissionService = Mockito.mock(com.talentprep.interview.coding.service.CodingSubmissionService.class);
        objectMapper = new ObjectMapper();

        sessionService = new InterviewSessionService(
                sessionRepository,
                roundRepository,
                questionRepository,
                snapshotRepository,
                candidateContextService,
                entitlementService,
                questionService,
                answerService,
                reportGenerationService,
                codeExecutionService,
                codingSubmissionService,
                objectMapper,
                evaluationWorker,
                followUpWorker,
                questionPreparationWorker,
                questionFlowCoordinator,
                messagingTemplate,
                taskRepository
        );
    }

    @Test
    @DisplayName("Interview setup fetches resume context once and stores setup snapshot")
    void testSetupWorkflowFetchesResumeOnceAndSavesSnapshot() {
        UUID userId = UUID.randomUUID();
        UUID resumeId = UUID.randomUUID();

        CandidateContext context = CandidateContext.builder()
                .userId(userId)
                .resumeId(resumeId)
                .resumeAvailable(true)
                .candidateName("Sam Taylor")
                .targetRole("Backend Engineer")
                .skills(List.of("Java", "Spring Boot"))
                .projects(List.of())
                .experience(List.of())
                .build();

        when(candidateContextService.buildContext(resumeId, userId)).thenReturn(context);
        when(snapshotRepository.save(any(CandidateContextSnapshot.class))).thenAnswer(i -> i.getArgument(0));

        CandidateSetupDetailsResponse setup = sessionService.getSetupDetails(resumeId, userId);

        assertNotNull(setup);
        assertEquals(resumeId, setup.getResumeId());
        assertEquals("Backend Engineer", setup.getTargetRole());
        verify(candidateContextService, times(1)).buildContext(resumeId, userId);
        verify(snapshotRepository, times(1)).save(any(CandidateContextSnapshot.class));
    }

    @Test
    @DisplayName("Create interview session reuses setup snapshot and does not call Resume Service again")
    void testCreateSession() {
        UUID userId = UUID.randomUUID();
        UUID resumeId = UUID.randomUUID();

        CreateInterviewRequest request = CreateInterviewRequest.builder()
                .resumeId(resumeId)
                .difficulty(DifficultyLevel.MEDIUM)
                .mode(InterviewMode.TEXT)
                .rounds(List.of(RoundType.TECHNICAL, RoundType.BEHAVIORAL))
                .build();

        CandidateContext context = CandidateContext.builder()
                .userId(userId)
                .resumeId(resumeId)
                .candidateName("Sam Taylor")
                .targetRole("Backend Engineer")
                .skills(List.of("Java", "Spring Boot"))
                .build();
        Map<String, Object> map = objectMapper.convertValue(context, Map.class);

        CandidateContextSnapshot setupSnapshot = CandidateContextSnapshot.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .resumeId(resumeId)
                .candidateName("Sam Taylor")
                .targetRole("Backend Engineer")
                .contextData(map)
                .build();

        when(snapshotRepository.findFirstByUserIdAndResumeIdOrderByCreatedAtDesc(userId, resumeId))
                .thenReturn(Optional.of(setupSnapshot));
        when(snapshotRepository.save(any(CandidateContextSnapshot.class))).thenAnswer(i -> {
            CandidateContextSnapshot s = i.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });
        when(sessionRepository.save(any(InterviewSession.class))).thenAnswer(i -> {
            InterviewSession s = i.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        InterviewSessionResponse response = sessionService.createSession(request, userId);

        assertNotNull(response);
        assertEquals(InterviewStatus.CREATED, response.getStatus());
        assertEquals("Backend Engineer", response.getTargetRole());
        verify(entitlementService).reserveSessionQuota(userId);
        // Verified: candidateContextService is NEVER called during session creation!
        verify(candidateContextService, never()).buildContext(any(), any());
        verify(snapshotRepository).save(any(CandidateContextSnapshot.class));
        verify(roundRepository).saveAll(any());
    }

    @Test
    @DisplayName("Create interview session fails when no setup snapshot exists")
    void testCreateSessionFailsWithoutSetup() {
        UUID userId = UUID.randomUUID();
        UUID resumeId = UUID.randomUUID();

        CreateInterviewRequest request = CreateInterviewRequest.builder()
                .resumeId(resumeId)
                .difficulty(DifficultyLevel.MEDIUM)
                .mode(InterviewMode.TEXT)
                .rounds(List.of(RoundType.TECHNICAL))
                .build();

        when(snapshotRepository.findFirstByUserIdAndResumeIdOrderByCreatedAtDesc(userId, resumeId))
                .thenReturn(Optional.empty());

        assertThrows(ResumeIntegrationException.class, () ->
                sessionService.createSession(request, userId));
        verify(candidateContextService, never()).buildContext(any(), any());
    }

    @Test
    @DisplayName("Create interview session rejects mismatched resume owner")
    void testCreateSessionRejectsMismatchedOwner() {
        UUID authenticatedUser = UUID.randomUUID();
        UUID victimUser = UUID.randomUUID();
        UUID resumeId = UUID.randomUUID();

        CreateInterviewRequest request = CreateInterviewRequest.builder()
                .resumeId(resumeId)
                .difficulty(DifficultyLevel.MEDIUM)
                .mode(InterviewMode.TEXT)
                .rounds(List.of(RoundType.TECHNICAL))
                .build();

        CandidateContextSnapshot attackerSnapshot = CandidateContextSnapshot.builder()
                .id(UUID.randomUUID())
                .userId(victimUser)
                .resumeId(resumeId)
                .build();

        when(snapshotRepository.findFirstByUserIdAndResumeIdOrderByCreatedAtDesc(authenticatedUser, resumeId))
                .thenReturn(Optional.of(attackerSnapshot));

        assertThrows(ResumeIntegrationException.class, () ->
                sessionService.createSession(request, authenticatedUser));
        verify(candidateContextService, never()).buildContext(any(), any());
    }

    @Test
    @DisplayName("Starting session transitions status to IN_PROGRESS and generates first question")
    void testStartSession() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();

        CandidateContext context = CandidateContext.builder()
                .candidateName("Sam Taylor")
                .targetRole("Backend Engineer")
                .build();
        Map<String, Object> map = objectMapper.convertValue(context, Map.class);

        CandidateContextSnapshot snapshot = CandidateContextSnapshot.builder()
                .contextData(map)
                .build();

        InterviewSession session = InterviewSession.builder()
                .id(sessionId)
                .userId(userId)
                .status(InterviewStatus.CREATED)
                .difficulty(DifficultyLevel.MEDIUM)
                .mode(InterviewMode.TEXT)
                .snapshot(snapshot)
                .build();

        InterviewRound round = InterviewRound.builder()
                .id(UUID.randomUUID())
                .session(session)
                .roundOrder(1)
                .roundType(RoundType.TECHNICAL)
                .targetQuestionCount(4)
                .completedQuestionCount(0)
                .build();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(roundRepository.findAllBySessionIdOrderByRoundOrderAsc(sessionId)).thenReturn(List.of(round));
        when(interviewAgent.askNextQuestion(any(), any(), any(), any(), eq(1), eq(4))).thenReturn(
                AgentQuestionResponse.builder()
                        .questionText("Explain Spring bean lifecycle.")
                        .questionCategory("Spring Boot")
                        .difficulty("MEDIUM")
                        .build()
        );
        when(questionRepository.save(any(InterviewQuestion.class))).thenAnswer(i -> {
            InterviewQuestion q = i.getArgument(0);
            q.setId(UUID.randomUUID());
            return q;
        });

        InterviewQuestionResponse qResponse = sessionService.startSession(sessionId, userId);

        assertNotNull(qResponse);
        assertEquals("Explain Spring bean lifecycle.", qResponse.getQuestionText());
        assertEquals(InterviewStatus.IN_PROGRESS, session.getStatus());
        verify(entitlementService).consumeSessionQuota(userId);
    }

    @Test
    @DisplayName("Throws UnauthorizedSessionException when user attempts to access another user's session")
    void testAccessControlValidation() {
        UUID ownerId = UUID.randomUUID();
        UUID maliciousUser = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();

        InterviewSession session = InterviewSession.builder()
                .id(sessionId)
                .userId(ownerId)
                .build();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        assertThrows(UnauthorizedSessionException.class, () ->
                sessionService.startSession(sessionId, maliciousUser));
    }

    @Test
    @DisplayName("Submit answer evaluates response, updates counts, and triggers round transition")
    void testSubmitAnswer() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        UUID questionId = UUID.randomUUID();

        CandidateContext context = CandidateContext.builder().candidateName("Sam").build();
        Map<String, Object> map = objectMapper.convertValue(context, Map.class);
        CandidateContextSnapshot snapshot = CandidateContextSnapshot.builder().contextData(map).build();

        InterviewSession session = InterviewSession.builder()
                .id(sessionId)
                .userId(userId)
                .status(InterviewStatus.IN_PROGRESS)
                .currentRoundIndex(0)
                .snapshot(snapshot)
                .build();

        InterviewRound round = InterviewRound.builder()
                .id(UUID.randomUUID())
                .session(session)
                .roundOrder(1)
                .roundType(RoundType.TECHNICAL)
                .targetQuestionCount(1) // Single question round to test completion
                .completedQuestionCount(0)
                .build();

        InterviewQuestion question = InterviewQuestion.builder()
                .id(questionId)
                .round(round)
                .questionText("Explain OOP polymorphism")
                .questionStatus(QuestionStatus.PENDING)
                .build();

        when(questionRepository.findById(questionId)).thenReturn(Optional.of(question));
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(answerRepository.save(any())).thenAnswer(i -> {
            InterviewAnswer a = i.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });
        when(evaluationService.evaluateAndSave(any(), any(), any())).thenReturn(
                AnswerEvaluation.builder()
                        .id(UUID.randomUUID())
                        .score(85)
                        .technicalAccuracy(85)
                        .completeness(85)
                        .clarity(85)
                        .problemSolving(85)
                        .feedback("Good explanation of dynamic vs static polymorphism.")
                        .build()
        );
        when(roundRepository.findAllBySessionIdOrderByRoundOrderAsc(sessionId)).thenReturn(List.of(round));

        when(taskRepository.save(any())).thenAnswer(i -> {
            com.talentprep.interview.entity.AsyncInterviewTask t = i.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        SubmitAnswerRequest request = SubmitAnswerRequest.builder()
                .questionId(questionId)
                .clientRequestId("req-123")
                .answerText("Polymorphism allows objects to take multiple forms via overriding and overloading.")
                .timeTakenSeconds(25)
                .build();

        AnswerAcceptedResponse ack = sessionService.submitAnswer(sessionId, request, userId);

        assertNotNull(ack);
        assertEquals("RECEIVED", ack.getStatus());
        assertEquals(sessionId, ack.getSessionId());

        verify(evaluationWorker).processEvaluationAsync(any(), any(), any(), any());
        verify(followUpWorker).processFollowUpAsync(any(), any(), any(), any(), any(), any(), anyLong(), any());
    }

    @Test
    @DisplayName("Computes remaining seconds accounting for paused intervals and detects duration expiry")
    void testServerAuthoritativeTimerAndExpiry() {
        java.time.LocalDateTime now = java.time.LocalDateTime.now();

        InterviewSession activeWithPause = InterviewSession.builder()
                .status(InterviewStatus.IN_PROGRESS)
                .durationMinutes(30)
                .startedAt(now.minusMinutes(10))
                .totalPausedSeconds(120L)
                .build();

        // 30m (1800s) - (10m wall elapsed (600s) - 2m paused (120s)) = 1800 - 480 = 1320s
        assertEquals(1320L, activeWithPause.computeRemainingSeconds(now));
        assertFalse(activeWithPause.isTimeExpired(now));

        InterviewSession pausedSession = InterviewSession.builder()
                .status(InterviewStatus.PAUSED)
                .durationMinutes(15)
                .startedAt(now.minusMinutes(20))
                .pausedAt(now.minusMinutes(10))
                .totalPausedSeconds(0L)
                .build();

        // Frozen at pausedAt: 15m (900s) - 10m = 300s remaining
        assertEquals(300L, pausedSession.computeRemainingSeconds(now));
        assertFalse(pausedSession.isTimeExpired(now));

        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        InterviewSession expiredSession = InterviewSession.builder()
                .id(sessionId)
                .userId(userId)
                .status(InterviewStatus.IN_PROGRESS)
                .durationMinutes(15)
                .startedAt(now.minusMinutes(16))
                .totalPausedSeconds(0L)
                .currentRoundIndex(0)
                .build();

        InterviewRound activeRound = InterviewRound.builder()
                .id(UUID.randomUUID())
                .session(expiredSession)
                .roundOrder(1)
                .roundType(RoundType.TECHNICAL)
                .status(RoundStatus.IN_PROGRESS)
                .build();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(expiredSession));
        when(roundRepository.findAllBySessionIdOrderByRoundOrderAsc(sessionId)).thenReturn(List.of(activeRound));

        InterviewQuestionResponse next = sessionService.getNextQuestion(sessionId, userId);

        assertNull(next);
        assertEquals(InterviewStatus.COMPLETED, expiredSession.getStatus());
        assertEquals(RoundStatus.COMPLETED, activeRound.getStatus());
        verify(reportGenerationService).generateReport(expiredSession);
    }

    @Test
    @DisplayName("AI agent initialization in startSession reads from snapshot and never calls Resume Service")
    void testStartSessionReadsFromSnapshotWithoutResumeServiceCall() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();

        CandidateContext context = CandidateContext.builder()
                .userId(userId)
                .candidateName("Sam Taylor")
                .targetRole("Backend Engineer")
                .build();
        Map<String, Object> map = objectMapper.convertValue(context, Map.class);
        CandidateContextSnapshot snapshot = CandidateContextSnapshot.builder()
                .userId(userId)
                .targetRole("Backend Engineer")
                .contextData(map)
                .build();

        InterviewSession session = InterviewSession.builder()
                .id(sessionId)
                .userId(userId)
                .status(InterviewStatus.CREATED)
                .difficulty(DifficultyLevel.MEDIUM)
                .snapshot(snapshot)
                .build();

        InterviewRound round = InterviewRound.builder()
                .id(UUID.randomUUID())
                .session(session)
                .roundOrder(1)
                .roundType(RoundType.TECHNICAL)
                .status(RoundStatus.PENDING)
                .targetQuestionCount(3)
                .build();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(roundRepository.findAllBySessionIdOrderByRoundOrderAsc(sessionId)).thenReturn(List.of(round));
        when(interviewAgent.askNextQuestion(any(), any(), any(), any(), anyInt(), anyInt())).thenReturn(
                AgentQuestionResponse.builder()
                        .questionText("Explain Spring bean lifecycle.")
                        .questionCategory("Spring Core")
                        .difficulty("MEDIUM")
                        .build()
        );
        when(questionRepository.save(any())).thenAnswer(i -> {
            InterviewQuestion q = i.getArgument(0);
            q.setId(UUID.randomUUID());
            return q;
        });

        InterviewQuestionResponse qResponse = sessionService.startSession(sessionId, userId);

        assertNotNull(qResponse);
        assertEquals("Explain Spring bean lifecycle.", qResponse.getQuestionText());
        assertEquals(InterviewStatus.IN_PROGRESS, session.getStatus());
        // Verify Resume Service was NOT called
        verify(candidateContextService, never()).buildContext(any(), any());
    }

    @Test
    @DisplayName("Plain text respond endpoint processes candidate answer and returns AI text response")
    void testRespondTextOnly() {
        UUID userId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        UUID questionId = UUID.randomUUID();

        CandidateContext context = CandidateContext.builder().candidateName("Sam").targetRole("Java Dev").build();
        Map<String, Object> map = objectMapper.convertValue(context, Map.class);
        CandidateContextSnapshot snapshot = CandidateContextSnapshot.builder().userId(userId).contextData(map).build();

        InterviewSession session = InterviewSession.builder()
                .id(sessionId)
                .userId(userId)
                .status(InterviewStatus.IN_PROGRESS)
                .currentRoundIndex(0)
                .snapshot(snapshot)
                .build();

        InterviewRound round = InterviewRound.builder()
                .id(UUID.randomUUID())
                .session(session)
                .roundOrder(1)
                .roundType(RoundType.TECHNICAL)
                .targetQuestionCount(3)
                .completedQuestionCount(0)
                .status(RoundStatus.IN_PROGRESS)
                .build();

        InterviewQuestion question = InterviewQuestion.builder()
                .id(questionId)
                .round(round)
                .questionText("Explain the difference between HashMap and ConcurrentHashMap.")
                .questionStatus(QuestionStatus.PENDING)
                .build();

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(roundRepository.findAllBySessionIdOrderByRoundOrderAsc(sessionId)).thenReturn(List.of(round));
        when(questionRepository.findAllByRoundIdOrderByQuestionOrderAsc(round.getId())).thenReturn(List.of(question));
        when(answerRepository.save(any())).thenAnswer(i -> {
            InterviewAnswer a = i.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });
        when(evaluationService.evaluateAndSave(any(), any(), any())).thenReturn(
                AnswerEvaluation.builder()
                        .score(90)
                        .feedback("Excellent explanation of bucket locking.")
                        .build()
        );
        when(interviewAgent.askNextQuestion(any(), any(), any(), any(), anyInt(), anyInt())).thenReturn(
                AgentQuestionResponse.builder()
                        .questionText("How does ConcurrentHashMap achieve lock striping?")
                        .questionCategory("Concurrency")
                        .difficulty("MEDIUM")
                        .build()
        );
        when(questionRepository.save(any())).thenAnswer(i -> {
            InterviewQuestion q = i.getArgument(0);
            q.setId(UUID.randomUUID());
            return q;
        });

        InterviewRespondRequest request = InterviewRespondRequest.builder()
                .message("HashMap is non-synchronized while ConcurrentHashMap is thread-safe using bucket segments.")
                .build();

        InterviewRespondResponse resp = sessionService.respond(sessionId, request, userId);

        assertNotNull(resp);
        assertEquals(sessionId, resp.getSessionId());
        assertNotNull(resp.getResponse());
        assertFalse(resp.isCompleted());
        // Resume Service was never called
        verify(candidateContextService, never()).buildContext(any(), any());
    }

    @Test
    @DisplayName("Idempotent session creation returns existing session and reserves quota only once")
    void testIdempotentSessionCreationReturnsSameSession() {
        UUID userId = UUID.randomUUID();
        UUID resumeId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        String idempotencyKey = "unique-client-key-12345";

        CreateInterviewRequest request = CreateInterviewRequest.builder()
                .resumeId(resumeId)
                .difficulty(DifficultyLevel.MEDIUM)
                .mode(InterviewMode.TEXT)
                .rounds(List.of(RoundType.TECHNICAL))
                .targetRole("Backend Engineer")
                .idempotencyKey(idempotencyKey)
                .build();

        InterviewSession existingSession = InterviewSession.builder()
                .id(sessionId)
                .userId(userId)
                .status(InterviewStatus.CREATED)
                .difficulty(DifficultyLevel.MEDIUM)
                .mode(InterviewMode.TEXT)
                .targetRole("Backend Engineer")
                .idempotencyKey(idempotencyKey)
                .currentRoundIndex(0)
                .build();

        when(sessionRepository.findByUserIdAndIdempotencyKey(userId, idempotencyKey))
                .thenReturn(Optional.of(existingSession));
        when(roundRepository.findAllBySessionIdOrderByRoundOrderAsc(sessionId))
                .thenReturn(List.of());

        InterviewSessionResponse response = sessionService.createSession(request, userId);

        assertNotNull(response);
        assertEquals(sessionId, response.getId());
        verify(sessionRepository, never()).save(any());
        verify(entitlementService, never()).reserveSessionQuota(any());
    }

    @Test
    @DisplayName("New intentional session creation with different idempotency key creates new session")
    void testNewIntentionalCreationWithDifferentKeyCreatesNewSession() {
        UUID userId = UUID.randomUUID();
        UUID resumeId = UUID.randomUUID();
        UUID sessionId = UUID.randomUUID();
        String idempotencyKey = "unique-client-key-new";

        CreateInterviewRequest request = CreateInterviewRequest.builder()
                .resumeId(resumeId)
                .difficulty(DifficultyLevel.MEDIUM)
                .mode(InterviewMode.VOICE)
                .rounds(List.of(RoundType.TECHNICAL))
                .targetRole("Backend Engineer")
                .idempotencyKey(idempotencyKey)
                .build();

        CandidateContextSnapshot setupSnapshot = CandidateContextSnapshot.builder()
                .id(UUID.randomUUID())
                .userId(userId)
                .resumeId(resumeId)
                .candidateName("Alice")
                .targetRole("Backend Engineer")
                .experienceLevel("MID")
                .contextData(Map.of())
                .build();

        InterviewSession savedSession = InterviewSession.builder()
                .id(sessionId)
                .userId(userId)
                .snapshot(setupSnapshot)
                .status(InterviewStatus.CREATED)
                .difficulty(DifficultyLevel.MEDIUM)
                .mode(InterviewMode.VOICE)
                .targetRole("Backend Engineer")
                .idempotencyKey(idempotencyKey)
                .currentRoundIndex(0)
                .build();

        when(sessionRepository.findByUserIdAndIdempotencyKey(userId, idempotencyKey))
                .thenReturn(Optional.empty());
        when(snapshotRepository.findFirstByUserIdAndResumeIdOrderByCreatedAtDesc(userId, resumeId))
                .thenReturn(Optional.of(setupSnapshot));
        when(snapshotRepository.save(any(CandidateContextSnapshot.class))).thenReturn(setupSnapshot);
        when(sessionRepository.save(any(InterviewSession.class))).thenReturn(savedSession);
        when(roundRepository.saveAll(anyList())).thenReturn(List.of());

        InterviewSessionResponse response = sessionService.createSession(request, userId);

        assertNotNull(response);
        assertEquals(sessionId, response.getId());
        verify(entitlementService, times(1)).reserveSessionQuota(userId);
        verify(sessionRepository, times(1)).save(any(InterviewSession.class));
    }
}

