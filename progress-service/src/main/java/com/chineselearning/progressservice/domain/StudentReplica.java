package com.chineselearning.progressservice.domain;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Local replica of Student identity from User Service.
 * Populated via RabbitMQ events (StudentCreatedEvent, StudentUpdatedEvent).
 *
 * This allows Progress Service to operate independently without calling User Service
 * for every query (eventual consistency pattern).
 */
@Entity
@Table(name = "students_replica")
public class StudentReplica {

    @Id
    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "full_name", nullable = false, length = 255)
    private String fullName;

    @Column(name = "email", nullable = false, length = 255)
    private String email;

    @Column(name = "synced_at", nullable = false)
    private LocalDateTime syncedAt;

    public StudentReplica() {
    }

    public StudentReplica(Long studentId, String fullName, String email, LocalDateTime syncedAt) {
        this.studentId = studentId;
        this.fullName = fullName;
        this.email = email;
        this.syncedAt = syncedAt;
    }


    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public LocalDateTime getSyncedAt() {
        return syncedAt;
    }

    public void setSyncedAt(LocalDateTime syncedAt) {
        this.syncedAt = syncedAt;
    }

    @PrePersist
    @PreUpdate
    protected void onPersistOrUpdate() {
        this.syncedAt = LocalDateTime.now();
    }
}