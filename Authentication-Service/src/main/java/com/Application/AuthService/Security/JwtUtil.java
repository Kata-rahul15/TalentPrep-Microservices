package com.Application.AuthService.Security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.security.Key;
import java.time.Duration;
import java.util.Date;
import java.util.HashMap;
import java.util.UUID;

@Component
public class JwtUtil {


    @Value("${jwt_secret_key}")
    private String secretKey;

    private static final long  ACCESS_TOKEN_EXPIRATION = Duration.ofMinutes(15).toMillis();
    private static final long  REFRESH_TOKEN_EXPIRATION = Duration.ofDays(7).toMillis();



    public String generateAccessToken(String email,String role , String userId) {
        HashMap<String,Object>claims = new HashMap<>();
        claims.put("role",role);
        claims.put("userId", userId);
        return createToken(claims,email,ACCESS_TOKEN_EXPIRATION);
    }

    public String generateRefreshToken(String email){
        return createToken(new HashMap<>(),email,REFRESH_TOKEN_EXPIRATION);
    }

    public String createToken(HashMap<String,Object> claims,String email,Long expiration){
        return Jwts.builder()
                .setClaims(claims)
                .setSubject(email)
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(signKey(),SignatureAlgorithm.HS256)
                .compact();
    }


    public Key signKey(){
        return Keys.hmacShaKeyFor(secretKey.getBytes());
    }

    public Claims extractAllClaims(String token){
       return Jwts.parserBuilder()
                .setSigningKey(signKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    public String extractUsername(String token){
        Claims claims=extractAllClaims(token);
        return claims.getSubject();

    }
    public Boolean isTokenExpired(String token){
        return extractAllClaims(token).getExpiration().before(new Date());
    }

    public Boolean isTokenValid(String token, String email){

        String extractedEmail = extractAllClaims(token).getSubject();
        return (extractedEmail.equals(email) && !isTokenExpired(token));
    }

    public Duration getRemainingValidity(String token) {
        Claims claims = extractAllClaims(token);
        Date expiration = claims.getExpiration();

        long remainingTime = expiration.getTime() - System.currentTimeMillis();
        if(remainingTime<=0){
            return Duration.ZERO;
        }
         return Duration.ofMillis(remainingTime);
    }

    public String extractToken(HttpServletRequest request){
        String token = null;
        if (request.getCookies() != null) {
            for (Cookie cookie : request.getCookies()) {
                if (cookie.getName().equals("AccessToken")) {
                    token = cookie.getValue();
                }
            }
        }
        return token;
    }
}
