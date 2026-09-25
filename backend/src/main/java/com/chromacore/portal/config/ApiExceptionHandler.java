package com.chromacore.portal.config;

import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(IllegalArgumentException.class)
    ResponseEntity<?> bad(IllegalArgumentException e) {
        return ResponseEntity.badRequest().body(Map.of("message", e.getMessage()));
    }
    @ExceptionHandler(Exception.class)
    ResponseEntity<?> other(Exception e) {
        e.printStackTrace();
        return ResponseEntity.status(500).body(Map.of("message", "Server error"));
    }
}
