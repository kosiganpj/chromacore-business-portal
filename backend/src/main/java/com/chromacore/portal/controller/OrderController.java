
package com.chromacore.portal.controller;

import com.chromacore.portal.dto.OrderDtos;
import com.chromacore.portal.model.AppUser;
import com.chromacore.portal.model.CustomerOrder;
import com.chromacore.portal.model.OrderItem;
import com.chromacore.portal.model.OrderStatus;
import com.chromacore.portal.model.Product;
import com.chromacore.portal.model.StockMovement;
import com.chromacore.portal.repo.OrderRepository;
import com.chromacore.portal.repo.ProductRepository;
import com.chromacore.portal.repo.StockMovementRepository;
import com.chromacore.portal.repo.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final StockMovementRepository stockMovementRepository;
    private final UserRepository userRepository;

    public OrderController(
            OrderRepository orderRepository,
            ProductRepository productRepository,
            StockMovementRepository stockMovementRepository,
            UserRepository userRepository
    ) {
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.userRepository = userRepository;
    }

    // ============================================================
    // CREATE ORDER
    // CUSTOMER ONLY
    // ============================================================

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @Transactional
    public ResponseEntity<?> createOrder(
            @RequestBody OrderDtos.CreateOrderRequest request,
            Authentication authentication
    ) {

        if (request == null ||
                request.items() == null ||
                request.items().isEmpty()) {

            return ResponseEntity.badRequest()
                    .body("Order must contain at least one item.");
        }

        if (authentication == null ||
                authentication.getName() == null ||
                authentication.getName().isBlank()) {

            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Authentication is required.");
        }

        AppUser customer = userRepository
                .findByEmailIgnoreCase(authentication.getName())
                .orElse(null);

        if (customer == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Customer account not found.");
        }

        // ========================================================
        // AGGREGATE DUPLICATE PRODUCT IDS
        // ========================================================

        Map<Long, Double> requestedQuantities =
                new LinkedHashMap<>();

        for (OrderDtos.Item item : request.items()) {

            if (item == null || item.productId() == null) {
                return ResponseEntity.badRequest()
                        .body("Product ID is required.");
            }

            if (item.quantity() <= 0) {
                return ResponseEntity.badRequest()
                        .body("Quantity must be greater than zero.");
            }

            requestedQuantities.merge(
                    item.productId(),
                    item.quantity(),
                    Double::sum
            );
        }

        // ========================================================
        // VALIDATE EVERYTHING BEFORE RESERVING ANY STOCK
        // ========================================================

        Map<Long, Product> productsById =
                new LinkedHashMap<>();

        for (Map.Entry<Long, Double> entry :
                requestedQuantities.entrySet()) {

            Long productId = entry.getKey();
            double quantity = entry.getValue();

            Product product = productRepository
                    .findById(productId)
                    .orElse(null);

            if (product == null) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body("Product not found: " + productId);
            }

            if (!product.isActive()) {
                return ResponseEntity.badRequest()
                        .body(
                                "Product is inactive: "
                                        + product.getCode()
                        );
            }

            double available =
                    product.getAvailableQuantity();

            if (quantity > available) {
                return ResponseEntity.badRequest()
                        .body(
                                "Insufficient stock for product "
                                        + product.getCode()
                                        + ". Available: "
                                        + available
                        );
            }

            productsById.put(productId, product);
        }

        // ========================================================
        // CREATE ORDER
        // ========================================================

        CustomerOrder order =
                new CustomerOrder();

        order.setCustomer(customer);
        order.setShippingAddress(
                request.shippingAddress()
        );
        order.setStatus(
                OrderStatus.PLACED
        );
        order.setCreatedAt(
                Instant.now()
        );
        order.setUpdatedAt(
                Instant.now()
        );

        order.setOrderNumber(
                "CC-ORD-" +
                        UUID.randomUUID()
                                .toString()
                                .substring(0, 8)
                                .toUpperCase()
        );

        double total = 0;

        // ========================================================
        // RESERVE STOCK
        // ========================================================

        for (Map.Entry<Long, Double> entry :
                requestedQuantities.entrySet()) {

            Long productId = entry.getKey();
            double quantity = entry.getValue();

            Product product =
                    productsById.get(productId);

            product.setReservedQuantity(
                    product.getReservedQuantity()
                            + quantity
            );

            product.setUpdatedAt(
                    Instant.now()
            );

            product.refreshStatus();

            productRepository.save(product);

            OrderItem orderItem =
                    new OrderItem();

            orderItem.setOrder(order);
            orderItem.setProduct(product);
            orderItem.setQuantity(quantity);

            // Always use the database price.
            orderItem.setUnitPrice(
                    product.getPrice()
            );

            order.getItems().add(
                    orderItem
            );

            total +=
                    orderItem.getLineTotal();
        }

        order.setTotalAmount(total);

        CustomerOrder saved =
                orderRepository.save(order);

        return ResponseEntity.ok(saved);
    }

    // ============================================================
    // GET ALL ORDERS
    // ADMIN ONLY
    // ============================================================

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<CustomerOrder>> getAllOrders() {

        return ResponseEntity.ok(
                orderRepository.findAll()
        );
    }

    // ============================================================
    // GET ORDER BY ID
    // CUSTOMER CAN SEE OWN ORDER
    // ADMIN CAN SEE ANY ORDER
    // ============================================================

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getOrder(
            @PathVariable Long id,
            Authentication authentication
    ) {

        CustomerOrder order =
                orderRepository
                        .findById(id)
                        .orElse(null);

        if (order == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            "Order not found: "
                                    + id
                    );
        }

        boolean admin =
                authentication.getAuthorities()
                        .stream()
                        .anyMatch(
                                a -> a.getAuthority()
                                        .equals("ROLE_ADMIN")
                        );

        boolean owner =
                order.getCustomer() != null &&
                order.getCustomer().getEmail() != null &&
                order.getCustomer().getEmail()
                        .equalsIgnoreCase(
                                authentication.getName()
                        );

        if (!admin && !owner) {
            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(
                            "You are not allowed to view this order."
                    );
        }

        return ResponseEntity.ok(order);
    }

    // ============================================================
    // GET CUSTOMER ORDERS
    // ============================================================

    @GetMapping("/customer/{customerId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> getCustomerOrders(
            @PathVariable Long customerId,
            Authentication authentication
    ) {

        boolean admin =
                authentication.getAuthorities()
                        .stream()
                        .anyMatch(
                                a -> a.getAuthority()
                                        .equals("ROLE_ADMIN")
                        );

        AppUser authenticatedUser =
                userRepository
                        .findByEmailIgnoreCase(
                                authentication.getName()
                        )
                        .orElse(null);

        if (!admin &&
                (authenticatedUser == null ||
                        !authenticatedUser.getId()
                                .equals(customerId))) {

            return ResponseEntity
                    .status(HttpStatus.FORBIDDEN)
                    .body(
                            "You are not allowed to view these orders."
                    );
        }

        return ResponseEntity.ok(
                orderRepository
                        .findByCustomerIdOrderByCreatedAtDesc(
                                customerId
                        )
        );
    }

    // ============================================================
    // UPDATE ORDER STATUS
    // ADMIN ONLY
    // ============================================================

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> updateStatus(
            @PathVariable Long id,
            @RequestBody OrderDtos.StatusUpdateRequest request
    ) {

        CustomerOrder order =
                orderRepository
                        .findById(id)
                        .orElse(null);

        if (order == null) {
            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            "Order not found: "
                                    + id
                    );
        }

        if (request == null ||
                request.status() == null ||
                request.status().isBlank()) {

            return ResponseEntity.badRequest()
                    .body("Status is required.");
        }

        OrderStatus oldStatus =
                order.getStatus();

        OrderStatus newStatus;

        try {

            newStatus =
                    OrderStatus.valueOf(
                            request.status()
                                    .trim()
                                    .toUpperCase()
                    );

        } catch (IllegalArgumentException e) {

            return ResponseEntity.badRequest()
                    .body(
                            "Invalid order status: "
                                    + request.status()
                    );
        }

        // ========================================================
        // SAME STATUS
        // ========================================================

        if (oldStatus == newStatus) {

            if (request.trackingNumber() != null) {
                order.setTrackingNumber(
                        request.trackingNumber()
                );
            }

            if (request.transportName() != null) {
                order.setTransportName(
                        request.transportName()
                );
            }

            order.setUpdatedAt(
                    Instant.now()
            );

            return ResponseEntity.ok(
                    orderRepository.save(order)
            );
        }

        // ========================================================
        // TERMINAL STATUSES
        // ========================================================

        if (oldStatus == OrderStatus.DELIVERED) {

            return ResponseEntity.badRequest()
                    .body(
                            "Delivered orders cannot change status."
                    );
        }

        if (oldStatus == OrderStatus.CANCELLED) {

            return ResponseEntity.badRequest()
                    .body(
                            "Cancelled orders cannot change status."
                    );
        }

        // ========================================================
        // VALID STATE TRANSITION
        // ========================================================

        if (!isValidTransition(
                oldStatus,
                newStatus
        )) {

            return ResponseEntity.badRequest()
                    .body(
                            "Invalid status transition: "
                                    + oldStatus
                                    + " -> "
                                    + newStatus
                    );
        }

        // ========================================================
        // CANCEL
        // ========================================================

        if (newStatus == OrderStatus.CANCELLED) {

            releaseReservations(order);

            order.setStatus(
                    OrderStatus.CANCELLED
            );
        }

        // ========================================================
        // DELIVER
        // ========================================================

        else if (newStatus == OrderStatus.DELIVERED) {

            fulfillReservations(order);

            order.setStatus(
                    OrderStatus.DELIVERED
            );
        }

        // ========================================================
        // NORMAL TRANSITION
        // ========================================================

        else {

            order.setStatus(
                    newStatus
            );
        }

        if (request.trackingNumber() != null) {
            order.setTrackingNumber(
                    request.trackingNumber()
            );
        }

        if (request.transportName() != null) {
            order.setTransportName(
                    request.transportName()
            );
        }

        order.setUpdatedAt(
                Instant.now()
        );

        return ResponseEntity.ok(
                orderRepository.save(order)
        );
    }

    // ============================================================
    // VALID ORDER STATUS TRANSITIONS
    // ============================================================

    private boolean isValidTransition(
            OrderStatus oldStatus,
            OrderStatus newStatus
    ) {

        return switch (oldStatus) {

            case PLACED ->
                    newStatus == OrderStatus.CONFIRMED ||
                    newStatus == OrderStatus.CANCELLED;

            case CONFIRMED ->
                    newStatus == OrderStatus.PROCESSING ||
                    newStatus == OrderStatus.CANCELLED;

            case PROCESSING ->
                    newStatus == OrderStatus.PACKED ||
                    newStatus == OrderStatus.CANCELLED;

            case PACKED ->
                    newStatus == OrderStatus.DISPATCHED ||
                    newStatus == OrderStatus.CANCELLED;

            case DISPATCHED ->
                    newStatus == OrderStatus.IN_TRANSIT;

            case IN_TRANSIT ->
                    newStatus == OrderStatus.DELIVERED;

            case DELIVERED,
                 CANCELLED ->
                    false;
        };
    }

    // ============================================================
    // RELEASE RESERVED STOCK
    // ============================================================

    private void releaseReservations(
            CustomerOrder order
    ) {

        for (OrderItem item :
                order.getItems()) {

            Product product =
                    item.getProduct();

            double reserved =
                    product.getReservedQuantity();

            double release =
                    Math.min(
                            reserved,
                            item.getQuantity()
                    );

            product.setReservedQuantity(
                    reserved - release
            );

            product.setUpdatedAt(
                    Instant.now()
            );

            product.refreshStatus();

            productRepository.save(
                    product
            );
        }
    }

    // ============================================================
    // FULFILL RESERVED STOCK
    // ============================================================

    private void fulfillReservations(
            CustomerOrder order
    ) {

        for (OrderItem item :
                order.getItems()) {

            Product product =
                    item.getProduct();

            double quantity =
                    item.getQuantity();

            if (product.getReservedQuantity()
                    < quantity) {

                throw new IllegalStateException(
                        "Reserved stock is insufficient for product "
                                + product.getCode()
                );
            }

            if (product.getStockQuantity()
                    < quantity) {

                throw new IllegalStateException(
                        "Physical stock is insufficient for product "
                                + product.getCode()
                );
            }

            product.setReservedQuantity(
                    product.getReservedQuantity()
                            - quantity
            );

            product.setStockQuantity(
                    product.getStockQuantity()
                            - quantity
            );

            product.setUpdatedAt(
                    Instant.now()
            );

            product.refreshStatus();

            Product saved =
                    productRepository.save(
                            product
                    );

            recordMovement(
                    saved,
                    -quantity,
                    "Order delivered: "
                            + order.getOrderNumber(),
                    order.getCustomer() != null
                            ? order.getCustomer().getEmail()
                            : null
            );
        }
    }

    // ============================================================
    // RECORD STOCK MOVEMENT
    // ============================================================

    private void recordMovement(
            Product product,
            double delta,
            String reason,
            String email
    ) {

        StockMovement movement =
                new StockMovement();

        movement.setProduct(product);

        movement.setQuantityChange(
                delta
        );

        movement.setResultingStock(
                product.getStockQuantity()
        );

        movement.setReason(
                reason == null ||
                        reason.isBlank()
                        ? "Order stock adjustment"
                        : reason
        );

        if (email != null) {

            userRepository
                    .findByEmailIgnoreCase(email)
                    .ifPresent(
                            movement::setPerformedBy
                    );
        }

        stockMovementRepository.save(
                movement
        );
    }

    // ============================================================
    // DELETE ORDER
    // ADMIN ONLY
    // ============================================================

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<?> deleteOrder(
            @PathVariable Long id
    ) {

        CustomerOrder order =
                orderRepository
                        .findById(id)
                        .orElse(null);

        if (order == null) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(
                            "Order not found: "
                                    + id
                    );
        }

        if (order.getStatus()
                != OrderStatus.CANCELLED &&
                order.getStatus()
                        != OrderStatus.DELIVERED) {

            releaseReservations(order);
        }

        orderRepository.delete(order);

        return ResponseEntity.ok(
                "Order deleted successfully."
        );
    }
}
