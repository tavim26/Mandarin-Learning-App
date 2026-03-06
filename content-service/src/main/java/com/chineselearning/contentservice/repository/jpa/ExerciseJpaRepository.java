package com.chineselearning.contentservice.repository.jpa;

import com.chineselearning.contentservice.repository.entities.ExerciseEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExerciseJpaRepository extends JpaRepository<ExerciseEntity, Long> {

    List<ExerciseEntity> findByLessonId(Long lessonId);
}