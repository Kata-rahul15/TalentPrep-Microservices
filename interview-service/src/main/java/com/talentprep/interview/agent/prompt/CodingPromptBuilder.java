package com.talentprep.interview.agent.prompt;

import com.talentprep.interview.agent.dto.ConversationTurn;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.entity.enums.DifficultyLevel;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class CodingPromptBuilder {

    public String buildQuestionPrompt(
            CandidateContext context,
            DifficultyLevel difficulty,
            List<ConversationTurn> history,
            int questionOrder,
            int targetCount) {

        StringBuilder sb = new StringBuilder();
        sb.append("You are an expert algorithms and data structures interviewer conducting a Coding Round for TalentPrep.\n");
        sb.append("Candidate target role: ").append(context.getTargetRole()).append("\n");
        sb.append("Difficulty: ").append(difficulty.name()).append("\n\n");

        if (history != null && !history.isEmpty()) {
            sb.append("PREVIOUS CODING PROBLEMS ASKED IN THIS ROUND:\n");
            for (ConversationTurn turn : history) {
                sb.append("- ").append(turn.getQuestionText()).append("\n");
            }
            sb.append("RULE: Do NOT repeat these problems or exact DSA patterns.\n\n");
        }

        sb.append("TASK:\n");
        sb.append("Generate a standard coding problem (Arrays, Strings, HashMaps, Trees, Graphs, Two Pointers, or Dynamic Programming) ");
        sb.append("appropriate for the specified difficulty.\n");
        sb.append("Include problem statement, constraints, example input/output, empty starter template/function in codingBoilerplate, and structured test cases in codingTestCases.\n");
        sb.append("CRITICAL: codingBoilerplate MUST ONLY contain empty starter function signature with TODO comment and standard I/O driver. NEVER include the solution logic or answer implementation.\n");
        sb.append("Output JSON format:\n");
        sb.append("{\n");
        sb.append("  \"questionText\": \"Problem statement with input/output examples and constraints\",\n");
        sb.append("  \"questionCategory\": \"Data Structures & Algorithms / Arrays / Trees / etc\",\n");
        sb.append("  \"difficulty\": \"").append(difficulty.name()).append("\",\n");
        sb.append("  \"isFollowUp\": false,\n");
        sb.append("  \"codingBoilerplate\": \"public class Main {\\n    public static int solve(...) {\\n        // TODO: Write your solution here\\n        return 0;\\n    }\\n    public static void main(String[] args) {\\n        // standard I/O\\n    }\\n}\",\n");
        sb.append("  \"codingTestCases\": [\n");
        sb.append("    {\"input\": \"example input\", \"expectedOutput\": \"expected result\", \"description\": \"standard case\"}\n");
        sb.append("  ],\n");
        sb.append("  \"reasoning\": \"Tests algorithmic thinking and edge case management\"\n");
        sb.append("}\n");

        return sb.toString();
    }
}
