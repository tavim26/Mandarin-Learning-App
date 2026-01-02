package com.chineselearning.progressservice.domain.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;


public class StudentLessonProgressDto {

    private Long studentId;
    private Long lessonId;
    private String status;
    private BigDecimal completionPct;
    private Integer xpAwarded;
    private LocalDateTime startedAt;
    private LocalDateTime lastAccessedAt;
    private LocalDateTime completedAt;

    public StudentLessonProgressDto() {
    }

    public StudentLessonProgressDto(Long studentId, Long lessonId, String status, BigDecimal completionPct, Integer xpAwarded, LocalDateTime startedAt, LocalDateTime lastAccessedAt, LocalDateTime completedAt) {
        this.studentId = studentId;
        this.lessonId = lessonId;
        this.status = status;
        this.completionPct = completionPct;
        this.xpAwarded = xpAwarded;
        this.startedAt = startedAt;
        this.lastAccessedAt = lastAccessedAt;
        this.completedAt = completedAt;
    }

    // Getters and setters

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Long getLessonId() {
        return lessonId;
    }

    public void setLessonId(Long lessonId) {
        this.lessonId = lessonId;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public BigDecimal getCompletionPct() {
        return completionPct;
    }

    public void setCompletionPct(BigDecimal completionPct) {
        this.completionPct = completionPct;
    }

    public Integer getXpAwarded() {
        return xpAwarded;
    }

    public void setXpAwarded(Integer xpAwarded) {
        this.xpAwarded = xpAwarded;
    }

    public LocalDateTime getStartedAt() {
        return startedAt;
    }

    public void setStartedAt(LocalDateTime startedAt) {
        this.startedAt = startedAt;
    }

    public LocalDateTime getLastAccessedAt() {
        return lastAccessedAt;
    }

    public void setLastAccessedAt(LocalDateTime lastAccessedAt) {
        this.lastAccessedAt = lastAccessedAt;
    }

    public LocalDateTime getCompletedAt() {
        return completedAt;
    }

    public void setCompletedAt(LocalDateTime completedAt) {
        this.completedAt = completedAt;
    }
}