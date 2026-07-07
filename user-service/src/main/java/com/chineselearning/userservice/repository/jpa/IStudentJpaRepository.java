package com.chineselearning.userservice.repository.jpa;

import com.chineselearning.userservice.repository.entities.StudentEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IStudentJpaRepository extends JpaRepository<StudentEntity, Long>
{
    List<StudentEntity> findByNicknameContaining(String fragment);

    boolean existsByNickname(String nickname);
}