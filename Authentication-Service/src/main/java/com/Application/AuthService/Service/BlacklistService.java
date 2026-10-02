package com.Application.AuthService.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class BlacklistService {

    private final RedisService redisService;

    private final static  String BLACKLIST_PREFIX = "blacklist :";

    public void blacklistToken(String token, Duration remainingTime){
        redisService.save(BLACKLIST_PREFIX + token,"true",remainingTime);
    }
    public boolean isBlacklisted(String token){
        return redisService.exists(BLACKLIST_PREFIX + token);
    }
}
