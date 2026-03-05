package com.chineselearning.flashcardservice.domain.dto;

import java.time.LocalDateTime;

public class FlashcardReviewDto {

    private Long id;
    private Long studentId;
    private Long flashcardId;
    private LocalDateTime reviewedAt;
    private Integer quality;

    public FlashcardReviewDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public Long getFlashcardId() { return flashcardId; }
    public void setFlashcardId(Long flashcardId) { this.flashcardId = flashcardId; }

    public LocalDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(LocalDateTime reviewedAt) { this.reviewedAt = reviewedAt; }

    public Integer getQuality() { return quality; }
    public void setQuality(Integer quality) { this.quality = quality; }
}