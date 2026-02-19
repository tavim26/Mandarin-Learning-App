package com.chineselearning.progressservice.domain.dto;

public class StudentReplicaDto
{

    private Long studentId;
    private Integer xpTotal;
    private Integer level;

    public StudentReplicaDto() {}

    public StudentReplicaDto(Long studentId, Integer xpTotal, Integer level) {
        this.studentId = studentId;
        this.xpTotal = xpTotal;
        this.level = level;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public Integer getXpTotal() {
        return xpTotal;
    }

    public void setXpTotal(Integer xpTotal) {
        this.xpTotal = xpTotal;
    }

    public Integer getLevel() {
        return level;
    }

    public void setLevel(Integer level) {
        this.level = level;
    }
}