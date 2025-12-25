package com.chineselearning.contentservice.domain.dao;

import com.chineselearning.contentservice.domain.CourseUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

// am definit doar metode custom, cum este cea de mai jos
// datorita tehnologiei, nu este necesar sa definesc in interfete metodele generice CRUD: save(entity), saveAll(entities), delete(entity), findById(id), etc.
@Repository
public interface ICourseUnitDao extends JpaRepository<CourseUnit, Long> {

    //la runtime, Java Spring realizeaza automat implementarea metodelor custom definite, pe baza denumirii lor.
    List<CourseUnit> findAllByOrderByOrderIndexAsc(); // echivalent cu: SELECT * FROM course_units ORDER BY order_index ASC
}