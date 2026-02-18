package com.chineselearning.progressservice.controller;

import com.chineselearning.progressservice.domain.dto.StudentReplicaDto;
import com.chineselearning.progressservice.service.StudentReplicaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

// http://localhost:8083/swagger-ui/index.html

@RestController
@RequestMapping("/api/progress/students")
@Tag(name = "Student Progress Summary", description = "Endpoints for student XP, level, and leaderboard")
public class StudentReplicaController
{

    private final StudentReplicaService studentReplicaService;

    public StudentReplicaController(StudentReplicaService studentReplicaService)
    {
        this.studentReplicaService = studentReplicaService;
    }

    @GetMapping("/leaderboard")
    @Operation(summary = "Get global leaderboard", description = "Returns top 10 students by total XP across all lessons")
    public ResponseEntity<List<StudentReplicaDto>> getLeaderboard()
    {
        List<StudentReplicaDto> leaderboard = studentReplicaService.getLeaderboard();
        return ResponseEntity.ok(leaderboard);
    }

    @GetMapping("/{studentId}")
    @Operation(summary = "Get student progress summary", description = "Returns student XP total and level")
    public ResponseEntity<?> getStudentById(@PathVariable Long studentId)
    {
        Optional<StudentReplicaDto> student = studentReplicaService.getStudentById(studentId);

        if (student.isPresent()) {
            return ResponseEntity.ok(student.get());
        } else {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{studentId}/exists")
    @Operation(summary = "Check if student replica exists", description = "Returns true if student has submitted at least one attempt (replica created)")
    public ResponseEntity<Boolean> studentExists(@PathVariable Long studentId)
    {
        boolean exists = studentReplicaService.studentExists(studentId);
        return ResponseEntity.ok(exists);
    }

    @GetMapping("/admin/all")
    @Operation(summary = "Get all student replicas (admin)", description = "Returns all student progress summaries - for admin/debugging purposes")
    public ResponseEntity<List<StudentReplicaDto>> getAllStudents()
    {
        List<StudentReplicaDto> students = studentReplicaService.getAllStudents();
        return ResponseEntity.ok(students);
    }
}