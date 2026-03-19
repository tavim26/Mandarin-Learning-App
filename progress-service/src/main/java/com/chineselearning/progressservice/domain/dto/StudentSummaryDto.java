package com.chineselearning.progressservice.domain.dto;

public class StudentSummaryDto
{
    private Long studentId;
    private Integer xpTotal;
    private Integer level;
    private long completedLessonsCount;
    private long inProgressLessonsCount;

    public StudentSummaryDto() {}

    public StudentSummaryDto(Long studentId, Integer xpTotal, Integer level,
                             long completedLessonsCount, long inProgressLessonsCount)
    {
        this.studentId = studentId;
        this.xpTotal = xpTotal;
        this.level = level;
        this.completedLessonsCount = completedLessonsCount;
        this.inProgressLessonsCount = inProgressLessonsCount;
    }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public Integer getXpTotal() { return xpTotal; }
    public void setXpTotal(Integer xpTotal) { this.xpTotal = xpTotal; }

    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }

    public long getCompletedLessonsCount() { return completedLessonsCount; }
    public void setCompletedLessonsCount(long completedLessonsCount) { this.completedLessonsCount = completedLessonsCount; }

    public long getInProgressLessonsCount() { return inProgressLessonsCount; }
    public void setInProgressLessonsCount(long inProgressLessonsCount) { this.inProgressLessonsCount = inProgressLessonsCount; }
}