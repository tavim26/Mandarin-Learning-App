package com.chineselearning.userservice.domain.dto;

public class AuthResponseDto
{
    private String token;
    private Long userId;
    private String role;
    private String fullName;

    public AuthResponseDto(String token, Long userId, String role, String fullName) {
        this.token = token;
        this.userId = userId;
        this.role = role;
        this.fullName = fullName;
    }

    // Getters
    public String getToken() { return token; }
    public Long getUserId() { return userId; }
    public String getRole() { return role; }
    public String getFullName() { return fullName; }
}