package com.chineselearning.userservice.repository.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "students")
public class StudentEntity
{
    @Id
    private Long userId;

    @Column(name = "nickname", length = 50)
    private String nickname;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private UserEntity user;

    public StudentEntity() {}

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public String getNickname() { return nickname; }
    public void setNickname(String nickname) { this.nickname = nickname; }

    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }
}