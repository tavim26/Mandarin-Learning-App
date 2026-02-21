package com.chineselearning.chatbotservice.domain.dto;

import jakarta.validation.constraints.NotBlank;

public class SendMessageRequest
{

    @NotBlank
    private String content;

    public SendMessageRequest() {}

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}