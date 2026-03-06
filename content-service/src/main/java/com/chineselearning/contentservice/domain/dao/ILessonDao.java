package com.chineselearning.contentservice.domain.dao;

import com.chineselearning.contentservice.domain.Lesson;

import java.util.List;
import java.util.Optional;

public interface ILessonDao {

    List<Lesson> findByUnitIdOrderByOrderIndexAsc(Long unitId);

    Optional<Lesson> findById(Long id);

    Lesson save(Lesson lesson);

    void deleteById(Long id);

    boolean existsById(Long id);
}