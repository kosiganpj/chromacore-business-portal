package com.chromacore.portal.model;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name="shade_cards")
@Getter @Setter
public class ShadeCard {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable=false)
    private String shadeCode;

    @Column(nullable=false)
    private String shadeName;

    private String imageUrl;
    private String category;
    private boolean active = true;

    @ManyToOne(optional=false)
    private Product product;
}
