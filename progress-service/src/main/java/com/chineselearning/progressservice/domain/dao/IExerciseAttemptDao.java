package com.chineselearning.progressservice.domain.dao;

import com.chineselearning.progressservice.domain.ExerciseAttempt;

import java.util.List;

public interface IExerciseAttemptDao
{

    ExerciseAttempt save(ExerciseAttempt attempt);

    // Numara toate incercarile unui student la un exercitiu specific
    int countByStudentIdAndExerciseId(Long studentId, Long exerciseId);

    // Toate incercarile unui student la un exercitiu, ordonate dupa attemptNumber
    List<ExerciseAttempt> findByStudentIdAndExerciseIdOrderByAttemptNumberAsc(Long studentId, Long exerciseId);

    // Numarul de exercitii distincte rezolvate corect de un student dintr-o lista data
    long countDistinctCorrectExercises(Long studentId, List<Long> exerciseIds);
}