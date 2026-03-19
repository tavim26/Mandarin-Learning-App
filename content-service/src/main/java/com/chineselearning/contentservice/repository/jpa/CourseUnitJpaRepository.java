package com.chineselearning.contentservice.repository.jpa;

import com.chineselearning.contentservice.repository.entities.CourseUnitEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CourseUnitJpaRepository extends JpaRepository<CourseUnitEntity, Long> {

    List<CourseUnitEntity> findAllByOrderByOrderIndexAsc();

    List<CourseUnitEntity> findByHskLevelOrderByOrderIndexAsc(Integer hskLevel);
}