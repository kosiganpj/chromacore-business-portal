package com.chromacore.portal.dto;

public class ProductDtos {

    public record ProductRequest(
            String code,
            String name,
            String category,
            String description,
            String shade,
            String application,
            String packing,
            String imageUrl,
            double price,
            double stockQuantity,
            double minimumStock
    ) {}

    public record StockRequest(
            double quantity,
            String reason
    ) {}

    public record ShadeRequest(
            String shadeCode,
            String shadeName,
            String imageUrl,
            String category,
            Long productId
    ) {}
}