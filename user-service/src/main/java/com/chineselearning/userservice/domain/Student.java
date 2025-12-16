package com.chineselearning.userservice.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "students")
public class Student {

    @Id
    private Long userId; // Numele coloanei PK in DB este 'user_id' conform diagramei tale

    @Column(name = "xp_total", nullable = false)
    private Integer xpTotal;

    @Column(nullable = false)
    private Integer level;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id") // Leaga PK-ul 'userId' de cheia straina catre Users
    private User user;

    public Student() {}

    // Getters and Setters
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Integer getXpTotal() { return xpTotal; }
    public void setXpTotal(Integer xpTotal) { this.xpTotal = xpTotal; }

    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}