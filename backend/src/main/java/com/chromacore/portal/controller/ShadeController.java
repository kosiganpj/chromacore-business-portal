package com.chromacore.portal.controller;

import com.chromacore.portal.model.ShadeCard;
import com.chromacore.portal.repo.ShadeCardRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/shades")
public class ShadeController {

    private final ShadeCardRepository shades;

    public ShadeController(ShadeCardRepository shades) {
        this.shades = shades;
    }

    @GetMapping("/public")
    public List<ShadeCard> publicShades() {
        return shades.findByActiveTrueOrderByShadeNameAsc();
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<ShadeCard> allShades() {
        return shades.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShadeCard> createShade(@RequestBody ShadeCard shade) {
        shade.setId(null);
        shade.setActive(true);

        return ResponseEntity.ok(
            shades.save(shade)
        );
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ShadeCard> updateShade(
            @PathVariable Long id,
            @RequestBody ShadeCard incoming) {

        ShadeCard shade = shades.findById(id)
                .orElseThrow();

        shade.setShadeCode(incoming.getShadeCode());
        shade.setShadeName(incoming.getShadeName());
        shade.setImageUrl(incoming.getImageUrl());
        shade.setCategory(incoming.getCategory());
        shade.setActive(incoming.isActive());
        shade.setProduct(incoming.getProduct());

        return ResponseEntity.ok(
            shades.save(shade)
        );
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteShade(@PathVariable Long id) {
        shades.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}