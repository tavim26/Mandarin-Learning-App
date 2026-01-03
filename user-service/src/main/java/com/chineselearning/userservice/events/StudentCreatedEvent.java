package com.chineselearning.userservice.events;

import java.io.Serializable;

/**
 * Event DTO published when a new Student is created in User Service.
 * This event is consumed by other microservices (Progress, Flashcard, Group, etc.)
 * to maintain a local replica of student identity data.
 *
 * Pattern: Event-Driven Architecture with eventual consistency.
 */
public class StudentCreatedEvent implements Serializable
{

    private static final long serialVersionUID = 1L;

    private Long studentId;
    private String fullName;
    private String email;

    // No-args constructor for Jackson deserialization
    public StudentCreatedEvent()
    {
    }

    // All-args constructor for easy instantiation
    public StudentCreatedEvent(Long studentId, String fullName, String email)
    {
        this.studentId = studentId;
        this.fullName = fullName;
        this.email = email;
    }

    // Manual getters and setters (no Lombok as per project guidelines)

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