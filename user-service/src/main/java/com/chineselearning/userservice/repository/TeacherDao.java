package com.chineselearning.userservice.repository;

import com.chineselearning.userservice.domain.Teacher;
import com.chineselearning.userservice.domain.dao.ITeacherDao;
import com.chineselearning.userservice.repository.entities.TeacherEntity;
import com.chineselearning.userservice.repository.jpa.ITeacherJpaRepository;
import org.springframework.stereotype.Component;
import java.util.Optional;

@Component
public class TeacherDao implements ITeacherDao
{
    private final ITeacherJpaRepository jpaRepository;

    public TeacherDao(ITeacherJpaRepository jpaRepository)
    {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Teacher save(Teacher teacher)
    {
        TeacherEntity entity = toEntity(teacher);
        TeacherEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Teacher> findById(Long userId)
    {
        return jpaRepository.findById(userId).map(this::toDomain);
    }

    private TeacherEntity toEntity(Teacher teacher)
    {
        TeacherEntity entity = new TeacherEntity();
        entity.setUserId(teacher.getUserId());
        entity.setTitle(teacher.getTitle());
        return entity;
    }

    private Teacher toDomain(TeacherEntity entity)
    {
        Teacher teacher = new Teacher();
        teacher.setUserId(entity.getUserId());
        teacher.setTitle(entity.getTitle());
        return teacher;
    }
}
