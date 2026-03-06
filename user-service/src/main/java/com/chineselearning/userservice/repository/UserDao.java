package com.chineselearning.userservice.repository;

import com.chineselearning.userservice.domain.Credential;
import com.chineselearning.userservice.domain.Student;
import com.chineselearning.userservice.domain.Teacher;
import com.chineselearning.userservice.domain.User;
import com.chineselearning.userservice.domain.dao.IUserDao;
import com.chineselearning.userservice.repository.entities.StudentEntity;
import com.chineselearning.userservice.repository.entities.TeacherEntity;
import com.chineselearning.userservice.repository.entities.UserEntity;
import com.chineselearning.userservice.repository.jpa.IUserJpaRepository;
import org.springframework.stereotype.Component;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Component
public class UserDao implements IUserDao
{
    private final IUserJpaRepository jpaRepository;

    public UserDao(IUserJpaRepository jpaRepository)
    {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public User save(User user)
    {
        UserEntity entity = toEntity(user);
        UserEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<User> findById(Long id)
    {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public List<User> findAll()
    {
        return jpaRepository.findAll().stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<User> findByFullNameContaining(String fragment)
    {
        return jpaRepository.findByFullNameContaining(fragment).stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public boolean existsById(Long id)
    {
        return jpaRepository.existsById(id);
    }

    @Override
    public void deleteById(Long id)
    {
        jpaRepository.deleteById(id);
    }

    private UserEntity toEntity(User user)
    {
        UserEntity entity = new UserEntity();
        entity.setId(user.getId());
        entity.setFullName(user.getFullName());

        if (user.getStudent() != null)
        {
            StudentEntity studentEntity = new StudentEntity();
            studentEntity.setNickname(user.getStudent().getNickname());
            studentEntity.setUser(entity);
            entity.setStudent(studentEntity);
        }
        else if (user.getTeacher() != null)
        {
            TeacherEntity teacherEntity = new TeacherEntity();
            teacherEntity.setTitle(user.getTeacher().getTitle());
            teacherEntity.setUser(entity);
            entity.setTeacher(teacherEntity);
        }

        return entity;
    }

    private User toDomain(UserEntity entity)
    {
        User user = new User();
        user.setId(entity.getId());
        user.setFullName(entity.getFullName());

        // Setam Credential pe User pentru a putea accesa role-ul in service
        if (entity.getCredential() != null)
        {
            Credential credential = new Credential();
            credential.setId(entity.getCredential().getId());
            credential.setEmail(entity.getCredential().getEmail());
            credential.setPasswordHash(entity.getCredential().getPasswordHash());
            credential.setRole(entity.getCredential().getRole());
            credential.setCreatedAt(entity.getCredential().getCreatedAt());
            user.setCredential(credential);
        }

        if (entity.getStudent() != null)
        {
            Student student = new Student();
            student.setUserId(entity.getStudent().getUserId());
            student.setNickname(entity.getStudent().getNickname());
            student.setUser(user);
            user.setStudent(student);
        }
        else if (entity.getTeacher() != null)
        {
            Teacher teacher = new Teacher();
            teacher.setUserId(entity.getTeacher().getUserId());
            teacher.setTitle(entity.getTeacher().getTitle());
            teacher.setUser(user);
            user.setTeacher(teacher);
        }

        return user;
    }
}