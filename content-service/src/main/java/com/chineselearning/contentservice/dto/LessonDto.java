package com.chineselearning.contentservice.dto;

public class LessonDto {
    private Long id;
    private Long unitId; // Referinta doar prin ID, nu obiectul intreg
    private String title;
    private String description;
    private Integer xpReward;
    private Integer orderIndex;

    public LessonDto() {}

    public LessonDto(Long id, Long unitId, String title, String description, Integer xpReward, Integer orderIndex) {
        this.id = id;
        this.unitId = unitId;
        this.title = title;
        this.description = description;
        this.xpReward = xpReward;
        this.orderIndex = orderIndex;
    }

    // Getters si Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUnitId() { return unitId; }
    public void setUnitId(Long unitId) { this.unitId = unitId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getXpReward() { return xpReward; }
    public void setXpReward(Integer xpReward) { this.xpReward = xpReward; }

    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }
}