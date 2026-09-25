
package com.chromacore.portal.controller;

import com.chromacore.portal.dto.AuthDtos.*;
import com.chromacore.portal.model.AppUser;
import com.chromacore.portal.repo.UserRepository;
import com.chromacore.portal.security.JwtService;
import com.chromacore.portal.service.UserService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository users;
    private final UserService service;
    private final PasswordEncoder encoder;
    private final JwtService jwt;

    public AuthController(
            UserRepository users,
            UserService service,
            PasswordEncoder encoder,
            JwtService jwt
    ) {
        this.users = users;
        this.service = service;
        this.encoder = encoder;
        this.jwt = jwt;
    }

        @PostMapping("/login")
    public AuthResponse login(@RequestBody LoginRequest r) {
        AppUser u = users.findByEmailIgnoreCase(r.email())
                .orElseThrow(() ->
                        new IllegalArgumentException(
                                "Invalid email or password"
                        )
                );

        if (!encoder.matches(
                r.password(),
                u.getPasswordHash()
        )) {
            throw new IllegalArgumentException(
                    "Invalid email or password"
            );
        }

        return new AuthResponse(
                jwt.generate(
                        u.getEmail(),
                        u.getRole().name(),
                        u.getId()
                ),
                u.getId(),
                u.getEmail(),
                u.getRole().name(),
                u.getCompanyName()
        );
    }
}
