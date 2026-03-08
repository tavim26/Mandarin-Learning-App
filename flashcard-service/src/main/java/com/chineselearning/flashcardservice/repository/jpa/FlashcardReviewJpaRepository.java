package com.chineselearning.flashcardservice.repository.jpa;

import com.chineselearning.flashcardservice.repository.entities.FlashcardReviewEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FlashcardReviewJpaRepository extends JpaRepository<FlashcardReviewEntity, Long>
{

    List<FlashcardReviewEntity> findByStudentIdAndFlashcardIdOrderByReviewedAtAsc(Long studentId, Long flashcardId);
}