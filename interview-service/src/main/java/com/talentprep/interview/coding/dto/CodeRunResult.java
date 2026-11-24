package com.talentprep.interview.coding.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
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
public class CodeRunResult {
    private boolean compiled;
    private String compilationOutput;
    private boolean passedAllTestCases;
    private int passedCount;
    private int totalCount;
    private double score; // 0.0 to 100.0
    private long executionTimeMs;
    private long memoryUsedBytes;
    private String verdict; // ACCEPTED, WRONG_ANSWER, COMPILE_ERROR, RUNTIME_ERROR, TIME_LIMIT_EXCEEDED
    private String stdout;
    private String stderr;

    @Builder.Default
    private List<TestCaseResult> testCaseResults = new ArrayList<>();

    // Backward-compatibility accessors for frontend
    @JsonProperty("testCasesPassed")
    public int getTestCasesPassed() {
        return passedCount;
    }

    @JsonProperty("totalTestCases")
    public int getTotalTestCases() {
        return totalCount;
    }

    @JsonProperty("output")
    public String getOutput() {
        if (stdout != null && !stdout.isBlank()) return stdout;
        return compilationOutput;
    }

    @JsonProperty("errorMessage")
    public String getErrorMessage() {
        if (!compiled) return compilationOutput;
        if (stderr != null && !stderr.isBlank()) return stderr;
        return null;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class TestCaseResult {
        private String input;
        private String expectedOutput;
        private String actualOutput;
        private boolean passed;
        private String error;
        private String verdict;
        private long executionTimeMs;
        private long memoryUsedBytes;
        private boolean hidden;
    }
}
