package com.chineselearning.userservice.domain.dto;

public class StudentDto {
    private Long userId;
    private Integer xpTotal;
    private Integer level;

    public StudentDto() {}

    public StudentDto(Long userId, Integer xpTotal, Integer level) {
        this.userId = userId;
        this.xpTotal = xpTotal;
        this.level = level;
    }

    // Getters and Setters
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Integer getXpTotal() { return xpTotal; }
    public void setXpTotal(Integer xpTotal) { this.xpTotal = xpTotal; }

    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }
}