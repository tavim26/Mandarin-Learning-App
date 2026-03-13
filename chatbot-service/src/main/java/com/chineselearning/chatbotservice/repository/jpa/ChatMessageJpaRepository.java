package com.chineselearning.chatbotservice.repository.jpa;

import com.chineselearning.chatbotservice.repository.entities.ChatMessageEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatMessageJpaRepository extends JpaRepository<ChatMessageEntity, Long>
{

    List<ChatMessageEntity> findBySessionIdOrderByCreatedAtAsc(Long sessionId);

    List<ChatMessageEntity> findBySessionIdOrderByCreatedAtDesc(Long sessionId, Pageable pageable);
}