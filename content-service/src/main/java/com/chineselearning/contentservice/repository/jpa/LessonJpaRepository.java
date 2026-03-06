package com.chineselearning.contentservice.repository.jpa;

import com.chineselearning.contentservice.repository.entities.LessonEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonJpaRepository extends JpaRepository<LessonEntity, Long> {

    List<LessonEntity> findByUnitIdOrderByOrderIndexAsc(Long unitId);
}