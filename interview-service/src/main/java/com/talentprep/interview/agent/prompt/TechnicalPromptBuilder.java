package com.talentprep.interview.agent.prompt;

import com.talentprep.interview.agent.dto.ConversationTurn;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.entity.enums.DifficultyLevel;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TechnicalPromptBuilder {

    public String buildQuestionPrompt(
            CandidateContext context,
            DifficultyLevel difficulty,
            List<ConversationTurn> history,
            int questionOrder,
            int targetCount) {

        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert technical interviewer conducting a Technical Round for TalentPrep.\n");
        sb.append("CANDIDATE PROFILE:\n");
        sb.append("- Name: ").append(context.getCandidateName()).append("\n");
        sb.append("- Target Role: ").append(context.getTargetRole()).append("\n");
        sb.append("- Experience Level: ").append(context.getExperienceLevel()).append("\n");
        sb.append("- Explicit Skills: ").append(String.join(", ", context.getSkills())).append("\n");
        sb.append("- Difficulty Level: ").append(difficulty.name()).append("\n");
        sb.append("- Question ").append(questionOrder).append(" of ").append(targetCount).append("\n\n");

        if (context.getProjects() != null && !context.getProjects().isEmpty()) {
            sb.append("CANDIDATE PROJECTS (FROM VERIFIED RESUME):\n");
            for (var p : context.getProjects()) {
                sb.append("- Project: ").append(p.getName()).append("\n");
                if (p.getDescription() != null && !p.getDescription().isBlank()) {
                    sb.append("  Description: ").append(p.getDescription()).append("\n");
                }
                if (p.getTechnologies() != null && !p.getTechnologies().isEmpty()) {
                    sb.append("  Technologies: ").append(String.join(", ", p.getTechnologies())).append("\n");
                }
                if (p.getHighlights() != null && !p.getHighlights().isEmpty()) {
                    sb.append("  Highlights: ").append(String.join("; ", p.getHighlights())).append("\n");
                }
            }
            sb.append("\n");
        }

        if (context.getExperience() != null && !context.getExperience().isEmpty()) {
            sb.append("CANDIDATE WORK EXPERIENCE:\n");
            for (var e : context.getExperience()) {
                sb.append("- ").append(e.getRole()).append(" at ").append(e.getCompany());
                if (e.getDuration() != null && !e.getDuration().isBlank()) {
                    sb.append(" (").append(e.getDuration()).append(")");
                }
                sb.append("\n");
                if (e.getTechnologies() != null && !e.getTechnologies().isEmpty()) {
                    sb.append("  Technologies: ").append(String.join(", ", e.getTechnologies())).append("\n");
                }
            }
            sb.append("\n");
        }

        sb.append("INTERVIEW DOMAIN COVERAGE:\n");
        sb.append("Focus primarily on concepts, architectures, and design patterns relevant to: ")
                .append(context.getTargetRole() != null ? context.getTargetRole() : "Software Engineer");
        if (context.getSkills() != null && !context.getSkills().isEmpty()) {
            sb.append(" and technologies: ").append(String.join(", ", context.getSkills()));
        }
        sb.append(". For candidates with verified projects or experience, questions should investigate architecture decisions, trade-offs, concurrency, databases, and production incidents in their stated background.\n\n");

        if (history != null && !history.isEmpty()) {
            sb.append("PREVIOUS CONVERSATION IN THIS ROUND:\n");
            for (ConversationTurn turn : history) {
                sb.append("Q: ").append(turn.getQuestionText()).append("\n");
                if (turn.getCandidateAnswer() != null) {
                    sb.append("A: ").append(turn.getCandidateAnswer()).append("\n");
                }
            }
            sb.append("\nRULE: Do NOT ask the same question or cover the exact same concept already asked above. Ask a distinct, relevant next technical question.\n\n");
        }

        sb.append("TASK:\n");
        sb.append("Generate a single, direct, realistic technical question tailored to the candidate's skills and experience level.\n");
        sb.append("Output JSON format:\n");
        sb.append("{\n");
        sb.append("  \"questionText\": \"...\",\n");
        sb.append("  \"questionCategory\": \"Java / Spring Boot / Concurrency / etc\",\n");
        sb.append("  \"difficulty\": \"EASY / MEDIUM / HARD\",\n");
        sb.append("  \"isFollowUp\": false,\n");
        sb.append("  \"reasoning\": \"brief why this question was selected\"\n");
        sb.append("}\n");

        return sb.toString();
    }

    public String buildEvaluationPrompt(
            String questionText,
            String candidateAnswer,
            CandidateContext context,
            List<ConversationTurn> history) {

        return """
                You are an expert technical interviewer evaluating a candidate's answer for TalentPrep.

                QUESTION:
                %s

                CANDIDATE ANSWER:
                %s

                CANDIDATE PROFILE:
                - Target Role: %s
                - Experience Level: %s

                EVALUATION CRITERIA:
                1. Technical Accuracy (0-100): Is the answer factually correct?
                2. Completeness (0-100): Did it address the core technical concepts?
                3. Clarity (0-100): Was the explanation articulated clearly?
                4. Problem Solving (0-100): Does the candidate show practical architectural insight?
                Overall score should be the balanced average (0-100).

                Identify if the answer mentions a specific technical choice or mechanism that naturally warrants a follow-up question.

                Return JSON format:
                {
                  "score": 85,
                  "technicalAccuracy": 90,
                  "completeness": 80,
                  "clarity": 85,
                  "problemSolving": 85,
                  "feedback": "Constructive 2-sentence summary feedback",
                  "strengths": ["...", "..."],
                  "improvements": ["...", "..."],
                  "suggestedIdealAnswer": "A concise, industry-standard model answer",
                  "triggersFollowUp": true/false,
                  "followUpReason": "reason if a follow up is appropriate"
                }
                """.formatted(questionText, candidateAnswer, context.getTargetRole(), context.getExperienceLevel());
    }

    public String buildFollowUpPrompt(
            String originalQuestion,
            String candidateAnswer,
            String followUpReason,
            CandidateContext context) {

        return """
                You are an expert technical interviewer following up on a candidate's specific statement.

                PREVIOUS QUESTION:
                %s

                CANDIDATE'S ANSWER:
                %s

                REASON FOR FOLLOW UP:
                %s

                TASK:
                Generate a natural, inquisitive follow-up question digging deeper into the candidate's exact answer (e.g. edge cases, trade-offs, failure recovery).
                Return JSON format:
                {
                  "questionText": "...",
                  "questionCategory": "Follow-Up / Technical Deep Dive",
                  "difficulty": "MEDIUM",
                  "isFollowUp": true,
                  "reasoning": "Digging into candidate's claim"
                }
                """.formatted(originalQuestion, candidateAnswer, followUpReason);
    }
}

