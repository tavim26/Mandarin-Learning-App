package com.chineselearning.userservice.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "teachers")
public class Teacher {

    @Id
    private Long userId;

    private String title;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    public Teacher() {}

    // Getters and Setters
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}