package com.talentprep.interview.coding;

import com.talentprep.interview.coding.client.OnlineCompilerClient;
import com.talentprep.interview.coding.client.dto.*;
import com.talentprep.interview.coding.config.CodeExecutionProperties;
import com.talentprep.interview.coding.exception.CodeExecutionException;
import com.talentprep.interview.coding.service.OnlineCompilerCodeExecutionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.Duration;

import static org.junit.jupiter.api.Assertions.*;

class OnlineCompilerClientTest {

    private CodeExecutionProperties properties;
    private OnlineCompilerClient client;

    @BeforeEach
    void setUp() {
        properties = new CodeExecutionProperties();
        properties.setBaseUrl("https://api.onlinecompiler.io");
        properties.setApiKey("test-dummy-key");
        properties.setConnectTimeout(Duration.ofSeconds(2));
        properties.setResponseTimeout(Duration.ofSeconds(5));
        properties.setMaxCodeSizeBytes(65536);

        WebClient webClient = WebClient.builder()
                .baseUrl(properties.getBaseUrl())
                .build();

        client = new OnlineCompilerClient(webClient, properties);
    }

    @Test
    @DisplayName("Empty source code throws 400 CodeExecutionException")
    void testEmptyCodeValidation() {
        OnlineCompilerRunRequest req = OnlineCompilerRunRequest.builder()
                .compiler("openjdk-25")
                .code("")
                .input("")
                .build();

        CodeExecutionException ex = assertThrows(CodeExecutionException.class, () -> client.executeSync(req));
        assertEquals(400, ex.getStatusCode());
        assertTrue(ex.getMessage().contains("empty"));
    }

    @Test
    @DisplayName("Source code exceeding 64KB throws 400 CodeExecutionException")
    void testOversizedCodeValidation() {
        String hugeCode = "a".repeat(70000);
        OnlineCompilerRunRequest req = OnlineCompilerRunRequest.builder()
                .compiler("openjdk-25")
                .code(hugeCode)
                .input("")
                .build();

        CodeExecutionException ex = assertThrows(CodeExecutionException.class, () -> client.executeSync(req));
        assertEquals(400, ex.getStatusCode());
        assertTrue(ex.getMessage().contains("exceeds maximum permitted size"));
    }

    @Test
    @DisplayName("Missing API key throws 401 CodeExecutionException")
    void testMissingApiKeyValidation() {
        properties.setApiKey("");
        OnlineCompilerRunRequest req = OnlineCompilerRunRequest.builder()
                .compiler("openjdk-25")
                .code("System.out.println(\"Hi\");")
                .input("")
                .build();

        CodeExecutionException ex = assertThrows(CodeExecutionException.class, () -> client.executeSync(req));
        assertEquals(401, ex.getStatusCode());
        assertTrue(ex.getMessage().contains("CODE_EXECUTION_API_KEY is not configured"));
    }

    @Test
    @DisplayName("Language mapping resolves compilers accurately")
    void testLanguageResolution() {
        assertEquals("openjdk-25", OnlineCompilerCodeExecutionService.resolveCompiler("java"));
        assertEquals("openjdk-25", OnlineCompilerCodeExecutionService.resolveCompiler("JAVA"));
        assertEquals("openjdk-25", OnlineCompilerCodeExecutionService.resolveCompiler("java17"));
        assertEquals("python-3.14", OnlineCompilerCodeExecutionService.resolveCompiler("python"));
        assertEquals("python-3.14", OnlineCompilerCodeExecutionService.resolveCompiler("python3"));
        assertEquals("g++-15", OnlineCompilerCodeExecutionService.resolveCompiler("cpp"));
        assertEquals("g++-15", OnlineCompilerCodeExecutionService.resolveCompiler("c++"));
        assertEquals("nodejs-24", OnlineCompilerCodeExecutionService.resolveCompiler("javascript"));
        assertEquals("nodejs-24", OnlineCompilerCodeExecutionService.resolveCompiler("js"));
        assertEquals("typescript-deno", OnlineCompilerCodeExecutionService.resolveCompiler("typescript"));
    }

    @Test
    @DisplayName("Unsupported programming language throws 400 CodeExecutionException")
    void testUnsupportedLanguage() {
        assertThrows(CodeExecutionException.class, () ->
                OnlineCompilerCodeExecutionService.resolveCompiler("brainfuck"));
    }
}
