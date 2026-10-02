package com.Application.AuthService.Security;

import com.Application.AuthService.Entity.UserEntity;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

@Getter
public class CustomUserPrincipal extends User {

    private final UserEntity user;

    public CustomUserPrincipal(
            UserEntity user,
            Collection<? extends GrantedAuthority> authorities) {

        super(
                user.getEmail(),
                user.getPassword(),
                authorities
        );
        this.user = user;
    }
}