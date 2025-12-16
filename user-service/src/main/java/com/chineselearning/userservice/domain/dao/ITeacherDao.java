package com.chineselearning.userservice.domain.dao;

import com.chineselearning.userservice.domain.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ITeacherDao extends JpaRepository<Teacher, Long> {

}