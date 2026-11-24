package com.talentprep.interview.coding.service;

import com.talentprep.interview.coding.CodeExecutionService;
import com.talentprep.interview.coding.client.OnlineCompilerClient;
import com.talentprep.interview.coding.client.dto.*;
import com.talentprep.interview.coding.dto.CodeRunRequest;
import com.talentprep.interview.coding.dto.CodeRunResult;
import com.talentprep.interview.coding.exception.CodeExecutionException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import java.util.*;

@Slf4j
@Service
@Primary
@RequiredArgsConstructor
public class OnlineCompilerCodeExecutionService implements CodeExecutionService {

    private final OnlineCompilerClient onlineCompilerClient;

    public static String resolveCompiler(String language) {
        if (language == null) return "openjdk-25";
        String lower = language.trim().toLowerCase();
        return switch (lower) {
            case "java", "java17", "java21", "java25", "openjdk", "openjdk-25" -> "openjdk-25";
            case "python", "python3", "python-3.14", "py" -> "python-3.14";
            case "cpp", "c++", "g++", "g++-15" -> "g++-15";
            case "javascript", "js", "node", "nodejs", "nodejs-24" -> "nodejs-24";
            case "typescript", "ts", "typescript-deno" -> "typescript-deno";
            case "c", "gcc", "gcc-15" -> "gcc-15";
            default -> throw new CodeExecutionException(400, "Unsupported programming language: " + language + ". Supported languages: Java, Python, C++, JavaScript, TypeScript.");
        };
    }

    private String sanitizeSourceCode(String compiler, String code) {
        if (code == null) return "";
        // In Java, having "public class Solution" in a file that the runner names Main.java causes javac error:
        // "class Solution is public, should be declared in a file named Solution.java".
        // Changing "public class Solution" to "class Solution" solves this cleanly.
        if ("openjdk-25".equals(compiler)) {
            if (code.contains("public class Solution") && !code.contains("public class Main")) {
                code = code.replace("public class Solution", "class Solution");
            }
        }
        return code;
    }

    @Override
    public CodeRunResult execute(CodeRunRequest request) {
        if (request == null || request.getCode() == null || request.getCode().isBlank()) {
            return CodeRunResult.builder()
                    .compiled(false)
                    .compilationOutput("Source code is empty.")
                    .passedAllTestCases(false)
                    .passedCount(0)
                    .totalCount(request != null && request.getTestCases() != null ? request.getTestCases().size() : 0)
                    .verdict("EMPTY_CODE")
                    .build();
        }

        String compiler = resolveCompiler(request.getLanguage());
        String code = sanitizeSourceCode(compiler, request.getCode());
        List<Map<String, Object>> testCases = request.getTestCases() != null ? request.getTestCases() : List.of();

        if (testCases.isEmpty()) {
            // Single synchronous run
            return executeSingleRun(compiler, code, request.getCustomInput());
        }

        // Multi-test run via /api/run-tests/
        List<OnlineCompilerTestRequest.TestCaseItem> items = new ArrayList<>();
        for (Map<String, Object> tc : testCases) {
            String input = String.valueOf(tc.getOrDefault("input", ""));
            String expected = String.valueOf(tc.getOrDefault("expectedOutput", tc.getOrDefault("expected_output", "")));
            items.add(OnlineCompilerTestRequest.TestCaseItem.builder()
                    .input(input)
                    .expected_output(expected)
                    .weight(1)
                    .hidden(false)
                    .build());
        }

        OnlineCompilerTestRequest testReq = OnlineCompilerTestRequest.builder()
                .compiler(compiler)
                .code(code)
                .tests(items)
                .time_limit(5)
                .build();

        OnlineCompilerTestResponse response = onlineCompilerClient.runTests(testReq);
        return mapTestResponseToResult(response, items);
    }

