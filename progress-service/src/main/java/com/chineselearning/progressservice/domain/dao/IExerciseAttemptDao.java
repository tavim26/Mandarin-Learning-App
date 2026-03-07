package com.chineselearning.progressservice.domain.dao;

import com.chineselearning.progressservice.domain.ExerciseAttempt;

import java.util.List;

// Interfata pura Java - defineste contractul de persistenta fara detalii de implementare
// Niciun import Spring sau JPA
public interface IExerciseAttemptDao {

    ExerciseAttempt save(ExerciseAttempt attempt);

    // Numara toate incercarile unui student la un exercitiu specific
    // Folosit pentru calculul attemptNumber la o incercare noua
    int countByStudentIdAndExerciseId(Long studentId, Long exerciseId);

    // Toate incercarile unui student la un exercitiu, ordonate dupa attemptNumber
    List<ExerciseAttempt> findByStudentIdAndExerciseIdOrderByAttemptNumberAsc(Long studentId, Long exerciseId);

    // Numarul de exercitii distincte rezolvate corect de un student dintr-o lista data
    // Folosit pentru calculul procentului de completare a lectiei
    long countDistinctCorrectExercises(Long studentId, List<Long> exerciseIds);
}