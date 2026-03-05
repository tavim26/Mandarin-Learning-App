package com.chineselearning.flashcardservice.domain.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class FlashcardProgressDto {

    private Long id;
    private Long studentId;
    private Long flashcardId;
    private BigDecimal easinessFactor;
    private Integer intervalDays;
    private Integer repetitionCount;
    private LocalDateTime nextReviewAt;
    private LocalDateTime lastReviewedAt;

    public FlashcardProgressDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public Long getFlashcardId() { return flashcardId; }
    public void setFlashcardId(Long flashcardId) { this.flashcardId = flashcardId; }

    public BigDecimal getEasinessFactor() { return easinessFactor; }
    public void setEasinessFactor(BigDecimal easinessFactor) { this.easinessFactor = easinessFactor; }

    public Integer getIntervalDays() { return intervalDays; }
    public void setIntervalDays(Integer intervalDays) { this.intervalDays = intervalDays; }

    public Integer getRepetitionCount() { return repetitionCount; }
    public void setRepetitionCount(Integer repetitionCount) { this.repetitionCount = repetitionCount; }

    public LocalDateTime getNextReviewAt() { return nextReviewAt; }
    public void setNextReviewAt(LocalDateTime nextReviewAt) { this.nextReviewAt = nextReviewAt; }

    public LocalDateTime getLastReviewedAt() { return lastReviewedAt; }
    public void setLastReviewedAt(LocalDateTime lastReviewedAt) { this.lastReviewedAt = lastReviewedAt; }
}