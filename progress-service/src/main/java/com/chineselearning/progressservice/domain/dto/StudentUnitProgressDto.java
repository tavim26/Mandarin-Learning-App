package com.chineselearning.progressservice.domain.dto;

import java.math.BigDecimal;

public class StudentUnitProgressDto
{
    private Long unitId;
    private Long studentId;
    private int totalLessons;
    private long completedLessons;
    private long inProgressLessons;
    private long notStartedLessons;
    private BigDecimal unitCompletionPct;

    public StudentUnitProgressDto() {}

    public StudentUnitProgressDto(Long unitId, Long studentId, int totalLessons,
                                  long completedLessons, long inProgressLessons,
                                  long notStartedLessons, BigDecimal unitCompletionPct)
    {
        this.unitId = unitId;
        this.studentId = studentId;
        this.totalLessons = totalLessons;
        this.completedLessons = completedLessons;
        this.inProgressLessons = inProgressLessons;
        this.notStartedLessons = notStartedLessons;
        this.unitCompletionPct = unitCompletionPct;
    }

    public Long getUnitId() { return unitId; }
    public void setUnitId(Long unitId) { this.unitId = unitId; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public int getTotalLessons() { return totalLessons; }
    public void setTotalLessons(int totalLessons) { this.totalLessons = totalLessons; }

    public long getCompletedLessons() { return completedLessons; }
    public void setCompletedLessons(long completedLessons) { this.completedLessons = completedLessons; }

    public long getInProgressLessons() { return inProgressLessons; }
    public void setInProgressLessons(long inProgressLessons) { this.inProgressLessons = inProgressLessons; }

    public long getNotStartedLessons() { return notStartedLessons; }
    public void setNotStartedLessons(long notStartedLessons) { this.notStartedLessons = notStartedLessons; }

    public BigDecimal getUnitCompletionPct() { return unitCompletionPct; }
    public void setUnitCompletionPct(BigDecimal unitCompletionPct) { this.unitCompletionPct = unitCompletionPct; }
}