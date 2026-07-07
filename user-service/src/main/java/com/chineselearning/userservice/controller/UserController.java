package com.chineselearning.userservice.controller;

import com.chineselearning.userservice.domain.dto.RegisterRequestDto;
import com.chineselearning.userservice.domain.dto.StudentDto;
import com.chineselearning.userservice.domain.dto.TeacherDto;
import com.chineselearning.userservice.domain.dto.UserDto;
import com.chineselearning.userservice.domain.dto.StudentProfileDto;
import com.chineselearning.userservice.domain.dto.TeacherProfileDto;
import java.util.Map;

import com.chineselearning.userservice.service.UserService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;



import java.util.List;

// http://localhost:8082/swagger-ui/index.html

@RestController
@RequestMapping("/api/users")
@Tag(name = "User Management", description = "Endpoints for managing users, students and teachers")
public class UserController
{

    private final UserService userService;

    public UserController(UserService userService)
    {
        this.userService = userService;
    }


    @PostMapping
    @Operation(summary = "Create new user", description = "Creates a new user with role STUDENT or TEACHER (admin only)")
    public ResponseEntity<?> createUser(@RequestBody RegisterRequestDto request)
    {
        try {
            UserDto created = userService.createUser(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(created);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping
    @Operation(summary = "Get all users", description = "Returns list of all users in the system")
    public ResponseEntity<List<UserDto>> getAllUsers()
    {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID", description = "Returns basic user information")
    public ResponseEntity<?> getUserById(@PathVariable Long id)
    {
        try {
            UserDto user = userService.getUserById(id);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/search")
    @Operation(summary = "Search users by name", description = "Returns users whose full name contains the search fragment")
    public ResponseEntity<List<UserDto>> searchUsers(@RequestParam String name)
    {
        return ResponseEntity.ok(userService.searchUsersByName(name));
    }

    @PutMapping("/{id}/name")
    @Operation(summary = "Update user name", description = "Updates the full name of a user")
    public ResponseEntity<?> updateUserName(@PathVariable Long id, @RequestParam String newName)
    {
        try {
            UserDto updated = userService.updateUserName(id, newName);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete user", description = "Deletes a user and all associated data (cascade)")
    public ResponseEntity<?> deleteUser(@PathVariable Long id)
    {
        try {
            userService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }





    @GetMapping("/students/{userId}")
    @Operation(summary = "Get student details", description = "Returns student-specific information (nickname)")
    public ResponseEntity<?> getStudent(@PathVariable Long userId)
    {
        try {
            StudentDto student = userService.getStudentById(userId);
            return ResponseEntity.ok(student);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/students/{userId}/nickname")
    @Operation(summary = "Update student nickname", description = "Sets or updates the student's display nickname")
    public ResponseEntity<?> updateStudentNickname(@PathVariable Long userId, @RequestParam String newNickname)
    {
        try {
            StudentDto updated = userService.updateStudentNickname(userId, newNickname);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }





    @GetMapping("/teachers/{userId}")
    @Operation(summary = "Get teacher details", description = "Returns teacher-specific information")
    public ResponseEntity<?> getTeacher(@PathVariable Long userId)
    {
        try {
            TeacherDto teacher = userService.getTeacherById(userId);
            return ResponseEntity.ok(teacher);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/teachers/{userId}/title")
    @Operation(summary = "Update teacher title", description = "Updates teacher's academic or professional title")
    public ResponseEntity<?> updateTeacherTitle(@PathVariable Long userId, @RequestParam String newTitle)
    {
        try {
            TeacherDto updated = userService.updateTeacherTitle(userId, newTitle);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }


    @PutMapping("/{id}/email")
    @Operation(summary = "Update user email", description = "Updates the email of a user")
    public ResponseEntity<?> updateEmail(@PathVariable Long id, @RequestParam String newEmail)
    {
        try {
            UserDto updated = userService.updateEmail(id, newEmail);
            return ResponseEntity.ok(updated);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/password")
    @Operation(summary = "Update own password", description = "User updates their own password (requires current password)")
    public ResponseEntity<?> updatePassword(@PathVariable Long id, @RequestParam String oldPassword, @RequestParam String newPassword)
    {
        try {
            userService.updatePassword(id, oldPassword, newPassword);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/password/reset")
    @Operation(summary = "Admin reset password", description = "Admin resets a user's password without requiring the current password")
    public ResponseEntity<?> adminResetPassword(@PathVariable Long id, @RequestParam String newPassword)
    {
        try {
            userService.adminUpdatePassword(id, newPassword);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/students")
    @Operation(summary = "Get all students with profile data", description = "Returns full profile for all students")
    public ResponseEntity<List<StudentProfileDto>> getAllStudents()
    {
        return ResponseEntity.ok(userService.getAllStudents());
    }

    @GetMapping("/teachers")
    @Operation(summary = "Get all teachers with profile data", description = "Returns full profile for all teachers")
    public ResponseEntity<List<TeacherProfileDto>> getAllTeachers()
    {
        return ResponseEntity.ok(userService.getAllTeachers());
    }


    @GetMapping("/me")
    @Operation(summary = "Get current user", description = "Returns the profile of the authenticated user based on JWT email header")
    public ResponseEntity<?> getMe(@RequestHeader("X-User-Email") String email)
    {
        try {
            UserDto user = userService.getUserByEmail(email);
            return ResponseEntity.ok(user);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/students/search")
    @Operation(summary = "Search students by nickname", description = "Returns students whose nickname contains the search fragment")
    public ResponseEntity<List<StudentDto>> searchStudentsByNickname(@RequestParam String nickname)
    {
        return ResponseEntity.ok(userService.searchStudentsByNickname(nickname));
    }



    @PutMapping("/{id}/ban")
    @Operation(summary = "Ban user", description = "Deactivates a user account without deleting it")
    public ResponseEntity<?> banUser(@PathVariable Long id)
    {
        try {
            userService.banUser(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/unban")
    @Operation(summary = "Unban user", description = "Reactivates a previously banned user account")
    public ResponseEntity<?> unbanUser(@PathVariable Long id)
    {
        try {
            userService.unbanUser(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }



}