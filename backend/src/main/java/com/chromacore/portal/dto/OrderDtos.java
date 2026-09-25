package com.chromacore.portal.dto;

import java.util.List;

public class OrderDtos {

    public record Item(
            Long productId,
            double quantity
    ) {}

    public record CreateOrderRequest(
            List<Item> items,
            String shippingAddress
    ) {}

    public record StatusUpdateRequest(
            String status,
            String trackingNumber,
            String transportName
    ) {}
}