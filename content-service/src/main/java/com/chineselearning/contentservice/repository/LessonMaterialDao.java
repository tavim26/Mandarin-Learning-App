package com.chineselearning.contentservice.repository;

import com.chineselearning.contentservice.domain.Lesson;
import com.chineselearning.contentservice.domain.LessonMaterial;
import com.chineselearning.contentservice.domain.dao.ILessonMaterialDao;
import com.chineselearning.contentservice.repository.entities.LessonMaterialEntity;
import com.chineselearning.contentservice.repository.jpa.LessonJpaRepository;
import com.chineselearning.contentservice.repository.jpa.LessonMaterialJpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.stream.Collectors;

@Repository
public class LessonMaterialDao implements ILessonMaterialDao {

    private final LessonMaterialJpaRepository lessonMaterialJpaRepository;
    private final LessonJpaRepository lessonJpaRepository;

    public LessonMaterialDao(LessonMaterialJpaRepository lessonMaterialJpaRepository, LessonJpaRepository lessonJpaRepository) {
        this.lessonMaterialJpaRepository = lessonMaterialJpaRepository;
        this.lessonJpaRepository = lessonJpaRepository;
    }

    @Override
    public List<LessonMaterial> findByLessonId(Long lessonId) {
        return lessonMaterialJpaRepository.findByLessonId(lessonId).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public LessonMaterial save(LessonMaterial material) {
        LessonMaterialEntity saved = lessonMaterialJpaRepository.save(toEntity(material));
        return toDomain(saved);
    }

    @Override
    public void deleteById(Long id) {
        lessonMaterialJpaRepository.deleteById(id);
    }

    @Override
    public boolean existsById(Long id) {
        return lessonMaterialJpaRepository.existsById(id);
    }

    private LessonMaterial toDomain(LessonMaterialEntity entity) {
        LessonMaterial material = new LessonMaterial();
        material.setId(entity.getId());
        material.setTitle(entity.getTitle());
        material.setType(entity.getType());
        material.setUrl(entity.getUrl());

        Lesson lesson = new Lesson();
        lesson.setId(entity.getLesson().getId());
        material.setLesson(lesson);

        return material;
    }

    private LessonMaterialEntity toEntity(LessonMaterial material) {
        LessonMaterialEntity entity = new LessonMaterialEntity();
        entity.setId(material.getId());
        entity.setTitle(material.getTitle());
        entity.setType(material.getType());
        entity.setUrl(material.getUrl());

        if (material.getLesson() != null && material.getLesson().getId() != null) {
            entity.setLesson(lessonJpaRepository.getReferenceById(material.getLesson().getId()));
        }

        return entity;
    }
}