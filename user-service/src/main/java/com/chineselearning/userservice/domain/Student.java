package com.chineselearning.userservice.domain;

public class Student
{
    private Long userId;
    private String nickname;
    private User user;

    public Student() {}

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}