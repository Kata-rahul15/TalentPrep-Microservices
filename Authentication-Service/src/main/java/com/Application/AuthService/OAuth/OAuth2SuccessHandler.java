package com.Application.AuthService.OAuth;

import com.Application.AuthService.Entity.RefreshToken;
import com.Application.AuthService.Entity.Role;
import com.Application.AuthService.Entity.UserEntity;
import com.Application.AuthService.Security.JwtUtil;
import com.Application.AuthService.Service.RefreshTokenService;
import com.Application.AuthService.repository.UserRepository;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.web.client.RestClient;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.time.Duration;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    @Value("${app.url-redirect}")
    private String redirectUrl;

    private final UserRepository userRepository;
    private final OAuth2AuthorizedClientService authorizedClientService;
    private final JwtUtil jwtUtil;
    private final RefreshTokenService refreshTokenService;
    private final OAuth2UserInfoFactory oauth2UserInfoFactory;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication)
            throws IOException, ServletException {
        System.out.println("===== OAuth2SuccessHandler called =====");
        OAuth2AuthenticationToken oauthToken =
                (OAuth2AuthenticationToken) authentication;

        String registrationId =
                oauthToken.getAuthorizedClientRegistrationId();

        OAuth2User oauthUser = oauthToken.getPrincipal();

        OAuth2UserInfo userInfo =
                oauth2UserInfoFactory.getUserInfo(
                        registrationId,
                        oauthUser
                );

        String email = userInfo.getEmail();
        String name = userInfo.getName();
        System.out.println(name);

        if ("github".equals(registrationId) && email == null) {

            OAuth2AuthorizedClient client =
                    authorizedClientService.loadAuthorizedClient(
                            registrationId,
                            authentication.getName());

            String accessToken =
                    client.getAccessToken().getTokenValue();

            RestClient restClient = RestClient.create();

            GithubEmail[] emails = restClient.get()
                    .uri("https://api.github.com/user/emails")
                    .header("Authorization", "Bearer " + accessToken)
                    .retrieve()
                    .body(GithubEmail[].class);

            if (emails != null) {

                for (GithubEmail githubEmail : emails) {

                    if (githubEmail.primary() && githubEmail.verified()) {

                        email = githubEmail.email();
                        break;
                    }
                }
            }
        }
        UserEntity user = userRepository.findByEmail(email).orElse(null);

        if (user == null) {

            user = UserEntity.builder()
                    .userId(UUID.randomUUID().toString())
                    .email(email)
                    .username(name)
                    .role(Role.ROLE_USER)
                    .provider(userInfo.getProvider())
                    .isAccountVerified(true)
                    .build();

            userRepository.save(user);

        } else {

            // Update the existing user's OAuth name
            if (name != null && !name.isBlank()) {
                user.setUsername(name);
            }

            // Update the provider to the provider used for the current login
            user.setProvider(userInfo.getProvider());

            userRepository.save(user);
        }

        String accessToken = jwtUtil.generateAccessToken(
                user.getEmail(),
                user.getRole()
                        .name()
                        .replace("ROLE_", ""),
                user.getUserId()
        );

        RefreshToken refreshToken =
                refreshTokenService.createRefreshToken(user);

        ResponseCookie accessCookie =
                ResponseCookie.from("AccessToken", accessToken)
                        .httpOnly(true)
                        .secure(true)
                        .sameSite("None")
                        .path("/")
                        .maxAge(Duration.ofMinutes(15))
                        .build();

        ResponseCookie refreshCookie =
                ResponseCookie.from("RefreshToken", refreshToken.getToken())
                        .httpOnly(true)
                        .secure(true)
                        .sameSite("None")
                        .path("/api/auth")
                        .maxAge(Duration.ofDays(7))
                        .build();

        response.addHeader(HttpHeaders.SET_COOKIE, accessCookie.toString());
        response.addHeader(HttpHeaders.SET_COOKIE, refreshCookie.toString());
        System.out.println("oauth successfull");

        response.sendRedirect(redirectUrl);
    }
}
