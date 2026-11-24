package com.talentprep.interview.coding;

import com.talentprep.interview.coding.client.OnlineCompilerClient;
import com.talentprep.interview.coding.client.dto.*;
import com.talentprep.interview.coding.dto.CodeRunRequest;
import com.talentprep.interview.coding.dto.CodeRunResult;
import com.talentprep.interview.coding.service.OnlineCompilerCodeExecutionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OnlineCompilerCodeExecutionServiceTest {

    @Mock
    private OnlineCompilerClient client;

    @InjectMocks
    private OnlineCompilerCodeExecutionService executionService;

    @Test
    @DisplayName("Compilation error verdict is correctly parsed and sets compiled=false")
    void testCompilationErrorHandling() {
        OnlineCompilerTestResponse mockResponse = OnlineCompilerTestResponse.builder()
                .verdict("compile_error")
                .compile_error("Solution.java:5: error: ';' expected\n int x = 10\n ^")
                .passed(0)
                .total(2)
                .score(0.0)
                .build();

        when(client.runTests(any())).thenReturn(mockResponse);

        CodeRunRequest request = CodeRunRequest.builder()
                .language("java")
                .code("class Solution { int x = 10 }")
                .testCases(List.of(
                        Map.of("input", "1", "expectedOutput", "1")
                ))
                .build();

        CodeRunResult result = executionService.execute(request);

        assertNotNull(result);
        assertFalse(result.isCompiled());
        assertEquals("COMPILE_ERROR", result.getVerdict());
        assertEquals(0, result.getPassedCount());
        assertTrue(result.getCompilationOutput().contains("error: ';' expected"));
    }

    @Test
    @DisplayName("Accepted test response maps verdict, score and test cases correctly")
    void testSuccessfulExecution() {
        OnlineCompilerTestResponse mockResponse = OnlineCompilerTestResponse.builder()
                .verdict("accepted")
                .passed(2)
                .total(2)
                .score(100.0)
                .compile_error(null)
                .tests(List.of(
                        OnlineCompilerTestResponse.TestCaseResultItem.builder()
                                .verdict("accepted")
                                .output("0 1\n")
                                .time("0.02")
                                .memory("8000")
                                .hidden(false)
                                .build(),
                        OnlineCompilerTestResponse.TestCaseResultItem.builder()
                                .verdict("accepted")
                                .output("1 2\n")
                                .time("0.02")
                                .memory("8000")
                                .hidden(false)
                                .build()
                ))
                .build();

        when(client.runTests(any())).thenReturn(mockResponse);

        CodeRunRequest request = CodeRunRequest.builder()
                .language("java")
                .code("public class Main { ... }")
                .testCases(List.of(
                        Map.of("input", "4\n2 7 11 15\n9", "expectedOutput", "0 1"),
                        Map.of("input", "3\n3 2 4\n6", "expectedOutput", "1 2")
                ))
                .build();

        CodeRunResult result = executionService.execute(request);

        assertNotNull(result);
        assertTrue(result.isCompiled());
        assertTrue(result.isPassedAllTestCases());
        assertEquals(2, result.getPassedCount());
        assertEquals(2, result.getTotalCount());
        assertEquals(100.0, result.getScore());
        assertEquals("ACCEPTED", result.getVerdict());
        assertEquals(2, result.getTestCaseResults().size());
        assertTrue(result.getTestCaseResults().get(0).isPassed());
    }

    @Test
    @DisplayName("Wrong answer verdict maps correctly with partial score")
    void testWrongAnswerVerdict() {
        OnlineCompilerTestResponse mockResponse = OnlineCompilerTestResponse.builder()
                .verdict("wrong_answer")
                .passed(1)
                .total(2)
                .score(50.0)
                .tests(List.of(
                        OnlineCompilerTestResponse.TestCaseResultItem.builder()
                                .verdict("accepted")
                                .output("0 1\n")
                                .hidden(false)
                                .build(),
                        OnlineCompilerTestResponse.TestCaseResultItem.builder()
                                .verdict("wrong_answer")
                                .output("0 0\n")
                                .hidden(false)
                                .build()
                ))
                .build();

        when(client.runTests(any())).thenReturn(mockResponse);

        CodeRunRequest request = CodeRunRequest.builder()
                .language("java")
                .code("public class Main { ... }")
                .testCases(List.of(
                        Map.of("input", "4\n2 7 11 15\n9", "expectedOutput", "0 1"),
                        Map.of("input", "3\n3 2 4\n6", "expectedOutput", "1 2")
                ))
                .build();

        CodeRunResult result = executionService.execute(request);

        assertNotNull(result);
        assertTrue(result.isCompiled());
        assertFalse(result.isPassedAllTestCases());
        assertEquals(1, result.getPassedCount());
        assertEquals(2, result.getTotalCount());
        assertEquals(50.0, result.getScore());
        assertEquals("WRONG_ANSWER", result.getVerdict());
    }

    @Test
    @DisplayName("Judging submission keeps hidden test cases confidential")
    void testHiddenTestConfidentiality() {
        OnlineCompilerTestResponse mockResponse = OnlineCompilerTestResponse.builder()
                .verdict("accepted")
                .passed(2)
                .total(2)
                .score(100.0)
                .tests(List.of(
                        OnlineCompilerTestResponse.TestCaseResultItem.builder()
                                .verdict("accepted")
                                .output("49\n")
                                .hidden(false)
                                .build(),
                        OnlineCompilerTestResponse.TestCaseResultItem.builder()
                                .verdict("accepted")
                                .hidden(true) // Hidden test case
                                .build()
                ))
                .build();

        when(client.runTests(any())).thenReturn(mockResponse);

        List<Map<String, Object>> visible = List.of(
                Map.of("input", "9\n1 8 6 2 5 4 8 3 7", "expectedOutput", "49")
        );
        List<Map<String, Object>> hidden = List.of(
                Map.of("input", "SECRET_INPUT_123", "expectedOutput", "SECRET_OUTPUT_456")
        );

        CodeRunResult result = executionService.judgeSubmission("java", "class Solution {}", visible, hidden);

        assertNotNull(result);
        assertEquals(2, result.getTestCaseResults().size());

        // First test is visible
        assertFalse(result.getTestCaseResults().get(0).isHidden());
        assertEquals("9\n1 8 6 2 5 4 8 3 7", result.getTestCaseResults().get(0).getInput());

        // Second test is hidden: confidential input and output are masked
        assertTrue(result.getTestCaseResults().get(1).isHidden());
        assertEquals("[Hidden Test Case]", result.getTestCaseResults().get(1).getInput());
        assertEquals("[Hidden Test Case]", result.getTestCaseResults().get(1).getExpectedOutput());
        assertNotEquals("SECRET_INPUT_123", result.getTestCaseResults().get(1).getInput());
    }
}
