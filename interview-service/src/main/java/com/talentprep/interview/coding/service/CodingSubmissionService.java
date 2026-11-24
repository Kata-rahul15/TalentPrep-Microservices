package com.talentprep.interview.coding.service;

import com.talentprep.interview.coding.CodeExecutionService;
import com.talentprep.interview.coding.dto.CodeRunRequest;
import com.talentprep.interview.coding.dto.CodeRunResult;
import com.talentprep.interview.coding.entity.CodingProblem;
import com.talentprep.interview.dto.request.CodeSubmissionRequest;
import com.talentprep.interview.dto.response.AnswerEvaluationResponseDto;
import com.talentprep.interview.entity.*;
import com.talentprep.interview.entity.enums.InterviewStatus;
import com.talentprep.interview.entity.enums.QuestionStatus;
import com.talentprep.interview.entity.enums.RoundStatus;
import com.talentprep.interview.evaluation.ReportGenerationService;
import com.talentprep.interview.exception.InterviewNotFoundException;
import com.talentprep.interview.exception.UnauthorizedSessionException;
import com.talentprep.interview.repository.InterviewQuestionRepository;
import com.talentprep.interview.repository.InterviewRoundRepository;
import com.talentprep.interview.repository.InterviewSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class CodingSubmissionService {

    private final InterviewSessionRepository sessionRepository;
    private final InterviewQuestionRepository questionRepository;
    private final InterviewRoundRepository roundRepository;
    private final CodeExecutionService codeExecutionService;
    private final CodingProblemBankService problemBankService;
    private final ReportGenerationService reportGenerationService;

    @Transactional
    public CodeRunResult runCode(UUID sessionId, CodeSubmissionRequest request, UUID userId) {
        requireOwnedSession(sessionId, userId);
        InterviewQuestion question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new IllegalArgumentException("Question not found: " + request.getQuestionId()));
        requireQuestionBelongsToSession(question, sessionId);

        String language = request.getLanguage() != null ? request.getLanguage() : "java";

        CodeRunRequest runReq = CodeRunRequest.builder()
                .language(language)
                .code(request.getCode())
                .testCases(question.getCodingTestCases() != null ? question.getCodingTestCases() : List.of())
                .build();

        log.info("Running code for session {} question {} in {}", sessionId, question.getId(), language);
        return codeExecutionService.execute(runReq);
    }

    @Transactional
    public AnswerEvaluationResponseDto submitCode(UUID sessionId, CodeSubmissionRequest request, UUID userId) {
        InterviewSession session = requireOwnedSession(sessionId, userId);
        InterviewQuestion question = questionRepository.findById(request.getQuestionId())
                .orElseThrow(() -> new IllegalArgumentException("Question not found: " + request.getQuestionId()));
        requireQuestionBelongsToSession(question, sessionId);

        if (question.getQuestionStatus() == QuestionStatus.ANSWERED) {
            throw new IllegalStateException("Question has already been answered and evaluated.");
        }

        String language = request.getLanguage() != null ? request.getLanguage() : "java";
        log.info("Submitting code for judging: session={} question={} lang={}", sessionId, question.getId(), language);

        // 1. Collect visible test cases
        List<Map<String, Object>> visibleTests = question.getCodingTestCases() != null
                ? question.getCodingTestCases()
                : List.of();

        // 2. Collect hidden test cases (secure server-side storage)
        List<Map<String, Object>> hiddenTests = question.getCodingHiddenTestCases();
        if ((hiddenTests == null || hiddenTests.isEmpty()) && question.getCodingProblemId() != null) {
            Optional<CodingProblem> problemOpt = problemBankService.findById(question.getCodingProblemId());
            if (problemOpt.isPresent()) {
                hiddenTests = problemOpt.get().getHiddenTestCases();
            }
        }
        if (hiddenTests == null) {
            hiddenTests = List.of();
        }

        // 3. Execute authoritative judging via OnlineCompiler
        CodeRunResult judgingResult = codeExecutionService.judgeSubmission(language, request.getCode(), visibleTests, hiddenTests);
        int finalScore = (int) Math.round(judgingResult.getScore());
        boolean compiled = judgingResult.isCompiled();
        int passed = judgingResult.getPassedCount();
        int total = judgingResult.getTotalCount();
        long execTimeMs = judgingResult.getExecutionTimeMs();

        log.info("Judging complete: verdict={} passed={}/{} score={}",
                judgingResult.getVerdict(), passed, total, finalScore);

        // 4. Deterministic qualitative evaluation (Zero AI calls for pass/fail or scoring)
        String feedback;
        if (!compiled) {
            feedback = "Compilation error: " + (judgingResult.getCompilationOutput() != null ? judgingResult.getCompilationOutput() : "Compilation failed.");
        } else if (passed == total && total > 0) {
            feedback = "All " + total + " test cases passed successfully. Submission accepted (" + execTimeMs + "ms).";
        } else {
            feedback = "Passed " + passed + " of " + total + " test cases (" + finalScore + "%). Verdict: " + judgingResult.getVerdict() + ".";
        }

        List<String> strengths = new ArrayList<>();
        if (passed > 0) {
            strengths.add("Passed " + passed + " of " + total + " test cases.");
        }
        if (compiled) {
            strengths.add("Code compiled cleanly with no syntax errors.");
        }
        if (execTimeMs > 0) {
            strengths.add("Execution completed in " + execTimeMs + "ms.");
        }
        if (strengths.isEmpty()) {
            strengths.add("Code submission recorded.");
        }

        List<String> improvements = new ArrayList<>();
        if (!compiled) {
            improvements.add("Resolve compiler syntax errors and verify imports.");
        } else if (passed < total) {
            improvements.add((total - passed) + " test cases failed. Verify boundary conditions and edge cases.");
        }

        Map<String, Object> executionMetrics = new HashMap<>();
        executionMetrics.put("passedCount", passed);
        executionMetrics.put("totalCount", total);
        executionMetrics.put("score", finalScore);
        executionMetrics.put("verdict", judgingResult.getVerdict());
        executionMetrics.put("compiled", compiled);
        executionMetrics.put("compilationOutput", judgingResult.getCompilationOutput() != null ? judgingResult.getCompilationOutput() : "");
        executionMetrics.put("executionTimeMs", execTimeMs);
        executionMetrics.put("testCaseResults", judgingResult.getTestCaseResults() != null ? judgingResult.getTestCaseResults() : List.of());

        // 5. Persist Answer & Evaluation
        String answerSummary = "Code Submission (" + language + "):\n" + request.getCode()
                + "\n\nSandbox Verdict: " + judgingResult.getVerdict()
                + " | Passed: " + passed + "/" + total;

        InterviewAnswer answer = question.getAnswer();
        if (answer == null) {
            answer = new InterviewAnswer();
            answer.setQuestion(question);
            question.setAnswer(answer);
        }

        answer.setAnswerText(answerSummary);
        answer.setCodeSubmission(request.getCode());
        answer.setLanguage(language);
        answer.setTimeTakenSeconds((int) Math.max(1, execTimeMs / 1000));
        answer.setSubmittedAt(LocalDateTime.now());
        answer.setEvaluationStatus("COMPLETED");

        AnswerEvaluation evaluation = answer.getEvaluation();
        if (evaluation == null) {
            evaluation = new AnswerEvaluation();
            evaluation.setAnswer(answer);
            answer.setEvaluation(evaluation);
        }

        evaluation.setScore(finalScore);
        evaluation.setTechnicalAccuracy(finalScore);
        evaluation.setCompleteness(finalScore);
        evaluation.setClarity(compiled ? 100 : 0);
        evaluation.setProblemSolving(finalScore);
        evaluation.setFeedback(feedback);
        evaluation.setStrengths(strengths);
        evaluation.setImprovements(improvements);
        evaluation.setSuggestedIdealAnswer(null); // Never leak solution
        evaluation.setExecutionMetrics(executionMetrics);

        // Mark question answered and set followUpDecision = MOVE_ON so getNextQuestion will not stall!
        question.setQuestionStatus(QuestionStatus.ANSWERED);
        question.setFollowUpDecision("MOVE_ON");
        questionRepository.save(question);

        // 6. Update round progression
        InterviewRound round = question.getRound();
        int completedCount = round.getCompletedQuestionCount() != null ? round.getCompletedQuestionCount() + 1 : 1;
        round.setCompletedQuestionCount(completedCount);

        int targetQuestionCount = round.getTargetQuestionCount() != null ? round.getTargetQuestionCount() : 1;
        boolean roundCompleted = completedCount >= targetQuestionCount;
        if (roundCompleted) {
            round.setStatus(RoundStatus.COMPLETED);
            round.setCompletedAt(LocalDateTime.now());
        } else {
            round.setStatus(RoundStatus.IN_PROGRESS);
        }
        roundRepository.save(round);

        // 7. Check if interview completed
        boolean interviewCompleted = false;
        int currentRoundIdx = session.getCurrentRoundIndex() != null ? session.getCurrentRoundIndex() : 0;
        int totalRounds = session.getRounds() != null ? session.getRounds().size() : 1;

        if (roundCompleted) {
            if (currentRoundIdx + 1 >= totalRounds) {
                session.setStatus(InterviewStatus.COMPLETED);
                session.setCompletedAt(LocalDateTime.now());
                interviewCompleted = true;
                sessionRepository.save(session);
                // Immediately generate the authoritative final report!
                reportGenerationService.generateReport(session);
            } else {
                session.setStatus(InterviewStatus.ROUND_TRANSITION);
                session.setCurrentRoundIndex(currentRoundIdx + 1);
                sessionRepository.save(session);
            }
        }

        return AnswerEvaluationResponseDto.builder()
                .evaluationId(evaluation.getId())
                .questionId(question.getId())
                .score(evaluation.getScore())
                .technicalAccuracy(evaluation.getTechnicalAccuracy())
                .completeness(evaluation.getCompleteness())
                .clarity(evaluation.getClarity())
                .problemSolving(evaluation.getProblemSolving())
                .feedback(evaluation.getFeedback())
                .strengths(evaluation.getStrengths())
                .improvements(evaluation.getImprovements())
                .suggestedIdealAnswer(evaluation.getSuggestedIdealAnswer())
                .roundCompleted(roundCompleted)
                .interviewCompleted(interviewCompleted)
                .currentRoundIndex(session.getCurrentRoundIndex())
                .passedCount(passed)
                .totalCount(total)
                .executionTimeMs(execTimeMs)
                .verdict(judgingResult.getVerdict())
                .testCaseResults(judgingResult.getTestCaseResults())
                .questionOrder(question.getQuestionOrder())
                .targetQuestionCount(targetQuestionCount)
                .build();
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
}
