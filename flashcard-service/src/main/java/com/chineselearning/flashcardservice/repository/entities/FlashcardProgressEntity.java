package com.chineselearning.flashcardservice.repository.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "flashcard_progress", indexes = {
        @Index(name = "idx_progress_student_flashcard", columnList = "student_id, flashcard_id", unique = true),
        @Index(name = "idx_progress_student_next_review", columnList = "student_id, next_review_at")
})
public class FlashcardProgressEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    // FetchType.EAGER - id-ul flashcard-ului este necesar in conversie, accesat imediat
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "flashcard_id", nullable = false)
    private FlashcardEntity flashcard;

    // Valoare initiala SM-2: 2.5
    @Column(name = "easiness_factor", nullable = false, precision = 4, scale = 2)
    private BigDecimal easinessFactor = new BigDecimal("2.5");

    // Numarul de zile pana la urmatoarea recenzie
    @Column(name = "interval_days", nullable = false)
    private Integer intervalDays = 0;

    // Numarul de repetari consecutive corecte
    @Column(name = "repetition_count", nullable = false)
    private Integer repetitionCount = 0;

    @Column(name = "next_review_at")
    private LocalDateTime nextReviewAt;

    @Column(name = "last_reviewed_at")
    private LocalDateTime lastReviewedAt;

    public FlashcardProgressEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public FlashcardEntity getFlashcard() { return flashcard; }
    public void setFlashcard(FlashcardEntity flashcard) { this.flashcard = flashcard; }

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