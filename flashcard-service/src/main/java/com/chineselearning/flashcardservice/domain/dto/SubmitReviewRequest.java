package com.chineselearning.flashcardservice.domain.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class SubmitReviewRequest {

    @NotNull
    private Long flashcardId;

    // SM-2: scala 0-5
    @NotNull
    @Min(0)
    @Max(5)
    private Integer quality;

    public SubmitReviewRequest() {}

    public Long getFlashcardId() { return flashcardId; }
    public void setFlashcardId(Long flashcardId) { this.flashcardId = flashcardId; }

    public Integer getQuality() { return quality; }
    public void setQuality(Integer quality) { this.quality = quality; }
}