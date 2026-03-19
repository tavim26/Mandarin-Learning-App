package com.chineselearning.userservice.domain.dto;

public class StudentProfileDto
{
    private Long userId;
    private String fullName;
    private String role;
    private String nickname;
    private String email;

    public StudentProfileDto(Long userId, String fullName, String role, String nickname, String email)
    {
        this.userId = userId;
        this.fullName = fullName;
        this.role = role;
        this.nickname = nickname;
        this.email = email;
    }

    public Long getUserId() { return userId; }
    public String getFullName() { return fullName; }
    public String getRole() { return role; }
    public String getNickname() { return nickname; }
    public String getEmail() { return email; }
}