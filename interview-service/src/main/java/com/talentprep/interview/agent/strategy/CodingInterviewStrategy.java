package com.talentprep.interview.agent.strategy;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.talentprep.interview.agent.dto.AgentEvaluationResponse;
import com.talentprep.interview.agent.dto.AgentQuestionResponse;
import com.talentprep.interview.agent.dto.ConversationTurn;
import com.talentprep.interview.agent.prompt.CodingPromptBuilder;
import com.talentprep.interview.coding.CodeExecutionService;
import com.talentprep.interview.coding.entity.CodingProblem;
import com.talentprep.interview.coding.service.CodingProblemBankService;
import com.talentprep.interview.context.dto.CandidateContext;
import com.talentprep.interview.entity.enums.DifficultyLevel;
import com.talentprep.interview.entity.enums.RoundType;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.stereotype.Component;

import java.util.*;

@Slf4j
@Component
public class CodingInterviewStrategy extends BaseInterviewStrategy {

    private final CodingPromptBuilder promptBuilder;
    private final CodeExecutionService codeExecutionService;
    private final CodingProblemBankService problemBankService;

    public CodingInterviewStrategy(
            ChatClient chatClient,
            ObjectMapper objectMapper,
            CodingPromptBuilder promptBuilder,
            CodeExecutionService codeExecutionService,
            CodingProblemBankService problemBankService) {
        super(chatClient, objectMapper);
        this.promptBuilder = promptBuilder;
        this.codeExecutionService = codeExecutionService;
        this.problemBankService = problemBankService;
    }

    @Override
    public RoundType getRoundType() {
        return RoundType.CODING;
    }

    @Override
    public AgentQuestionResponse generateQuestion(
            CandidateContext context,
            DifficultyLevel difficulty,
            List<ConversationTurn> history,
            int questionOrder,
            int targetQuestionCount) {

        // 1. Prefer curated question bank from PostgreSQL
        Set<String> excludeSlugs = new HashSet<>();
        if (history != null) {
            for (ConversationTurn turn : history) {
                if (turn.getQuestionText() != null) {
                    excludeSlugs.add(turn.getQuestionText().trim());
                }
            }
        }

        Optional<CodingProblem> problemOpt = problemBankService.findProblemForDifficulty(difficulty, excludeSlugs);
        if (problemOpt.isPresent()) {
            CodingProblem problem = problemOpt.get();
            log.info("Selected curated coding problem '{}' for difficulty {}", problem.getTitle(), difficulty);
            String starter = problem.getStarterCode() != null ? problem.getStarterCode().getOrDefault("java", "") : "";
            return AgentQuestionResponse.builder()
                    .questionText(problem.getDescription())
                    .questionCategory(problem.getCategory())
                    .difficulty(problem.getDifficulty().name())
                    .isFollowUp(false)
                    .codingBoilerplate(starter)
                    .codingStarterTemplates(problem.getStarterCode() != null ? problem.getStarterCode() : Map.of())
                    .codingTestCases(problem.getSampleTestCases() != null ? problem.getSampleTestCases() : List.of())
                    .codingProblemId(problem.getId())
                    .codingHiddenTestCases(problem.getHiddenTestCases() != null ? problem.getHiddenTestCases() : List.of())
                    .reasoning("Selected curated problem from question bank: " + problem.getTitle())
                    .build();
        }

        // 2. Fallback to dynamic AI question generation if bank empty
        log.info("No curated problem found in bank. Falling back to AI question generation.");
        String prompt = promptBuilder.buildQuestionPrompt(context, difficulty, history, questionOrder, targetQuestionCount);
        return callAiForQuestion(prompt, "Algorithms & Data Structures", difficulty);
    }

    @Override
    public AgentEvaluationResponse evaluateAnswer(
            String questionText,
            String candidateAnswer,
            CandidateContext context,
            List<ConversationTurn> history) {
        // Coding evaluation is completely deterministic and handled in CodingSubmissionService.
        // Return a deterministic fallback response without calling an LLM.
        return AgentEvaluationResponse.builder()
                .score(70)
                .technicalAccuracy(70)
                .completeness(70)
                .clarity(70)
                .problemSolving(70)
                .feedback("Coding evaluation is determined via test execution.")
                .strengths(List.of("Submitted code recorded"))
                .improvements(List.of())
                .triggersFollowUp(false)
                .build();
    }

    @Override
    public AgentQuestionResponse generateFollowUpQuestion(
            String questionText,
            String candidateAnswer,
            AgentEvaluationResponse evaluation,
            CandidateContext context,
            List<ConversationTurn> history,
            DifficultyLevel difficulty) {
        // Coding rounds do not generate conversational follow-ups.
        return null;
    }

    @Override
    protected AgentQuestionResponse buildFallbackQuestion(String category, DifficultyLevel difficulty) {
        Map<String, String> starters = Map.of(
                "java", """
import java.util.*;

public class Main {
    public static int[] twoSum(int[] nums, int target) {
        // TODO: Write your solution here
        return new int[]{};
    }

    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (!sc.hasNextInt()) return;
        int n = sc.nextInt();
        int[] nums = new int[n];
        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();
        int target = sc.nextInt();
        int[] res = twoSum(nums, target);
        if (res.length == 2) {
            System.out.println(res[0] + " " + res[1]);
        }
    }
}
""",
                "python", """
import sys

def two_sum(nums, target):
    # TODO: Write your solution here
    return []

if __name__ == '__main__':
    input_data = sys.stdin.read().split()
    if input_data:
        n = int(input_data[0])
        nums = [int(x) for x in input_data[1:n+1]]
        target = int(input_data[n+1])
        res = two_sum(nums, target)
        if res:
            print(f"{res[0]} {res[1]}")
"""
        );

        return AgentQuestionResponse.builder()
                .questionText("Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.")
                .questionCategory(category)
                .difficulty(difficulty.name())
                .isFollowUp(false)
                .codingBoilerplate(starters.get("java"))
                .codingStarterTemplates(starters)
                .codingTestCases(List.of(
                        Map.of("input", "4\n2 7 11 15\n9", "expectedOutput", "0 1", "description", "Sample case")
                ))
                .codingHiddenTestCases(List.of(
                        Map.of("input", "2\n3 3\n6", "expectedOutput", "0 1", "weight", 1)
                ))
                .reasoning("Two Sum standard DSA problem testing hash map lookup efficiency")
                .build();
    }
}
