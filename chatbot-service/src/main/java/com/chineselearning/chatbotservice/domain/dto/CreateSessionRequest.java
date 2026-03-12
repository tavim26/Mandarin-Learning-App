package com.chineselearning.chatbotservice.domain.dto;

public class CreateSessionRequest
{
    private Long studentId;

    private String title;

    public CreateSessionRequest() {}

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
}