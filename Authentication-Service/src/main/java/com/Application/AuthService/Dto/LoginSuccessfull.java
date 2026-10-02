package com.Application.AuthService.Dto;


import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class LoginSuccessfull {

    private String username;
    private String email;
    private String role;
    private String message;
}
