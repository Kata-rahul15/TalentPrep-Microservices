package com.talentprep.interview.coding.client;

import com.talentprep.interview.coding.client.dto.*;
import com.talentprep.interview.coding.config.CodeExecutionProperties;
import com.talentprep.interview.coding.exception.CodeExecutionException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatusCode;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;

@Slf4j
@Component
public class OnlineCompilerClient {

    private final WebClient webClient;
    private final CodeExecutionProperties properties;

    public OnlineCompilerClient(
            @Qualifier("onlineCompilerWebClient") WebClient webClient,
            CodeExecutionProperties properties) {
        this.webClient = webClient;
        this.properties = properties;
    }

    public String getEffectiveApiKey() {
        String key = properties.getApiKey();
        if (key == null || key.isBlank()) {
            key = System.getenv("CODE_EXECUTION_API_KEY");
        }
        return key != null ? key.trim() : "";
    }

    public boolean isConfigured() {
        return !getEffectiveApiKey().isEmpty();
    }

    /**
     * Executes single code file with standard input synchronously.
     * POST /api/run-code-sync/
     */
    public OnlineCompilerRunResponse executeSync(OnlineCompilerRunRequest request) {
        validateRequest(request.getCode());
        String apiKey = getEffectiveApiKey();
        if (apiKey.isEmpty()) {
            throw new CodeExecutionException(401, "CODE_EXECUTION_API_KEY is not configured. Please configure it in your backend environment.");
        }

        try {
            return webClient.post()
                    .uri("/api/run-code-sync/")
                    .header("Authorization", apiKey)
                    .bodyValue(request)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, clientResponse ->
                            clientResponse.bodyToMono(String.class)
                                    .defaultIfEmpty("")
                                    .flatMap(errorBody -> {
                                        int status = clientResponse.statusCode().value();
                                        log.warn("OnlineCompiler /run-code-sync HTTP {}", status);
                                        if (status == 401) {
                                            return Mono.error(new CodeExecutionException(401, "OnlineCompiler API authentication failed. Verify API key."));
                                        } else if (status == 429) {
                                            return Mono.error(new CodeExecutionException(429, "OnlineCompiler rate limit exceeded. Please wait a moment."));
                                        }
                                        return Mono.error(new CodeExecutionException(status, "OnlineCompiler execution failed: " + errorBody));
                                    })
                    )
                    .bodyToMono(OnlineCompilerRunResponse.class)
                    .timeout(properties.getResponseTimeout())
                    .block();
        } catch (WebClientResponseException e) {
            log.error("OnlineCompiler HTTP error: status={}", e.getStatusCode());
            throw new CodeExecutionException(e.getStatusCode().value(), "OnlineCompiler API error: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            if (e instanceof CodeExecutionException ce) throw ce;
            log.error("OnlineCompiler executeSync failed: {}", e.getMessage());
            throw new CodeExecutionException(503, "OnlineCompiler code execution failed: " + e.getMessage());
        }
    }

    /**
     * Evaluates source code against multiple test cases in a fresh isolated sandbox.
     * POST /api/run-tests/
     */
    public OnlineCompilerTestResponse runTests(OnlineCompilerTestRequest request) {
        validateRequest(request.getCode());
        String apiKey = getEffectiveApiKey();
        if (apiKey.isEmpty()) {
            throw new CodeExecutionException(401, "CODE_EXECUTION_API_KEY is not configured. Please configure it in your backend environment.");
        }

        try {
            return webClient.post()
                    .uri("/api/run-tests/")
                    .header("Authorization", apiKey)
                    .bodyValue(request)
                    .retrieve()
                    .onStatus(HttpStatusCode::isError, clientResponse ->
                            clientResponse.bodyToMono(String.class)
                                    .defaultIfEmpty("")
                                    .flatMap(errorBody -> {
                                        int status = clientResponse.statusCode().value();
                                        log.warn("OnlineCompiler /run-tests HTTP {}", status);
                                        if (status == 401) {
                                            return Mono.error(new CodeExecutionException(401, "OnlineCompiler API authentication failed. Verify API key."));
                                        } else if (status == 429) {
                                            return Mono.error(new CodeExecutionException(429, "OnlineCompiler rate limit exceeded. Please wait a moment."));
                                        }
                                        return Mono.error(new CodeExecutionException(status, "OnlineCompiler test judging failed: " + errorBody));
                                    })
                    )
                    .bodyToMono(OnlineCompilerTestResponse.class)
                    .timeout(properties.getResponseTimeout())
                    .block();
        } catch (WebClientResponseException e) {
            log.error("OnlineCompiler HTTP error: status={}", e.getStatusCode());
            throw new CodeExecutionException(e.getStatusCode().value(), "OnlineCompiler API error: " + e.getResponseBodyAsString());
        } catch (Exception e) {
            if (e instanceof CodeExecutionException ce) throw ce;
            log.error("OnlineCompiler runTests failed: {}", e.getMessage());
            throw new CodeExecutionException(503, "OnlineCompiler test evaluation failed: " + e.getMessage());
        }
    }

    private void validateRequest(String code) {
        if (code == null || code.isBlank()) {
            throw new CodeExecutionException(400, "Source code cannot be empty.");
        }
        if (code.getBytes(StandardCharsets.UTF_8).length > properties.getMaxCodeSizeBytes()) {
            throw new CodeExecutionException(400, "Source code exceeds maximum permitted size (" + (properties.getMaxCodeSizeBytes() / 1024) + " KB).");
        }
    }
}
