package com.chineselearning.progressservice.repository;

import com.chineselearning.progressservice.domain.StudentLessonProgress;
import com.chineselearning.progressservice.domain.dao.IStudentLessonProgressDao;
import com.chineselearning.progressservice.repository.entities.StudentLessonProgressEntity;
import com.chineselearning.progressservice.repository.jpa.StudentLessonProgressJpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class StudentLessonProgressDao implements IStudentLessonProgressDao {

    private final StudentLessonProgressJpaRepository jpaRepository;

    public StudentLessonProgressDao(StudentLessonProgressJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public StudentLessonProgress save(StudentLessonProgress progress) {
        StudentLessonProgressEntity saved = jpaRepository.save(toEntity(progress));
        return toDomain(saved);
    }

    @Override
    public Optional<StudentLessonProgress> findByStudentIdAndLessonId(Long studentId, Long lessonId) {
        return jpaRepository
                .findByStudentIdAndLessonId(studentId, lessonId)
                .map(this::toDomain);
    }

    @Override
    public List<StudentLessonProgress> findByStudentId(Long studentId) {
        return jpaRepository.findByStudentId(studentId)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<StudentLessonProgress> findByStudentIdAndStatus(Long studentId, String status) {
        return jpaRepository.findByStudentIdAndStatus(studentId, status)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<StudentLessonProgress> findTop10ByLessonIdOrderByCompletionPctDesc(Long lessonId) {
        return jpaRepository.findTop10ByLessonIdOrderByCompletionPctDesc(lessonId)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }




    private StudentLessonProgressEntity toEntity(StudentLessonProgress domain) {
        StudentLessonProgressEntity entity = new StudentLessonProgressEntity();
        entity.setId(domain.getId());
        entity.setStudentId(domain.getStudentId());
        entity.setLessonId(domain.getLessonId());
        entity.setStatus(domain.getStatus());
        entity.setCompletionPct(domain.getCompletionPct());
        entity.setXpAwarded(domain.getXpAwarded());
        entity.setStartedAt(domain.getStartedAt());
        entity.setLastAccessedAt(domain.getLastAccessedAt());
        entity.setCompletedAt(domain.getCompletedAt());
        return entity;
    }

    private StudentLessonProgress toDomain(StudentLessonProgressEntity entity) {
        StudentLessonProgress domain = new StudentLessonProgress();
        domain.setId(entity.getId());
        domain.setStudentId(entity.getStudentId());
        domain.setLessonId(entity.getLessonId());
        domain.setStatus(entity.getStatus());
        domain.setCompletionPct(entity.getCompletionPct());
        domain.setXpAwarded(entity.getXpAwarded());
        domain.setStartedAt(entity.getStartedAt());
        domain.setLastAccessedAt(entity.getLastAccessedAt());
        domain.setCompletedAt(entity.getCompletedAt());
        return domain;
    }
}