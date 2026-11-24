package com.talentprep.interview.coding;

import com.talentprep.interview.coding.dto.CodeRunRequest;
import com.talentprep.interview.coding.dto.CodeRunResult;

import java.util.List;
import java.util.Map;

public interface CodeExecutionService {

    /**
     * Executes code against visible sample test cases (Run Code).
     */
    CodeRunResult execute(CodeRunRequest request);

    /**
     * Judges code against all test cases, including hidden test cases (Submit Code).
     */
    CodeRunResult judgeSubmission(String language, String code, List<Map<String, Object>> visibleTests, List<Map<String, Object>> hiddenTests);
}
