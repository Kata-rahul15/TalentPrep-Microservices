package com.talentprep.interview.coding;

import com.talentprep.interview.coding.dto.CodeRunResult;
import com.talentprep.interview.coding.service.CodingProblemBankService;
import com.talentprep.interview.coding.service.CodingSubmissionService;
import com.talentprep.interview.dto.request.CodeSubmissionRequest;
import com.talentprep.interview.dto.response.AnswerEvaluationResponseDto;
import com.talentprep.interview.entity.*;
import com.talentprep.interview.entity.enums.InterviewStatus;
import com.talentprep.interview.entity.enums.QuestionStatus;
import com.talentprep.interview.entity.enums.RoundStatus;
import com.talentprep.interview.evaluation.ReportGenerationService;
import com.talentprep.interview.exception.UnauthorizedSessionException;
import com.talentprep.interview.repository.InterviewQuestionRepository;
import com.talentprep.interview.repository.InterviewRoundRepository;
import com.talentprep.interview.repository.InterviewSessionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CodingSubmissionServiceTest {

    @Mock
    private InterviewSessionRepository sessionRepository;
    @Mock
    private InterviewQuestionRepository questionRepository;
    @Mock
    private InterviewRoundRepository roundRepository;
    @Mock
    private CodeExecutionService codeExecutionService;
    @Mock
    private CodingProblemBankService problemBankService;
    @Mock
    private ReportGenerationService reportGenerationService;

    @InjectMocks
    private CodingSubmissionService submissionService;

    private UUID userId;
    private UUID sessionId;
    private UUID questionId;
    private InterviewSession session;
    private InterviewRound round;
    private InterviewQuestion question;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        sessionId = UUID.randomUUID();
        questionId = UUID.randomUUID();

        session = InterviewSession.builder()
                .id(sessionId)
                .userId(userId)
                .status(InterviewStatus.IN_PROGRESS)
                .currentRoundIndex(0)
                .rounds(new ArrayList<>())
                .build();

        round = InterviewRound.builder()
                .id(UUID.randomUUID())
                .session(session)
                .roundOrder(1)
                .status(RoundStatus.IN_PROGRESS)
                .targetQuestionCount(1)
                .completedQuestionCount(0)
                .build();
        session.getRounds().add(round);

        question = InterviewQuestion.builder()
                .id(questionId)
                .round(round)
                .questionText("Two Sum")
                .questionOrder(1)
                .questionStatus(QuestionStatus.PENDING)
                .build();
    }

    @Test
    @DisplayName("Unauthorized user cannot submit code for another user's session")
    void testUnauthorizedSubmission() {
        UUID intruderId = UUID.randomUUID();
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));

        CodeSubmissionRequest request = new CodeSubmissionRequest();
        request.setQuestionId(questionId);
        request.setLanguage("java");
        request.setCode("class Solution {}");

        assertThrows(UnauthorizedSessionException.class, () ->
                submissionService.submitCode(sessionId, request, intruderId));
    }

    @Test
    @DisplayName("Cannot submit an already answered question (duplicate submission protection)")
    void testDuplicateSubmissionProtection() {
        question.setQuestionStatus(QuestionStatus.ANSWERED);

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(questionRepository.findById(questionId)).thenReturn(Optional.of(question));

        CodeSubmissionRequest request = new CodeSubmissionRequest();
        request.setQuestionId(questionId);
        request.setLanguage("java");
        request.setCode("class Solution {}");

        IllegalStateException ex = assertThrows(IllegalStateException.class, () ->
                submissionService.submitCode(sessionId, request, userId));
        assertTrue(ex.getMessage().contains("already been answered"));
    }

    @Test
    @DisplayName("Successful 1-question submission evaluates tests deterministically, completes interview and generates report")
    void testSuccessfulSubmissionAndEvaluation() {
        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(questionRepository.findById(questionId)).thenReturn(Optional.of(question));

        CodeRunResult mockResult = CodeRunResult.builder()
                .compiled(true)
                .passedAllTestCases(true)
                .passedCount(5)
                .totalCount(5)
                .score(100.0)
                .verdict("ACCEPTED")
                .executionTimeMs(250)
                .memoryUsedBytes(12000)
                .build();

        when(codeExecutionService.judgeSubmission(any(), any(), any(), any())).thenReturn(mockResult);

        CodeSubmissionRequest request = new CodeSubmissionRequest();
        request.setQuestionId(questionId);
        request.setLanguage("java");
        request.setCode("public class Main { ... }");

        AnswerEvaluationResponseDto response = submissionService.submitCode(sessionId, request, userId);

        assertNotNull(response);
        assertEquals(100, response.getScore());
        assertEquals(5, response.getPassedCount());
        assertEquals(5, response.getTotalCount());
        assertEquals("ACCEPTED", response.getVerdict());
        assertTrue(response.isRoundCompleted());
        assertTrue(response.isInterviewCompleted());
        assertEquals(QuestionStatus.ANSWERED, question.getQuestionStatus());
        assertEquals("MOVE_ON", question.getFollowUpDecision());
        assertEquals(RoundStatus.COMPLETED, round.getStatus());
        assertEquals(InterviewStatus.COMPLETED, session.getStatus());

        verify(questionRepository).save(question);
        verify(roundRepository).save(round);
        verify(sessionRepository).save(session);
        verify(reportGenerationService).generateReport(session);
    }

    @Test
    @DisplayName("In a 2-question interview, submitting question 1 advances round without completing interview or generating report prematurely")
    void testTwoQuestionInterviewFirstSubmission() {
        round.setTargetQuestionCount(2);

        when(sessionRepository.findById(sessionId)).thenReturn(Optional.of(session));
        when(questionRepository.findById(questionId)).thenReturn(Optional.of(question));

        CodeRunResult mockResult = CodeRunResult.builder()
                .compiled(true)
                .passedAllTestCases(true)
                .passedCount(3)
                .totalCount(3)
                .score(100.0)
                .verdict("ACCEPTED")
                .executionTimeMs(150)
                .build();

        when(codeExecutionService.judgeSubmission(any(), any(), any(), any())).thenReturn(mockResult);

        CodeSubmissionRequest request = new CodeSubmissionRequest();
        request.setQuestionId(questionId);
        request.setLanguage("java");
        request.setCode("public class Main { ... }");

        AnswerEvaluationResponseDto response = submissionService.submitCode(sessionId, request, userId);

        assertNotNull(response);
        assertEquals(100, response.getScore());
        assertEquals(3, response.getPassedCount());
        assertEquals(3, response.getTotalCount());
        assertFalse(response.isRoundCompleted());
        assertFalse(response.isInterviewCompleted());
        assertEquals(1, round.getCompletedQuestionCount());
        assertEquals(RoundStatus.IN_PROGRESS, round.getStatus());
        assertEquals(InterviewStatus.IN_PROGRESS, session.getStatus());
        assertEquals("MOVE_ON", question.getFollowUpDecision());

        verify(questionRepository).save(question);
        verify(roundRepository).save(round);
        verify(reportGenerationService, never()).generateReport(any());
    }
}
