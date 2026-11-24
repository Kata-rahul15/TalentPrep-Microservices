package com.talentprep.interview.agent.prompt;

import com.talentprep.interview.agent.dto.ConversationTurn;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.entity.enums.DifficultyLevel;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class SystemDesignPromptBuilder {

    public String buildQuestionPrompt(
            CandidateContext context,
            DifficultyLevel difficulty,
            List<ConversationTurn> history,
            int questionOrder,
            int targetCount) {

        StringBuilder sb = new StringBuilder();
        sb.append("You are a Principal Software Architect conducting a System Design Round for TalentPrep.\n");
        sb.append("Candidate target role: ").append(context.getTargetRole()).append("\n");
        sb.append("Experience level: ").append(context.getExperienceLevel()).append("\n");
        sb.append("Difficulty: ").append(difficulty.name()).append("\n\n");

        if (history != null && !history.isEmpty()) {
            sb.append("PREVIOUS QUESTIONS & ANSWERS IN THIS SYSTEM DESIGN SESSION:\n");
            for (ConversationTurn turn : history) {
                sb.append("Q: ").append(turn.getQuestionText()).append("\n");
                if (turn.getCandidateAnswer() != null && !turn.getCandidateAnswer().isBlank()) {
                    sb.append("A: ").append(turn.getCandidateAnswer()).append("\n");
                }
            }
            sb.append("Build on the previous system components (e.g. database scaling, caching, messaging, reliability) without repeating.\n\n");
        }

        sb.append("TASK:\n");
        sb.append("Generate a distributed systems or architecture design question (e.g. designing URL shortener, Rate Limiter, Notification Service, ");
        sb.append("Distributed Cache, Event-Driven Order Processing, or Payment idempotency).\n");
        sb.append("Incorporate requirements like high availability, fault tolerance, low latency, and horizontal scaling.\n");
        sb.append("Output JSON format:\n");
        sb.append("{\n");
        sb.append("  \"questionText\": \"Design a [SystemName] that handles [Requirements]...\",\n");
        sb.append("  \"questionCategory\": \"System Design / Distributed Systems\",\n");
        sb.append("  \"difficulty\": \"").append(difficulty.name()).append("\",\n");
        sb.append("  \"isFollowUp\": false,\n");
        sb.append("  \"reasoning\": \"Tests trade-offs between consistency, availability, and latency\"\n");
        sb.append("}\n");

        return sb.toString();
    }

    public String buildEvaluationPrompt(
            String questionText,
            String candidateAnswer,
            CandidateContext context) {

        return """
                You are a Principal Architect evaluating a candidate's System Design answer.

                QUESTION:
                %s

                CANDIDATE ANSWER:
                %s

                EVALUATE:
                1. Functional & Non-Functional requirement understanding
                2. Data modeling and database choice (SQL vs NoSQL, sharding, replication)
                3. High availability, caching strategies, rate limiting, and failure modes
                4. Communication and structured design breakdown

                Return JSON format:
                {
                  "score": 82,
                  "technicalAccuracy": 85,
                  "completeness": 80,
                  "clarity": 80,
                  "problemSolving": 85,
                  "feedback": "Architectural review of candidate's system design",
                  "strengths": ["Clear breakdown of load balancer and cache layer"],
                  "improvements": ["Address single point of failure in master database"],
                  "suggestedIdealAnswer": "High-level and detailed architectural blueprint addressing scale, latency, and CAP trade-offs",
                  "triggersFollowUp": true,
                  "followUpReason": "Inquire about handling network partitions or database failover"
                }
                """.formatted(questionText, candidateAnswer);
    }
}

