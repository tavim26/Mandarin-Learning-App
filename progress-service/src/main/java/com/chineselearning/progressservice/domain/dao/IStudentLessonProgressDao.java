package com.chineselearning.progressservice.domain.dao;

import com.chineselearning.progressservice.domain.StudentLessonProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IStudentLessonProgressDao extends JpaRepository<StudentLessonProgress, StudentLessonProgress.StudentLessonProgressId> {


    Optional<StudentLessonProgress> findByStudentIdAndLessonId(Long studentId, Long lessonId);


    List<StudentLessonProgress> findByStudentId(Long studentId);


    List<StudentLessonProgress> findByLessonIdOrderByCompletionPctDesc(Long lessonId);


    List<StudentLessonProgress> findByStudentIdAndStatus(Long studentId, String status);
}