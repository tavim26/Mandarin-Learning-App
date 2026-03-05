package com.chineselearning.flashcardservice.domain.dao;

import com.chineselearning.flashcardservice.domain.FlashcardProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface IFlashcardProgressDao extends JpaRepository<FlashcardProgress, Long> {

    Optional<FlashcardProgress> findByStudentIdAndFlashcardId(Long studentId, Long flashcardId);

    // Cardurile scadente pentru recenzie: next_review_at <= momentul curent
    List<FlashcardProgress> findByStudentIdAndNextReviewAtLessThanEqual(Long studentId, LocalDateTime now);
}