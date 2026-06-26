package com.chineselearning.chatbotservice.repository;

import com.chineselearning.chatbotservice.domain.ChatMessage;
import com.chineselearning.chatbotservice.domain.ChatSession;
import com.chineselearning.chatbotservice.domain.dao.IChatMessageDao;

import com.chineselearning.chatbotservice.repository.entities.ChatMessageEntity;
import com.chineselearning.chatbotservice.repository.entities.ChatSessionEntity;
import com.chineselearning.chatbotservice.repository.jpa.ChatMessageJpaRepository;
import com.chineselearning.chatbotservice.repository.jpa.ChatSessionJpaRepository;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

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
    public List<ChatMessage> findRecentBySessionId(Long sessionId, int limit)
    {
        Pageable pageable = PageRequest.of(0, limit);
        return jpaRepository.findBySessionIdOrderByCreatedAtDesc(sessionId, pageable)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public long countBySessionId(Long sessionId)
    {
        return jpaRepository.countBySessionId(sessionId);
    }


    @Override
    public List<ChatMessage> findBySessionIdOrderByCreatedAtAsc(Long sessionId, int page, int size)
    {
        Pageable pageable = PageRequest.of(page, size);
        return jpaRepository.findBySessionIdOrderByCreatedAtAsc(sessionId, pageable)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public List<ChatMessage> findLastMessageBySessionId(Long sessionId)
    {
        return jpaRepository.findLastMessageBySessionId(sessionId)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public long countTotalBySessionId(Long sessionId)
    {
        return jpaRepository.countBySessionId(sessionId);
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

        ChatSessionEntity sessionEntity = entity.getSession();
        ChatSession session = new ChatSession();
        session.setId(sessionEntity.getId());
        session.setStudentId(sessionEntity.getStudentId());
        session.setTitle(sessionEntity.getTitle());
        session.setStartedAt(sessionEntity.getStartedAt());
        session.setEndedAt(sessionEntity.getEndedAt());
        message.setSession(session);

        return message;
    }
}