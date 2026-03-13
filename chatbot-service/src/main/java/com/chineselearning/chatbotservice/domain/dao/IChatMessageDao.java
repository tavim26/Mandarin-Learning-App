package com.chineselearning.chatbotservice.domain.dao;

import com.chineselearning.chatbotservice.domain.ChatMessage;
import java.util.List;

public interface IChatMessageDao
{

    ChatMessage save(ChatMessage message);

    List<ChatMessage> findBySessionIdOrderByCreatedAtAsc(Long sessionId);

    List<ChatMessage> findRecentBySessionId(Long sessionId, int limit);
}