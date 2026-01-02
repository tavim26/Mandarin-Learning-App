package com.chineselearning.progressservice.events;

import java.io.Serializable;

/**
 * Event DTO primit atunci cand profilul unui Student primeste update din User Service.
 */
public class StudentUpdatedEvent implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long studentId;
    private String fullName;
    private String email;

    public StudentUpdatedEvent() {
    }

    public StudentUpdatedEvent(Long studentId, String fullName, String email) {
        this.studentId = studentId;
        this.fullName = fullName;
        this.email = email;
    }

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
        return "StudentUpdatedEvent{" +
                "studentId=" + studentId +
                ", fullName='" + fullName + '\'' +
                ", email='" + email + '\'' +
                '}';
    }
}