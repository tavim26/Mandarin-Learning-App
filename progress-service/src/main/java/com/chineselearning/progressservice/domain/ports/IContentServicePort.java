package com.chineselearning.progressservice.domain.ports;

import com.chineselearning.progressservice.domain.dto.ExerciseResponseDto;
import com.chineselearning.progressservice.domain.dto.LessonResponseDto;

public interface IContentServicePort
{
    ExerciseResponseDto getExercise(Long exerciseId);
    LessonResponseDto getLesson(Long lessonId);
}