package com.Application.AuthService.Controller;

import com.Application.AuthService.Dto.*;
import com.Application.AuthService.Service.ProfileService;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final ProfileService profileService;
    private final String frontendUrl;

    public AuthController(
            ProfileService profileService,
            @Value("${app.url-frontend}") String frontendUrl
    ) {
        this.profileService = profileService;
        this.frontendUrl = frontendUrl;
    }

    @GetMapping("/health")
    public String home() {
        return "Authentication Service Running!";
    }


    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ProfileResponse register(@Valid @RequestBody ProfileRequest request) {
        return profileService.register(request);
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        LoginResponse response = profileService.login(request);

        ResponseCookie AccessCookie = ResponseCookie.from("AccessToken", response.getAccessToken())
                .httpOnly(true)
                .path("/")
                .secure(true)
                .maxAge(Duration.ofMinutes(15))
                .sameSite("Strict")
                .build();
        ResponseCookie RefreshCookie = ResponseCookie.from("RefreshToken", response.getRefreshToken())
                .httpOnly(true)
                .path("/api/auth/refresh")
                .secure(true)
                .maxAge(Duration.ofDays(7))
                .sameSite("Strict")
                .build();


        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, AccessCookie.toString())
                .header(HttpHeaders.SET_COOKIE, RefreshCookie.toString())
                .body(new LoginSuccessfull(
                        response.getUsername(),
                        response.getEmail(),
                        response.getRole(),
                        "Login Successfully Completed"));

    }

    @GetMapping("/login")
    public ResponseEntity<Void> oauthLoginCancelled() {
        URI redirectUri = URI.create(frontendUrl + "/login?oauth=cancelled");

        return ResponseEntity
                .status(HttpStatus.FOUND)
                .location(redirectUri)
                .build();
    }


    @PostMapping("/logout")
    public ResponseEntity<String> logout(HttpServletResponse response, HttpServletRequest request, Authentication authentication) {
        String email = authentication != null ? authentication.getName() : null;
        profileService.logout(request, response, email);
        return ResponseEntity.ok().body("Logout Successfully");
    }

    @PostMapping("/send-verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody VerifyOtpRequest request) {
        VerifyOtpResponse response = profileService.verifyOtp(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/send-reset-otp")
    public ResponseEntity<?> resetOtp(@RequestBody VerifyOtpRequest request) {
        VerifyOtpResponse response = profileService.verifyResetOtp(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/resend-otp")
    public ResponseEntity<?> resend(@RequestBody ResendOtpRequest request) {
        profileService.resendOtp(request);
        return ResponseEntity.ok().body("ResendOtp Successfully Sent");
    }

    @GetMapping("/whoami")
    public String whoami(Authentication authentication) {

        if (authentication == null) {
            return "NOT LOGGED IN";
        }

        return authentication.getClass().getName()
                + " -> "
                + authentication.getName();
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        ForgotPasswordResponse response = profileService.forgotPassword(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/profile")
    public ResponseEntity<ProfileResponse> getProfile(Authentication authentication) {
        return ResponseEntity.ok(profileService.getProfile(authentication));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody ResetPasswordRequest request) {
        ForgotPasswordResponse response = profileService.resetPassword(request);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refresh(@CookieValue("RefreshToken") String RefreshToken) {
        return profileService.refresh(RefreshToken);
    }
}