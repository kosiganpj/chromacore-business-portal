
package com.chromacore.portal.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;

import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.List;

@Configuration
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    SecurityFilterChain filterChain(
            HttpSecurity http,
            JwtFilter jwtFilter
    ) throws Exception {

        http
            .csrf(csrf -> csrf.disable())

            .cors(cors ->
                cors.configurationSource(
                    corsConfigurationSource()
                )
            )

            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            .exceptionHandling(exceptions ->
                exceptions
                    .authenticationEntryPoint(
                        new HttpStatusEntryPoint(
                            HttpStatus.UNAUTHORIZED
                        )
                    )
                    .accessDeniedHandler(accessDeniedHandler())
            )

            .authorizeHttpRequests(auth -> auth

                // Public authentication endpoints
                .requestMatchers("/api/auth/**")
                .permitAll()

                // Public product/shade endpoints
                .requestMatchers(
                    "/api/products/public",
                    "/api/shades/public"
                )
                .permitAll()

                // Admin endpoints
                .requestMatchers("/api/admin/**")
                .hasRole("ADMIN")

                // Customer-only endpoints
                .requestMatchers("/api/customer/**")
                .hasRole("CUSTOMER")

                // Order creation is customer-only
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/orders"
                )
                .hasRole("CUSTOMER")

                // Viewing all orders is admin-only
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/orders"
                )
                .hasRole("ADMIN")

                // Changing order status is admin-only
                .requestMatchers(
                    HttpMethod.PUT,
                    "/api/orders/*/status"
                )
                .hasRole("ADMIN")

                // Deleting orders is admin-only
                .requestMatchers(
                    HttpMethod.DELETE,
                    "/api/orders/*"
                )
                .hasRole("ADMIN")

                // Remaining order endpoints require authentication.
                // OrderController performs ownership checks.
                .requestMatchers("/api/orders/**")
                .authenticated()

                // Everything else requires authentication
                .anyRequest()
                .authenticated()
            )

            .addFilterBefore(
                jwtFilter,
                UsernamePasswordAuthenticationFilter.class
            );

        return http.build();
    }

    @Bean
    AccessDeniedHandler accessDeniedHandler() {
        return (request, response, exception) -> {
            response.setStatus(HttpStatus.FORBIDDEN.value());
            response.setContentType("application/json");
            response.getWriter().write(
                "{\"error\":\"Access denied\"}"
            );
        };
    }

    @Bean
    CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration c = new CorsConfiguration();

        c.setAllowedOrigins(
            List.of(
                "http://localhost:5173",
                "https://chromacore-business-portal-frontend.onrender.com"
            )
        );

        c.setAllowedMethods(
            List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "OPTIONS"
            )
        );

        c.setAllowedHeaders(
            List.of("*")
        );

        c.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
            "/**",
            c
        );

        return source;
    }
}