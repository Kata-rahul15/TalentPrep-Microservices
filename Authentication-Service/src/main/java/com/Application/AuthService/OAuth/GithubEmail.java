package com.Application.AuthService.OAuth;

public record GithubEmail(
        String email,
        boolean primary,
        boolean verified
) {}