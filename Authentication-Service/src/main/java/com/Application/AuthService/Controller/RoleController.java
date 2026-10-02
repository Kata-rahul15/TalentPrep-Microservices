package com.Application.AuthService.Controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/roles")
public class RoleController {


    @PostMapping
    @PreAuthorize("hasAuthority('VIEW_ADMIN')")
    public String Adminrole() {
        return  "Admin only access";
    }

    @GetMapping("/user")
    @PreAuthorize("hasAuthority('VIEW_USERS')")
    public String foruser(){
        return "user only";
    }

    @GetMapping("/guests")
    @PreAuthorize("hasAuthority('VIEW_USERS') and hasAuthority('VIEW_ADMIN')")
    public String forall(){
        return "admin and user both";
    }

}
