package com.chineselearning.userservice.repository;

import com.chineselearning.userservice.domain.Credential;
import com.chineselearning.userservice.domain.Student;
import com.chineselearning.userservice.domain.Teacher;
import com.chineselearning.userservice.domain.User;
import com.chineselearning.userservice.domain.dao.ICredentialDao;

import com.chineselearning.userservice.repository.entities.CredentialEntity;
import com.chineselearning.userservice.repository.entities.StudentEntity;
import com.chineselearning.userservice.repository.entities.TeacherEntity;
import com.chineselearning.userservice.repository.entities.UserEntity;

import com.chineselearning.userservice.repository.jpa.ICredentialJpaRepository;
import org.springframework.stereotype.Component;
import java.util.Optional;

@Component
public class CredentialDao implements ICredentialDao
{
    private final ICredentialJpaRepository jpaRepository;

    public CredentialDao(ICredentialJpaRepository jpaRepository)
    {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Credential save(Credential credential)
    {
        if (credential.getId() != null && jpaRepository.existsById(credential.getId()))
        {
            CredentialEntity managed = jpaRepository.findById(credential.getId()).get();
            managed.setEmail(credential.getEmail());
            managed.setPasswordHash(credential.getPasswordHash());
            managed.setRole(credential.getRole());
            managed.setActive(credential.isActive());
            CredentialEntity saved = jpaRepository.save(managed);
            return toDomain(saved);
        }

        CredentialEntity entity = toEntity(credential);
        CredentialEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Credential> findByEmail(String email)
    {
        return jpaRepository.findByEmail(email).map(this::toDomain);
    }

    @Override
    public boolean existsByEmail(String email)
    {
        return jpaRepository.existsByEmail(email);
    }



    @Override
    public Optional<Credential> findById(Long id)
    {
        return jpaRepository.findById(id).map(this::toDomain);
    }

    @Override
    public void deleteById(Long id)
    {
        jpaRepository.deleteById(id);
    }


    @Override
    public Optional<Credential> findByEmailAndIsActiveTrue(String email)
    {
        return jpaRepository.findByEmailAndIsActiveTrue(email).map(this::toDomain);
    }



    private CredentialEntity toEntity(Credential credential)
    {
        CredentialEntity entity = new CredentialEntity();
        entity.setId(credential.getId());
        entity.setEmail(credential.getEmail());
        entity.setPasswordHash(credential.getPasswordHash());
        entity.setRole(credential.getRole());
        entity.setCreatedAt(credential.getCreatedAt());

        if (credential.getUser() != null)
        {
            UserEntity userEntity = new UserEntity();
            userEntity.setFullName(credential.getUser().getFullName());
            userEntity.setCredential(entity);

            if (credential.getUser().getStudent() != null)
            {
                StudentEntity studentEntity = new StudentEntity();
                studentEntity.setNickname(credential.getUser().getStudent().getNickname());
                studentEntity.setUser(userEntity);
                userEntity.setStudent(studentEntity);
            }
            else if (credential.getUser().getTeacher() != null)
            {
                TeacherEntity teacherEntity = new TeacherEntity();
                teacherEntity.setTitle(credential.getUser().getTeacher().getTitle());
                teacherEntity.setUser(userEntity);
                userEntity.setTeacher(teacherEntity);
            }

            entity.setUser(userEntity);
        }

        return entity;
    }


    private Credential toDomain(CredentialEntity entity)
    {
        Credential credential = new Credential();
        credential.setId(entity.getId());
        credential.setEmail(entity.getEmail());
        credential.setPasswordHash(entity.getPasswordHash());
        credential.setRole(entity.getRole());
        credential.setCreatedAt(entity.getCreatedAt());
        credential.setActive(entity.isActive());

        if (entity.getUser() != null)
        {
            User user = new User();
            user.setId(entity.getUser().getId());
            user.setFullName(entity.getUser().getFullName());
            user.setCredential(credential);

            if (entity.getUser().getStudent() != null)
            {
                Student student = new Student();
                student.setUserId(entity.getUser().getStudent().getUserId());
                student.setNickname(entity.getUser().getStudent().getNickname());
                student.setUser(user);
                user.setStudent(student);
            }
            else if (entity.getUser().getTeacher() != null)
            {
                Teacher teacher = new Teacher();
                teacher.setUserId(entity.getUser().getTeacher().getUserId());
                teacher.setTitle(entity.getUser().getTeacher().getTitle());
                teacher.setUser(user);
                user.setTeacher(teacher);
            }

            credential.setUser(user);
        }

        return credential;
    }
}