package com.example.api_gateway.controller;

import org.springframework.security.web.server.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
public class CsrfController {
    @GetMapping("/api/csrf")
    public Mono<Map<String, String>> csrf(ServerWebExchange exchange) {
        Object tokenAttribute = exchange.getAttributes().get(CsrfToken.class.getName());
        if (tokenAttribute instanceof Mono<?> tokenMono) {
            return tokenMono.cast(CsrfToken.class).map(token -> Map.of(
                    "headerName", token.getHeaderName(),
                    "parameterName", token.getParameterName(),
                    "token", token.getToken()));
        }
        return Mono.just(Map.of("message", "CSRF token will be issued by the security filter"));
    }
}
