package com.chineselearning.chatbotservice.repository.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "chat_messages",
        indexes = @Index(name = "idx_chat_messages_session_id", columnList = "session_id"))
public class ChatMessageEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ChatSessionEntity session;

    @Column(name = "sender", nullable = false, length = 20)
    private String sender;

    @Column(name = "content", nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    public ChatMessageEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public ChatSessionEntity getSession() { return session; }
    public void setSession(ChatSessionEntity session) { this.session = session; }

    public String getSender() { return sender; }
    public void setSender(String sender) { this.sender = sender; }

    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}