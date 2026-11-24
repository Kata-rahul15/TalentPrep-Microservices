package com.talentprep.interview.evaluation;

import com.talentprep.interview.entity.*;
import com.talentprep.interview.entity.enums.InterviewStatus;
import com.talentprep.interview.entity.enums.RoundType;
import com.talentprep.interview.repository.InterviewReportRepository;
import com.talentprep.interview.repository.InterviewSessionRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

@Service
public class ReportGenerationService {

    private static final Logger log = LoggerFactory.getLogger(ReportGenerationService.class);

    private final InterviewReportRepository reportRepository;
    private final InterviewSessionRepository sessionRepository;

    public ReportGenerationService(
            InterviewReportRepository reportRepository,
            InterviewSessionRepository sessionRepository) {
        this.reportRepository = reportRepository;
        this.sessionRepository = sessionRepository;
    }

    @Transactional
    public InterviewReport generateReport(InterviewSession session) {
        log.info("Generating interview performance report for session: {}", session.getId());

        InterviewReport existingReport = reportRepository.findBySessionId(session.getId()).orElse(null);
        if (existingReport != null) {
            return existingReport;
        }

        List<InterviewRound> rounds = session.getRounds() != null ? session.getRounds() : List.of();
        List<Map<String, Object>> roundBreakdowns = new ArrayList<>();
        Set<String> allStrengths = new LinkedHashSet<>();
        Set<String> allWeaknesses = new LinkedHashSet<>();
        Set<String> allImprovements = new LinkedHashSet<>();
        Set<String> recommendedTopics = new LinkedHashSet<>();

        int totalScoreAccumulator = 0;
        int evaluatedQuestionsCount = 0;
        int totalCodingSolved = 0;
        int totalCodingPassed = 0;
        int totalCodingFailed = 0;
        boolean hasCodingRound = false;

        for (InterviewRound round : rounds) {
            int roundScoreSum = 0;
            int roundQuestionsCount = 0;
            int roundSolvedCount = 0;
            int roundPassedTests = 0;
            int roundFailedTests = 0;
            List<Map<String, Object>> questionDetails = new ArrayList<>();

            List<InterviewQuestion> questions = round.getQuestions() != null ? round.getQuestions() : List.of();
            for (InterviewQuestion question : questions) {
                InterviewAnswer answer = question.getAnswer();
                if (answer != null && answer.getEvaluation() != null) {
                    AnswerEvaluation eval = answer.getEvaluation();
                    int score = eval.getScore() != null ? eval.getScore() : 0;
                    roundScoreSum += score;
                    roundQuestionsCount++;
                    totalScoreAccumulator += score;
                    evaluatedQuestionsCount++;

                    if (score == 100) {
                        roundSolvedCount++;
                        if (round.getRoundType() == RoundType.CODING) {
                            totalCodingSolved++;
                        }
                    }

                    if (eval.getStrengths() != null) allStrengths.addAll(eval.getStrengths());
                    if (eval.getImprovements() != null) {
                        allWeaknesses.addAll(eval.getImprovements());
                        allImprovements.addAll(eval.getImprovements());
                    }

                    Map<String, Object> qDetail = new HashMap<>();
                    qDetail.put("questionId", question.getId());
                    qDetail.put("questionOrder", question.getQuestionOrder());
                    qDetail.put("questionText", question.getQuestionText());
                    qDetail.put("questionCategory", question.getQuestionCategory());
                    qDetail.put("difficulty", question.getDifficulty());
                    qDetail.put("score", score);
                    qDetail.put("feedback", eval.getFeedback());
                    qDetail.put("language", answer.getLanguage());
                    qDetail.put("codeSubmission", answer.getCodeSubmission());
                    qDetail.put("timeTakenSeconds", answer.getTimeTakenSeconds());

                    if (eval.getExecutionMetrics() != null) {
                        qDetail.put("executionMetrics", eval.getExecutionMetrics());
                        Object pCount = eval.getExecutionMetrics().get("passedCount");
                        Object tCount = eval.getExecutionMetrics().get("totalCount");
                        if (pCount instanceof Number p && tCount instanceof Number t) {
                            int pInt = p.intValue();
                            int tInt = t.intValue();
                            roundPassedTests += pInt;
                            roundFailedTests += Math.max(0, tInt - pInt);
                            if (round.getRoundType() == RoundType.CODING) {
                                totalCodingPassed += pInt;
                                totalCodingFailed += Math.max(0, tInt - pInt);
                            }
                        }
                    }
                    questionDetails.add(qDetail);
                }
            }

            int avgRoundScore = roundQuestionsCount > 0 ? (roundScoreSum / roundQuestionsCount) : 0;
            round.setRoundScore(avgRoundScore);

            int targetCount = round.getTargetQuestionCount() != null
                    ? round.getTargetQuestionCount()
                    : Math.max(roundQuestionsCount, questions.size());

            Map<String, Object> roundMap = new HashMap<>();
            roundMap.put("roundOrder", round.getRoundOrder());
            roundMap.put("roundType", round.getRoundType().name());
            roundMap.put("roundScore", avgRoundScore);
            roundMap.put("questionsCount", targetCount);
            roundMap.put("completedQuestions", roundQuestionsCount);
            roundMap.put("solvedQuestions", roundSolvedCount);
            roundMap.put("testCasesPassed", roundPassedTests);
            roundMap.put("testCasesFailed", roundFailedTests);
            roundMap.put("questions", questionDetails);
            roundBreakdowns.add(roundMap);

            if (round.getRoundType() == RoundType.CODING) {
                hasCodingRound = true;
            }

            if (roundQuestionsCount > 0 && avgRoundScore < 75) {
                recommendedTopics.add(round.getRoundType().name() + " fundamentals");
            }
        }

        // Zero is an explicit "not evaluated" sentinel; never manufacture a passing score.
        int overallScore = evaluatedQuestionsCount > 0
                ? (totalScoreAccumulator / evaluatedQuestionsCount)
                : 0;

        String summary;
        if (evaluatedQuestionsCount == 0) {
            summary = String.format("Completed session for target role '%s', but no answers were evaluated.",
                    session.getTargetRole());
        } else if (hasCodingRound && rounds.size() == 1) {
            summary = String.format("Completed Coding Assessment for target role '%s'. Solved %d of %d questions with %d test cases passed and %d failed. Overall score: %d/100.",
                    session.getTargetRole(), totalCodingSolved, evaluatedQuestionsCount, totalCodingPassed, totalCodingFailed, overallScore);
        } else {
            summary = String.format("Completed %d rounds for target role '%s'. Overall candidate performance score is %d/100.",
                    rounds.size(), session.getTargetRole(), overallScore);
        }

        InterviewReport report = InterviewReport.builder()
                .session(session)
                .overallScore(overallScore)
                .roundBreakdown(roundBreakdowns)
                .strengths(new ArrayList<>(allStrengths).stream().limit(5).toList())
                .weaknesses(new ArrayList<>(allWeaknesses).stream().limit(5).toList())
                .improvementAreas(new ArrayList<>(allImprovements).stream().limit(5).toList())
                .recommendedTopics(new ArrayList<>(recommendedTopics).stream().limit(5).toList())
                .summary(summary)
                .build();

        InterviewReport savedReport = reportRepository.save(report);

        session.setStatus(InterviewStatus.REPORT_GENERATED);
        session.setCompletedAt(LocalDateTime.now());
        sessionRepository.save(session);

        log.info("Report generated successfully for session {}: score={}", session.getId(), overallScore);
        return savedReport;
    }
}
