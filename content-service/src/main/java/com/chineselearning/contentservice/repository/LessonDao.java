package com.chineselearning.contentservice.repository;

import com.chineselearning.contentservice.domain.CourseUnit;
import com.chineselearning.contentservice.domain.Lesson;

import com.chineselearning.contentservice.domain.dao.ILessonDao;

import com.chineselearning.contentservice.repository.entities.LessonEntity;

import com.chineselearning.contentservice.repository.jpa.CourseUnitJpaRepository;
import com.chineselearning.contentservice.repository.jpa.LessonJpaRepository;

import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class LessonDao implements ILessonDao
{

    private final LessonJpaRepository lessonJpaRepository;
    private final CourseUnitJpaRepository courseUnitJpaRepository;

    public LessonDao(LessonJpaRepository lessonJpaRepository, CourseUnitJpaRepository courseUnitJpaRepository)
    {
        this.lessonJpaRepository = lessonJpaRepository;
        this.courseUnitJpaRepository = courseUnitJpaRepository;
    }

    @Override
    public List<Lesson> findByUnitIdOrderByOrderIndexAsc(Long unitId)
    {
        return lessonJpaRepository.findByUnitIdOrderByOrderIndexAsc(unitId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Lesson> findById(Long id) {
        return lessonJpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public Lesson save(Lesson lesson)
    {
        LessonEntity saved = lessonJpaRepository.save(toEntity(lesson));
        return toDomain(saved);
    }

    @Override
    public void deleteById(Long id)
    {
        lessonJpaRepository.deleteById(id);
    }

    @Override
    public boolean existsById(Long id)
    {
        return lessonJpaRepository.existsById(id);
    }




    private Lesson toDomain(LessonEntity entity)
    {
        Lesson lesson = new Lesson();
        lesson.setId(entity.getId());
        lesson.setTitle(entity.getTitle());
        lesson.setDescription(entity.getDescription());
        lesson.setXpReward(entity.getXpReward());
        lesson.setOrderIndex(entity.getOrderIndex());

        CourseUnit unit = new CourseUnit();
        unit.setId(entity.getUnit().getId());
        lesson.setUnit(unit);

        return lesson;
    }

    private LessonEntity toEntity(Lesson lesson)
    {
        LessonEntity entity = new LessonEntity();
        entity.setId(lesson.getId());
        entity.setTitle(lesson.getTitle());
        entity.setDescription(lesson.getDescription());
        entity.setXpReward(lesson.getXpReward());
        entity.setOrderIndex(lesson.getOrderIndex());

        if (lesson.getUnit() != null && lesson.getUnit().getId() != null) {
            entity.setUnit(courseUnitJpaRepository.getReferenceById(lesson.getUnit().getId()));
        }

        return entity;
    }
}