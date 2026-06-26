package com.chineselearning.chatbotservice.repository.jpa;

import com.chineselearning.chatbotservice.repository.entities.ChatMessageEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageJpaRepository extends JpaRepository<ChatMessageEntity, Long>
{

    List<ChatMessageEntity> findBySessionIdOrderByCreatedAtAsc(Long sessionId);

    List<ChatMessageEntity> findBySessionIdOrderByCreatedAtAsc(Long sessionId, Pageable pageable);

    List<ChatMessageEntity> findBySessionIdOrderByCreatedAtDesc(Long sessionId, Pageable pageable);

    @Query("SELECT m FROM ChatMessageEntity m WHERE m.session.id = :sessionId ORDER BY m.createdAt DESC LIMIT 1")
    List<ChatMessageEntity> findLastMessageBySessionId(@Param("sessionId") Long sessionId);

    long countBySessionId(Long sessionId);
}