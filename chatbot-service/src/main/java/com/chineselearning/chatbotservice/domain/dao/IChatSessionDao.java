package com.chineselearning.chatbotservice.domain.dao;

import com.chineselearning.chatbotservice.domain.ChatSession;
import java.util.List;
import java.util.Optional;

public interface IChatSessionDao
{

    ChatSession save(ChatSession session);

    Optional<ChatSession> findById(Long id);

    boolean existsById(Long id);

    List<ChatSession> findByStudentIdOrderByStartedAtDesc(Long studentId);

    List<ChatSession> findByStudentIdOrderByStartedAtDesc(Long studentId, int page, int size);

    long countByStudentId(Long studentId);

    void deleteById(Long id);

    boolean existsByIdAndStudentId(Long id, Long studentId);
}