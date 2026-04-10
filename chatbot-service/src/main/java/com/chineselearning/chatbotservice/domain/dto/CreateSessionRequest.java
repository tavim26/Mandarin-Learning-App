package com.chineselearning.chatbotservice.domain.dto;

public class CreateSessionRequest
{
    private String title;
    private String customInstructions;

    public CreateSessionRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getCustomInstructions() { return customInstructions; }
    public void setCustomInstructions(String customInstructions) { this.customInstructions = customInstructions; }
}