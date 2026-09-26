
package com.chromacore.portal.controller;

import com.chromacore.portal.dto.AuthDtos.*;
import com.chromacore.portal.model.AppUser;
import com.chromacore.portal.model.Role;
import com.chromacore.portal.repo.UserRepository;
import com.chromacore.portal.security.JwtService;
import com.chromacore.portal.service.UserService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
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

        if (!encoder.matches(r.password(), u.getPasswordHash())) {
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

    @PostMapping("/register")
    public ResponseEntity<?> register(
            @RequestBody RegisterRequest r
    ) {

        if (r == null ||
                r.email() == null ||
                r.email().isBlank() ||
                r.password() == null ||
                r.password().isBlank()) {

            return ResponseEntity.badRequest()
                    .body("Email and password are required.");
        }

        if (users.findByEmailIgnoreCase(r.email()).isPresent()) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("An account with this email already exists.");
        }

        AppUser user = new AppUser();

        user.setEmail(r.email().trim());

        user.setPasswordHash(
                encoder.encode(r.password())
        );

        user.setRole(Role.CUSTOMER);

        if (r.companyName() != null) {
            user.setCompanyName(r.companyName().trim());
        }

        AppUser saved = users.save(user);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(
                        new AuthResponse(
                                jwt.generate(
                                        saved.getEmail(),
                                        saved.getRole().name(),
                                        saved.getId()
                                ),
                                saved.getId(),
                                saved.getEmail(),
                                saved.getRole().name(),
                                saved.getCompanyName()
                        )
                );
    }
}
