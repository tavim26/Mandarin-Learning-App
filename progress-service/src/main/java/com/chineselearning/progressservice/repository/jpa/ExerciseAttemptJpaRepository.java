package com.chineselearning.progressservice.repository.jpa;

import com.chineselearning.progressservice.repository.entities.ExerciseAttemptEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ExerciseAttemptJpaRepository extends JpaRepository<ExerciseAttemptEntity, Long>
{

    // Numara toate incercarile unui student la un exercitiu
    int countByStudentIdAndExerciseId(Long studentId, Long exerciseId);

    // Toate incercarile unui student la un exercitiu, ordonate dupa attemptNumber
    List<ExerciseAttemptEntity> findByStudentIdAndExerciseIdOrderByAttemptNumberAsc(Long studentId, Long exerciseId);

    // Numarul de exercitii distincte rezolvate corect dintr-o lista data
    @Query("SELECT COUNT(DISTINCT ea.exerciseId) FROM ExerciseAttemptEntity ea " +
            "WHERE ea.studentId = :studentId " +
            "AND ea.exerciseId IN :exerciseIds " +
            "AND ea.isCorrect = true")
    long countDistinctCorrectExercises(@Param("studentId") Long studentId, @Param("exerciseIds") List<Long> exerciseIds);
}