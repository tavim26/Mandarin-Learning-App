package com.chineselearning.flashcardservice.domain.dto;

public class DueCountBySetDto {

    private Long setId;
    private String setTitle;
    private Integer dueCount;

    public DueCountBySetDto() {}

    public Long getSetId() { return setId; }
    public void setSetId(Long setId) { this.setId = setId; }

    public String getSetTitle() { return setTitle; }
    public void setSetTitle(String setTitle) { this.setTitle = setTitle; }

    public Integer getDueCount() { return dueCount; }
    public void setDueCount(Integer dueCount) { this.dueCount = dueCount; }
}