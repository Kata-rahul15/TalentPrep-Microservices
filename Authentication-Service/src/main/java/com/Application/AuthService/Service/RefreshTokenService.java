package com.Application.AuthService.Service;

import com.Application.AuthService.Entity.RefreshToken;
import com.Application.AuthService.Entity.UserEntity;
import com.Application.AuthService.Security.JwtUtil;
import com.Application.AuthService.repository.RefreshTokenRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtil jwtUtil;

    public RefreshToken createRefreshToken(UserEntity user){

        String refreshToken = jwtUtil.generateRefreshToken(user.getEmail());

        RefreshToken token= new RefreshToken();
        token.setToken(refreshToken);
        token.setExpiry(LocalDateTime.now().plusDays(7));
        token.setRevoked(false);
        token.setUser(user);

        return refreshTokenRepository.save(token);

    }

    public RefreshToken verifyRefreshToken(String token){
        RefreshToken refreshToken = refreshTokenRepository.findByToken(token)
                .orElseThrow(()-> new ResponseStatusException
                        (HttpStatus.UNAUTHORIZED,"Refresh Token Not Found"));

        if(refreshToken.getRevoked()){
            throw new ResponseStatusException
                    (HttpStatus.UNAUTHORIZED,"Refresh Token revoked");
        }
        if(!jwtUtil.isTokenValid(token,refreshToken.getUser().getEmail())){
            throw new ResponseStatusException
                    (HttpStatus.UNAUTHORIZED,"Invalid Refresh Token");
        }

        return refreshToken;
    }

    public void revokeRefreshToken(String token){

        RefreshToken refreshToken = verifyRefreshToken(token);


        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);
    }

    @Transactional
    public void deleteByEmail(String email) {
        refreshTokenRepository.deleteByUser_Email(email);
    }

    public RefreshToken rotateRefreshToken(String oldToken){
        RefreshToken refreshToken = verifyRefreshToken(oldToken);

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        return createRefreshToken(refreshToken.getUser());
    }
}
