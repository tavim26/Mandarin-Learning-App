package com.chineselearning.progressservice.events;

import java.io.Serializable;

/**
 * Event DTO received when a new Student is created in User Service.
 * Progress Service consumes this event to create a local replica.
 *
 * Must match the structure sent by User Service.
 */
public class StudentCreatedEvent implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long studentId;
    private String fullName;
    private String email;

    // No-args constructor for Jackson deserialization
    public StudentCreatedEvent() {
    }

    // All-args constructor
    public StudentCreatedEvent(Long studentId, String fullName, String email) {
        this.studentId = studentId;
        this.fullName = fullName;
        this.email = email;
    }

    // Getters and setters

    public Long getStudentId() {
        return studentId;
    }

    public void setStudentId(Long studentId) {
        this.studentId = studentId;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    @Override
    public String toString() {
        return "StudentCreatedEvent{" +
                "studentId=" + studentId +
                ", fullName='" + fullName + '\'' +
                ", email='" + email + '\'' +
                '}';
    }
}