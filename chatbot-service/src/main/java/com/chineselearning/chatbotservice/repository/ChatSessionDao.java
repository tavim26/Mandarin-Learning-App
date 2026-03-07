package com.chineselearning.chatbotservice.repository;

import com.chineselearning.chatbotservice.domain.ChatSession;
import com.chineselearning.chatbotservice.domain.dao.IChatSessionDao;

import com.chineselearning.chatbotservice.repository.entities.ChatSessionEntity;
import com.chineselearning.chatbotservice.repository.jpa.ChatSessionJpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class ChatSessionDao implements IChatSessionDao {

    private final ChatSessionJpaRepository jpaRepository;

    public ChatSessionDao(ChatSessionJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public ChatSession save(ChatSession session) {
        ChatSessionEntity entity = toEntity(session);
        return toDomain(jpaRepository.save(entity));
    }

    @Override
    public Optional<ChatSession> findById(Long id) {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public boolean existsById(Long id) {
        return jpaRepository.existsById(id);
    }

    @Override
    public List<ChatSession> findByStudentIdOrderByStartedAtDesc(Long studentId) {
        return jpaRepository.findByStudentIdOrderByStartedAtDesc(studentId)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    // Conversie domain -> entity pentru persistenta
    private ChatSessionEntity toEntity(ChatSession session) {
        ChatSessionEntity entity = new ChatSessionEntity();
        entity.setId(session.getId());
        entity.setStudentId(session.getStudentId());
        entity.setTitle(session.getTitle());
        entity.setStartedAt(session.getStartedAt());
        entity.setEndedAt(session.getEndedAt());
        return entity;
    }

    // Conversie entity -> domain, mesajele nu sunt mapate aici pentru a evita lazy loading
    private ChatSession toDomain(ChatSessionEntity entity) {
        ChatSession session = new ChatSession();
        session.setId(entity.getId());
        session.setStudentId(entity.getStudentId());
        session.setTitle(entity.getTitle());
        session.setStartedAt(entity.getStartedAt());
        session.setEndedAt(entity.getEndedAt());
        return session;
    }
}