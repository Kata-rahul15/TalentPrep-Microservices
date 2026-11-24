package com.talentprep.interview.agent.dto;

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
public class AgentQuestionResponse {
    private String questionText;
    private String questionCategory;
    private String difficulty;
    private Boolean isFollowUp;
    private UUID parentQuestionId;
    private String codingBoilerplate;
    private Map<String, String> codingStarterTemplates;

    @Builder.Default
    private List<Map<String, Object>> codingTestCases = new ArrayList<>();

    private UUID codingProblemId;

    @Builder.Default
    private List<Map<String, Object>> codingHiddenTestCases = new ArrayList<>();

    private String reasoning;
}
