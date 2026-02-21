package com.chineselearning.chatbotservice.domain.dao;

import com.chineselearning.chatbotservice.domain.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IChatSessionDao extends JpaRepository<ChatSession, Long>
{

    List<ChatSession> findByStudentIdOrderByStartedAtDesc(Long studentId);
}