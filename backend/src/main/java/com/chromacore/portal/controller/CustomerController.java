package com.chromacore.portal.controller;

import com.chromacore.portal.model.AppUser;
import com.chromacore.portal.repo.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api")
public class CustomerController {
    private final UserRepository users;
    public CustomerController(UserRepository users) { this.users=users; }

    @GetMapping("/customer/me")
    public AppUser me(Authentication auth) {
        return users.findByEmailIgnoreCase(auth.getName()).orElseThrow();
    }

    @GetMapping("/admin/customers")
    public List<AppUser> customers() {
        return users.findAll().stream().filter(u -> u.getRole().name().equals("CUSTOMER")).toList();
    }
}
