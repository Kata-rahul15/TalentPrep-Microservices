package com.Application.AuthService.Service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;

@Service
@RequiredArgsConstructor
public class OtpService {

    private final RedisService redisService;

    private final static String OTP_PREFIX = "otp:";
    private final static Duration OTP_EXPIRY = Duration.ofMinutes(5);

    public void saveOtp(String email,String otp){
       String key= OTP_PREFIX + email;
        redisService.save(key,otp,OTP_EXPIRY);
    }
    public boolean verifyOtp(String email ,String enteredOtp){
        String key= OTP_PREFIX + email;
        String storedOtp = redisService.get(key);

        if(storedOtp == null){
            return false;
        }
        if(!storedOtp.equals(enteredOtp)){
            return false;
        }
        redisService.delete(key);
        return true;
    }

    public void deleteOtp(String email){
        redisService.delete(OTP_PREFIX + email);
    }
    public boolean otpExists(String email){
       return  redisService.exists(OTP_PREFIX + email);
    }
}
