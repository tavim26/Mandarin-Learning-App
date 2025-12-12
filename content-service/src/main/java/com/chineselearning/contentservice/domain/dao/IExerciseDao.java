package com.chineselearning.contentservice.domain.dao;

import com.chineselearning.contentservice.domain.Exercise;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IExerciseDao extends JpaRepository<Exercise, Long> {
    List<Exercise> findByLessonId(Long lessonId);
}