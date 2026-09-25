package com.chromacore.portal.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name="invoices")
@Getter @Setter
public class Invoice {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false, unique=true)
    private String invoiceNumber;

    @OneToOne(optional=false)
    private CustomerOrder order;

    @ManyToOne(optional=false)
    private AppUser customer;

    @Column(nullable=false)
    private double amount;

    @Column(nullable=false)
    private double paidAmount = 0;

    private Instant issuedAt = Instant.now();

    public double getOutstanding() { return Math.max(0, amount - paidAmount); }
}
