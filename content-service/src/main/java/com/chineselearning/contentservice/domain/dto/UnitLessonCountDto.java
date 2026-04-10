package com.chineselearning.contentservice.domain.dto;

public class UnitLessonCountDto {

    private Long unitId;
    private Integer totalLessons;

    public UnitLessonCountDto(Long unitId, Integer totalLessons) {
        this.unitId = unitId;
        this.totalLessons = totalLessons;
    }

    public Long getUnitId() { return unitId; }
    public void setUnitId(Long unitId) { this.unitId = unitId; }

    public Integer getTotalLessons() { return totalLessons; }
    public void setTotalLessons(Integer totalLessons) { this.totalLessons = totalLessons; }
}