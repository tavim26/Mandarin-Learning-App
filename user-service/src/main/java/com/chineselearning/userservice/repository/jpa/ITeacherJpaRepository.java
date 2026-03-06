package com.chineselearning.userservice.repository.jpa;

import com.chineselearning.userservice.repository.entities.TeacherEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ITeacherJpaRepository extends JpaRepository<TeacherEntity, Long>
{
}