package com.talentprep.interview.agent.strategy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentprep.interview.agent.dto.AgentEvaluationResponse;
import com.talentprep.interview.agent.dto.AgentQuestionResponse;
import com.talentprep.interview.agent.dto.ConversationTurn;
import com.talentprep.interview.agent.prompt.TechnicalPromptBuilder;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.entity.enums.DifficultyLevel;
import com.talentprep.interview.entity.enums.RoundType;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TechnicalInterviewStrategy extends BaseInterviewStrategy {

    private final TechnicalPromptBuilder promptBuilder;

    public TechnicalInterviewStrategy(
            ChatClient chatClient,
            ObjectMapper objectMapper,
            TechnicalPromptBuilder promptBuilder) {
        super(chatClient, objectMapper);
        this.promptBuilder = promptBuilder;
    }

    @Override
    public RoundType getRoundType() {
        return RoundType.TECHNICAL;
    }

    @Override
    public AgentQuestionResponse generateQuestion(
            CandidateContext context,
            DifficultyLevel difficulty,
            List<ConversationTurn> history,
            int questionOrder,
            int targetQuestionCount) {

        String prompt = promptBuilder.buildQuestionPrompt(context, difficulty, history, questionOrder, targetQuestionCount);
        return callAiForQuestion(prompt, "Core Java & Spring Boot", difficulty);
    }

    @Override
    public AgentEvaluationResponse evaluateAnswer(
            String questionText,
            String candidateAnswer,
            CandidateContext context,
            List<ConversationTurn> history) {

        String prompt = promptBuilder.buildEvaluationPrompt(questionText, candidateAnswer, context, history);
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
        return callAiForFollowUpQuestion(questionText, candidateAnswer, evaluation, context, "Technical Deep Dive", difficulty);
    }

    @Override
    protected AgentQuestionResponse buildFallbackQuestion(String category, DifficultyLevel difficulty) {
        return AgentQuestionResponse.builder()
                .questionText("How do you ensure thread-safety when building singleton services in Spring Boot with concurrent user traffic?")
                .questionCategory(category)
                .difficulty(difficulty.name())
                .isFollowUp(false)
                .reasoning("Fallback question assessing concurrency and Spring bean scoping fundamentals")
                .build();
    }
}

