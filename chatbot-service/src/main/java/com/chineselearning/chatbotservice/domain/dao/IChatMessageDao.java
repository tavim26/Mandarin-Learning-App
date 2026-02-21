package com.chineselearning.chatbotservice.domain.dao;

import com.chineselearning.chatbotservice.domain.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IChatMessageDao extends JpaRepository<ChatMessage, Long>
{

    List<ChatMessage> findBySessionIdOrderByCreatedAtAsc(Long sessionId);

    List<ChatMessage> findTop20BySessionIdOrderByCreatedAtDesc(Long sessionId);
}