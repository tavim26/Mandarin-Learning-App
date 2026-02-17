package com.chineselearning.progressservice.domain.dao;

import com.chineselearning.progressservice.domain.StudentLessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface IStudentLessonProgressDao extends JpaRepository<StudentLessonProgress, Long> {

    // Lookup progress for a specific student on a specific lesson
    Optional<StudentLessonProgress> findByStudentIdAndLessonId(Long studentId, Long lessonId);

    // Get all lesson progress records for a student
    List<StudentLessonProgress> findByStudentId(Long studentId);

    // Get only in-progress lessons for a student
    List<StudentLessonProgress> findByStudentIdAndStatus(Long studentId, String status);

    // Leaderboard: top 10 students by completion for a specific lesson
    List<StudentLessonProgress> findTop10ByLessonIdOrderByCompletionPctDesc(Long lessonId);
}