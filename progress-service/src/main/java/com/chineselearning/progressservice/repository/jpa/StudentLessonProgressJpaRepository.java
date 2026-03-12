package com.chineselearning.progressservice.repository.jpa;

import com.chineselearning.progressservice.repository.entities.StudentLessonProgressEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface StudentLessonProgressJpaRepository extends JpaRepository<StudentLessonProgressEntity, Long>
{

    // Progresul unui student la o lectie specifica
    Optional<StudentLessonProgressEntity> findByStudentIdAndLessonId(Long studentId, Long lessonId);

    // Tot progresul unui student pentru toate lectiile incepute
    List<StudentLessonProgressEntity> findByStudentId(Long studentId);

    // Doar lectiile cu un anumit status pentru un student
    List<StudentLessonProgressEntity> findByStudentIdAndStatus(Long studentId, String status);

    // Top 10 studenti dupa procentul de completare pentru o lectie specifica
    List<StudentLessonProgressEntity> findTop10ByLessonIdOrderByCompletionPctDesc(Long lessonId);
}