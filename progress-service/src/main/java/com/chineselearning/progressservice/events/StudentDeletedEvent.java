package com.chineselearning.progressservice.events;

import java.io.Serializable;

/**
 * Event DTO primit atunci cand un Student este  sters din User Service.
 */
public class StudentDeletedEvent implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long studentId;

    public StudentDeletedEvent() {
    }

    public StudentDeletedEvent(Long studentId) {
        this.studentId = studentId;
    }

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    @Override
    public String toString() {
        return "StudentDeletedEvent{" +
                "studentId=" + studentId +
                '}';
    }
}