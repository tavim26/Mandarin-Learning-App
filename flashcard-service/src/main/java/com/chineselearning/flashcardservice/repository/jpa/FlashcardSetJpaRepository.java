package com.chineselearning.flashcardservice.repository.jpa;

import com.chineselearning.flashcardservice.repository.entities.FlashcardSetEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FlashcardSetJpaRepository extends JpaRepository<FlashcardSetEntity, Long>
{

    List<FlashcardSetEntity> findByStudentIdOrderByIdDesc(Long studentId);
}