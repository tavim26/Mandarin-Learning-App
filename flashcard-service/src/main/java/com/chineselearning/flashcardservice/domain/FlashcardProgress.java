package com.chineselearning.flashcardservice.domain;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class FlashcardProgress
{

    private Long id;
    private Long studentId;
    private Long flashcardId;

    // Valoare initiala SM-2: 2.5
    private BigDecimal easinessFactor = new BigDecimal("2.5");

    // Numarul de zile pana la urmatoarea recenzie
    private Integer intervalDays = 0;

    // Numarul de repetari consecutive corecte
    private Integer repetitionCount = 0;

    private LocalDateTime nextReviewAt;
    private LocalDateTime lastReviewedAt;

    public FlashcardProgress() {}

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