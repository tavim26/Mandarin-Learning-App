package com.chineselearning.progressservice.domain.dao;

import com.chineselearning.progressservice.domain.ExerciseAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IExerciseAttemptDao extends JpaRepository<ExerciseAttempt, Long> {

    /**
     * Count total attempts for a specific student and exercise.
     */
    long countByStudentIdAndExerciseId(Long studentId, Long exerciseId);

    /**
     * Find all attempts for a specific exercise by a student (ordered by attempt number).
     */
    List<ExerciseAttempt> findByStudentIdAndExerciseIdOrderByAttemptNumberAsc(Long studentId, Long exerciseId);

    /**
     * Find all attempts by a student (recent first).
     */
    List<ExerciseAttempt> findByStudentIdOrderBySubmittedAtDesc(Long studentId);

    /**
     * Count distinct exercises with correct attempts for a student in a specific lesson.
     * This is used to calculate lesson completion percentage.
     */
    @Query("SELECT COUNT(DISTINCT ea.exerciseId) FROM ExerciseAttempt ea " +
            "WHERE ea.studentId = :studentId " +
            "AND ea.exerciseId IN :exerciseIds " +
            "AND ea.isCorrect = true")
    long countDistinctCorrectExercises(@Param("studentId") Long studentId,
                                       @Param("exerciseIds") List<Long> exerciseIds);
}