package com.chineselearning.userservice.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "credentials")
public class Credential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(name = "password_hash", nullable = false)
    private String passwordHash;

    @Column(nullable = false)
    private String role; // STUDENT, TEACHER, ADMIN

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    // Relatia OneToOne catre User
    // Cascade ALL inseamna ca daca salvam Credential, se salveaza si User
    @OneToOne(mappedBy = "credential", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private User user;

    public Credential() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public User getUser() { return user; }
    public void setUser(User user) {
        this.user = user;
        if (user != null) {
            user.setCredential(this);
        }
    }
}