package com.chineselearning.progressservice.events;

import java.io.Serializable;

/**
 * Event DTO primit cand un nou Student este creat in User Service.
 * Progress Service consuma acest event pentru a crea o "replica" locala, in acest serviciu.
 */
public class StudentCreatedEvent implements Serializable {

    private static final long serialVersionUID = 1L;

    private Long studentId;
    private String fullName;
    private String email;

    public StudentCreatedEvent() {
    }

    public StudentCreatedEvent(Long studentId, String fullName, String email) {
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
        return "StudentCreatedEvent{" +
                "studentId=" + studentId +
                ", fullName='" + fullName + '\'' +
                ", email='" + email + '\'' +
                '}';
    }
}