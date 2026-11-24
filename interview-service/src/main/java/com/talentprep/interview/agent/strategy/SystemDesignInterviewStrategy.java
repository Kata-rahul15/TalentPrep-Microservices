package com.talentprep.interview.agent.strategy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentprep.interview.agent.dto.AgentEvaluationResponse;
import com.talentprep.interview.agent.dto.AgentQuestionResponse;
import com.talentprep.interview.agent.dto.ConversationTurn;
import com.talentprep.interview.agent.prompt.SystemDesignPromptBuilder;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.entity.enums.DifficultyLevel;
import com.talentprep.interview.entity.enums.RoundType;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SystemDesignInterviewStrategy extends BaseInterviewStrategy {

    private final SystemDesignPromptBuilder promptBuilder;

    public SystemDesignInterviewStrategy(
            ChatClient chatClient,
            ObjectMapper objectMapper,
            SystemDesignPromptBuilder promptBuilder) {
        super(chatClient, objectMapper);
        this.promptBuilder = promptBuilder;
    }

    @Override
    public RoundType getRoundType() {
        return RoundType.SYSTEM_DESIGN;
    }

    @Override
    public AgentQuestionResponse generateQuestion(
            CandidateContext context,
            DifficultyLevel difficulty,
            List<ConversationTurn> history,
            int questionOrder,
            int targetQuestionCount) {

        String prompt = promptBuilder.buildQuestionPrompt(context, difficulty, history, questionOrder, targetQuestionCount);
        return callAiForQuestion(prompt, "System Design & Distributed Systems", difficulty);
    }

    @Override
    public AgentEvaluationResponse evaluateAnswer(
            String questionText,
            String candidateAnswer,
            CandidateContext context,
            List<ConversationTurn> history) {

        String prompt = promptBuilder.buildEvaluationPrompt(questionText, candidateAnswer, context);
        return callAiForEvaluation(prompt);
    }

    @Override
    public AgentQuestionResponse generateFollowUpQuestion(
            String questionText,
            String candidateAnswer,
            AgentEvaluationResponse evaluation,
            CandidateContext context,
            List<ConversationTurn> history,
            DifficultyLevel difficulty) {
        return callAiForFollowUpQuestion(questionText, candidateAnswer, evaluation, context, "System Design Follow-up", difficulty);
    }

    @Override
    protected AgentQuestionResponse buildFallbackQuestion(String category, DifficultyLevel difficulty) {
        return AgentQuestionResponse.builder()
                .questionText("Design a distributed rate limiter for a multi-tenant API gateway handling 100,000 requests per second. Address latency, storage, and synchronization.")
                .questionCategory(category)
                .difficulty(difficulty.name())
                .isFollowUp(false)
                .reasoning("Standard architectural problem testing distributed coordination and memory efficiency")
                .build();
    }
}

