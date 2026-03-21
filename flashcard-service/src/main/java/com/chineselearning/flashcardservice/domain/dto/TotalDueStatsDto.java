package com.chineselearning.flashcardservice.domain.dto;

import java.util.List;

public class TotalDueStatsDto {

    private Integer totalDue;
    private List<DueCountBySetDto> bySet;

    public TotalDueStatsDto() {}

    public Integer getTotalDue() { return totalDue; }
    public void setTotalDue(Integer totalDue) { this.totalDue = totalDue; }

    public List<DueCountBySetDto> getBySet() { return bySet; }
    public void setBySet(List<DueCountBySetDto> bySet) { this.bySet = bySet; }
}