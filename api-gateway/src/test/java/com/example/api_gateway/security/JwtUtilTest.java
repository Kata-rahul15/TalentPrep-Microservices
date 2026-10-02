package com.example.api_gateway.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

class JwtUtilTest {

    private ReactiveStringRedisTemplate redisTemplate;
    private JwtUtil jwtUtil;
    private final String secretKey = "thisismyecretkeyforemailservice12232321314y2urwbwedjdsfdfdsgbvcbcvnnpoiujyhgbvcdsxszdfdwd";

    @BeforeEach
    void setUp() {
        redisTemplate = Mockito.mock(ReactiveStringRedisTemplate.class);
        jwtUtil = new JwtUtil(secretKey, redisTemplate);
    }

    @Test
    void testIsBlacklistedReturnsTrueWhenKeyExistsInRedis() {
        String token = "sample.blacklisted.jwt";
        when(redisTemplate.hasKey("blacklist :" + token)).thenReturn(Mono.just(true));

        StepVerifier.create(jwtUtil.isBlacklisted(token))
                .expectNext(true)
                .verifyComplete();
    }

    @Test
    void testIsBlacklistedReturnsFalseWhenKeyDoesNotExist() {
        String token = "sample.valid.jwt";
        when(redisTemplate.hasKey("blacklist :" + token)).thenReturn(Mono.just(false));

        StepVerifier.create(jwtUtil.isBlacklisted(token))
                .expectNext(false)
                .verifyComplete();
    }

    @Test
    void testValidateTokenRejectsBlacklistedToken() {
        String token = "sample.blacklisted.jwt";
        when(redisTemplate.hasKey("blacklist :" + token)).thenReturn(Mono.just(true));

        StepVerifier.create(jwtUtil.validateToken(token))
                .expectErrorMatches(ex -> ex instanceof IllegalArgumentException && ex.getMessage().contains("revoked"))
                .verify();
    }
}
