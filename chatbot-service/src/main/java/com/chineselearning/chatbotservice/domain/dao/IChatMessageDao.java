package com.chineselearning.chatbotservice.domain.dao;

import com.chineselearning.chatbotservice.domain.ChatMessage;
import java.util.List;

public interface IChatMessageDao
{

    ChatMessage save(ChatMessage message);

    List<ChatMessage> findBySessionIdOrderByCreatedAtAsc(Long sessionId);

    List<ChatMessage> findBySessionIdOrderByCreatedAtAsc(Long sessionId, int page, int size);

    List<ChatMessage> findRecentBySessionId(Long sessionId, int limit);

    int countBySessionId(Long sessionId);

    long countTotalBySessionId(Long sessionId);
}