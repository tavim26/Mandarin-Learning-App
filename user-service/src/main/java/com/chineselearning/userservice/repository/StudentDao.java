package com.chineselearning.userservice.repository;

import com.chineselearning.userservice.domain.Student;
import com.chineselearning.userservice.domain.dao.IStudentDao;
import com.chineselearning.userservice.repository.entities.StudentEntity;
import com.chineselearning.userservice.repository.jpa.IStudentJpaRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

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
        Optional<StudentEntity> existing = jpaRepository.findById(student.getUserId());

        if (existing.isPresent())
        {
            StudentEntity managed = existing.get();
            managed.setNickname(student.getNickname());
            StudentEntity saved = jpaRepository.save(managed);
            return toDomain(saved);
        }

        StudentEntity entity = toEntity(student);
        StudentEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Student> findById(Long userId)
    {
        return jpaRepository.findById(userId).map(this::toDomain);
    }

    @Override
    public List<Student> findByNicknameContaining(String fragment)
    {
        return jpaRepository.findByNicknameContaining(fragment).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public boolean existsByNickname(String nickname)
    {
        return jpaRepository.existsByNickname(nickname);
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