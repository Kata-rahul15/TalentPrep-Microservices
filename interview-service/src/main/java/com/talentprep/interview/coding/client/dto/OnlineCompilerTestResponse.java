package com.talentprep.interview.coding.client.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
@JsonIgnoreProperties(ignoreUnknown = true)
public class OnlineCompilerTestResponse {
    private String verdict;
    private Double score;
    private Integer passed;
    private Integer total;
    private Double time_limit;
    private String compile_error;

    @Builder.Default
    private List<TestCaseResultItem> tests = new ArrayList<>();

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TestCaseResultItem {
        private String verdict;
        private Boolean hidden;
        private String time;
        private String memory;
        private Integer exit_code;
        private String signal;
        private String output;
        private String error;
        private Boolean truncated;
    }
}
