package com.chineselearning.progressservice.domain.dao;

import com.chineselearning.progressservice.domain.ExerciseAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface IExerciseAttemptDao extends JpaRepository<ExerciseAttempt, Long>
{

    // numarul de incercari ale unui student pentru un anumit exercitiu
    int countByStudentIdAndExerciseId(Long studentId, Long exerciseId);

    // toate incercarile unui student pentru un anumit exercitiu
    List<ExerciseAttempt> findByStudentIdAndExerciseIdOrderByAttemptNumberAsc(Long studentId, Long exerciseId);

    // numara exercitiile distincte la care studentul a raspuns corect
    // folosit pt a calcula procentul de completare al unei lectii
    @Query("SELECT COUNT(DISTINCT ea.exerciseId) FROM ExerciseAttempt ea " +
            "WHERE ea.studentId = :studentId " +
            "AND ea.exerciseId IN :exerciseIds " +
            "AND ea.isCorrect = true")
    long countDistinctCorrectExercises(@Param("studentId") Long studentId, @Param("exerciseIds") List<Long> exerciseIds);
}