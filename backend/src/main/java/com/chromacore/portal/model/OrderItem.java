package com.chromacore.portal.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name="order_items")
@Getter
@Setter
public class OrderItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(optional=false)
    private CustomerOrder order;

    @ManyToOne(optional=false)
    private Product product;

    @Column(nullable=false)
    private double quantity;

    @Column(nullable=false)
    private double unitPrice;

    public double getLineTotal() {
        return quantity * unitPrice;
    }
}