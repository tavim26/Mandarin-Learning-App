package com.chineselearning.contentservice.repository.jpa;

import com.chineselearning.contentservice.repository.entities.LessonMaterialEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface LessonMaterialJpaRepository extends JpaRepository<LessonMaterialEntity, Long> {

    List<LessonMaterialEntity> findByLessonId(Long lessonId);
}