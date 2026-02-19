package com.chineselearning.progressservice.domain.dao;

import com.chineselearning.progressservice.domain.StudentLessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IStudentLessonProgressDao extends JpaRepository<StudentLessonProgress, Long>
{

    Optional<StudentLessonProgress> findByStudentIdAndLessonId(Long studentId, Long lessonId);

    List<StudentLessonProgress> findByStudentId(Long studentId);

    List<StudentLessonProgress> findByStudentIdAndStatus(Long studentId, String status);

    List<StudentLessonProgress> findTop10ByLessonIdOrderByCompletionPctDesc(Long lessonId);
}