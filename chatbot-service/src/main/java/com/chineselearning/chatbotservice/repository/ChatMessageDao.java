package com.chineselearning.chatbotservice.repository;

import com.chineselearning.chatbotservice.domain.ChatMessage;
import com.chineselearning.chatbotservice.domain.ChatSession;
import com.chineselearning.chatbotservice.domain.dao.IChatMessageDao;

import com.chineselearning.chatbotservice.repository.entities.ChatMessageEntity;
import com.chineselearning.chatbotservice.repository.entities.ChatSessionEntity;
import com.chineselearning.chatbotservice.repository.jpa.ChatMessageJpaRepository;
import com.chineselearning.chatbotservice.repository.jpa.ChatSessionJpaRepository;

import jakarta.persistence.EntityNotFoundException;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public class ChatMessageDao implements IChatMessageDao
{

    private final ChatMessageJpaRepository jpaRepository;
    private final ChatSessionJpaRepository sessionJpaRepository;

    public ChatMessageDao(ChatMessageJpaRepository jpaRepository, ChatSessionJpaRepository sessionJpaRepository)
    {
        this.jpaRepository = jpaRepository;
        this.sessionJpaRepository = sessionJpaRepository;
    }

    @Override
    public ChatMessage save(ChatMessage message)
    {
        ChatMessageEntity entity = toEntity(message);
        return toDomain(jpaRepository.save(entity));
    }

    @Override
    public List<ChatMessage> findBySessionIdOrderByCreatedAtAsc(Long sessionId)
    {
        return jpaRepository.findBySessionIdOrderByCreatedAtAsc(sessionId)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<ChatMessage> findTop20BySessionIdOrderByCreatedAtDesc(Long sessionId)
    {
        return jpaRepository.findTop20BySessionIdOrderByCreatedAtDesc(sessionId)
                .stream()
                .map(this::toDomain)
                .toList();
    }






    private ChatMessageEntity toEntity(ChatMessage message)
    {
        ChatSessionEntity sessionEntity = sessionJpaRepository.findById(message.getSession().getId())
                .orElseThrow(() -> new EntityNotFoundException("Sesiunea cu id " + message.getSession().getId() + " nu exista."));

        ChatMessageEntity entity = new ChatMessageEntity();
        entity.setId(message.getId());
        entity.setSession(sessionEntity);
        entity.setSender(message.getSender());
        entity.setContent(message.getContent());
        entity.setCreatedAt(message.getCreatedAt());
        return entity;
    }

    private ChatMessage toDomain(ChatMessageEntity entity)
    {
        ChatMessage message = new ChatMessage();
        message.setId(entity.getId());
        message.setSender(entity.getSender());
        message.setContent(entity.getContent());
        message.setCreatedAt(entity.getCreatedAt());

        ChatSession session = new ChatSession();
        session.setId(entity.getSession().getId());
        message.setSession(session);

        return message;
    }
}