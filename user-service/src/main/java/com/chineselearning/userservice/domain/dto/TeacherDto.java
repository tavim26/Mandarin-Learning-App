package com.chineselearning.userservice.domain.dto;

public class TeacherDto
{
    private Long userId;
    private String title;

    public TeacherDto() {}

    public TeacherDto(Long userId, String title) {
        this.userId = userId;
        this.title = title;
    }

    // Getters and Setters
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
}