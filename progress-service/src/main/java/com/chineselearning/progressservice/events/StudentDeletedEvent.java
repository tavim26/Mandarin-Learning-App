package com.chineselearning.progressservice.events;

import java.io.Serializable;

/**
 * Event DTO received when a Student is deleted in User Service.
 * Progress Service consumes this event to remove or soft-delete the local replica.
 */
public class StudentDeletedEvent implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long studentId;

    // No-args constructor for Jackson
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