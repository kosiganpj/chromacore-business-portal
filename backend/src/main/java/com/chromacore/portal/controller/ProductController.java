
package com.chromacore.portal.controller;

import com.chromacore.portal.dto.ProductDtos.*;
import com.chromacore.portal.model.*;
import com.chromacore.portal.repo.*;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api")
public class ProductController {

    private final ProductRepository products;
    private final StockMovementRepository movements;
    private final UserRepository users;
    private final ShadeCardRepository shades;

    public ProductController(
            ProductRepository products,
            StockMovementRepository movements,
            UserRepository users,
            ShadeCardRepository shades) {

        this.products = products;
        this.movements = movements;
        this.users = users;
        this.shades = shades;
    }

    // =========================================================
    // PUBLIC PRODUCTS
    // =========================================================

    // Primary endpoint used by the frontend
    @GetMapping("/products")
    public List<Product> publicProducts() {
        return products.findByActiveTrueOrderByNameAsc();
    }

    // Backward-compatible endpoint
    @GetMapping("/products/public")
    public List<Product> publicProductsLegacy() {
        return products.findByActiveTrueOrderByNameAsc();
    }

    // =========================================================
    // ADMIN PRODUCTS
    // =========================================================

    @GetMapping("/admin/products")
    public List<Product> adminProducts() {
        return products.findAll();
    }

    @GetMapping("/admin/products/{id}")
    public Product getProduct(@PathVariable Long id) {
        return products.findById(id).orElseThrow();
    }

    @PostMapping("/admin/products")
    public Product add(@RequestBody ProductRequest r) {

        if (r.price() < 0) {
            throw new IllegalArgumentException(
                    "Price cannot be negative"
            );
        }

        if (r.stockQuantity() < 0) {
            throw new IllegalArgumentException(
                    "Stock quantity cannot be negative"
            );
        }

        if (r.minimumStock() < 0) {
            throw new IllegalArgumentException(
                    "Minimum stock cannot be negative"
            );
        }

        Product p = from(r, new Product());

        p.setCreatedAt(Instant.now());
        p.setUpdatedAt(Instant.now());

        p.refreshStatus();

        return products.save(p);
    }

    @PutMapping("/admin/products/{id}")
    public Product update(
            @PathVariable Long id,
            @RequestBody ProductRequest r) {

        if (r.price() < 0) {
            throw new IllegalArgumentException(
                    "Price cannot be negative"
            );
        }

        if (r.stockQuantity() < 0) {
            throw new IllegalArgumentException(
                    "Stock quantity cannot be negative"
            );
        }

        if (r.minimumStock() < 0) {
            throw new IllegalArgumentException(
                    "Minimum stock cannot be negative"
            );
        }

        Product p = products
                .findById(id)
                .orElseThrow();

        double oldStock = p.getStockQuantity();

        from(r, p);

        p.setUpdatedAt(Instant.now());
        p.refreshStatus();

        Product saved = products.save(p);

        if (Double.compare(
                oldStock,
                p.getStockQuantity()
        ) != 0) {

            recordMovement(
                    saved,
                    p.getStockQuantity() - oldStock,
                    "Admin product edit",
                    null
            );
        }

        return saved;
    }

    @DeleteMapping("/admin/products/{id}")
    public void deactivate(
            @PathVariable Long id) {

        Product p = products
                .findById(id)
                .orElseThrow();

        p.setActive(false);
        p.refreshStatus();
        p.setUpdatedAt(Instant.now());

        products.save(p);
    }

    // =========================================================
    // STOCK MANAGEMENT
    // =========================================================

    @PostMapping("/admin/products/{id}/stock/add")
    public Product addStock(
            @PathVariable Long id,
            @RequestBody StockRequest r,
            Authentication auth) {

        if (r.quantity() <= 0) {
            throw new IllegalArgumentException(
                    "Quantity must be positive"
            );
        }

        Product p = products
                .findById(id)
                .orElseThrow();

        p.setStockQuantity(
                p.getStockQuantity() + r.quantity()
        );

        p.setUpdatedAt(Instant.now());
        p.refreshStatus();

        Product saved = products.save(p);

        recordMovement(
                saved,
                r.quantity(),
                r.reason(),
                auth != null ? auth.getName() : null
        );

        return saved;
    }

