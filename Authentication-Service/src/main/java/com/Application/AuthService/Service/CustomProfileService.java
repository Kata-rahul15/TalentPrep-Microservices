package com.Application.AuthService.Service;

import com.Application.AuthService.Entity.UserEntity;
import com.Application.AuthService.Security.CustomUserPrincipal;
import com.Application.AuthService.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CustomProfileService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {

        UserEntity existingUser = userRepository.findByEmail(email)
                .orElseThrow(() ->
                        new UsernameNotFoundException("User not found with email: " + email));

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();

        authorities.add(new SimpleGrantedAuthority(existingUser.getRole().name()));

        existingUser.getRole().getPermissions()
                .forEach(permission ->
                        authorities.add(
                                new SimpleGrantedAuthority(permission.name())
                        ));
//
//        return User.builder()
//                .username(existingUser.getEmail())
//                .password(existingUser.getPassword())
//                .authorities(authorities)
//                .build();
        return new CustomUserPrincipal(existingUser,authorities);
    }
}