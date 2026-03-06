package com.chineselearning.userservice.domain.dao;

import com.chineselearning.userservice.domain.Student;
import java.util.Optional;

public interface IStudentDao
{
    Student save(Student student);
    Optional<Student> findById(Long userId);
}