package com.chineselearning.flashcardservice.domain.dao;

import com.chineselearning.flashcardservice.domain.FlashcardProgress;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface IFlashcardProgressDao
{

    FlashcardProgress save(FlashcardProgress flashcardProgress);

    // Starea SM-2 pentru o pereche unica (student, flashcard)
    Optional<FlashcardProgress> findByStudentIdAndFlashcardId(Long studentId, Long flashcardId);


    // Progresul existent pentru o lista de flashcard-uri — folosit pentru a identifica cardurile nevazute
    List<FlashcardProgress> findByStudentIdAndFlashcardIdIn(Long studentId, List<Long> flashcardIds);
}