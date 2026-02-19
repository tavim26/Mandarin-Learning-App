package com.chineselearning.userservice.domain.dto;

public class RegisterResponseDto
{
    private Long userId;
    private String role;
    private String fullName;

    public RegisterResponseDto(Long userId, String role, String fullName)
    {
        this.userId = userId;
        this.role = role;
        this.fullName = fullName;
    }

    public Long getUserId() { return userId; }
    public String getRole() { return role; }
    public String getFullName() { return fullName; }
}