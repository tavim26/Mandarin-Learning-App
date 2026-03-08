package com.chineselearning.flashcardservice.domain.dao;

import com.chineselearning.flashcardservice.domain.FlashcardReview;

import java.util.List;

public interface IFlashcardReviewDao
{

    FlashcardReview save(FlashcardReview flashcardReview);

    // Istoricul recenziilor unui student pe un card specific, ordonat cronologic
    List<FlashcardReview> findByStudentIdAndFlashcardIdOrderByReviewedAtAsc(Long studentId, Long flashcardId);
}