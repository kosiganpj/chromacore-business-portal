package com.chromacore.portal.config;

import com.chromacore.portal.model.*;
import com.chromacore.portal.repo.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {
    @Bean
    CommandLineRunner seed(UserRepository users, ProductRepository products, PasswordEncoder encoder) {
        return args -> {
            if (users.findByEmailIgnoreCase("admin@chromacore.local").isEmpty()) {
                AppUser a = new AppUser();
                a.setEmail("admin@chromacore.local");
                a.setPasswordHash(encoder.encode("Admin@12345"));
                a.setCompanyName("ChromaCore Dyes & Chemicals");
                a.setContactName("Administrator");
                a.setRole(Role.ADMIN);
                users.save(a);
            }

            if (products.count() == 0) {
                Product p = new Product();
                p.setCode("DEMO-RED-01");
                p.setName("Reactive Red Demo");
                p.setCategory("Reactive Dyes");
                p.setShade("Red");
                p.setApplication("Textile Dyeing");
                p.setPacking("25 KG / 50 KG");
                p.setStockQuantity(100);
                p.setMinimumStock(20);
                p.setActive(true);
                p.refreshStatus();
                products.save(p);
            }
        };
    }
}
