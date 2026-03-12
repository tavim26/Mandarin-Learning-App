package com.chineselearning.chatbotservice.domain.dto;

public class SendMessageRequest
{
    private String content;

    public SendMessageRequest() {}

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}