    @PostMapping("/admin/products/{id}/stock/remove")
    public Product removeStock(
            @PathVariable Long id,
            @RequestBody StockRequest r,
            Authentication auth) {

        if (r.quantity() <= 0) {
            throw new IllegalArgumentException(
                    "Quantity must be positive"
            );
        }

        Product p = products
                .findById(id)
                .orElseThrow();

        if (r.quantity() > p.getStockQuantity()) {
            throw new IllegalArgumentException(
                    "Cannot remove more stock than exists"
            );
        }

        p.setStockQuantity(
                p.getStockQuantity() - r.quantity()
        );

        p.setUpdatedAt(Instant.now());
        p.refreshStatus();

        Product saved = products.save(p);

        recordMovement(
                saved,
                -r.quantity(),
                r.reason(),
                auth != null ? auth.getName() : null
        );

        return saved;
    }

    @GetMapping("/admin/products/{id}/stock-movements")
    public List<StockMovement> movements(
            @PathVariable Long id) {

        return movements
                .findByProductIdOrderByCreatedAtDesc(id);
    }

    // =========================================================
    // SHADES
    // =========================================================

    @GetMapping("/shades/public")
    public List<ShadeCard> publicShades() {
        return shades.findByActiveTrueOrderByShadeNameAsc();
    }

    @GetMapping("/admin/shades")
    public List<ShadeCard> adminShades() {
        return shades.findAll();
    }

    @PostMapping("/admin/shades")
    public ShadeCard addShade(
            @RequestBody ShadeRequest r) {

        Product p = products
                .findById(r.productId())
                .orElseThrow();

        ShadeCard s = new ShadeCard();

        s.setShadeCode(r.shadeCode());
        s.setShadeName(r.shadeName());
        s.setImageUrl(r.imageUrl());
        s.setCategory(r.category());
        s.setProduct(p);

        return shades.save(s);
    }

    @PutMapping("/admin/shades/{id}")
    public ShadeCard updateShade(
            @PathVariable Long id,
            @RequestBody ShadeRequest r) {

        ShadeCard s = shades
                .findById(id)
                .orElseThrow();

        s.setShadeCode(r.shadeCode());
        s.setShadeName(r.shadeName());
        s.setImageUrl(r.imageUrl());
        s.setCategory(r.category());

        if (r.productId() != null) {
            s.setProduct(
                    products
                            .findById(r.productId())
                            .orElseThrow()
            );
        }

        return shades.save(s);
    }

    @DeleteMapping("/admin/shades/{id}")
    public void deleteShade(
            @PathVariable Long id) {

        ShadeCard s = shades
                .findById(id)
                .orElseThrow();

        s.setActive(false);

        shades.save(s);
    }

    // =========================================================
    // PRODUCT MAPPING
    // =========================================================

    private Product from(
            ProductRequest r,
            Product p) {

        p.setCode(r.code());
        p.setName(r.name());
        p.setCategory(r.category());
        p.setDescription(r.description());
        p.setShade(r.shade());
        p.setApplication(r.application());
        p.setPacking(r.packing());
        p.setImageUrl(r.imageUrl());

        // Product price
        p.setPrice(r.price());

        p.setStockQuantity(
                r.stockQuantity()
        );

        p.setMinimumStock(
                r.minimumStock()
        );

        p.setActive(true);

        return p;
    }

    // =========================================================
    // STOCK MOVEMENT RECORDING
    // =========================================================

    private void recordMovement(
            Product p,
            double delta,
            String reason,
            String email) {

        StockMovement m = new StockMovement();

        m.setProduct(p);

        m.setQuantityChange(delta);

        m.setResultingStock(
                p.getStockQuantity()
        );

        m.setReason(
                reason == null || reason.isBlank()
                        ? "Manual adjustment"
                        : reason
        );

        if (email != null) {
            users
                    .findByEmailIgnoreCase(email)
                    .ifPresent(
                            m::setPerformedBy
                    );
        }

        movements.save(m);
    }
}
