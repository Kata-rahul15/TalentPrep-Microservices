package com.talentprep.interview.agent;

import com.talentprep.interview.agent.dto.AgentEvaluationResponse;
import com.talentprep.interview.agent.dto.AgentQuestionResponse;
import com.talentprep.interview.agent.dto.ConversationTurn;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.entity.enums.DifficultyLevel;
import com.talentprep.interview.entity.enums.RoundType;

import java.util.List;

public interface InterviewStrategy {

    RoundType getRoundType();

    AgentQuestionResponse generateQuestion(
            CandidateContext context,
            DifficultyLevel difficulty,
            List<ConversationTurn> history,
            int questionOrder,
            int targetQuestionCount);

    AgentEvaluationResponse evaluateAnswer(
            String questionText,
            String candidateAnswer,
            CandidateContext context,
            List<ConversationTurn> history);

    AgentQuestionResponse generateFollowUpQuestion(
            String questionText,
            String candidateAnswer,
            AgentEvaluationResponse evaluation,
            CandidateContext context,
            List<ConversationTurn> history,
            DifficultyLevel difficulty);
}

