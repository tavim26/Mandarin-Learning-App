package com.chineselearning.progressservice.domain.dto;

import java.time.LocalDateTime;


public class StudentReplicaDto {

    private Long studentId;
    private String fullName;
    private String email;
    private LocalDateTime syncedAt;

    public StudentReplicaDto() {
    }

    public StudentReplicaDto(Long studentId, String fullName, String email, LocalDateTime syncedAt) {
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
}