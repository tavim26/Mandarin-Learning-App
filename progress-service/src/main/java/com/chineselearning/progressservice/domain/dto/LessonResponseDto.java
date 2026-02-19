package com.chineselearning.progressservice.domain.dto;

import java.util.List;

// DTO folosit exclusiv pentru deserializarea raspunsurilor HTTP de la content-service
// Nu este expus prin niciun endpoint al progress-service
public class LessonResponseDto {

    private Long id;
    private Integer xpReward;

    // Lista de exercitii inclusa in raspunsul GET /lessons/{id} din content-service
    private List<ExerciseResponseDto> exercises;

    public LessonResponseDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getXpReward() { return xpReward; }
    public void setXpReward(Integer xpReward) { this.xpReward = xpReward; }

    public List<ExerciseResponseDto> getExercises() { return exercises; }
    public void setExercises(List<ExerciseResponseDto> exercises) { this.exercises = exercises; }
}