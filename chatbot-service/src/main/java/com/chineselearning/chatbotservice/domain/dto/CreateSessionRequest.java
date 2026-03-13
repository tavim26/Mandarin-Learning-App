package com.chineselearning.chatbotservice.domain.dto;

public class CreateSessionRequest
{
    private String title;

    public CreateSessionRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
}