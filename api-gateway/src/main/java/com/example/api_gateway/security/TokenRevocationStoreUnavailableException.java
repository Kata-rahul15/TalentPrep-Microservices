package com.example.api_gateway.security;

/** Raised when token revocation state cannot be checked safely. */
public class TokenRevocationStoreUnavailableException extends RuntimeException {
    public TokenRevocationStoreUnavailableException(Throwable cause) {
        super("Token revocation store is unavailable", cause);
    }
}
