package com.chineselearning.userservice.service;

import com.chineselearning.userservice.domain.Student;
import com.chineselearning.userservice.domain.Teacher;
import com.chineselearning.userservice.domain.User;
import com.chineselearning.userservice.domain.dao.IStudentDao;
import com.chineselearning.userservice.domain.dao.ITeacherDao;
import com.chineselearning.userservice.domain.dao.IUserDao;
import com.chineselearning.userservice.domain.dto.StudentDto;
import com.chineselearning.userservice.domain.dto.TeacherDto;
import com.chineselearning.userservice.domain.dto.UserDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final IUserDao userDao;
    private final IStudentDao studentDao;
    private final ITeacherDao teacherDao;

    public UserService(IUserDao userDao, IStudentDao studentDao, ITeacherDao teacherDao) {
        this.userDao = userDao;
        this.studentDao = studentDao;
        this.teacherDao = teacherDao;
    }

    // ========== USER OPERATIONS ==========

    public List<UserDto> getAllUsers() {
        return userDao.findAll().stream()
                .map(this::mapToUserDto)
                .collect(Collectors.toList());
    }

    public UserDto getUserById(Long id) {
        User user = userDao.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        return mapToUserDto(user);
    }

    public List<UserDto> searchUsersByName(String nameFragment) {
        return userDao.findByFullNameContaining(nameFragment).stream()
                .map(this::mapToUserDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDto updateUserName(Long id, String newName) {
        User user = userDao.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        user.setFullName(newName);
        User updated = userDao.save(user);
        return mapToUserDto(updated);
    }

    @Transactional
    public void deleteUser(Long id) {
        if (!userDao.existsById(id)) {
            throw new IllegalArgumentException("User not found with id: " + id);
        }
        userDao.deleteById(id);
    }

    // ========== STUDENT OPERATIONS ==========

    public StudentDto getStudentById(Long userId) {
        Student student = studentDao.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found with id: " + userId));
        return mapToStudentDto(student);
    }

    @Transactional
    public StudentDto updateStudentXp(Long userId, int xpToAdd) {
        Student student = studentDao.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found with id: " + userId));

        student.setXpTotal(student.getXpTotal() + xpToAdd);

        // Simple level calculation: every 1000 XP = 1 level
        int newLevel = (student.getXpTotal() / 1000) + 1;
        student.setLevel(newLevel);

        Student updated = studentDao.save(student);
        return mapToStudentDto(updated);
    }

    @Transactional
    public StudentDto updateStudentLevel(Long userId, int newLevel) {
        Student student = studentDao.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found with id: " + userId));
        student.setLevel(newLevel);
        Student updated = studentDao.save(student);
        return mapToStudentDto(updated);
    }

    public List<StudentDto> getTopStudentsByXp() {
        return studentDao.findTop10ByOrderByXpTotalDesc().stream()
                .map(this::mapToStudentDto)
                .collect(Collectors.toList());
    }

    // ========== TEACHER OPERATIONS ==========

    public TeacherDto getTeacherById(Long userId) {
        Teacher teacher = teacherDao.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Teacher not found with id: " + userId));
        return mapToTeacherDto(teacher);
    }

    @Transactional
    public TeacherDto updateTeacherTitle(Long userId, String newTitle) {
        Teacher teacher = teacherDao.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Teacher not found with id: " + userId));
        teacher.setTitle(newTitle);
        Teacher updated = teacherDao.save(teacher);
        return mapToTeacherDto(updated);
    }

    // ========== PRIVATE MAPPING METHODS ==========

    private UserDto mapToUserDto(User user) {
        return new UserDto(
                user.getId(),
                user.getFullName(),
                user.getCredential().getRole()
        );
    }

    private StudentDto mapToStudentDto(Student student) {
        return new StudentDto(
                student.getUserId(),
                student.getXpTotal(),
                student.getLevel()
        );
    }

    private TeacherDto mapToTeacherDto(Teacher teacher) {
        return new TeacherDto(
                teacher.getUserId(),
                teacher.getTitle()
        );
    }
}