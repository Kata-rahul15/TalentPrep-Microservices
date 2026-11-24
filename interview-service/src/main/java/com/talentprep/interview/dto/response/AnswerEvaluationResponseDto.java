package com.talentprep.interview.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnswerEvaluationResponseDto {
    private UUID evaluationId;
    private UUID questionId;
    private Integer score;
    private Integer technicalAccuracy;
    private Integer completeness;
    private Integer clarity;
    private Integer problemSolving;
    private String feedback;

    @Builder.Default
    private List<String> strengths = new ArrayList<>();

    @Builder.Default
    private List<String> improvements = new ArrayList<>();

    private String suggestedIdealAnswer;
    private boolean roundCompleted;
    private boolean interviewCompleted;
    private Integer currentRoundIndex;
    private Integer passedCount;
    private Integer totalCount;
    private Long executionTimeMs;
    private String verdict;
    private List<com.talentprep.interview.coding.dto.CodeRunResult.TestCaseResult> testCaseResults;
    private Integer questionOrder;
    private Integer targetQuestionCount;
}
