package com.chineselearning.chatbotservice.domain.dto;// DUPĂ
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class SendMessageRequest
{
    @NotBlank(message = "Message content must not be blank.")
    @Size(max = 4000, message = "Message content must not exceed 4000 characters.")
    private String content;

    public SendMessageRequest() {}

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
}