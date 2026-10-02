package com.Application.AuthService.Security;

import com.Application.AuthService.Entity.Role;
import com.Application.AuthService.Service.BlacklistService;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.AllArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;

@Component
@AllArgsConstructor
public class JwtFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final BlacklistService blacklistService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        String token = jwtUtil.extractToken(request);

        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {

            if (blacklistService.isBlacklisted(token)) {
                response.sendError(
                        HttpServletResponse.SC_UNAUTHORIZED,
                        "Token is blacklisted"
                );
                return;
            }

            if (SecurityContextHolder.getContext().getAuthentication() == null) {

                Claims claims = jwtUtil.extractAllClaims(token);

                String email = claims.getSubject();
                String roleClaim = claims.get("role", String.class);

                if (email == null || roleClaim == null) {
                    filterChain.doFilter(request, response);
                    return;
                }

                String roleName = roleClaim.startsWith("ROLE_")
                        ? roleClaim
                        : "ROLE_" + roleClaim;

                Role role = Role.valueOf(roleName);

                if (jwtUtil.isTokenValid(token, email)) {

                    List<SimpleGrantedAuthority> authorities =
                            new ArrayList<>();

                    authorities.add(
                            new SimpleGrantedAuthority(role.name())
                    );

                    role.getPermissions().forEach(permission ->
                            authorities.add(
                                    new SimpleGrantedAuthority(permission.name())
                            )
                    );

                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    email,
                                    null,
                                    authorities
                            );

                    authentication.setDetails(
                            new WebAuthenticationDetailsSource()
                                    .buildDetails(request)
                    );

                    SecurityContextHolder
                            .getContext()
                            .setAuthentication(authentication);
                }
            }

        } catch (JwtException | IllegalArgumentException ex) {

            // Invalid/expired JWT.
            // Do not crash the request.
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }
}