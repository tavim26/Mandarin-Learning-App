package com.chineselearning.flashcardservice.repository.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "flashcard_reviews", indexes = {
        @Index(name = "idx_reviews_student_id", columnList = "student_id"),
        @Index(name = "idx_reviews_student_flashcard", columnList = "student_id, flashcard_id")
})
public class FlashcardReviewEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "flashcard_id", nullable = false)
    private FlashcardEntity flashcard;

    @Column(name = "reviewed_at", nullable = false)
    private LocalDateTime reviewedAt;

    // Scor SM-2: 0-5
    @Column(name = "quality", nullable = false)
    private Integer quality;

    public FlashcardReviewEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public FlashcardEntity getFlashcard() { return flashcard; }
    public void setFlashcard(FlashcardEntity flashcard) { this.flashcard = flashcard; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public Integer getQuality() { return quality; }
    public void setQuality(Integer quality) { this.quality = quality; }
}