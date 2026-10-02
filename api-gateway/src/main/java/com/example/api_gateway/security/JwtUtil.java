package com.example.api_gateway.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.NimbusReactiveJwtDecoder;
import org.springframework.security.oauth2.jwt.ReactiveJwtDecoder;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Mono;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

@Component
public class JwtUtil {

    private static final Logger log = LoggerFactory.getLogger(JwtUtil.class);
    private static final String BLACKLIST_PREFIX = "blacklist :";

    private final String secretKey;
    private final ReactiveJwtDecoder jwtDecoder;
    private final ReactiveStringRedisTemplate redisTemplate;

    public JwtUtil(@Value("${jwt.secret.key:}") String secretKey,
                   @Autowired(required = false) ReactiveStringRedisTemplate redisTemplate) {
        this.secretKey = secretKey;
        this.redisTemplate = redisTemplate;
        if (secretKey != null && !secretKey.isBlank()) {
            SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            this.jwtDecoder = NimbusReactiveJwtDecoder.withSecretKey(keySpec)
                    .macAlgorithm(MacAlgorithm.HS256)
                    .build();
        } else {
            this.jwtDecoder = null;
            log.warn("JWT secret key (jwt.secret.key / JWT_SECRET_KEY) is not configured.");
        }
    }

    public Mono<Jwt> validateToken(String token) {
        if (jwtDecoder == null) {
            log.error("JWT validation attempted, but JWT secret key is not configured.");
            return Mono.error(new IllegalStateException("JWT secret key is not configured"));
        }
        return isBlacklisted(token)
                .flatMap(blacklisted -> {
                    if (Boolean.TRUE.equals(blacklisted)) {
                        log.debug("JWT validation failed: Token is blacklisted in Redis.");
                        return Mono.error(new IllegalArgumentException("Token has been revoked"));
                    }
                    return jwtDecoder.decode(token);
                });
    }

    public Mono<Boolean> isBlacklisted(String token) {
        if (redisTemplate == null) {
            return Mono.just(false);
        }
        return redisTemplate.hasKey(BLACKLIST_PREFIX + token)
                .onErrorResume(ex -> {
                    log.error("Error checking Redis token blacklist: {}", ex.getMessage());
                    return Mono.just(false);
                });
    }
}
