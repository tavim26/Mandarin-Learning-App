package com.chineselearning.flashcardservice.domain.dao;

import com.chineselearning.flashcardservice.domain.Flashcard;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface IFlashcardDao extends JpaRepository<Flashcard, Long> {

    List<Flashcard> findBySetId(Long setId);
}