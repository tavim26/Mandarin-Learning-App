package com.chineselearning.chatbotservice.domain.dto;

import java.time.LocalDateTime;

public class SendMessageResponse
{

    private ChatMessageDto userMessage;
    private ChatMessageDto aiMessage;

    public SendMessageResponse() {}

    public ChatMessageDto getUserMessage() { return userMessage; }
    public void setUserMessage(ChatMessageDto userMessage) { this.userMessage = userMessage; }

    public ChatMessageDto getAiMessage() { return aiMessage; }
    public void setAiMessage(ChatMessageDto aiMessage) { this.aiMessage = aiMessage; }
}