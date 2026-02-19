package com.chineselearning.contentservice.domain.dao;

import com.chineselearning.contentservice.domain.CourseUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;


@Repository
public interface ICourseUnitDao extends JpaRepository<CourseUnit, Long> {

    List<CourseUnit> findAllByOrderByOrderIndexAsc();
}