package com.chineselearning.contentservice.domain.dto;

import java.util.Map;

public class LessonExerciseTypesDto {

    private Long lessonId;
    private Map<String, Long> exerciseTypes;

    public LessonExerciseTypesDto(Long lessonId, Map<String, Long> exerciseTypes) {
        this.lessonId = lessonId;
        this.exerciseTypes = exerciseTypes;
    }

    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }

    public Map<String, Long> getExerciseTypes() { return exerciseTypes; }
    public void setExerciseTypes(Map<String, Long> exerciseTypes) { this.exerciseTypes = exerciseTypes; }
}