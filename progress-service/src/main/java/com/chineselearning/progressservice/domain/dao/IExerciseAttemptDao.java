package com.chineselearning.progressservice.domain.dao;

import com.chineselearning.progressservice.domain.ExerciseAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IExerciseAttemptDao extends JpaRepository<ExerciseAttempt, Long> {


    long countByStudentIdAndExerciseId(Long studentId, Long exerciseId);


    List<ExerciseAttempt> findByStudentIdAndExerciseIdOrderByAttemptNumberAsc(Long studentId, Long exerciseId);


    List<ExerciseAttempt> findByStudentIdOrderBySubmittedAtDesc(Long studentId);


    @Query("SELECT COUNT(DISTINCT ea.exerciseId) FROM ExerciseAttempt ea " +
            "WHERE ea.studentId = :studentId " +
            "AND ea.exerciseId IN :exerciseIds " +
            "AND ea.isCorrect = true")
    long countDistinctCorrectExercises(@Param("studentId") Long studentId, @Param("exerciseIds") List<Long> exerciseIds);
}