package com.chineselearning.contentservice.domain.dao;

import com.chineselearning.contentservice.domain.Exercise;

import java.util.List;
import java.util.Optional;

public interface IExerciseDao {

    List<Exercise> findByLessonId(Long lessonId);

    Optional<Exercise> findById(Long id);

    Exercise save(Exercise exercise);

    void deleteById(Long id);

    boolean existsById(Long id);
}