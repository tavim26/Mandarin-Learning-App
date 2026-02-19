package com.chineselearning.userservice.service;

import com.chineselearning.userservice.domain.Credential;
import com.chineselearning.userservice.domain.Student;
import com.chineselearning.userservice.domain.Teacher;
import com.chineselearning.userservice.domain.User;
import com.chineselearning.userservice.domain.dao.ICredentialDao;
import com.chineselearning.userservice.domain.dao.IStudentDao;
import com.chineselearning.userservice.domain.dao.ITeacherDao;
import com.chineselearning.userservice.domain.dao.IUserDao;
import com.chineselearning.userservice.domain.dto.RegisterRequestDto;
import com.chineselearning.userservice.domain.dto.StudentDto;
import com.chineselearning.userservice.domain.dto.TeacherDto;
import com.chineselearning.userservice.domain.dto.UserDto;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class UserService
{

    private final IUserDao userDao;
    private final IStudentDao studentDao;
    private final ITeacherDao teacherDao;
    private final ICredentialDao credentialDao;

    private final PasswordEncoder passwordEncoder;

    public UserService(IUserDao userDao, IStudentDao studentDao, ITeacherDao teacherDao, ICredentialDao credentialDao, PasswordEncoder passwordEncoder) {
        this.userDao = userDao;
        this.studentDao = studentDao;
        this.teacherDao = teacherDao;
        this.credentialDao = credentialDao;
        this.passwordEncoder = passwordEncoder;
    }


    @Transactional
    public UserDto createUser(RegisterRequestDto request) {
        // 1. Validate: Check if email already exists
        if (credentialDao.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already registered");
        }

        // 2. Validate: Check role (only STUDENT or TEACHER)
        if (!request.getRole().equals("STUDENT") && !request.getRole().equals("TEACHER")) {
            throw new IllegalArgumentException("Role must be STUDENT or TEACHER");
        }

        // 3. Create Credential entity
        Credential credential = new Credential();
        credential.setEmail(request.getEmail());
        credential.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        credential.setRole(request.getRole());
        credential.setCreatedAt(LocalDateTime.now());

        // 4. Create User entity
        User user = new User();
        user.setFullName(request.getFullName());
        user.setCredential(credential);
        credential.setUser(user);

        // 5. Create Student or Teacher entity
        if (request.getRole().equals("STUDENT")) {
            Student student = new Student();
            student.setNickname(null); // Nickname can be set later
            student.setUser(user);
            user.setStudent(student);
        }
        else
        {
            Teacher teacher = new Teacher();
            teacher.setTitle("");
            teacher.setUser(user);
            user.setTeacher(teacher);
        }

        // 6. Save (cascade saves all entities)
        Credential savedCredential = credentialDao.save(credential);

        // 7. Return UserDto
        return mapToUserDto(savedCredential.getUser());
    }

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

        // Cascade delete handles all related entities (Student/Teacher)
        userDao.deleteById(id);
    }





    public StudentDto getStudentById(Long userId) {
        Student student = studentDao.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found with id: " + userId));
        return mapToStudentDto(student);
    }

    @Transactional
    public StudentDto updateStudentNickname(Long userId, String newNickname) {
        Student student = studentDao.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found with id: " + userId));

        student.setNickname(newNickname);
        Student updated = studentDao.save(student);

        return mapToStudentDto(updated);
    }





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
                student.getNickname()
        );
    }

    private TeacherDto mapToTeacherDto(Teacher teacher) {
        return new TeacherDto(
                teacher.getUserId(),
                teacher.getTitle()
        );
    }
}