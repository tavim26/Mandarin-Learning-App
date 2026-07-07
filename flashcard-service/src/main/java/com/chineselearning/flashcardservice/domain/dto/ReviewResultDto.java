package com.chineselearning.flashcardservice.domain.dto;

public class ReviewResultDto {

    private FlashcardReviewDto review;

    private FlashcardProgressDto progress;

    public ReviewResultDto() {}

    public FlashcardReviewDto getReview() { return review; }
    public void setReview(FlashcardReviewDto review) { this.review = review; }

    public FlashcardProgressDto getProgress() { return progress; }
    public void setProgress(FlashcardProgressDto progress) { this.progress = progress; }
}