    @Override
    public CodeRunResult judgeSubmission(String language, String code, List<Map<String, Object>> visibleTests, List<Map<String, Object>> hiddenTests) {
        if (code == null || code.isBlank()) {
            return CodeRunResult.builder()
                    .compiled(false)
                    .compilationOutput("Submitted code is empty.")
                    .passedAllTestCases(false)
                    .passedCount(0)
                    .totalCount((visibleTests != null ? visibleTests.size() : 0) + (hiddenTests != null ? hiddenTests.size() : 0))
                    .verdict("EMPTY_CODE")
                    .build();
        }

        String compiler = resolveCompiler(language);
        String sanitizedCode = sanitizeSourceCode(compiler, code);

        List<OnlineCompilerTestRequest.TestCaseItem> items = new ArrayList<>();

        if (visibleTests != null) {
            for (Map<String, Object> tc : visibleTests) {
                items.add(OnlineCompilerTestRequest.TestCaseItem.builder()
                        .input(String.valueOf(tc.getOrDefault("input", "")))
                        .expected_output(String.valueOf(tc.getOrDefault("expectedOutput", tc.getOrDefault("expected_output", ""))))
                        .weight(1)
                        .hidden(false)
                        .build());
            }
        }

        if (hiddenTests != null) {
            for (Map<String, Object> tc : hiddenTests) {
                int weight = 1;
                if (tc.get("weight") instanceof Number n) {
                    weight = n.intValue();
                }
                items.add(OnlineCompilerTestRequest.TestCaseItem.builder()
                        .input(String.valueOf(tc.getOrDefault("input", "")))
                        .expected_output(String.valueOf(tc.getOrDefault("expectedOutput", tc.getOrDefault("expected_output", ""))))
                        .weight(weight)
                        .hidden(true)
                        .build());
            }
        }

        OnlineCompilerTestRequest testReq = OnlineCompilerTestRequest.builder()
                .compiler(compiler)
                .code(sanitizedCode)
                .tests(items)
                .time_limit(5)
                .build();

        OnlineCompilerTestResponse response = onlineCompilerClient.runTests(testReq);
        return mapTestResponseToResult(response, items);
    }

    private CodeRunResult executeSingleRun(String compiler, String code, String input) {
        OnlineCompilerRunRequest runReq = OnlineCompilerRunRequest.builder()
                .compiler(compiler)
                .code(code)
                .input(input != null ? input : "")
                .build();

        OnlineCompilerRunResponse res = onlineCompilerClient.executeSync(runReq);
        boolean success = res.getExit_code() != null && res.getExit_code() == 0;
        long timeMs = parseTimeToMs(res.getTime());
        long memoryBytes = parseMemoryToBytes(res.getMemory());

        String error = res.getError();
        boolean compiled = error == null || (!error.contains("error:") && !error.contains("javac"));

        return CodeRunResult.builder()
                .compiled(compiled)
                .compilationOutput(error)
                .passedAllTestCases(success)
                .passedCount(success ? 1 : 0)
                .totalCount(1)
                .score(success ? 100.0 : 0.0)
                .executionTimeMs(timeMs)
                .memoryUsedBytes(memoryBytes)
                .stdout(res.getOutput())
                .stderr(res.getError())
                .verdict(success ? "ACCEPTED" : "RUNTIME_ERROR")
                .testCaseResults(List.of(
                        CodeRunResult.TestCaseResult.builder()
                                .input(input)
                                .expectedOutput("")
                                .actualOutput(res.getOutput())
                                .passed(success)
                                .error(res.getError())
                                .verdict(success ? "ACCEPTED" : "RUNTIME_ERROR")
                                .executionTimeMs(timeMs)
                                .memoryUsedBytes(memoryBytes)
                                .hidden(false)
                                .build()
                ))
                .build();
    }

