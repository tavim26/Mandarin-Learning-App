package com.chineselearning.contentservice.domain;

public class CourseUnit {

    private Long id;
    private String title;
    private String description;
    private Integer hskLevel;
    private Integer orderIndex;
    private Long createdByTeacherId;

    public CourseUnit() {}

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

    public Long getCreatedByTeacherId() { return createdByTeacherId; }
    public void setCreatedByTeacherId(Long createdByTeacherId) { this.createdByTeacherId = createdByTeacherId; }
}