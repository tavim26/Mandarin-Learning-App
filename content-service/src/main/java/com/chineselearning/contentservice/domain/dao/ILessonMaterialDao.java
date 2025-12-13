package com.chineselearning.contentservice.domain.dao;

import com.chineselearning.contentservice.domain.LessonMaterial;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ILessonMaterialDao extends JpaRepository<LessonMaterial, Long> {

    List<LessonMaterial> findByLessonId(Long lessonId);
}