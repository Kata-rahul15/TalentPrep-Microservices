package com.talentprep.interview.session;

import com.talentprep.interview.dto.response.*;
import com.talentprep.interview.entity.*;
import com.talentprep.interview.exception.InterviewNotFoundException;
import com.talentprep.interview.exception.InterviewReportNotFoundException;
import com.talentprep.interview.exception.UnauthorizedSessionException;
import com.talentprep.interview.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/** Read-only session queries, separated from session state transitions and AI orchestration. */
@Service
public class InterviewSessionQueryService {
    private final InterviewSessionRepository sessionRepository;
    private final InterviewRoundRepository roundRepository;
    private final InterviewQuestionRepository questionRepository;
    private final InterviewReportRepository reportRepository;

    public InterviewSessionQueryService(InterviewSessionRepository sessionRepository,
                                        InterviewRoundRepository roundRepository,
                                        InterviewQuestionRepository questionRepository,
                                        InterviewReportRepository reportRepository) {
        this.sessionRepository = sessionRepository;
        this.roundRepository = roundRepository;
        this.questionRepository = questionRepository;
        this.reportRepository = reportRepository;
    }

    @Transactional(readOnly = true)
    public List<InterviewHistoryItemResponse> getInterviewHistory(UUID userId) {
        List<InterviewSession> sessions = sessionRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
        List<InterviewHistoryItemResponse> result = new ArrayList<>();

        for (InterviewSession s : sessions) {
            List<InterviewRound> rounds = roundRepository.findAllBySessionIdOrderByRoundOrderAsc(s.getId());
            List<String> roundTypes = rounds.stream().map(r -> r.getRoundType().name()).toList();

            String interviewType;
            if (roundTypes.contains("CODING") && roundTypes.size() == 1) {
                interviewType = "Coding Interview";
            } else if (roundTypes.contains("TECHNICAL") && roundTypes.size() == 1) {
                interviewType = "Technical Interview";
            } else if (roundTypes.contains("SYSTEM_DESIGN") && roundTypes.size() == 1) {
                interviewType = "System Design Interview";
            } else if (roundTypes.contains("BEHAVIORAL") && roundTypes.size() == 1) {
                interviewType = "HR Interview";
            } else if (roundTypes.contains("CODING") && roundTypes.contains("TECHNICAL")) {
                interviewType = "Technical & Coding Interview";
            } else if (!roundTypes.isEmpty()) {
                interviewType = roundTypes.get(0).replace("_", " ") + " Interview";
            } else {
                interviewType = "Practice Interview";
            }

            Optional<InterviewReport> reportOpt = reportRepository.findBySessionId(s.getId());
            Integer overallScore = reportOpt.map(InterviewReport::getOverallScore).orElse(null);

            int totalQuestions = rounds.stream().mapToInt(r -> r.getTargetQuestionCount() != null ? r.getTargetQuestionCount() : 0).sum();
            int completedQuestions = rounds.stream().mapToInt(r -> r.getCompletedQuestionCount() != null ? r.getCompletedQuestionCount() : 0).sum();

            result.add(InterviewHistoryItemResponse.builder()
                    .sessionId(s.getId())
                    .interviewType(interviewType)
                    .roundTypes(roundTypes)
                    .createdAt(s.getCreatedAt())
                    .completedAt(s.getCompletedAt())
                    .overallScore(overallScore)
                    .status(s.getStatus().name())
                    .totalQuestions(totalQuestions)
                    .completedQuestions(completedQuestions)
                    .durationMinutes(s.getDurationMinutes())
                    .targetRole(s.getTargetRole())
                    .difficulty(s.getDifficulty() != null ? s.getDifficulty().name() : null)
                    .build());
        }

        return result;
    }

