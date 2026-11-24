package com.talentprep.interview.agent.strategy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentprep.interview.agent.dto.AgentEvaluationResponse;
import com.talentprep.interview.agent.dto.AgentQuestionResponse;
import com.talentprep.interview.agent.dto.ConversationTurn;
import com.talentprep.interview.agent.prompt.ProjectPromptBuilder;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.entity.enums.DifficultyLevel;
import com.talentprep.interview.entity.enums.RoundType;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ProjectInterviewStrategy extends BaseInterviewStrategy {

    private final ProjectPromptBuilder promptBuilder;

    public ProjectInterviewStrategy(
            ChatClient chatClient,
            ObjectMapper objectMapper,
            ProjectPromptBuilder promptBuilder) {
        super(chatClient, objectMapper);
        this.promptBuilder = promptBuilder;
    }

    @Override
    public RoundType getRoundType() {
        return RoundType.PROJECT;
    }

    @Override
    public AgentQuestionResponse generateQuestion(
            CandidateContext context,
            DifficultyLevel difficulty,
            List<ConversationTurn> history,
            int questionOrder,
            int targetQuestionCount) {

        String prompt = promptBuilder.buildQuestionPrompt(context, difficulty, history, questionOrder, targetQuestionCount);
        return callAiForQuestion(prompt, "Project Architecture & Implementation", difficulty);
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
        return callAiForFollowUpQuestion(questionText, candidateAnswer, evaluation, context, "Project Deep Dive", difficulty);
    }

    @Override
    protected AgentQuestionResponse buildFallbackQuestion(String category, DifficultyLevel difficulty) {
        return AgentQuestionResponse.builder()
                .questionText("Can you describe the overall architecture of your primary project, including how data flows from the client to the database and how security is enforced?")
                .questionCategory(category)
                .difficulty(difficulty.name())
                .isFollowUp(false)
                .reasoning("Fallback project question verifying end-to-end architecture ownership")
                .build();
    }
}

