package com.chineselearning.chatbotservice.domain;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class ChatSession
{

    private Long id;
    private Long studentId;
    private String title;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private String customInstructions;
    private List<ChatMessage> messages = new ArrayList<>();

    public ChatSession() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getEndedAt() { return endedAt; }
    public void setEndedAt(LocalDateTime endedAt) { this.endedAt = endedAt; }

    public String getCustomInstructions() { return customInstructions; }
    public void setCustomInstructions(String customInstructions) { this.customInstructions = customInstructions; }

    public List<ChatMessage> getMessages() { return messages; }
    public void setMessages(List<ChatMessage> messages) { this.messages = messages; }
}