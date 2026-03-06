package com.chineselearning.userservice.domain;

public class Teacher
{
    private Long userId;
    private String title;
    private User user;

    public Teacher() {}

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}