package com.talentprep.interview.coding;

import com.talentprep.interview.coding.dto.CodeRunRequest;
import com.talentprep.interview.coding.dto.CodeRunResult;
import org.springframework.stereotype.Service;

/**
 * Safe placeholder until a real isolated execution provider (for example, a locked-down
 * container runner) is configured. Never reports heuristic string checks as execution.
 */
@Service
public class IsolatedCodeExecutionService implements CodeExecutionService {

    public IsolatedCodeExecutionService() { }

    @Override
    public CodeRunResult execute(CodeRunRequest request) {
        if (request == null || request.getCode() == null || request.getCode().isBlank()) {
            return CodeRunResult.builder()
                    .compiled(false)
                    .compilationOutput("Empty code submission.")
                    .passedAllTestCases(false)
                    .passedCount(0)
                    .totalCount(request != null && request.getTestCases() != null ? request.getTestCases().size() : 0)
                    .build();
        }

        return CodeRunResult.builder()
                .compiled(false)
                .compilationOutput("Code execution is currently unavailable. A real isolated sandbox runner has not been configured; the service will not simulate compilation or test results.")
                .passedAllTestCases(false)
                .passedCount(0)
                .totalCount(request.getTestCases() != null ? request.getTestCases().size() : 0)
                .executionTimeMs(0)
                .memoryUsedBytes(0L)
                .testCaseResults(java.util.List.of())
                .build();
    }

    @Override
    public CodeRunResult judgeSubmission(String language, String code, java.util.List<java.util.Map<String, Object>> visibleTests, java.util.List<java.util.Map<String, Object>> hiddenTests) {
        int total = (visibleTests != null ? visibleTests.size() : 0) + (hiddenTests != null ? hiddenTests.size() : 0);
        return CodeRunResult.builder()
                .compiled(false)
                .compilationOutput("Execution sandbox is currently offline.")
                .passedAllTestCases(false)
                .passedCount(0)
                .totalCount(total)
                .verdict("OFFLINE")
                .executionTimeMs(0)
                .memoryUsedBytes(0L)
                .testCaseResults(java.util.List.of())
                .build();
    }
}
