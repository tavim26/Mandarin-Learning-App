package com.chineselearning.userservice.repository.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "teachers")
public class TeacherEntity
{
    @Id
    private Long userId;

    @Column(name = "title", length = 100)
    private String title;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private UserEntity user;

    public TeacherEntity() {}

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }
}