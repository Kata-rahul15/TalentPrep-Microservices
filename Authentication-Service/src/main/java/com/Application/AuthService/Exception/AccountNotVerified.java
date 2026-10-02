package com.Application.AuthService.Exception;

public class AccountNotVerified extends RuntimeException {

    private final String email;

    public AccountNotVerified(String message, String email) {
        super(message);
        this.email = email;
    }

    public String getEmail() {
        return email;
    }
}