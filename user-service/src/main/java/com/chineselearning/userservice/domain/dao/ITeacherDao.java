package com.chineselearning.userservice.domain.dao;

import com.chineselearning.userservice.domain.Teacher;
import java.util.Optional;

public interface ITeacherDao
{
    Teacher save(Teacher teacher);
    Optional<Teacher> findById(Long userId);
}