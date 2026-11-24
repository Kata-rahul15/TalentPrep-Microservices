package com.talentprep.interview.agent.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AgentEvaluationResponse {
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
    private Boolean triggersFollowUp;
    private String followUpReason;
}

