package com.talentprep.interview.coding.client.dto;

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
public class OnlineCompilerTestRequest {
    private String compiler;
    private String code;

    @Builder.Default
    private List<TestCaseItem> tests = new ArrayList<>();

    private Integer time_limit;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TestCaseItem {
        private String input;
        private String expected_output;
        private Integer weight;
        private Boolean hidden;
    }
}
