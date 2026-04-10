package com.chineselearning.userservice.domain;

import java.time.LocalDateTime;

public class Credential
{
    private Long id;
    private String email;
    private String passwordHash;
    private String role;
    private LocalDateTime createdAt;
    private boolean isActive = true;
    private User user;

    public Credential() {}

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

    public boolean isActive() { return isActive; }
    public void setActive(boolean isActive) { this.isActive = isActive; }

    public User getUser() { return user; }
    public void setUser(User user)
    {
        this.user = user;
        if (user != null)
        {
            user.setCredential(this);
        }
    }
}