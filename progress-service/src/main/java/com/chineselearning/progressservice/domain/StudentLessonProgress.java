package com.chineselearning.progressservice.domain;

import jakarta.persistence.*;
import java.io.Serializable;
import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Tracks a student's progress through a specific lesson.
 * Composite primary key: (student_id, lesson_id).
 */
@Entity
@Table(name = "student_lesson_progress", indexes = {
        @Index(name = "idx_student_status", columnList = "student_id, status")
})
@IdClass(StudentLessonProgress.StudentLessonProgressId.class)
public class StudentLessonProgress {

    @Id
    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Id
    @Column(name = "lesson_id", nullable = false)
    private Long lessonId;

    @Column(name = "status", nullable = false, length = 20)
    private String status; // NOT_STARTED, IN_PROGRESS, COMPLETED

    @Column(name = "completion_pct", nullable = false, precision = 5, scale = 2)
    private BigDecimal completionPct;

    @Column(name = "xp_awarded")
    private Integer xpAwarded;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "last_accessed_at", nullable = false)
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
        this.lastAccessedAt = LocalDateTime.now();
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

    @PreUpdate
    protected void onUpdate() {
        this.lastAccessedAt = LocalDateTime.now();
    }

    /**
     * Composite primary key class for StudentLessonProgress.
     * Required for @IdClass strategy.
     */
    public static class StudentLessonProgressId implements Serializable {

        private Long studentId;
        private Long lessonId;

        // No-args constructor
        public StudentLessonProgressId() {
        }

        public StudentLessonProgressId(Long studentId, Long lessonId) {
            this.studentId = studentId;
            this.lessonId = lessonId;
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

        // equals() and hashCode() required for composite key

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;

            StudentLessonProgressId that = (StudentLessonProgressId) o;

            if (!studentId.equals(that.studentId)) return false;
            return lessonId.equals(that.lessonId);
        }

        @Override
        public int hashCode() {
            int result = studentId.hashCode();
            result = 31 * result + lessonId.hashCode();
            return result;
        }
    }
}