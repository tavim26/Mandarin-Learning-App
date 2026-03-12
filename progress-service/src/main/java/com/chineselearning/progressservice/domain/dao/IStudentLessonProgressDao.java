package com.chineselearning.progressservice.domain.dao;

import com.chineselearning.progressservice.domain.StudentLessonProgress;

import java.util.List;
import java.util.Optional;

public interface IStudentLessonProgressDao
{
    StudentLessonProgress save(StudentLessonProgress progress);

    // Progresul unui student la o lectie specifica
    Optional<StudentLessonProgress> findByStudentIdAndLessonId(Long studentId, Long lessonId);

    // Tot progresul unui student pentru toate lectiile incepute
    List<StudentLessonProgress> findByStudentId(Long studentId);

    // Doar lectiile cu un anumit status pentru un student
    List<StudentLessonProgress> findByStudentIdAndStatus(Long studentId, String status);

    // Top 10 studenti dupa procentul de completare pentru o lectie specifica
    List<StudentLessonProgress> findTop10ByLessonIdOrderByCompletionPctDesc(Long lessonId);
}