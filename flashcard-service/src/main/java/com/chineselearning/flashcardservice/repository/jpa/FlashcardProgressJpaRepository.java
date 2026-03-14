package com.chineselearning.flashcardservice.repository.jpa;

import com.chineselearning.flashcardservice.repository.entities.FlashcardProgressEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface FlashcardProgressJpaRepository extends JpaRepository<FlashcardProgressEntity, Long>
{

    Optional<FlashcardProgressEntity> findByStudentIdAndFlashcardId(Long studentId, Long flashcardId);

    // Cardurile scadente: next_review_at <= momentul curent
    List<FlashcardProgressEntity> findByStudentIdAndNextReviewAtLessThanEqual(Long studentId, LocalDateTime now);

    // Progresul existent pentru o lista de flashcard-uri
    List<FlashcardProgressEntity> findByStudentIdAndFlashcardFlashcardIdIn(Long studentId, List<Long> flashcardIds);
}