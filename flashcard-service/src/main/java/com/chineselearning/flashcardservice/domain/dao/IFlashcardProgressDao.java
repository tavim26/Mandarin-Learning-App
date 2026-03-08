package com.chineselearning.flashcardservice.domain.dao;

import com.chineselearning.flashcardservice.domain.FlashcardProgress;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface IFlashcardProgressDao
{

    FlashcardProgress save(FlashcardProgress flashcardProgress);

    // Starea SM-2 pentru o pereche unica (student, flashcard)
    Optional<FlashcardProgress> findByStudentIdAndFlashcardId(Long studentId, Long flashcardId);

    // Cardurile scadente pentru recenzie: next_review_at <= momentul curent
    List<FlashcardProgress> findByStudentIdAndNextReviewAtLessThanEqual(Long studentId, LocalDateTime now);
}