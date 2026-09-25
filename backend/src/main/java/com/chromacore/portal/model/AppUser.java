package com.chromacore.portal.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name="users")
@Getter
@Setter
public class AppUser {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, unique=true)
    private String email;

    @JsonIgnore
    @Column(nullable=false)
    private String passwordHash;

    @Column(nullable=false)
    private String companyName;

    private String contactName;
    private String phone;
    private String gstNumber;
    private String address;
    private String city;
    private String state;

    @Enumerated(EnumType.STRING)
    private Role role = Role.CUSTOMER;

    @Column(nullable=false)
    private boolean enabled = true;

    @Column(nullable=false)
    private Instant createdAt = Instant.now();
}
