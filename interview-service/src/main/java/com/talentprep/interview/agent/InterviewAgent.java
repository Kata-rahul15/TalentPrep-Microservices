package com.talentprep.interview.agent;

import com.talentprep.interview.agent.dto.AgentEvaluationResponse;
import com.talentprep.interview.agent.dto.AgentQuestionResponse;
import com.talentprep.interview.agent.dto.ConversationTurn;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.entity.enums.DifficultyLevel;
import com.talentprep.interview.entity.enums.RoundType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class InterviewAgent {

    private static final Logger log = LoggerFactory.getLogger(InterviewAgent.class);

    private final InterviewOrchestrator orchestrator;

    public InterviewAgent(InterviewOrchestrator orchestrator) {
        this.orchestrator = orchestrator;
    }

    public AgentQuestionResponse askNextQuestion(
            RoundType roundType,
            CandidateContext context,
            DifficultyLevel difficulty,
            List<ConversationTurn> history,
            int questionOrder,
            int targetQuestionCount) {

        log.info("InterviewAgent generating question: round={}, order={}/{}, candidate={}",
                roundType, questionOrder, targetQuestionCount, context.getCandidateName());

        InterviewStrategy strategy = orchestrator.getStrategy(roundType);
        DifficultyLevel questionDifficulty = resolveDifficulty(difficulty, history, questionOrder);

        if (history != null && !history.isEmpty()) {
            ConversationTurn lastTurn = history.get(history.size() - 1);
            if (Boolean.TRUE.equals(lastTurn.getTriggersFollowUp()) && !Boolean.TRUE.equals(lastTurn.getIsFollowUp())) {
                AgentEvaluationResponse eval = AgentEvaluationResponse.builder()
                        .triggersFollowUp(true)
                        .followUpReason(lastTurn.getFollowUpReason())
                        .build();
                return strategy.generateFollowUpQuestion(
                        lastTurn.getQuestionText(),
                        lastTurn.getCandidateAnswer(),
                        eval,
                        context,
                        history,
                        questionDifficulty);
            }
        }

        return strategy.generateQuestion(context, questionDifficulty, history, questionOrder, targetQuestionCount);
    }

    private DifficultyLevel resolveDifficulty(
            DifficultyLevel requested, List<ConversationTurn> history, int questionOrder) {
        if (requested != DifficultyLevel.MIXED) return requested;
        int baseQuestionOrder = history == null ? questionOrder :
                (int) history.stream().filter(turn -> !Boolean.TRUE.equals(turn.getIsFollowUp())).count() + 1;
        return switch (Math.floorMod(baseQuestionOrder - 1, 3)) {
            case 0 -> DifficultyLevel.EASY;
            case 1 -> DifficultyLevel.MEDIUM;
            default -> DifficultyLevel.HARD;
        };
    }

    public AgentEvaluationResponse evaluateAnswer(
            RoundType roundType,
            String questionText,
            String candidateAnswer,
            CandidateContext context,
            List<ConversationTurn> history) {

        log.info("InterviewAgent evaluating answer: round={}, answerLength={}",
                roundType, candidateAnswer != null ? candidateAnswer.length() : 0);

        InterviewStrategy strategy = orchestrator.getStrategy(roundType);
        return strategy.evaluateAnswer(questionText, candidateAnswer, context, history);
    }
}

