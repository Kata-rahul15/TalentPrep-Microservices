package com.talentprep.interview.agent.strategy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentprep.interview.agent.dto.AgentEvaluationResponse;
import com.talentprep.interview.agent.dto.AgentQuestionResponse;
import com.talentprep.interview.agent.dto.ConversationTurn;
import com.talentprep.interview.agent.prompt.BehavioralPromptBuilder;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.entity.enums.DifficultyLevel;
import com.talentprep.interview.entity.enums.RoundType;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class BehavioralInterviewStrategy extends BaseInterviewStrategy {

    private final BehavioralPromptBuilder promptBuilder;

    public BehavioralInterviewStrategy(
            ChatClient chatClient,
            ObjectMapper objectMapper,
            BehavioralPromptBuilder promptBuilder) {
        super(chatClient, objectMapper);
        this.promptBuilder = promptBuilder;
    }

    @Override
    public RoundType getRoundType() {
        return RoundType.BEHAVIORAL;
    }

    @Override
    public AgentQuestionResponse generateQuestion(
            CandidateContext context,
            DifficultyLevel difficulty,
            List<ConversationTurn> history,
            int questionOrder,
            int targetQuestionCount) {

        String prompt = promptBuilder.buildQuestionPrompt(context, difficulty, history, questionOrder, targetQuestionCount);
        return callAiForQuestion(prompt, "Behavioral & Leadership", difficulty);
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
        return callAiForFollowUpQuestion(questionText, candidateAnswer, evaluation, context, "Behavioral Follow-up", difficulty);
    }

    @Override
    protected AgentQuestionResponse buildFallbackQuestion(String category, DifficultyLevel difficulty) {
        return AgentQuestionResponse.builder()
                .questionText("Tell me about a time when you strongly disagreed with a technical or product decision made by a team member or manager. How did you handle the situation and what was the outcome?")
                .questionCategory(category)
                .difficulty(difficulty.name())
                .isFollowUp(false)
                .reasoning("Assesses conflict resolution, empathy, and professional communication")
                .build();
    }
}

