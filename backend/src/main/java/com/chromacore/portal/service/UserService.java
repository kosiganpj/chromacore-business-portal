package com.chromacore.portal.service;

import com.chromacore.portal.model.AppUser;
import com.chromacore.portal.model.Role;
import com.chromacore.portal.repo.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository repo;
    private final PasswordEncoder encoder;

    public UserService(UserRepository repo, PasswordEncoder encoder) {
        this.repo = repo; this.encoder = encoder;
    }

    public AppUser register(AppUser user, String password) {
        if (repo.findByEmailIgnoreCase(user.getEmail()).isPresent())
            throw new IllegalArgumentException("Email already registered");
        user.setPasswordHash(encoder.encode(password));
        user.setRole(Role.CUSTOMER);
        return repo.save(user);
    }
}
