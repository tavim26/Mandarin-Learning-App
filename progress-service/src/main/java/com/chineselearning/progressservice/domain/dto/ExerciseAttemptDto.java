package com.chineselearning.progressservice.domain.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

public class ExerciseAttemptDto {

    private Long id;
    private Long studentId;
    private Long exerciseId;
    private Integer attemptNumber;
    private LocalDateTime submittedAt;
    private Map<String, Object> submittedAnswer;
    private Boolean isCorrect;
    private BigDecimal score;
    private String feedbackText;

    public ExerciseAttemptDto() {}

    public ExerciseAttemptDto(Long id, Long studentId, Long exerciseId, Integer attemptNumber,
                              LocalDateTime submittedAt, Map<String, Object> submittedAnswer,
                              Boolean isCorrect, BigDecimal score, String feedbackText) {
        this.id = id;
        this.studentId = studentId;
        this.exerciseId = exerciseId;
        this.attemptNumber = attemptNumber;
        this.submittedAt = submittedAt;
        this.submittedAnswer = submittedAnswer;
        this.isCorrect = isCorrect;
        this.score = score;
        this.feedbackText = feedbackText;
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
}