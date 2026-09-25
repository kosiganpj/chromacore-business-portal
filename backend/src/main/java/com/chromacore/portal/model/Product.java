package com.chromacore.portal.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

@Entity
@Table(name = "products")
@Getter
@Setter
public class Product {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    private String category;

    private String description;

    private String shade;

    private String application;

    private String packing;

    private String imageUrl;

    @Column(nullable = false)
    private double price = 0;

    @Column(nullable = false)
    private double stockQuantity = 0;

    @Column(nullable = false)
    private double reservedQuantity = 0;

    @Column(nullable = false)
    private double minimumStock = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ProductStatus status = ProductStatus.OUT_OF_STOCK;

    @Column(nullable = false)
    private boolean active = true;

    private Instant createdAt = Instant.now();

    private Instant updatedAt = Instant.now();

    public double getAvailableQuantity() {
        return Math.max(0, stockQuantity - reservedQuantity);
    }

    public void refreshStatus() {
        if (!active) {
            status = ProductStatus.INACTIVE;
        } else if (getAvailableQuantity() <= 0) {
            status = ProductStatus.OUT_OF_STOCK;
        } else if (getAvailableQuantity() <= minimumStock) {
            status = ProductStatus.LOW_STOCK;
        } else {
            status = ProductStatus.AVAILABLE;
        }
    }
}