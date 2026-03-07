package com.chineselearning.progressservice.repository;

import com.chineselearning.progressservice.domain.ExerciseAttempt;
import com.chineselearning.progressservice.domain.dao.IExerciseAttemptDao;
import com.chineselearning.progressservice.repository.entities.ExerciseAttemptEntity;
import com.chineselearning.progressservice.repository.jpa.ExerciseAttemptJpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.stream.Collectors;

@Repository
public class ExerciseAttemptDao implements IExerciseAttemptDao {

    private final ExerciseAttemptJpaRepository jpaRepository;

    public ExerciseAttemptDao(ExerciseAttemptJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public ExerciseAttempt save(ExerciseAttempt attempt) {
        ExerciseAttemptEntity saved = jpaRepository.save(toEntity(attempt));
        return toDomain(saved);
    }

    @Override
    public int countByStudentIdAndExerciseId(Long studentId, Long exerciseId) {
        return jpaRepository.countByStudentIdAndExerciseId(studentId, exerciseId);
    }

    @Override
    public List<ExerciseAttempt> findByStudentIdAndExerciseIdOrderByAttemptNumberAsc(Long studentId, Long exerciseId) {
        return jpaRepository
                .findByStudentIdAndExerciseIdOrderByAttemptNumberAsc(studentId, exerciseId)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public long countDistinctCorrectExercises(Long studentId, List<Long> exerciseIds) {
        return jpaRepository.countDistinctCorrectExercises(studentId, exerciseIds);
    }

    // ========== CONVERSIE ==========

    private ExerciseAttemptEntity toEntity(ExerciseAttempt domain) {
        ExerciseAttemptEntity entity = new ExerciseAttemptEntity();
        entity.setId(domain.getId());
        entity.setStudentId(domain.getStudentId());
        entity.setExerciseId(domain.getExerciseId());
        entity.setAttemptNumber(domain.getAttemptNumber());
        entity.setSubmittedAt(domain.getSubmittedAt());
        entity.setSubmittedAnswer(domain.getSubmittedAnswer());
        entity.setIsCorrect(domain.getIsCorrect());
        entity.setScore(domain.getScore());
        entity.setFeedbackText(domain.getFeedbackText());
        return entity;
    }

    private ExerciseAttempt toDomain(ExerciseAttemptEntity entity) {
        ExerciseAttempt domain = new ExerciseAttempt();
        domain.setId(entity.getId());
        domain.setStudentId(entity.getStudentId());
        domain.setExerciseId(entity.getExerciseId());
        domain.setAttemptNumber(entity.getAttemptNumber());
        domain.setSubmittedAt(entity.getSubmittedAt());
        domain.setSubmittedAnswer(entity.getSubmittedAnswer());
        domain.setIsCorrect(entity.getIsCorrect());
        domain.setScore(entity.getScore());
        domain.setFeedbackText(entity.getFeedbackText());
        return domain;
    }
}