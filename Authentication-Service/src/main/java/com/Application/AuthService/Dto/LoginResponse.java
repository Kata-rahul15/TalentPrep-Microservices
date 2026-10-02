package com.Application.AuthService.Dto;

import lombok.*;


@AllArgsConstructor
@NoArgsConstructor
@Getter
@Builder
public class LoginResponse {

    private String username;
    private String email;
    private String AccessToken;
    private String RefreshToken;
    private String role;

}
