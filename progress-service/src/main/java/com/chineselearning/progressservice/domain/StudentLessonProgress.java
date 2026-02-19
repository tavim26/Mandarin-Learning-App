package com.chineselearning.progressservice.domain;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(
        name = "student_lesson_progress",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uq_student_lesson",
                        columnNames = {"student_id", "lesson_id"}
                )
        },
        indexes = {
                @Index(name = "idx_progress_student_status", columnList = "student_id, status")
        }
)
public class StudentLessonProgress
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "lesson_id", nullable = false)
    private Long lessonId;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "completion_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal completionPct;

    @Column(name = "xp_awarded")
    private Integer xpAwarded;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "last_accessed_at")
    private LocalDateTime lastAccessedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    public StudentLessonProgress() {
        this.status = "NOT_STARTED";
        this.completionPct = BigDecimal.ZERO;
    }

    public StudentLessonProgress(Long studentId, Long lessonId) {
        this.studentId = studentId;
        this.lessonId = lessonId;
        this.status = "NOT_STARTED";
        this.completionPct = BigDecimal.ZERO;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

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