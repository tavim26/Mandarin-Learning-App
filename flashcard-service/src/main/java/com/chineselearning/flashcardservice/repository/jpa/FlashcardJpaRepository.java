package com.chineselearning.flashcardservice.repository.jpa;

import com.chineselearning.flashcardservice.repository.entities.FlashcardEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FlashcardJpaRepository extends JpaRepository<FlashcardEntity, Long>
{

    List<FlashcardEntity> findBySetId(Long setId);
}