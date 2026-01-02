package com.chineselearning.progressservice.domain.dao;

import com.chineselearning.progressservice.domain.StudentLessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IStudentLessonProgressDao extends JpaRepository<StudentLessonProgress, StudentLessonProgress.StudentLessonProgressId> {

    /**
     * Find progress record by composite key.
     */
    Optional<StudentLessonProgress> findByStudentIdAndLessonId(Long studentId, Long lessonId);

    /**
     * Find all progress records for a specific student.
     */
    List<StudentLessonProgress> findByStudentId(Long studentId);

    /**
     * Find all students' progress for a specific lesson (for leaderboard).
     */
    List<StudentLessonProgress> findByLessonIdOrderByCompletionPctDesc(Long lessonId);

    /**
     * Find progress by student and status (e.g., all IN_PROGRESS lessons).
     */
    List<StudentLessonProgress> findByStudentIdAndStatus(Long studentId, String status);
}