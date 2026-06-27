package com.chineselearning.flashcardservice.repository.jpa;

import com.chineselearning.flashcardservice.repository.entities.FlashcardProgressEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FlashcardProgressJpaRepository extends JpaRepository<FlashcardProgressEntity, Long>
{

    Optional<FlashcardProgressEntity> findByStudentIdAndFlashcardId(Long studentId, Long flashcardId);

    List<FlashcardProgressEntity> findByStudentIdAndFlashcardIdIn(Long studentId, List<Long> flashcardIds);}