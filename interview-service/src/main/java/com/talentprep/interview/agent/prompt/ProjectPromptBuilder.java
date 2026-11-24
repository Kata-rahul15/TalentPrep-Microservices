package com.talentprep.interview.agent.prompt;

import com.talentprep.interview.agent.dto.ConversationTurn;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.context.dto.ProjectContext;
import com.talentprep.interview.entity.enums.DifficultyLevel;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ProjectPromptBuilder {

    public String buildQuestionPrompt(
            CandidateContext context,
            DifficultyLevel difficulty,
            List<ConversationTurn> history,
            int questionOrder,
            int targetCount) {

        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert technical interviewer conducting a Project-Based Architecture Round for TalentPrep.\n");
        sb.append("CANDIDATE'S ACTUAL EXTRACTED PROJECTS FROM RESUME:\n");

        if (context.getProjects() != null && !context.getProjects().isEmpty()) {
            for (ProjectContext p : context.getProjects()) {
                sb.append("- Project: ").append(p.getName()).append("\n");
                sb.append("  Description: ").append(p.getDescription()).append("\n");
                sb.append("  Technologies: ").append(String.join(", ", p.getTechnologies())).append("\n");
                if (p.getHighlights() != null && !p.getHighlights().isEmpty()) {
                    sb.append("  Highlights: ").append(String.join("; ", p.getHighlights())).append("\n");
                }
            }
        } else {
            sb.append("No explicit projects listed; focus on technical implementations from experience: ")
                    .append(String.join(", ", context.getSkills())).append("\n");
        }

        if (history != null && !history.isEmpty()) {
            sb.append("\nPREVIOUS QUESTIONS ASKED IN THIS ROUND:\n");
            for (ConversationTurn turn : history) {
                sb.append("Q: ").append(turn.getQuestionText()).append("\n");
            }
            sb.append("RULE: Do not ask about the exact same aspect of the project already discussed.\n");
        }

        sb.append("\nTASK:\n");
        sb.append("Formulate a deep, architectural, or implementation question directly focused on one of the candidate's actual projects above.\n");
        sb.append("Ask about architectural decisions, database schema choices, performance bottlenecks, concurrency issues, security, or trade-offs.\n");
        sb.append("Output JSON format:\n");
        sb.append("{\n");
        sb.append("  \"questionText\": \"In your project [ProjectName], how did you handle [specific technical aspect]?\",\n");
        sb.append("  \"questionCategory\": \"Project Architecture / [ProjectName]\",\n");
        sb.append("  \"difficulty\": \"").append(difficulty.name()).append("\",\n");
        sb.append("  \"isFollowUp\": false,\n");
        sb.append("  \"reasoning\": \"Evaluates direct ownership and practical engineering challenges in candidate's project\"\n");
        sb.append("}\n");

        return sb.toString();
    }

    public String buildEvaluationPrompt(
            String questionText,
            String candidateAnswer,
            CandidateContext context) {

        return """
                You are an expert technical interviewer evaluating a candidate's project architecture answer.

                QUESTION:
                %s

                CANDIDATE ANSWER:
                %s

                EVALUATE:
                1. Technical depth and realism (Did they actually build this, or are they reciting theory?)
                2. Architecture & design justification (Trade-offs, scaling, failure cases)
                3. Clarity and confidence in explaining technical decisions

                Return JSON format:
                {
                  "score": 88,
                  "technicalAccuracy": 90,
                  "completeness": 85,
                  "clarity": 90,
                  "problemSolving": 88,
                  "feedback": "Feedback on practical project implementation details",
                  "strengths": ["Demonstrates clear ownership of database partitioning"],
                  "improvements": ["Explain metrics used to detect connection pool exhaustion"],
                  "suggestedIdealAnswer": "Comprehensive architectural response addressing trade-offs and scaling",
                  "triggersFollowUp": true,
                  "followUpReason": "Drill deeper into failure recovery or load balancing"
                }
                """.formatted(questionText, candidateAnswer);
    }
}

