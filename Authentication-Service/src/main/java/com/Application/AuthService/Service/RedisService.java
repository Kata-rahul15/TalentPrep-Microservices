package com.Application.AuthService.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class RedisService {

    private final StringRedisTemplate redisTemplate;

    public void save(String key, String value, Duration ttl){
        redisTemplate.opsForValue().set(key,value,ttl);
    }
    public void save(String key,String value){
        redisTemplate.opsForValue().set(key,value);
    }
    public String get(String key){
        return redisTemplate.opsForValue().get(key);
    }
    public boolean exists(String key){
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
    public boolean delete(String key){
        return Boolean.TRUE.equals(redisTemplate.delete(key));
    }
    public Long increment(String key){
        return redisTemplate.opsForValue().increment(key);
    }
    public void expire(String key,Duration ttl){
        redisTemplate.expire(key,ttl);
    }
    public Long getExpire(String key){
        return redisTemplate.getExpire(key);
    }

}
