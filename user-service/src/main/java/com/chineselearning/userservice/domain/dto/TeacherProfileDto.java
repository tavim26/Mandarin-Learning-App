package com.chineselearning.userservice.domain.dto;

public class TeacherProfileDto
{
    private Long userId;
    private String fullName;
    private String role;
    private String title;
    private String email;

    public TeacherProfileDto(Long userId, String fullName, String role, String title, String email)
    {
        this.userId = userId;
        this.fullName = fullName;
        this.role = role;
        this.title = title;
        this.email = email;
    }

    public Long getUserId() { return userId; }
    public String getFullName() { return fullName; }
    public String getRole() { return role; }
    public String getTitle() { return title; }
    public String getEmail() { return email; }
}