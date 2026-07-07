package com.chineselearning.progressservice.domain.dto;

import java.util.List;

public class LessonResponseDto
{

    private Long id;
    private Integer xpReward;

    private List<ExerciseResponseDto> exercises;

    public LessonResponseDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Integer getXpReward() { return xpReward; }
    public void setXpReward(Integer xpReward) { this.xpReward = xpReward; }

    public List<ExerciseResponseDto> getExercises() { return exercises; }
    public void setExercises(List<ExerciseResponseDto> exercises) { this.exercises = exercises; }
}