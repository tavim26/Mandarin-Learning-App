package com.chineselearning.flashcardservice.repository;

import com.chineselearning.flashcardservice.domain.FlashcardReview;
import com.chineselearning.flashcardservice.domain.dao.IFlashcardReviewDao;
import com.chineselearning.flashcardservice.repository.entities.FlashcardEntity;
import com.chineselearning.flashcardservice.repository.entities.FlashcardReviewEntity;
import com.chineselearning.flashcardservice.repository.jpa.FlashcardJpaRepository;
import com.chineselearning.flashcardservice.repository.jpa.FlashcardReviewJpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class FlashcardReviewDao implements IFlashcardReviewDao
{

    private final FlashcardReviewJpaRepository flashcardReviewJpaRepository;
    private final FlashcardJpaRepository flashcardJpaRepository;

    public FlashcardReviewDao(FlashcardReviewJpaRepository flashcardReviewJpaRepository, FlashcardJpaRepository flashcardJpaRepository) {
        this.flashcardReviewJpaRepository = flashcardReviewJpaRepository;
        this.flashcardJpaRepository = flashcardJpaRepository;
    }

    @Override
    public FlashcardReview save(FlashcardReview flashcardReview)
    {
        FlashcardReviewEntity entity = toEntity(flashcardReview);
        FlashcardReviewEntity saved = flashcardReviewJpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public List<FlashcardReview> findByStudentIdAndFlashcardIdOrderByReviewedAtAsc(Long studentId, Long flashcardId)
    {
        return flashcardReviewJpaRepository
                .findByStudentIdAndFlashcardIdOrderByReviewedAtAsc(studentId, flashcardId)
                .stream()
                .map(this::toDomain)
                .toList();
    }


    private FlashcardReviewEntity toEntity(FlashcardReview domain)
    {
        FlashcardReviewEntity entity = new FlashcardReviewEntity();
        entity.setId(domain.getId());
        entity.setStudentId(domain.getStudentId());
        entity.setReviewedAt(domain.getReviewedAt());
        entity.setQuality(domain.getQuality());

        FlashcardEntity flashcardEntity = flashcardJpaRepository.findById(domain.getFlashcardId())
                .orElseThrow(() -> new RuntimeException("Flashcard with ID " + domain.getFlashcardId() + " does not exist."));
        entity.setFlashcard(flashcardEntity);

        return entity;
    }

    private FlashcardReview toDomain(FlashcardReviewEntity entity)
    {
        FlashcardReview domain = new FlashcardReview();
        domain.setId(entity.getId());
        domain.setStudentId(entity.getStudentId());
        domain.setFlashcardId(entity.getFlashcard().getId());
        domain.setReviewedAt(entity.getReviewedAt());
        domain.setQuality(entity.getQuality());
        return domain;
    }
}