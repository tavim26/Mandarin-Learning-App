package com.chineselearning.userservice.domain;

public class User
{
    private Long id;
    private String fullName;
    private Credential credential;
    private Student student;
    private Teacher teacher;

    public User() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }

    public Credential getCredential() { return credential; }
    public void setCredential(Credential credential) { this.credential = credential; }

    public Student getStudent() { return student; }
    public void setStudent(Student student)
    {
        this.student = student;
        if (student != null)
        {
            student.setUser(this);
        }
    }

    public Teacher getTeacher() { return teacher; }
    public void setTeacher(Teacher teacher)
    {
        this.teacher = teacher;
        if (teacher != null)
        {
            teacher.setUser(this);
        }
    }
}