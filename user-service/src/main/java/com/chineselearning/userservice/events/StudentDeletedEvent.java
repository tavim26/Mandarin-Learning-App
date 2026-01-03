package com.chineselearning.userservice.events;

import java.io.Serializable;

/**
 * Event DTO published when a Student is deleted in User Service.
 * Consumer services use this to remove or soft-delete their local replica.
 *
 * Pattern: Event-Driven Architecture with eventual consistency.
 */
public class StudentDeletedEvent implements Serializable
{

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