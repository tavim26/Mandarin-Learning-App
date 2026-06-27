package com.chineselearning.contentservice.domain;

public class Lesson {

    private Long id;
    private CourseUnit unit;
    private String title;
    private String description;
    private Integer xpReward;
    private Integer orderIndex;

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
}