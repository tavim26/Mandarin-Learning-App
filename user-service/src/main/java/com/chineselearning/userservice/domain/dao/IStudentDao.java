package com.chineselearning.userservice.domain.dao;

import com.chineselearning.userservice.domain.Student;

import java.util.List;
import java.util.Optional;

public interface IStudentDao
{
    Student save(Student student);
    Optional<Student> findById(Long userId);
    List<Student> findByNicknameContaining(String fragment);
    boolean existsByNickname(String nickname);
}