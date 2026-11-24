package com.talentprep.interview.agent.prompt;

import com.talentprep.interview.agent.dto.ConversationTurn;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.entity.enums.DifficultyLevel;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class BehavioralPromptBuilder {

    public String buildQuestionPrompt(
            CandidateContext context,
            DifficultyLevel difficulty,
            List<ConversationTurn> history,
            int questionOrder,
            int targetCount) {

        StringBuilder sb = new StringBuilder();
        sb.append("You are an experienced Engineering Manager conducting a Behavioral Round for TalentPrep.\n");
        sb.append("Target Role: ").append(context.getTargetRole()).append("\n");
        sb.append("Experience Level: ").append(context.getExperienceLevel()).append("\n\n");

        if (context.getExperience() != null && !context.getExperience().isEmpty()) {
            sb.append("CANDIDATE BACKGROUND:\n");
            for (var exp : context.getExperience()) {
                sb.append("- ").append(exp.getRole()).append(" at ").append(exp.getCompany());
                if (exp.getDuration() != null && !exp.getDuration().isBlank()) {
                    sb.append(" (").append(exp.getDuration()).append(")");
                }
                sb.append("\n");
            }
            sb.append("\n");
        }

        if (history != null && !history.isEmpty()) {
            sb.append("PREVIOUS BEHAVIORAL QUESTIONS ASKED:\n");
            for (ConversationTurn turn : history) {
                sb.append("Q: ").append(turn.getQuestionText()).append("\n");
                if (turn.getCandidateAnswer() != null && !turn.getCandidateAnswer().isBlank()) {
                    sb.append("A: ").append(turn.getCandidateAnswer()).append("\n");
                }
            }
            sb.append("RULE: Do not ask about the same behavioral category already covered.\n\n");
        }

        sb.append("TASK:\n");
        sb.append("Generate a situational or behavioral question designed for STAR method responses (Situation, Task, Action, Result).\n");
        sb.append("Categories to rotate through: Conflict Resolution, Cross-Functional Collaboration, Navigating Ambiguity, Production Outages/Failures, Mentorship, or Prioritization.\n");
        sb.append("Output JSON format:\n");
        sb.append("{\n");
        sb.append("  \"questionText\": \"Tell me about a time when...\",\n");
        sb.append("  \"questionCategory\": \"Behavioral / Conflict Resolution / etc\",\n");
        sb.append("  \"difficulty\": \"").append(difficulty.name()).append("\",\n");
        sb.append("  \"isFollowUp\": false,\n");
        sb.append("  \"reasoning\": \"Evaluates emotional intelligence, accountability, and teamwork\"\n");
        sb.append("}\n");

        return sb.toString();
    }

    public String buildEvaluationPrompt(
            String questionText,
            String candidateAnswer,
            CandidateContext context) {

        return """
                You are an Engineering Manager evaluating a candidate's behavioral answer based on the STAR method.

                QUESTION:
                %s

                CANDIDATE ANSWER:
                %s

                EVALUATE:
                1. STAR adherence: Did they clearly articulate Situation, Task, Action, and quantifiable Result?
                2. Ownership and Accountability: Did they focus on 'I' vs vague 'we'?
                3. Interpersonal maturity, communication, and emotional intelligence

                Return JSON format:
                {
                  "score": 85,
                  "technicalAccuracy": 80,
                  "completeness": 85,
                  "clarity": 90,
                  "problemSolving": 85,
                  "feedback": "STAR-based feedback on candidate's answer",
                  "strengths": ["Clear description of the conflict and empathetic approach"],
                  "improvements": ["Quantify the business impact or final result of the resolution"],
                  "suggestedIdealAnswer": "Well-structured STAR answer illustrating direct action and measurable outcome",
                  "triggersFollowUp": false,
                  "followUpReason": null
                }
                """.formatted(questionText, candidateAnswer);
    }
}

