package com.chineselearning.flashcardservice.domain.dao;

import com.chineselearning.flashcardservice.domain.FlashcardSet;

import java.util.List;
import java.util.Optional;

public interface IFlashcardSetDao
{

    FlashcardSet save(FlashcardSet flashcardSet);

    Optional<FlashcardSet> findById(Long id);

    // Toate seturile unui student, ordonate descrescator dupa id
    List<FlashcardSet> findByStudentIdOrderByIdDesc(Long studentId);

    void delete(FlashcardSet flashcardSet);
}