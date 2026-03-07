package com.chineselearning.chatbotservice.domain;

import java.time.LocalDateTime;

public class ChatMessage {

    private Long id;
    private ChatSession session;
    private String sender;
    private String content;
    private LocalDateTime createdAt;

    public ChatMessage() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    // sessionId in loc de referinta directa la ChatSession — domeniu pur, fara relatii JPA
    public ChatSession getSession() { return session; }
    public void setSession(ChatSession session) { this.session = session; }

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}