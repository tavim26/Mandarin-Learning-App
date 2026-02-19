package com.chineselearning.userservice.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class User
{
    @Id
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id") // Cheia straina care este si cheie primara
    private Credential credential;


    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Student student;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private Teacher teacher;

    public User() {}

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Credential getCredential() { return credential; }
    public void setCredential(Credential credential) { this.credential = credential; }

    public Student getStudent() { return student; }
    public void setStudent(Student student) {
        this.student = student;
        if (student != null) {
            student.setUser(this);
        }
    }

    public Teacher getTeacher() { return teacher; }
    public void setTeacher(Teacher teacher) {
        this.teacher = teacher;
        if (teacher != null) {
            teacher.setUser(this);
        }
    }
}