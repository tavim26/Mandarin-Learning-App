package com.chineselearning.progressservice.domain;

import jakarta.persistence.*;

@Entity
@Table(
        name = "students_replica",
        indexes = {
                @Index(name = "idx_students_xp_leaderboard", columnList = "xp_total DESC")
        }
)
public class StudentReplica {

    @Id
    @Column(name = "student_id")
    private Long studentId;

    @Column(name = "xp_total", nullable = false)
    private Integer xpTotal;

    @Column(name = "level", nullable = false)
    private Integer level;

    // Constructors
    public StudentReplica() {
        this.xpTotal = 0;
        this.level = 1;
    }

    public StudentReplica(Long studentId) {
        this.studentId = studentId;
        this.xpTotal = 0;
        this.level = 1;
    }

    public StudentReplica(Long studentId, Integer xpTotal, Integer level) {
        this.studentId = studentId;
        this.xpTotal = xpTotal;
        this.level = level;
    }

    // Getters and Setters
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

    // Business logic methods
    public void addXp(Integer xpToAdd) {
        this.xpTotal += xpToAdd;
        recalculateLevel();
    }

    public void recalculateLevel() {
        this.level = (this.xpTotal / 1000) + 1;
    }
}