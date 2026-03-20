package com.chineselearning.chatbotservice.repository.jpa;

import com.chineselearning.chatbotservice.repository.entities.ChatSessionEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatSessionJpaRepository extends JpaRepository<ChatSessionEntity, Long>
{

    List<ChatSessionEntity> findByStudentIdOrderByStartedAtDesc(Long studentId);

    List<ChatSessionEntity> findByStudentIdOrderByStartedAtDesc(Long studentId, Pageable pageable);

    long countByStudentId(Long studentId);

    boolean existsByIdAndStudentId(Long id, Long studentId);
}