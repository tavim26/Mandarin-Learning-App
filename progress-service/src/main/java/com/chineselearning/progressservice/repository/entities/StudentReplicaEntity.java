package com.chineselearning.progressservice.repository.entities;

import jakarta.persistence.*;

@Entity
@Table(
        name = "students_replica",
        indexes = {
                @Index(name = "idx_students_xp_leaderboard", columnList = "xp_total DESC")
        }
)
public class StudentReplicaEntity {

    @Id
    @Column(name = "student_id")
    private Long studentId;

    @Column(name = "xp_total", nullable = false)
    private Integer xpTotal;

    @Column(name = "level", nullable = false)
    private Integer level;

    public StudentReplicaEntity() {}

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public Integer getXpTotal() { return xpTotal; }
    public void setXpTotal(Integer xpTotal) { this.xpTotal = xpTotal; }

    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }
}