package com.Application.AuthService.Service;

import com.Application.AuthService.Dto.*;
import com.Application.AuthService.Entity.AuthProvider;
import com.Application.AuthService.Entity.RefreshToken;
import com.Application.AuthService.Entity.Role;
import com.Application.AuthService.Entity.UserEntity;
import com.Application.AuthService.Exception.AccountAlreadyVerifiedException;
import com.Application.AuthService.Exception.AccountNotVerified;
import com.Application.AuthService.Exception.EmailAlreadyExistsException;
import com.Application.AuthService.Exception.InvalidOtpException;
import com.Application.AuthService.Security.CustomUserPrincipal;
import com.Application.AuthService.Security.JwtUtil;
import com.Application.AuthService.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.transaction.Transactional;
import lombok.AllArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.security.SecureRandom;
import java.time.Duration;
import java.util.UUID;

@Service
@AllArgsConstructor
public class ProfileService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;
    private final RefreshTokenService refreshTokenService;
    private final OtpService otpService;
    private final BlacklistService blacklistService;


    public LoginResponse login(LoginRequest request) {
        Authentication authentication;

        try {
            authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getEmail(),
                            request.getPassword()
                    )
            );
        } catch (AuthenticationException e) {
            e.printStackTrace();
            throw e;
        }

        CustomUserPrincipal principal =
                (CustomUserPrincipal) authentication.getPrincipal();

        assert principal != null;
        UserEntity user = principal.getUser();
        if (!user.getIsAccountVerified()) {
            throw new AccountNotVerified("Verify Your Account", request.getEmail());
        }
        String role = user.getRole().name().replace("ROLE_", "");
        String userId = user.getUserId();
        String accessToken = jwtUtil.generateAccessToken(request.getEmail(), role , userId);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user);
        System.out.println(refreshToken.getToken());
        return LoginResponse.builder()
                .username(user.getUsername())
                .email(request.getEmail())
                .role(role)
                .AccessToken(accessToken)
                .RefreshToken(refreshToken.getToken())
                .build();
    }

    @Transactional(rollbackOn = Exception.class)
    public ProfileResponse register(ProfileRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new EmailAlreadyExistsException("Email Already Exists");
        }

        String otp = String.valueOf(100000 + new SecureRandom().nextInt(900000));
        UserEntity newUser = UserEntity
                .builder()
                .email(request.getEmail())
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .userId(UUID.randomUUID().toString())
                .role(Role.ROLE_USER)
                .provider(AuthProvider.LOCAL)
                .isAccountVerified(false)
                .build();
        emailService.sendVerifyOtp(request.getEmail(),
                request.getUsername(), otp);
        userRepository.save(newUser);
        otpService.saveOtp(request.getEmail(), otp);
        return convertToResponse(newUser);
    }

    @Transactional
    public VerifyOtpResponse verifyOtp(VerifyOtpRequest request) {
        UserEntity verifyUser =userRepository.findByEmail(request.getEmail()).orElseThrow(()-> new ResponseStatusException(HttpStatus.BAD_REQUEST,"User Not Found"));
        if (verifyUser.getIsAccountVerified()) {
            throw new AccountAlreadyVerifiedException("Account Already Verified");
        }
        if (!otpService.verifyOtp(request.getEmail(), request.getOtp())) {
            throw new InvalidOtpException("Invalid Otp");
        }

        verifyUser.setIsAccountVerified(true);
        userRepository.save(verifyUser);
        otpService.deleteOtp(request.getEmail());
        emailService.sendWelcomeEmail(verifyUser.getUsername(),request.getEmail());
        return new VerifyOtpResponse(true, "Otp Successfully Verified");
    }

    private ProfileResponse convertToResponse(UserEntity newUserEntity) {
        return ProfileResponse.builder()
                .userId(newUserEntity.getUserId())
                .username(newUserEntity.getUsername())
                .email(newUserEntity.getEmail())
                .isAccountVerified(newUserEntity.getIsAccountVerified())
                .build();
    }

    public ForgotPasswordResponse forgotPassword(ForgotPasswordRequest request) {
        UserEntity user = userRepository.findByEmail(request.getEmail()).orElseThrow(
                ()-> new ResponseStatusException(HttpStatus.BAD_REQUEST,"User Not Found"));

        if (user == null) {
            throw new EmailAlreadyExistsException("Email Not Found");
        }
        if (!user.getIsAccountVerified()) {
            throw new AccountAlreadyVerifiedException("Verify your Account first");
        }

        String savedOtp = String.valueOf(100000 + new SecureRandom().nextInt(90000));

        otpService.saveOtp(request.getEmail(), savedOtp);
        emailService.sendResetOtp(request.getEmail(),user.getUsername(),savedOtp);

        return new ForgotPasswordResponse(
                true,
                "successfully sent reset otp");

    }

    public VerifyOtpResponse verifyResetOtp(VerifyOtpRequest request) {

        if (!otpService.verifyOtp(request.getEmail(), request.getOtp())) {
            throw new InvalidOtpException("Invalid Otp");
        }
        return new VerifyOtpResponse(true, "Reset Otp Verified Successfully");
    }

    public ForgotPasswordResponse resetPassword(ResetPasswordRequest request) {
        UserEntity user = userRepository.findByEmail(request.getEmail()).orElseThrow(()->
                new ResponseStatusException(HttpStatus.BAD_REQUEST,"Email Not Registered"));

        if (passwordEncoder.matches(request.getNewPassword(), user.getPassword())) {
            return new ForgotPasswordResponse(
                    false,
                    "Old Password Cannot Be your new password");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        return new ForgotPasswordResponse(
                true,
                "Password Successfully Changed");

    }

    public ProfileResponse getProfile(Authentication authentication) {
        String email = authentication.getName();

        UserEntity user = userRepository.findByEmail(email).orElseThrow(()->
                new ResponseStatusException(HttpStatus.BAD_REQUEST,"User Not Found"));
        return ProfileResponse.builder()
                .username(user.getUsername())
                .email(user.getEmail())
                .build();
    }

    public void resendOtp(ResendOtpRequest request) {

        UserEntity user = userRepository.findByEmail(request.getEmail()).orElseThrow(()-> new ResponseStatusException(HttpStatus.BAD_REQUEST,"User Not Found"));

        if(Boolean.TRUE.equals(user.getIsAccountVerified())){
            throw new AccountAlreadyVerifiedException("Account Already Verified");
        }
        String otp = String.valueOf(100000 + new SecureRandom().nextInt(900000));
        emailService.sendVerifyOtp(request.getEmail(),user.getUsername(),otp);
        otpService.saveOtp(request.getEmail(),otp);
    }
    public ResponseEntity<?> refresh(String refreshToken) {

        RefreshToken token =
                refreshTokenService.rotateRefreshToken(refreshToken);

        UserEntity user = token.getUser();

        String role = user.getRole()
                .name()
                .replace("ROLE_", "");

        String accessToken =
                jwtUtil.generateAccessToken(
                        user.getEmail(),
                        role,
                        user.getUserId()
                );

        ResponseCookie accessCookie =
                ResponseCookie.from("AccessToken", accessToken)
                        .httpOnly(true)
                        .secure(true)
                        .sameSite("Strict")
                        .path("/")
                        .maxAge(Duration.ofMinutes(15))
                        .build();

        ResponseCookie refreshCookie =
                ResponseCookie.from(
                                "RefreshToken",
                                token.getToken()
                        )
                        .httpOnly(true)
                        .secure(true)
                        .sameSite("Strict")
                        .path("/api/auth/refresh")
                        .maxAge(Duration.ofDays(7))
                        .build();

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, accessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, refreshCookie.toString())
                .build();
    }

    public void logout(HttpServletRequest request, HttpServletResponse response,String email) {
        String token = jwtUtil.extractToken(request);

        if(token!=null) {
            Duration remaining = jwtUtil.getRemainingValidity(token);
            blacklistService.blacklistToken(token, remaining);
        }

        if(email!=null) {
            refreshTokenService.deleteByEmail(email);
        }
        clearCookies(response);
    }

    private void clearCookies(HttpServletResponse response) {

            ResponseCookie accessCookie =
                    ResponseCookie.from("AccessToken","")
                            .httpOnly(true)
                            .secure(true)
                            .sameSite("Strict")
                            .path("/")
                            .maxAge(0)
                            .build();
        ResponseCookie refreshCookie = ResponseCookie.from("RefreshToken", "")
                        .httpOnly(true)
                        .secure(true)
                        .sameSite("Strict")
                        .path("/api/auth/refresh")
                        .maxAge(0)
                        .build();
            response.addHeader(HttpHeaders.SET_COOKIE,accessCookie.toString());
            response.addHeader(HttpHeaders.SET_COOKIE,refreshCookie.toString());
    }

}
