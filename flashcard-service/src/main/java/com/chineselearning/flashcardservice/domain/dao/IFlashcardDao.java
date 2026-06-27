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

    // Toate cardurile din mai multe seturi dintr-o singura interogare
    List<Flashcard> findBySetIdIn(List<Long> setIds);

    void delete(Flashcard flashcard);
}