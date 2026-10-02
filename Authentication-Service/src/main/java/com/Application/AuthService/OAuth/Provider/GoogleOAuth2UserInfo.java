package com.Application.AuthService.OAuth.Provider;

import com.Application.AuthService.Entity.AuthProvider;
import com.Application.AuthService.OAuth.OAuth2UserInfo;
import lombok.RequiredArgsConstructor;
import org.springframework.security.oauth2.core.user.OAuth2User;

@RequiredArgsConstructor
public class GoogleOAuth2UserInfo implements OAuth2UserInfo {

    private final OAuth2User oauthUser;

    @Override
    public String getEmail() {
        return oauthUser.getAttribute("email");
    }

    @Override
    public String getName() {
        return oauthUser.getAttribute("name");
    }

    @Override
    public AuthProvider getProvider() {
        return AuthProvider.GOOGLE;
    }
}