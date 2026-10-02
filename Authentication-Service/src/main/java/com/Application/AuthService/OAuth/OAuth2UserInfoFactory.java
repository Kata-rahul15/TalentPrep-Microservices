package com.Application.AuthService.OAuth;

import com.Application.AuthService.OAuth.Provider.GithubOAuth2UserInfo;
import com.Application.AuthService.OAuth.Provider.GoogleOAuth2UserInfo;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Component;

@Component
public class OAuth2UserInfoFactory {

    public OAuth2UserInfo getUserInfo(String registrationId,
                                      OAuth2User oauthUser){

        return switch (registrationId){

            case "google" ->
                    new GoogleOAuth2UserInfo(oauthUser);

            case "github" ->
                    new GithubOAuth2UserInfo(oauthUser);

            default ->
                    throw new IllegalArgumentException(
                            "Unsupported provider");
        };
    }
}