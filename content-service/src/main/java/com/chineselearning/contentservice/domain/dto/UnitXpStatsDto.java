package com.chineselearning.contentservice.domain.dto;

public class UnitXpStatsDto {

    private Long unitId;
    private Integer totalXp;

    public UnitXpStatsDto(Long unitId, Integer totalXp) {
        this.unitId = unitId;
        this.totalXp = totalXp;
    }

    public Long getUnitId() { return unitId; }
    public void setUnitId(Long unitId) { this.unitId = unitId; }

    public Integer getTotalXp() { return totalXp; }
    public void setTotalXp(Integer totalXp) { this.totalXp = totalXp; }
}