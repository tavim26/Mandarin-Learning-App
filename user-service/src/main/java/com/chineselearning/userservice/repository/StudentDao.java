package com.chineselearning.userservice.repository;

import com.chineselearning.userservice.domain.Student;
import com.chineselearning.userservice.domain.dao.IStudentDao;
import com.chineselearning.userservice.repository.entities.StudentEntity;
import com.chineselearning.userservice.repository.jpa.IStudentJpaRepository;
import org.springframework.stereotype.Component;
import java.util.Optional;

@Component
public class StudentDao implements IStudentDao
{
    private final IStudentJpaRepository jpaRepository;

    public StudentDao(IStudentJpaRepository jpaRepository)
    {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Student save(Student student)
    {
        StudentEntity entity = toEntity(student);
        StudentEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Student> findById(Long userId)
    {
        return jpaRepository.findById(userId).map(this::toDomain);
    }

    private StudentEntity toEntity(Student student)
    {
        StudentEntity entity = new StudentEntity();
        entity.setUserId(student.getUserId());
        entity.setNickname(student.getNickname());
        return entity;
    }

    private Student toDomain(StudentEntity entity)
    {
        Student student = new Student();
        student.setUserId(entity.getUserId());
        student.setNickname(entity.getNickname());
        return student;
    }
}