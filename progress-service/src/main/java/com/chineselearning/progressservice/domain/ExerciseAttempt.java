package com.chineselearning.progressservice.domain;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

/**
 * Records each attempt a student makes on an exercise.
 * Tracks submitted answer, score, correctness, and feedback.
 */
@Entity
@Table(name = "exercise_attempts", indexes = {
        @Index(name = "idx_student_exercise_submitted", columnList = "student_id, exercise_id, submitted_at"),
        @Index(name = "idx_exercise_correct", columnList = "exercise_id, is_correct")
})
public class ExerciseAttempt {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "exercise_id", nullable = false)
    private Long exerciseId;

    @Column(name = "attempt_number", nullable = false)
    private Integer attemptNumber;

    @Column(name = "submitted_at", nullable = false)
    private LocalDateTime submittedAt;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "submitted_answer", columnDefinition = "jsonb", nullable = false)
    private Map<String, Object> submittedAnswer;

    @Column(name = "is_correct", nullable = false)
    private Boolean isCorrect;

    @Column(name = "score", nullable = false, precision = 5, scale = 2)
    private BigDecimal score;

    @Column(name = "feedback_text", columnDefinition = "TEXT")
    private String feedbackText;

    // No-args constructor for JPA
    public ExerciseAttempt() {
    }

    // Manual getters and setters

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

    public Long getExerciseId() {
        return exerciseId;
    }

    public void setExerciseId(Long exerciseId) {
        this.exerciseId = exerciseId;
    }

    public Integer getAttemptNumber() {
        return attemptNumber;
    }

    public void setAttemptNumber(Integer attemptNumber) {
        this.attemptNumber = attemptNumber;
    }

    public LocalDateTime getSubmittedAt() {
        return submittedAt;
    }

    public void setSubmittedAt(LocalDateTime submittedAt) {
        this.submittedAt = submittedAt;
    }

    public Map<String, Object> getSubmittedAnswer() {
        return submittedAnswer;
    }

    public void setSubmittedAnswer(Map<String, Object> submittedAnswer) {
        this.submittedAnswer = submittedAnswer;
    }

    public Boolean getIsCorrect() {
        return isCorrect;
    }

    public void setIsCorrect(Boolean isCorrect) {
        this.isCorrect = isCorrect;
    }

    public BigDecimal getScore() {
        return score;
    }

    public void setScore(BigDecimal score) {
        this.score = score;
    }

    public String getFeedbackText() {
        return feedbackText;
    }

    public void setFeedbackText(String feedbackText) {
        this.feedbackText = feedbackText;
    }

    @PrePersist
    protected void onCreate() {
        if (submittedAt == null) {
            submittedAt = LocalDateTime.now();
        }
    }
}