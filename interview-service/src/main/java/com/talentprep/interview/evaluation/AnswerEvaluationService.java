package com.talentprep.interview.evaluation;

import com.talentprep.interview.agent.InterviewAgent;
import com.talentprep.interview.agent.dto.AgentEvaluationResponse;
import com.talentprep.interview.agent.dto.ConversationTurn;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.entity.AnswerEvaluation;
import com.talentprep.interview.entity.InterviewAnswer;
import com.talentprep.interview.entity.InterviewQuestion;
import com.talentprep.interview.entity.InterviewRound;
import com.talentprep.interview.repository.AnswerEvaluationRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class AnswerEvaluationService {

    private static final Logger log = LoggerFactory.getLogger(AnswerEvaluationService.class);

    private final InterviewAgent interviewAgent;
    private final AnswerEvaluationRepository evaluationRepository;
    private final String evaluationModel;

    public AnswerEvaluationService(
            InterviewAgent interviewAgent,
            AnswerEvaluationRepository evaluationRepository,
            @Value("${INTERVIEW_AI_MODEL:qwen/qwen3.8-27b}") String evaluationModel) {
        this.interviewAgent = interviewAgent;
        this.evaluationRepository = evaluationRepository;
        this.evaluationModel = evaluationModel;
    }

    @Transactional
    public AnswerEvaluation evaluateAndSave(
            InterviewAnswer answer,
            CandidateContext context,
            List<ConversationTurn> history) {

        InterviewQuestion question = answer.getQuestion();
        InterviewRound round = question.getRound();

        log.info("Evaluating answer for question {}: round={}", question.getId(), round.getRoundType());

        // Fast evaluation if answer is empty or skipped
        if (answer.getAnswerText() == null
                || answer.getAnswerText().trim().length() < 3
                || "SKIPPED".equalsIgnoreCase(answer.getAnswerText().trim())) {
            AnswerEvaluation minimal = AnswerEvaluation.builder()
                    .answer(answer)
                    .score(0)
                    .technicalAccuracy(0)
                    .completeness(0)
                    .clarity(0)
                    .problemSolving(0)
                    .feedback("SKIPPED".equalsIgnoreCase(answer.getAnswerText() != null ? answer.getAnswerText().trim() : "")
                            ? "Question skipped by candidate." : "No meaningful answer provided.")
                    .strengths(List.of())
                    .improvements(List.of("Attempt answering with core technical concepts."))
                    .suggestedIdealAnswer("Provide a structured explanation addressing the question requirements.")
                    .evaluationModel(evaluationModel)
                    .evaluationVersion("1.0")
                    .build();
            return evaluationRepository.save(minimal);
        }

        AgentEvaluationResponse aiEval = interviewAgent.evaluateAnswer(
                round.getRoundType(),
                question.getQuestionText(),
                answer.getAnswerText(),
                context,
                history
        );

        AnswerEvaluation evaluation = AnswerEvaluation.builder()
                .answer(answer)
                .score(clamp(aiEval.getScore()))
                .technicalAccuracy(clamp(aiEval.getTechnicalAccuracy()))
                .completeness(clamp(aiEval.getCompleteness()))
                .clarity(clamp(aiEval.getClarity()))
                .problemSolving(clamp(aiEval.getProblemSolving()))
                .feedback(aiEval.getFeedback())
                .strengths(aiEval.getStrengths() != null ? aiEval.getStrengths() : List.of())
                .improvements(aiEval.getImprovements() != null ? aiEval.getImprovements() : List.of())
                .suggestedIdealAnswer(aiEval.getSuggestedIdealAnswer())
                .triggersFollowUp(Boolean.TRUE.equals(aiEval.getTriggersFollowUp()))
                .followUpReason(aiEval.getFollowUpReason())
                .evaluationModel(evaluationModel)
                .evaluationVersion("1.0")
                .build();

        return evaluationRepository.save(evaluation);
    }

    private int clamp(Integer score) {
        if (score == null) throw new IllegalStateException("AI evaluation did not include a required score.");
        return Math.max(0, Math.min(100, score));
    }
}

