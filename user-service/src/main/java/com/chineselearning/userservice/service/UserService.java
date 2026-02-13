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
import com.chineselearning.userservice.events.StudentCreatedEvent;
import com.chineselearning.userservice.events.StudentDeletedEvent;
import com.chineselearning.userservice.events.StudentUpdatedEvent;
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
    private final StudentEventPublisher studentEventPublisher;

    public UserService(
            IUserDao userDao,
            IStudentDao studentDao,
            ITeacherDao teacherDao,
            ICredentialDao credentialDao,
            PasswordEncoder passwordEncoder,
            StudentEventPublisher studentEventPublisher
    ) {
        this.userDao = userDao;
        this.studentDao = studentDao;
        this.teacherDao = teacherDao;
        this.credentialDao = credentialDao;
        this.passwordEncoder = passwordEncoder;
        this.studentEventPublisher = studentEventPublisher;
    }



    // ========== USER OPERATIONS ==========

    @Transactional
    public UserDto createUser(RegisterRequestDto request)
    {
        // 1. Validate: Check if email already exists
        if (credentialDao.existsByEmail(request.getEmail()))
        {
            throw new IllegalArgumentException("Email already registered");
        }

        // 2. Validate: Check role (only STUDENT or TEACHER)
        if (!request.getRole().equals("STUDENT") && !request.getRole().equals("TEACHER"))
        {
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
        if (request.getRole().equals("STUDENT"))
        {
            Student student = new Student();
            student.setXpTotal(0);
            student.setLevel(1);
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

        // 6. Save
        Credential savedCredential = credentialDao.save(credential);

        // 7. Publish StudentCreatedEvent if role is STUDENT
        if (request.getRole().equals("STUDENT")) {
            StudentCreatedEvent event = new StudentCreatedEvent(
                    savedCredential.getId(),
                    savedCredential.getUser().getFullName(),
                    savedCredential.getEmail()
            );
            studentEventPublisher.publishStudentCreated(event);
        }

        // 8. Return UserDto
        return mapToUserDto(savedCredential.getUser());
    }

    public List<UserDto> getAllUsers()
    {
        return userDao.findAll().stream()
                .map(this::mapToUserDto)
                .collect(Collectors.toList());
    }

    public UserDto getUserById(Long id)
    {
        User user = userDao.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        return mapToUserDto(user);
    }

    public List<UserDto> searchUsersByName(String nameFragment)
    {
        return userDao.findByFullNameContaining(nameFragment).stream()
                .map(this::mapToUserDto)
                .collect(Collectors.toList());
    }

    @Transactional
    public UserDto updateUserName(Long id, String newName)
    {
        User user = userDao.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));

        user.setFullName(newName);
        User updated = userDao.save(user);

        // Publish StudentUpdatedEvent if this user is a student
        if (studentDao.existsById(id))
        {
            Credential credential = credentialDao.findById(id)
                    .orElseThrow(() -> new IllegalArgumentException("Credential not found for id: " + id));

            StudentUpdatedEvent event = new StudentUpdatedEvent(
                    id,
                    newName,
                    credential.getEmail()
            );
            studentEventPublisher.publishStudentUpdated(event);
        }

        return mapToUserDto(updated);
    }

    @Transactional
    public void deleteUser(Long id)
    {
        if (!userDao.existsById(id))
        {
            throw new IllegalArgumentException("User not found with id: " + id);
        }

        // Publish StudentDeletedEvent BEFORE deletion if this user is a student
        if (studentDao.existsById(id))
        {
            StudentDeletedEvent event = new StudentDeletedEvent(id);
            studentEventPublisher.publishStudentDeleted(event);
        }

        // Delete user
        userDao.deleteById(id);
    }



    // ========== STUDENT OPERATIONS ==========

    public StudentDto getStudentById(Long userId)
    {
        Student student = studentDao.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found with id: " + userId));
        return mapToStudentDto(student);
    }

    @Transactional
    public StudentDto updateStudentXp(Long userId, int xpToAdd)
    {
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
    public StudentDto updateStudentLevel(Long userId, int newLevel)
    {
        Student student = studentDao.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Student not found with id: " + userId));
        student.setLevel(newLevel);
        Student updated = studentDao.save(student);
        return mapToStudentDto(updated);
    }

    public List<StudentDto> getTopStudentsByXp()
    {
        return studentDao.findTop10ByOrderByXpTotalDesc().stream()
                .map(this::mapToStudentDto)
                .collect(Collectors.toList());
    }




    // ========== TEACHER OPERATIONS ==========

    public TeacherDto getTeacherById(Long userId)
    {
        Teacher teacher = teacherDao.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Teacher not found with id: " + userId));
        return mapToTeacherDto(teacher);
    }

    @Transactional
    public TeacherDto updateTeacherTitle(Long userId, String newTitle)
    {
        Teacher teacher = teacherDao.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Teacher not found with id: " + userId));
        teacher.setTitle(newTitle);
        Teacher updated = teacherDao.save(teacher);
        return mapToTeacherDto(updated);
    }



    // ========== PRIVATE MAPPING METHODS ==========

    private UserDto mapToUserDto(User user)
    {
        return new UserDto(
                user.getId(),
                user.getFullName(),
                user.getCredential().getRole()
        );
    }

    private StudentDto mapToStudentDto(Student student)
    {
        return new StudentDto(
                student.getUserId(),
                student.getXpTotal(),
                student.getLevel()
        );
    }

    private TeacherDto mapToTeacherDto(Teacher teacher)
    {
        return new TeacherDto(
                teacher.getUserId(),
                teacher.getTitle()
        );
    }
}