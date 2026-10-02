package com.Application.AuthService.Exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.DisabledException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(EmailAlreadyExistsException.class)
    public ResponseEntity<?> handleEmailAlreadyExistsException(EmailAlreadyExistsException ex) {

        return ResponseEntity
                .status(HttpStatus.CONFLICT)
                .body(Map.of(
                        "error", true,
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<?> handleBadCredentialsException(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "error", true,
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler(DisabledException.class)
    public ResponseEntity<?> handleDisabledException(DisabledException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(Map.of(
                        "error", true,
                        "message", ex.getMessage()
                ));
    }

    @ExceptionHandler(AccountAlreadyVerifiedException.class)
    public ResponseEntity<?> handleAccountAlreadyVerifiedException(AccountAlreadyVerifiedException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "error", true,
                        "message", ex.getMessage()
                ));
    }
    @ExceptionHandler(InvalidOtpException.class)
    public ResponseEntity<?> handleInValidOtpException(InvalidOtpException ex){
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of(
                        "error",true,
                        "message",ex.getMessage()
                ));
    }



    @ExceptionHandler(AccountNotVerified.class)
    public ResponseEntity<?> handleAccountNotVerifiedException(AccountNotVerified ex){
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(Map.of(
                    "error",true,
                    "errorCode", "ACCOUNT_NOT_VERIFIED",
                    "message","Your account is not verified. Please verify your email.",
                    "email",ex.getEmail()

                ));
    }
}