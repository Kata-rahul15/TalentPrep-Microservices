package com.Application.AuthService.Dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ProfileRequest {


    @NotNull
    private String username;

    @Email(message = "Enter a valid email address")
    @NotNull(message = "Email Should not be Empty")
    private String email;
    @Size(min = 6,message = "Password must be At least 6 characters")
    private String password;

}
