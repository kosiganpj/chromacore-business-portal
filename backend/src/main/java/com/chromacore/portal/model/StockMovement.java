package com.chromacore.portal.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.Instant;

@Entity
@Table(name="stock_movements")
@Getter @Setter
public class StockMovement {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional=false)
    private Product product;

    @Column(nullable=false)
    private double quantityChange;

    @Column(nullable=false)
    private double resultingStock;

    @Column(nullable=false)
    private String reason;

    @ManyToOne
    private AppUser performedBy;

    private Instant createdAt = Instant.now();
}
