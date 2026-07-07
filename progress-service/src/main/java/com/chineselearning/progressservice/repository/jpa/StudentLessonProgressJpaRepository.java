package com.chineselearning.progressservice.repository.jpa;

import com.chineselearning.progressservice.repository.entities.StudentLessonProgressEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentLessonProgressJpaRepository extends JpaRepository<StudentLessonProgressEntity, Long>
{

    Optional<StudentLessonProgressEntity> findByStudentIdAndLessonId(Long studentId, Long lessonId);

    List<StudentLessonProgressEntity> findByStudentId(Long studentId);

    List<StudentLessonProgressEntity> findByStudentIdAndStatus(Long studentId, String status);

    List<StudentLessonProgressEntity> findTop10ByLessonIdOrderByCompletionPctDesc(Long lessonId);

    long countByStudentIdAndStatus(Long studentId, String status);

    List<StudentLessonProgressEntity> findByStudentIdAndLessonIdIn(Long studentId, List<Long> lessonIds);
}