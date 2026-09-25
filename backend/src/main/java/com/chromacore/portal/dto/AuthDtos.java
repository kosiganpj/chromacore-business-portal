package com.chromacore.portal.dto;

public class AuthDtos {
    public record RegisterRequest(String email, String password, String companyName,
                                  String contactName, String phone, String gstNumber,
                                  String address, String city, String state) {}
    public record LoginRequest(String email, String password) {}
    public record AuthResponse(String token, Long userId, String email, String role, String companyName) {}
}
