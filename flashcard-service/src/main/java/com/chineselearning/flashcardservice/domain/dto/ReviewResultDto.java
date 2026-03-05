package com.chineselearning.flashcardservice.domain.dto;

public class ReviewResultDto {

    // Inregistrarea recenziei salvate
    private FlashcardReviewDto review;

    // Starea SM-2 actualizata dupa recenzie
    private FlashcardProgressDto progress;

    public ReviewResultDto() {}

    public FlashcardReviewDto getReview() { return review; }
    public void setReview(FlashcardReviewDto review) { this.review = review; }

    public FlashcardProgressDto getProgress() { return progress; }
    public void setProgress(FlashcardProgressDto progress) { this.progress = progress; }
}