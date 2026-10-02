package com.Application.AuthService.OAuth;

import com.Application.AuthService.Entity.AuthProvider;

public interface OAuth2UserInfo {

    String getEmail();

    String getName();

    AuthProvider getProvider();
}
