package com.chineselearning.flashcardservice.domain.dao;

import com.chineselearning.flashcardservice.domain.Flashcard;

import java.util.List;
import java.util.Optional;

public interface IFlashcardDao
{

    Flashcard save(Flashcard flashcard);

    Optional<Flashcard> findById(Long id);

    // Toate cardurile dintr-un set
    List<Flashcard> findBySetId(Long setId);

    void delete(Flashcard flashcard);
}