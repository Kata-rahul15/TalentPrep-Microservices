package com.talentprep.interview.coding;

import com.talentprep.interview.coding.client.OnlineCompilerClient;
import com.talentprep.interview.coding.client.dto.*;
import com.talentprep.interview.coding.config.CodeExecutionProperties;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class OnlineCompilerLiveIntegrationTest {

    private OnlineCompilerClient client;
    private String apiKey;

    @BeforeEach
    void setUp() {
        apiKey = System.getenv("CODE_EXECUTION_API_KEY");
        // Skip if not provided in environment
        Assumptions.assumeTrue(apiKey != null && !apiKey.isBlank(), "CODE_EXECUTION_API_KEY is not set in environment; skipping live network test");

        CodeExecutionProperties props = new CodeExecutionProperties();
        props.setBaseUrl("https://api.onlinecompiler.io");
        props.setApiKey(apiKey);
        props.setConnectTimeout(Duration.ofSeconds(10));
        props.setResponseTimeout(Duration.ofSeconds(35));

        WebClient webClient = WebClient.builder()
                .baseUrl(props.getBaseUrl())
                .build();

        client = new OnlineCompilerClient(webClient, props);
    }

    @Test
    @DisplayName("Live API test: Java code compilation and multi-test execution")
    void testLiveJavaRunTests() {
        OnlineCompilerTestRequest request = OnlineCompilerTestRequest.builder()
                .compiler("openjdk-25")
                .code("""
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        if (sc.hasNextInt()) {
            int a = sc.nextInt();
            int b = sc.nextInt();
            System.out.println(a + b);
        }
    }
}
""")
                .tests(List.of(
                        OnlineCompilerTestRequest.TestCaseItem.builder()
                                .input("3 4\n")
                                .expected_output("7\n")
                                .weight(1)
                                .hidden(false)
                                .build(),
                        OnlineCompilerTestRequest.TestCaseItem.builder()
                                .input("10 20\n")
                                .expected_output("30\n")
                                .weight(1)
                                .hidden(true)
                                .build()
                ))
                .time_limit(5)
                .build();

        OnlineCompilerTestResponse response = client.runTests(request);
        assertNotNull(response);
        assertEquals("accepted", response.getVerdict());
        assertEquals(2, response.getPassed());
        assertEquals(2, response.getTotal());
        assertNull(response.getCompile_error());
    }

    @Test
    @DisplayName("Live API test: Python execution")
    void testLivePythonRunTests() {
        OnlineCompilerTestRequest request = OnlineCompilerTestRequest.builder()
                .compiler("python-3.14")
                .code("""
import sys
tokens = sys.stdin.read().split()
if tokens:
    a, b = int(tokens[0]), int(tokens[1])
    print(a * b)
""")
                .tests(List.of(
                        OnlineCompilerTestRequest.TestCaseItem.builder()
                                .input("6 7\n")
                                .expected_output("42\n")
                                .weight(1)
                                .hidden(false)
                                .build()
                ))
                .time_limit(5)
                .build();

        OnlineCompilerTestResponse response = client.runTests(request);
        assertNotNull(response);
        assertEquals("accepted", response.getVerdict());
        assertEquals(1, response.getPassed());
    }
}
