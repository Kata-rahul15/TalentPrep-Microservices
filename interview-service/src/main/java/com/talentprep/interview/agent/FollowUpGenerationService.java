package com.talentprep.interview.agent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentprep.interview.agent.dto.ConversationTurn;
import com.talentprep.interview.agent.dto.FollowUpDecisionResponse;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.entity.enums.DifficultyLevel;
import com.talentprep.interview.entity.enums.RoundType;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Locale;

/**
 * Evaluates candidate responses to determine whether an intelligent follow-up
 * or clarification is warranted, independent of the scoring evaluation.
 * Enforces backend policy limits (max depth, count, time remaining, deduplication).
 */
@Service
public class FollowUpGenerationService {

    private static final Logger log = LoggerFactory.getLogger(FollowUpGenerationService.class);

    private static final int MAX_FOLLOW_UP_DEPTH = 2;
    private static final int MAX_FOLLOW_UPS_PER_BASE = 2;
    private static final long MIN_REMAINING_SECONDS = 180; // 3 minutes

    private final ChatClient chatClient;
    private final ObjectMapper objectMapper;

    public FollowUpGenerationService(ChatClient chatClient, ObjectMapper objectMapper) {
        this.chatClient = chatClient;
        this.objectMapper = objectMapper;
    }

    /**
     * Determines whether to ask a follow-up, clarify, or move on to the next question.
     */
    public FollowUpDecisionResponse decideFollowUp(
            RoundType roundType,
            String questionText,
            String candidateAnswer,
            String expectedAnswer,
            CandidateContext context,
            List<ConversationTurn> history,
            int currentDepth,
            int followUpCountForParent,
            long remainingSeconds,
            DifficultyLevel difficulty) {

        // Policy Check 1: Coding rounds use code submission workspace, not conversational follow-up
        if (roundType == RoundType.CODING) {
            log.info("Coding track bypasses conversational follow-up generation.");
            return moveOn("Coding round questions advance deterministically.");
        }

        // Policy Check 2: Depth limit
        if (currentDepth >= MAX_FOLLOW_UP_DEPTH) {
            log.info("Follow-up policy depth limit reached: depth={}", currentDepth);
            return moveOn("Maximum follow-up depth reached.");
        }

        // Policy Check 3: Count limit for base question
        if (followUpCountForParent >= MAX_FOLLOW_UPS_PER_BASE) {
            log.info("Follow-up policy count limit reached for base question: count={}", followUpCountForParent);
            return moveOn("Maximum follow-up count reached for root question.");
        }

        // Policy Check 4: Remaining time limit
        if (remainingSeconds > 0 && remainingSeconds < MIN_REMAINING_SECONDS) {
            log.info("Insufficient interview duration remaining for follow-up: {}s remaining", remainingSeconds);
            return moveOn("Session duration nearing completion.");
        }

        // Policy Check 5: Meaningful candidate answer
        if (candidateAnswer == null
                || candidateAnswer.trim().length() < 5
                || "SKIPPED".equalsIgnoreCase(candidateAnswer.trim())) {
            log.info("Candidate provided empty or skipped answer; moving on.");
            return moveOn("Candidate skipped or gave minimal answer.");
        }

        // Generate decision via Spring AI
        try {
            String prompt = buildPrompt(roundType, questionText, candidateAnswer, expectedAnswer,
                    context, history, currentDepth, difficulty);
            String rawResponse = chatClient.prompt().user(prompt).call().content();
            FollowUpDecisionResponse decision = parseDecision(rawResponse, currentDepth + 1);

            // Policy Check 6: Validate generated question
            return validateDecision(decision, history, currentDepth + 1);
        } catch (Exception ex) {
            log.warn("Follow-up generation encountered an error; falling back to MOVE_ON: {}", ex.getMessage());
            return moveOn("Fallback to next base question due to generator error.");
        }
    }

