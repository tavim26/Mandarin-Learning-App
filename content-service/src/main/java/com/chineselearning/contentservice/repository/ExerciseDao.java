package com.chineselearning.contentservice.repository;

import com.chineselearning.contentservice.domain.Exercise;
import com.chineselearning.contentservice.domain.Lesson;

import com.chineselearning.contentservice.domain.dao.IExerciseDao;

import com.chineselearning.contentservice.repository.entities.ExerciseEntity;
import com.chineselearning.contentservice.repository.jpa.ExerciseJpaRepository;
import com.chineselearning.contentservice.repository.jpa.LessonJpaRepository;

import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class ExerciseDao implements IExerciseDao
{

    private final ExerciseJpaRepository exerciseJpaRepository;
    private final LessonJpaRepository lessonJpaRepository;

    public ExerciseDao(ExerciseJpaRepository exerciseJpaRepository, LessonJpaRepository lessonJpaRepository)
    {
        this.exerciseJpaRepository = exerciseJpaRepository;
        this.lessonJpaRepository = lessonJpaRepository;
    }

    @Override
    public List<Exercise> findByLessonId(Long lessonId)
    {
        return exerciseJpaRepository.findByLessonId(lessonId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Exercise> findById(Long id)
    {
        return exerciseJpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Exercise save(Exercise exercise)
    {
        ExerciseEntity saved = exerciseJpaRepository.save(toEntity(exercise));
        return toDomain(saved);
    }

    @Override
    public void deleteById(Long id)
    {
        exerciseJpaRepository.deleteById(id);
    }

    @Override
    public boolean existsById(Long id)
    {
        return exerciseJpaRepository.existsById(id);
    }




    private Exercise toDomain(ExerciseEntity entity)
    {
        Exercise exercise = new Exercise();
        exercise.setId(entity.getId());
        exercise.setType(entity.getType());
        exercise.setPrompt(entity.getPrompt());
        exercise.setDifficulty(entity.getDifficulty());
        exercise.setContentData(entity.getContentData());

        Lesson lesson = new Lesson();
        lesson.setId(entity.getLesson().getId());
        exercise.setLesson(lesson);

        return exercise;
    }

    private ExerciseEntity toEntity(Exercise exercise)
    {
        ExerciseEntity entity = new ExerciseEntity();
        entity.setId(exercise.getId());
        entity.setType(exercise.getType());
        entity.setPrompt(exercise.getPrompt());
        entity.setDifficulty(exercise.getDifficulty());
        entity.setContentData(exercise.getContentData());

        if (exercise.getLesson() != null && exercise.getLesson().getId() != null)
        {
            entity.setLesson(lessonJpaRepository.getReferenceById(exercise.getLesson().getId()));
        }

        return entity;
    }
}