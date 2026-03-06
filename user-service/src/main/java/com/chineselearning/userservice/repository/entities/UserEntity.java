package com.chineselearning.userservice.repository.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "users")
public class UserEntity
{
    @Id
    private Long id;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "id")
    private CredentialEntity credential;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private StudentEntity student;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private TeacherEntity teacher;

    public UserEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public CredentialEntity getCredential() { return credential; }
    public void setCredential(CredentialEntity credential) { this.credential = credential; }

    public StudentEntity getStudent() { return student; }
    public void setStudent(StudentEntity student) { this.student = student; }

    public TeacherEntity getTeacher() { return teacher; }
    public void setTeacher(TeacherEntity teacher) { this.teacher = teacher; }
}