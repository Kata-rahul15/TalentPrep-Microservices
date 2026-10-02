package com.example.api_gateway.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
public class HealthController {

    private final ServiceHealthService serviceHealthService;

    public HealthController(ServiceHealthService serviceHealthService) {
        this.serviceHealthService = serviceHealthService;
    }

    @GetMapping("/health")
    public String HealthCheck(){
        return "Service is Up and Running";
    }
    @GetMapping("/health/ready")
    public Mono<Map<String, Object>> readiness() {
        return serviceHealthService.checkAllServices();
    }
}
