package com.chineselearning.progressservice.domain.ports;

import com.chineselearning.progressservice.domain.dto.ExerciseResponseDto;
import com.chineselearning.progressservice.domain.dto.LessonResponseDto;

import java.util.List;

public interface IContentServicePort
{
    ExerciseResponseDto getExercise(Long exerciseId);
    LessonResponseDto getLesson(Long lessonId);

    // Returneaza lista lectiilor dintr-o unitate (fara exercises populate)
    List<LessonResponseDto> getLessonsForUnit(Long unitId);
}