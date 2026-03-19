package com.chineselearning.contentservice.domain.dto;

import java.util.List;

public class CourseUnitFullDto {

    private Long id;
    private String title;
    private String description;
    private Integer hskLevel;
    private Integer orderIndex;
    private List<LessonDto> lessons;

    public CourseUnitFullDto() {}

    public CourseUnitFullDto(Long id, String title, String description, Integer hskLevel, Integer orderIndex, List<LessonDto> lessons) {
        this.id = id;
        this.title = title;
        this.description = description;
        this.hskLevel = hskLevel;
        this.orderIndex = orderIndex;
        this.lessons = lessons;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getHskLevel() { return hskLevel; }
    public void setHskLevel(Integer hskLevel) { this.hskLevel = hskLevel; }

    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }

    public List<LessonDto> getLessons() { return lessons; }
    public void setLessons(List<LessonDto> lessons) { this.lessons = lessons; }
}