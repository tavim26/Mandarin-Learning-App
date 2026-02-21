package com.chineselearning.chatbotservice.domain.dto;

import java.time.LocalDateTime;

public class ChatMessageDto
{

    private Long id;
    private Long sessionId;
    private String sender;
    private String content;
    private LocalDateTime createdAt;

    public ChatMessageDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSessionId() { return sessionId; }
    public void setSessionId(Long sessionId) { this.sessionId = sessionId; }

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}