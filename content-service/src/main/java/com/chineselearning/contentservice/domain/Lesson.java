package com.chineselearning.contentservice.domain;

import java.util.ArrayList;
import java.util.List;

public class Lesson {

    private Long id;
    private CourseUnit unit;
    private String title;
    private String description;
    private Integer xpReward;
    private Integer orderIndex;
    private List<Exercise> exercises = new ArrayList<>();
    private List<LessonMaterial> materials = new ArrayList<>();

    public Lesson() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CourseUnit getUnit() { return unit; }
    public void setUnit(CourseUnit unit) { this.unit = unit; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getXpReward() { return xpReward; }
    public void setXpReward(Integer xpReward) { this.xpReward = xpReward; }

    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }

    public List<Exercise> getExercises() { return exercises; }
    public void setExercises(List<Exercise> exercises) { this.exercises = exercises; }

    public List<LessonMaterial> getMaterials() { return materials; }
    public void setMaterials(List<LessonMaterial> materials) { this.materials = materials; }
}