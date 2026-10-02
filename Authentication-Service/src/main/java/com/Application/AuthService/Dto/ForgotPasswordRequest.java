package com.Application.AuthService.Dto;


import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ForgotPasswordRequest {
    @Email(message = "Enter a valid Email Address")
    @NotNull(message = "Email Cannot be Null")
    private String email;
}
