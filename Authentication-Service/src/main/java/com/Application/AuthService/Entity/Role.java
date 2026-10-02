package com.Application.AuthService.Entity;


import lombok.Getter;

import java.util.Set;

@Getter
public enum Role {
    ROLE_USER(Set.of(Permissions.VIEW_USERS)),
    ROLE_ADMIN(Set.of(Permissions.VIEW_ADMIN,Permissions.VIEW_USERS));

    private final Set<Permissions> permissions;


    Role(Set<Permissions> permissions) {
        this.permissions = permissions;
    }


}
