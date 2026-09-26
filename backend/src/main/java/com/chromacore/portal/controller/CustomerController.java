
package com.chromacore.portal.controller;

import com.chromacore.portal.model.AppUser;
import com.chromacore.portal.model.CustomerOrder;
import com.chromacore.portal.repo.OrderRepository;
import com.chromacore.portal.repo.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CustomerController {

    private final UserRepository users;
    private final OrderRepository orders;

    public CustomerController(
            UserRepository users,
            OrderRepository orders
    ) {
        this.users = users;
        this.orders = orders;
    }

    @GetMapping("/customer/me")
    public AppUser me(Authentication auth) {
        return users.findByEmailIgnoreCase(auth.getName())
                .orElseThrow();
    }

    @GetMapping("/customer/orders")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<CustomerOrder>> customerOrders(
            Authentication auth
    ) {
        AppUser customer = users.findByEmailIgnoreCase(auth.getName())
                .orElseThrow();

        return ResponseEntity.ok(
                orders.findByCustomerIdOrderByCreatedAtDesc(
                        customer.getId()
                )
        );
    }

    @GetMapping("/admin/customers")
    @PreAuthorize("hasRole('ADMIN')")
    public List<AppUser> customers() {
        return users.findAll()
                .stream()
                .filter(u -> u.getRole().name().equals("CUSTOMER"))
                .toList();
    }
}