    private FollowUpDecisionResponse validateDecision(
            FollowUpDecisionResponse decision,
            List<ConversationTurn> history,
            int nextDepth) {

        if (decision == null || decision.getDecision() == null) {
            return moveOn("Invalid or null model decision.");
        }

        String dec = decision.getDecision().toUpperCase(Locale.ROOT).trim();
        if ("MOVE_ON".equals(dec)) {
            decision.setDecision("MOVE_ON");
            return decision;
        }

        if ("CLARIFY".equals(dec)) dec = "ASK_FOLLOW_UP";
        if (!"ASK_FOLLOW_UP".equals(dec)) {
            log.warn("Unknown follow-up decision enum value '{}'; falling back to MOVE_ON", dec);
            return moveOn("Unsupported decision value.");
        }

        String question = decision.getQuestion();
        if (question == null || question.isBlank() || question.trim().length() < 10) {
            log.warn("Model returned blank or trivial question for '{}'; falling back to MOVE_ON", dec);
            return moveOn("Generated question was empty or too short.");
        }

        // Prevent substantive duplication of previous questions
        String normalizedQuestion = question.trim().toLowerCase(Locale.ROOT);
        if (history != null) {
            for (ConversationTurn turn : history) {
                if (turn.getQuestionText() != null
                        && turn.getQuestionText().toLowerCase(Locale.ROOT).contains(normalizedQuestion)) {
                    log.warn("Generated follow-up duplicates earlier question; falling back to MOVE_ON");
                    return moveOn("Follow-up duplicate of earlier question.");
                }
            }
        }

        decision.setDecision(dec);
        decision.setQuestion(question.trim());
        decision.setDepth(nextDepth);
        if (decision.getEstimatedAnswerSeconds() == null || decision.getEstimatedAnswerSeconds() <= 0) {
            decision.setEstimatedAnswerSeconds(60);
        }
        return decision;
    }

    private FollowUpDecisionResponse parseDecision(String raw, int nextDepth) {
        if (raw == null || raw.isBlank()) {
            return moveOn("Model returned empty response.");
        }
        try {
            String cleaned = cleanJson(raw);
            FollowUpDecisionResponse res = objectMapper.readValue(cleaned, FollowUpDecisionResponse.class);
            if (res.getDepth() == null) res.setDepth(nextDepth);
            return res;
        } catch (Exception ex) {
            log.warn("Failed to parse follow-up decision JSON: raw='{}', error={}", raw, ex.getMessage());
            return moveOn("JSON parsing failed on model response.");
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

    private String buildPrompt(
            RoundType roundType,
            String questionText,
            String candidateAnswer,
            String expectedAnswer,
            CandidateContext context,
            List<ConversationTurn> history,
            int currentDepth,
            DifficultyLevel difficulty) {

        return """
                You are a senior technical interviewer for a TalentPrep mock interview simulation.
                Round Type: %s
                Target Role: %s
                Difficulty Level: %s
                Current Question Depth: %d (Max Depth: 2)

                Interviewer Question:
                "%s"

                Candidate Answer:
                "%s"

                Expected answer / key concepts (may be unavailable; if so infer essential concepts
                from the original question and role):
                "%s"

                Decide whether the candidate's answer requires one genuinely useful follow-up or whether
                the interview should move on. Be a fair technical interviewer, not an examiner seeking
                reasons to prolong every topic.

                Assess:
                - The original question and the essential concepts it tests.
                - Technical correctness and whether the candidate's approach is valid.
                - Whether any essential concept is missing (not merely optional extra detail).
                - Whether the answer is ambiguous enough that its meaning cannot be assessed.
                - Whether the candidate's answer is sufficiently complete for the requested scope.

                Decision rules:
                - MOVE_ON when the answer is correct and sufficient, including a correct concise answer.
                - MOVE_ON when the candidate clearly does not know; do not repeatedly probe a blank answer.
                - ASK_FOLLOW_UP only when a specific missing essential concept, material ambiguity,
                  or technically important claim genuinely needs clarification/deeper exploration.
                - Do not demand one canonical terminology, framework, syntax, or implementation.
                  Accept different technically valid terminology and approaches.
                - Do not ask a follow-up merely because the candidate could say more.
                - If the answer is partially correct, ask one focused question about the most important gap.
                - If it is materially ambiguous, ask one neutral question that resolves that ambiguity.

                Infer the expected concepts from the question, round type and target role. Distinguish
                essential concepts from optional elaboration. The decision must be based on the answer,
                not on a generic preference for more detail.

                Respond ONLY with a valid JSON object matching this schema:
                {
                  "decision": "ASK_FOLLOW_UP" | "MOVE_ON",
                  "question": "One focused follow-up if ASK_FOLLOW_UP, otherwise empty string",
                  "reason": "Brief technical explanation for this decision",
                  "topic": "Specific technical concept or competency probed",
                  "depth": %d,
                  "estimatedAnswerSeconds": 60
                }
                """.formatted(
                roundType,
                context.getTargetRole() != null ? context.getTargetRole() : "Software Engineer",
                difficulty != null ? difficulty.name() : "MEDIUM",
                currentDepth,
                questionText,
                candidateAnswer,
                expectedAnswer != null ? expectedAnswer : "Not available; infer from the question.",
                currentDepth + 1
        );
    }

    private FollowUpDecisionResponse moveOn(String reason) {
        return FollowUpDecisionResponse.builder()
                .decision("MOVE_ON")
                .question("")
                .reason(reason)
                .topic("General")
                .depth(0)
                .estimatedAnswerSeconds(0)
                .build();
    }
}

