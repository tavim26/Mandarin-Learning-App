package com.chineselearning.flashcardservice.domain.dao;

import com.chineselearning.flashcardservice.domain.FlashcardReview;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IFlashcardReviewDao extends JpaRepository<FlashcardReview, Long> {

    List<FlashcardReview> findByStudentIdAndFlashcardIdOrderByReviewedAtAsc(Long studentId, Long flashcardId);
}