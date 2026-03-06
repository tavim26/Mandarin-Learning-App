package com.chineselearning.contentservice.domain.dao;

import com.chineselearning.contentservice.domain.CourseUnit;

import java.util.List;
import java.util.Optional;

public interface ICourseUnitDao {

    List<CourseUnit> findAllByOrderByOrderIndexAsc();

    Optional<CourseUnit> findById(Long id);

    CourseUnit save(CourseUnit unit);

    void deleteById(Long id);

    boolean existsById(Long id);
}