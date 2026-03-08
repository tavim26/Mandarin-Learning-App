package com.chineselearning.flashcardservice.repository;

import com.chineselearning.flashcardservice.domain.FlashcardProgress;
import com.chineselearning.flashcardservice.domain.dao.IFlashcardProgressDao;
import com.chineselearning.flashcardservice.repository.entities.FlashcardEntity;
import com.chineselearning.flashcardservice.repository.entities.FlashcardProgressEntity;
import com.chineselearning.flashcardservice.repository.jpa.FlashcardJpaRepository;
import com.chineselearning.flashcardservice.repository.jpa.FlashcardProgressJpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public class FlashcardProgressDao implements IFlashcardProgressDao
{

    private final FlashcardProgressJpaRepository flashcardProgressJpaRepository;
    private final FlashcardJpaRepository flashcardJpaRepository;

    public FlashcardProgressDao(FlashcardProgressJpaRepository flashcardProgressJpaRepository, FlashcardJpaRepository flashcardJpaRepository) {
        this.flashcardProgressJpaRepository = flashcardProgressJpaRepository;
        this.flashcardJpaRepository = flashcardJpaRepository;
    }

    @Override
    public FlashcardProgress save(FlashcardProgress flashcardProgress)
    {
        FlashcardProgressEntity entity = toEntity(flashcardProgress);
        FlashcardProgressEntity saved = flashcardProgressJpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<FlashcardProgress> findByStudentIdAndFlashcardId(Long studentId, Long flashcardId)
    {
        return flashcardProgressJpaRepository
                .findByStudentIdAndFlashcardId(studentId, flashcardId)
                .map(this::toDomain);
    }

    @Override
    public List<FlashcardProgress> findByStudentIdAndNextReviewAtLessThanEqual(Long studentId, LocalDateTime now)
    {
        return flashcardProgressJpaRepository
                .findByStudentIdAndNextReviewAtLessThanEqual(studentId, now)
                .stream()
                .map(this::toDomain)
                .toList();
    }



    // Conversie domain -> entity
    private FlashcardProgressEntity toEntity(FlashcardProgress domain)
    {
        FlashcardProgressEntity entity = new FlashcardProgressEntity();
        entity.setId(domain.getId());
        entity.setStudentId(domain.getStudentId());
        entity.setEasinessFactor(domain.getEasinessFactor());
        entity.setIntervalDays(domain.getIntervalDays());
        entity.setRepetitionCount(domain.getRepetitionCount());
        entity.setNextReviewAt(domain.getNextReviewAt());
        entity.setLastReviewedAt(domain.getLastReviewedAt());

        FlashcardEntity flashcardEntity = flashcardJpaRepository.findById(domain.getFlashcardId())
                .orElseThrow(() -> new RuntimeException("Flashcard-ul cu id " + domain.getFlashcardId() + " nu exista"));
        entity.setFlashcard(flashcardEntity);

        return entity;
    }

    // Conversie entity -> domain
    private FlashcardProgress toDomain(FlashcardProgressEntity entity)
    {
        FlashcardProgress domain = new FlashcardProgress();
        domain.setId(entity.getId());
        domain.setStudentId(entity.getStudentId());
        domain.setFlashcardId(entity.getFlashcard().getId());
        domain.setEasinessFactor(entity.getEasinessFactor());
        domain.setIntervalDays(entity.getIntervalDays());
        domain.setRepetitionCount(entity.getRepetitionCount());
        domain.setNextReviewAt(entity.getNextReviewAt());
        domain.setLastReviewedAt(entity.getLastReviewedAt());
        return domain;
    }
}