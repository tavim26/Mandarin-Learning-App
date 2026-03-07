package com.chineselearning.progressservice.domain;

// Clasa de domeniu pura - zero dependente externe
// Replica locala a datelor din user-service pentru operatii frecvente (XP, nivel, clasament)
public class StudentReplica {

    private Long studentId;
    private Integer xpTotal;
    private Integer level;

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

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public Integer getXpTotal() { return xpTotal; }
    public void setXpTotal(Integer xpTotal) { this.xpTotal = xpTotal; }

    public Integer getLevel() { return level; }
    public void setLevel(Integer level) { this.level = level; }

    // Logica de business a domeniului - adauga XP si recalculeaza nivelul
    public void addXp(Integer xpToAdd) {
        this.xpTotal += xpToAdd;
        recalculateLevel();
    }

    // Formula nivel: fiecare 100 XP = 1 nivel
    public void recalculateLevel() {
        this.level = (this.xpTotal / 100) + 1;
    }
}