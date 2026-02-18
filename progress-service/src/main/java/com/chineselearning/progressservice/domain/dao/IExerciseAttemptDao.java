package com.chineselearning.progressservice.domain.dao;

import com.chineselearning.progressservice.domain.ExerciseAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IExerciseAttemptDao extends JpaRepository<ExerciseAttempt, Long>
{

    // Count total attempts for a specific student on a specific exercise
    // Used to calculate next attempt_number
    int countByStudentIdAndExerciseId(Long studentId, Long exerciseId);

    // Get all attempts for a specific student on a specific exercise
    List<ExerciseAttempt> findByStudentIdAndExerciseIdOrderByAttemptNumberAsc(Long studentId, Long exerciseId);

    // Count distinct exercises answered correctly by student from a given list
    // Used for lesson completion percentage calculation
    @Query("SELECT COUNT(DISTINCT ea.exerciseId) FROM ExerciseAttempt ea " +
            "WHERE ea.studentId = :studentId " +
            "AND ea.exerciseId IN :exerciseIds " +
            "AND ea.isCorrect = true")
    long countDistinctCorrectExercises(@Param("studentId") Long studentId,
                                       @Param("exerciseIds") List<Long> exerciseIds);
}