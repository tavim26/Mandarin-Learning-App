package com.chineselearning.flashcardservice.domain.dao;

import com.chineselearning.flashcardservice.domain.FlashcardSet;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IFlashcardSetDao extends JpaRepository<FlashcardSet, Long> {

    List<FlashcardSet> findByStudentIdOrderByIdDesc(Long studentId);
}