    private CodeRunResult mapTestResponseToResult(OnlineCompilerTestResponse res, List<OnlineCompilerTestRequest.TestCaseItem> requestedCases) {
        if (res == null) {
            return CodeRunResult.builder()
                    .compiled(false)
                    .compilationOutput("Empty response received from execution engine.")
                    .verdict("ERROR")
                    .build();
        }

        boolean hasCompileError = res.getCompile_error() != null && !res.getCompile_error().isBlank()
                || "compile_error".equalsIgnoreCase(res.getVerdict());

        if (hasCompileError) {
            String compileOutput = res.getCompile_error() != null ? res.getCompile_error() : "Compilation failed.";
            return CodeRunResult.builder()
                    .compiled(false)
                    .compilationOutput(compileOutput)
                    .stderr(compileOutput)
                    .passedAllTestCases(false)
                    .passedCount(0)
                    .totalCount(res.getTotal() != null ? res.getTotal() : requestedCases.size())
                    .score(0.0)
                    .verdict("COMPILE_ERROR")
                    .testCaseResults(List.of())
                    .build();
        }

        List<CodeRunResult.TestCaseResult> tcResults = new ArrayList<>();
        long totalTimeMs = 0;
        long peakMemoryBytes = 0;
        StringBuilder allStdout = new StringBuilder();
        StringBuilder allStderr = new StringBuilder();

        List<OnlineCompilerTestResponse.TestCaseResultItem> responseTests = res.getTests() != null ? res.getTests() : List.of();

        for (int i = 0; i < requestedCases.size(); i++) {
            OnlineCompilerTestRequest.TestCaseItem reqCase = requestedCases.get(i);
            OnlineCompilerTestResponse.TestCaseResultItem respCase = i < responseTests.size() ? responseTests.get(i) : null;

            boolean isHidden = Boolean.TRUE.equals(reqCase.getHidden());
            String verdict = respCase != null && respCase.getVerdict() != null ? respCase.getVerdict().toUpperCase() : "UNKNOWN";
            boolean passed = "ACCEPTED".equalsIgnoreCase(verdict);

            long caseTimeMs = respCase != null ? parseTimeToMs(respCase.getTime()) : 0;
            long caseMemoryBytes = respCase != null ? parseMemoryToBytes(respCase.getMemory()) : 0;

            totalTimeMs += caseTimeMs;
            if (caseMemoryBytes > peakMemoryBytes) {
                peakMemoryBytes = caseMemoryBytes;
            }

            if (!isHidden && respCase != null) {
                if (respCase.getOutput() != null) allStdout.append(respCase.getOutput()).append("\n");
                if (respCase.getError() != null && !respCase.getError().isBlank()) allStderr.append(respCase.getError()).append("\n");
            }

            tcResults.add(CodeRunResult.TestCaseResult.builder()
                    .input(isHidden ? "[Hidden Test Case]" : reqCase.getInput())
                    .expectedOutput(isHidden ? "[Hidden Test Case]" : reqCase.getExpected_output())
                    .actualOutput(isHidden ? (passed ? "Passed" : "Failed") : (respCase != null ? respCase.getOutput() : ""))
                    .passed(passed)
                    .error(isHidden ? null : (respCase != null ? respCase.getError() : null))
                    .verdict(verdict)
                    .executionTimeMs(caseTimeMs)
                    .memoryUsedBytes(caseMemoryBytes)
                    .hidden(isHidden)
                    .build());
        }

        int passedCount = res.getPassed() != null ? res.getPassed() : 0;
        int totalCount = res.getTotal() != null ? res.getTotal() : requestedCases.size();
        boolean passedAll = "accepted".equalsIgnoreCase(res.getVerdict()) || (totalCount > 0 && passedCount == totalCount);
        double score = res.getScore() != null ? res.getScore() : (totalCount > 0 ? (double) passedCount / totalCount * 100 : 0.0);

        String normalizedVerdict = res.getVerdict() != null ? res.getVerdict().toUpperCase() : (passedAll ? "ACCEPTED" : "WRONG_ANSWER");

        return CodeRunResult.builder()
                .compiled(true)
                .compilationOutput("Compilation successful.")
                .passedAllTestCases(passedAll)
                .passedCount(passedCount)
                .totalCount(totalCount)
                .score(score)
                .executionTimeMs(totalTimeMs)
                .memoryUsedBytes(peakMemoryBytes)
                .verdict(normalizedVerdict)
                .stdout(allStdout.toString().trim())
                .stderr(allStderr.toString().trim())
                .testCaseResults(tcResults)
                .build();
    }

    private long parseTimeToMs(String timeStr) {
        if (timeStr == null || timeStr.isBlank()) return 0;
        try {
            double seconds = Double.parseDouble(timeStr);
            return (long) (seconds * 1000);
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    private long parseMemoryToBytes(String memStr) {
        if (memStr == null || memStr.isBlank()) return 0;
        try {
            // Some responses return KB or bytes
            long val = Long.parseLong(memStr);
            if (val < 100000) {
                // If small number, likely in KB
                return val * 1024;
            }
            return val;
        } catch (NumberFormatException e) {
            return 0;
        }
    }
}
