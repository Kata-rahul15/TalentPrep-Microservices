package com.example.api_gateway.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Map;
@Service
public class ServiceHealthService {

    private final WebClient.Builder webClientBuilder;

    @Value("${services.auth.base-url}")
    private String authUrl;

    @Value("${services.resume.base-url}")
    private String resumeUrl;

    public ServiceHealthService(WebClient.Builder webClientBuilder) {
        this.webClientBuilder = webClientBuilder;
    }

    private Mono<Boolean> checkService(String url, String path) {

        return webClientBuilder.build()
                .get()
                .uri(url + path)
                .retrieve()
                .toBodilessEntity()
                .map(response -> response.getStatusCode().is2xxSuccessful())
                .timeout(Duration.ofSeconds(30))
                .onErrorReturn(false);
    }

    public Mono<Map<String, Object>> checkAllServices() {

        Mono<Boolean> authHealth =
                checkService(authUrl, "/api/auth/health");

        Mono<Boolean> resumeHealth =
                checkService(resumeUrl, "/health");

        return Mono.zip(authHealth, resumeHealth)
                .map(tuple -> {

                    boolean authReady = tuple.getT1();
                    boolean resumeReady = tuple.getT2();

                    boolean ready = authReady && resumeReady;

                    return Map.<String, Object>of(
                            "status", ready ? "READY" : "STARTING",
                            "authService", authReady ? "UP" : "STARTING",
                            "resumeService", resumeReady ? "UP" : "STARTING",
                            "ready", ready
                    );
                });
    }
}