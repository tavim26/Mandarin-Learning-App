package com.chineselearning.userservice.domain.dto;

public class StudentProfileDto
{
    private Long userId;
    private String fullName;
    private String role;
    private String nickname;
    private String email;
    private boolean isBanned;

    public StudentProfileDto(Long userId, String fullName, String role, String nickname, String email, boolean isBanned)
    {
        this.userId = userId;
        this.fullName = fullName;
        this.role = role;
        this.nickname = nickname;
        this.email = email;
        this.isBanned = isBanned;
    }

    public Long getUserId() { return userId; }
    public String getFullName() { return fullName; }
    public String getRole() { return role; }
    public String getNickname() { return nickname; }
    public String getEmail() { return email; }
    public boolean isBanned() { return isBanned; }
}