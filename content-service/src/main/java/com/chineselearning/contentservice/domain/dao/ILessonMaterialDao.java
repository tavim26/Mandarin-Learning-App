package com.chineselearning.contentservice.domain.dao;

import com.chineselearning.contentservice.domain.LessonMaterial;

import java.util.List;
import java.util.Optional;

public interface ILessonMaterialDao {

    List<LessonMaterial> findByLessonId(Long lessonId);

    LessonMaterial save(LessonMaterial material);

    void deleteById(Long id);

    boolean existsById(Long id);

    Optional<LessonMaterial> findById(Long id);
}