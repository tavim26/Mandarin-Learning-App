package com.chineselearning.contentservice.domain.dao;

import com.chineselearning.contentservice.domain.Lesson;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ILessonDao extends JpaRepository<Lesson, Long> {

    List<Lesson> findByUnitIdOrderByOrderIndexAsc(Long unitId);
}