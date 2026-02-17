package com.chineselearning.userservice.domain.dao;

import com.chineselearning.userservice.domain.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IStudentDao extends JpaRepository<Student, Long> {


}