    @Transactional(readOnly = true)
    public InterviewDetailReviewResponse getInterviewDetail(UUID sessionId, UUID userId) {
        InterviewSession session = requireOwnedSession(sessionId, userId);
        List<InterviewRound> rounds = roundRepository.findAllBySessionIdOrderByRoundOrderAsc(sessionId);
        List<InterviewQuestion> questions = questionRepository.findAllBySessionId(sessionId);
        Optional<InterviewReport> reportOpt = reportRepository.findBySessionId(sessionId);

        List<InterviewDetailReviewResponse.InterviewRoundReviewDto> roundDtos = rounds.stream()
                .map(r -> InterviewDetailReviewResponse.InterviewRoundReviewDto.builder()
                        .roundId(r.getId())
                        .roundOrder(r.getRoundOrder())
                        .roundType(r.getRoundType().name())
                        .status(r.getStatus().name())
                        .roundScore(r.getRoundScore())
                        .targetQuestionCount(r.getTargetQuestionCount())
                        .completedQuestionCount(r.getCompletedQuestionCount())
                        .build())
                .toList();

        List<InterviewDetailReviewResponse.InterviewQuestionReviewDto> questionDtos = questions.stream()
                .map(q -> {
                    InterviewAnswer a = q.getAnswer();
                    AnswerEvaluation e = a != null ? a.getEvaluation() : null;
                    return InterviewDetailReviewResponse.InterviewQuestionReviewDto.builder()
                            .questionId(q.getId())
                            .roundId(q.getRound() != null ? q.getRound().getId() : null)
                            .roundOrder(q.getRound() != null ? q.getRound().getRoundOrder() : 1)
                            .roundType(q.getRound() != null ? q.getRound().getRoundType().name() : null)
                            .questionOrder(q.getQuestionOrder())
                            .questionText(q.getQuestionText())
                            .questionCategory(q.getQuestionCategory())
                            .difficulty(q.getDifficulty())
                            .questionStatus(q.getQuestionStatus() != null ? q.getQuestionStatus().name() : null)
                            .codingBoilerplate(q.getCodingBoilerplate())
                            .codingTestCases(q.getCodingTestCases())
                            .candidateAnswer(a != null ? a.getAnswerText() : null)
                            .codeSubmission(a != null ? a.getCodeSubmission() : null)
                            .language(a != null ? a.getLanguage() : null)
                            .timeTakenSeconds(a != null ? a.getTimeTakenSeconds() : null)
                            .submittedAt(a != null ? a.getSubmittedAt() : null)
                            .score(e != null ? e.getScore() : null)
                            .technicalAccuracy(e != null ? e.getTechnicalAccuracy() : null)
                            .completeness(e != null ? e.getCompleteness() : null)
                            .clarity(e != null ? e.getClarity() : null)
                            .problemSolving(e != null ? e.getProblemSolving() : null)
                            .feedback(e != null ? e.getFeedback() : null)
                            .strengths(e != null ? e.getStrengths() : List.of())
                            .improvements(e != null ? e.getImprovements() : List.of())
                            .executionMetrics(e != null ? e.getExecutionMetrics() : null)
                            .build();
                })
                .toList();

        InterviewReportResponse reportDto = reportOpt.map(r -> InterviewReportResponse.builder()
                .reportId(r.getId())
                .sessionId(sessionId)
                .overallScore(r.getOverallScore())
                .roundBreakdown(r.getRoundBreakdown())
                .strengths(r.getStrengths())
                .weaknesses(r.getWeaknesses())
                .improvementAreas(r.getImprovementAreas())
                .recommendedTopics(r.getRecommendedTopics())
                .summary(r.getSummary())
                .generatedAt(r.getGeneratedAt())
                .build()).orElse(null);

        return InterviewDetailReviewResponse.builder()
                .sessionId(session.getId())
                .targetRole(session.getTargetRole())
                .difficulty(session.getDifficulty() != null ? session.getDifficulty().name() : null)
                .mode(session.getMode() != null ? session.getMode().name() : null)
                .status(session.getStatus().name())
                .overallScore(reportDto != null ? reportDto.getOverallScore() : null)
                .durationMinutes(session.getDurationMinutes())
                .createdAt(session.getCreatedAt())
                .startedAt(session.getStartedAt())
                .completedAt(session.getCompletedAt())
                .candidateName(session.getSnapshot() != null ? session.getSnapshot().getCandidateName() : null)
                .rounds(roundDtos)
                .questions(questionDtos)
                .report(reportDto)
                .build();
    }

    @Transactional(readOnly = true)
    public InterviewSessionResponse getSession(UUID sessionId, UUID userId) {
        InterviewSession session = requireOwnedSession(sessionId, userId);
        List<InterviewRoundResponse> rounds = roundRepository.findAllBySessionIdOrderByRoundOrderAsc(sessionId)
                .stream().map(round -> InterviewRoundResponse.builder()
                        .id(round.getId())
                        .roundOrder(round.getRoundOrder())
                        .roundType(round.getRoundType())
                        .status(round.getStatus())
                        .targetQuestionCount(round.getTargetQuestionCount())
                        .completedQuestionCount(round.getCompletedQuestionCount())
                        .roundScore(round.getRoundScore())
                        .build()).toList();

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
                .rounds(rounds)
                .build();
    }

    @Transactional(readOnly = true)
    public InterviewTranscriptResponse getTranscript(UUID sessionId, UUID userId) {
        InterviewSession session = requireOwnedSession(sessionId, userId);
        List<InterviewTranscriptResponse.TranscriptItem> items = new ArrayList<>();
        for (InterviewQuestion question : questionRepository.findAllBySessionId(sessionId)) {
            InterviewAnswer answer = question.getAnswer();
            AnswerEvaluation evaluation = answer != null ? answer.getEvaluation() : null;
            items.add(InterviewTranscriptResponse.TranscriptItem.builder()
                    .roundOrder(question.getRound().getRoundOrder())
                    .roundType(question.getRound().getRoundType().name())
                    .questionOrder(question.getQuestionOrder())
                    .questionText(question.getQuestionText())
                    .answerText(answer != null ? answer.getAnswerText() : null)
                    .score(evaluation != null ? evaluation.getScore() : null)
                    .feedback(evaluation != null ? evaluation.getFeedback() : null)
                    .idealAnswer(evaluation != null ? evaluation.getSuggestedIdealAnswer() : null)
                    .build());
        }
        return InterviewTranscriptResponse.builder()
                .sessionId(sessionId)
                .candidateName(session.getSnapshot() != null ? session.getSnapshot().getCandidateName() : null)
                .targetRole(session.getTargetRole())
                .status(session.getStatus().name())
                .items(items)
                .build();
    }

    @Transactional(readOnly = true)
    public InterviewReportResponse getReport(UUID sessionId, UUID userId) {
        requireOwnedSession(sessionId, userId);
        InterviewReport report = reportRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new InterviewReportNotFoundException(sessionId));
        return InterviewReportResponse.builder()
                .reportId(report.getId())
                .sessionId(report.getSession().getId())
                .overallScore(report.getOverallScore())
                .roundBreakdown(report.getRoundBreakdown())
                .strengths(report.getStrengths())
                .weaknesses(report.getWeaknesses())
                .improvementAreas(report.getImprovementAreas())
                .recommendedTopics(report.getRecommendedTopics())
                .summary(report.getSummary())
                .generatedAt(report.getGeneratedAt())
                .build();
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
