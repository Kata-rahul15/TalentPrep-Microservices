package com.talentprep.interview.agent.strategy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentprep.interview.agent.InterviewStrategy;
import com.talentprep.interview.agent.dto.AgentEvaluationResponse;
import com.talentprep.interview.agent.dto.AgentQuestionResponse;
import com.talentprep.interview.entity.enums.DifficultyLevel;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;

import java.util.List;

public abstract class BaseInterviewStrategy implements InterviewStrategy {

    protected final Logger log = LoggerFactory.getLogger(getClass());
    protected final ChatClient chatClient;
    protected final ObjectMapper objectMapper;

    protected BaseInterviewStrategy(ChatClient chatClient, ObjectMapper objectMapper) {
        this.chatClient = chatClient;
        this.objectMapper = objectMapper;
    }

    protected AgentQuestionResponse callAiForQuestion(String prompt, String defaultCategory, DifficultyLevel difficulty) {
        try {
            String raw = chatClient.prompt().user(prompt).call().content();
            return parseQuestionResponse(raw, defaultCategory, difficulty);
        } catch (Exception ex) {
            log.error("Failed to generate question via AI for strategy {}: {}", getRoundType(), ex.getMessage());
            return buildFallbackQuestion(defaultCategory, difficulty);
        }
    }

    protected AgentEvaluationResponse callAiForEvaluation(String prompt) {
        try {
            String raw = chatClient.prompt().user(prompt).call().content();
            return parseEvaluationResponse(raw);
        } catch (Exception ex) {
            log.error("AI evaluation failed for strategy {}", getRoundType(), ex);
            throw new com.talentprep.interview.exception.AiEvaluationUnavailableException(
                    "AI evaluation is temporarily unavailable. Your answer was not assigned a score.", ex);
        }
    }

    protected AgentQuestionResponse parseQuestionResponse(String raw, String defaultCategory, DifficultyLevel difficulty) {
        if (raw == null || raw.isBlank()) {
            return buildFallbackQuestion(defaultCategory, difficulty);
        }
        try {
            String cleaned = cleanJson(raw);
            AgentQuestionResponse response = objectMapper.readValue(cleaned, AgentQuestionResponse.class);
            if (response.getQuestionText() == null || response.getQuestionText().isBlank()) {
                return buildFallbackQuestion(defaultCategory, difficulty);
            }
            if (response.getQuestionCategory() == null) {
                response.setQuestionCategory(defaultCategory);
            }
            // The selected session difficulty is authoritative; the model cannot silently downgrade it.
            response.setDifficulty(difficulty.name());
            return response;
        } catch (Exception ex) {
            log.warn("Failed to parse AI question response JSON: raw='{}', error={}", raw, ex.getMessage());
            return buildFallbackQuestion(defaultCategory, difficulty);
        }
    }

    protected AgentEvaluationResponse parseEvaluationResponse(String raw) {
        if (raw == null || raw.isBlank()) {
            throw new com.talentprep.interview.exception.AiEvaluationUnavailableException(
                    "AI evaluation returned an empty response.");
        }
        try {
            String cleaned = cleanJson(raw);
            AgentEvaluationResponse response = objectMapper.readValue(cleaned, AgentEvaluationResponse.class);
            if (response.getScore() == null
                    || response.getTechnicalAccuracy() == null
                    || response.getCompleteness() == null
                    || response.getClarity() == null
                    || response.getProblemSolving() == null) {
                throw new IllegalArgumentException("AI evaluation response is missing one or more required score fields.");
            }
            response.setScore(clamp(response.getScore()));
            response.setTechnicalAccuracy(clamp(response.getTechnicalAccuracy()));
            response.setCompleteness(clamp(response.getCompleteness()));
            response.setClarity(clamp(response.getClarity()));
            response.setProblemSolving(clamp(response.getProblemSolving()));
            return response;
        } catch (Exception ex) {
            log.warn("Failed to parse AI evaluation response JSON: {}", ex.getMessage());
            throw new com.talentprep.interview.exception.AiEvaluationUnavailableException(
                    "AI evaluation returned an invalid response. No score was saved.", ex);
        }
    }

    private String cleanJson(String raw) {
        String trimmed = raw.trim();
        if (trimmed.startsWith("```json")) {
            trimmed = trimmed.substring(7);
        } else if (trimmed.startsWith("```")) {
            trimmed = trimmed.substring(3);
        }
        if (trimmed.endsWith("```")) {
            trimmed = trimmed.substring(0, trimmed.length() - 3);
        }
        return trimmed.trim();
    }

    protected int clamp(Integer value) {
        return Math.max(0, Math.min(100, value));
    }


    protected abstract AgentQuestionResponse buildFallbackQuestion(String category, DifficultyLevel difficulty);

    protected AgentQuestionResponse callAiForFollowUpQuestion(
            String question, String answer, AgentEvaluationResponse evaluation, Object context, String category,
            DifficultyLevel difficulty) {
        String reason = evaluation != null ? evaluation.getFollowUpReason() : null;
        String prompt = buildFollowUpPrompt(question, answer, reason, context);
        AgentQuestionResponse response = callAiForQuestion(prompt, category, difficulty);
        response.setIsFollowUp(true);
        return response;
    }

    protected String buildFollowUpPrompt(String question, String answer, String reason, Object context) {
        return "You are an expert interviewer. Generate exactly one concise, specific follow-up question.\n"
                + "Original question: " + question + "\n"
                + "Candidate answer: " + answer + "\n"
                + "Reason to probe: " + (reason == null ? "Probe a meaningful claim or missing detail." : reason) + "\n"
                + "Candidate context: " + context + "\n"
                + "Return only JSON with questionText, questionCategory, difficulty, isFollowUp, reasoning.\n"
                + "Set isFollowUp=true. Do not repeat the original question.";
    }
}
