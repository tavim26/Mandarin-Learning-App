package com.chineselearning.progressservice.controller;

import com.chineselearning.progressservice.domain.dto.StudentReplicaDto;

import com.chineselearning.progressservice.service.StudentReplicaService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/progress/students")
@Tag(name = "Student Progress Summary", description = "Endpoints for managing student XP, level, and leaderboard")
public class StudentReplicaController
{

    private final StudentReplicaService studentReplicaService;

    public StudentReplicaController(StudentReplicaService studentReplicaService)
    {
        this.studentReplicaService = studentReplicaService;
    }

    @GetMapping("/leaderboard")
    @Operation(
            summary = "Get the global leaderboard",
            description = "Returns the top 10 students ordered by total XP accumulated across all lessons."
    )
    public ResponseEntity<List<StudentReplicaDto>> getLeaderboard()
    {
        return ResponseEntity.ok(studentReplicaService.getLeaderboard());
    }

    @GetMapping("/{studentId}")
    @Operation(
            summary = "Get a student's progress summary",
            description = "Returns the total XP and current level of the student."
    )
    public ResponseEntity<?> getStudentById(
            @PathVariable Long studentId,
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @RequestHeader("X-User-Role") String role)
    {
        if (isForbidden(studentId, authenticatedUserId, role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access forbidden");
        }

        Optional<StudentReplicaDto> student = studentReplicaService.getStudentById(studentId);
        return student
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{studentId}/exists")
    @Operation(
            summary = "Check whether a student's replica exists",
            description = "Returns true if the student has submitted at least one attempt and the replica has been created."
    )
    public ResponseEntity<?> studentExists(
            @PathVariable Long studentId,
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @RequestHeader("X-User-Role") String role)
    {
        if (isForbidden(studentId, authenticatedUserId, role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access forbidden");
        }

        return ResponseEntity.ok(studentReplicaService.studentExists(studentId));
    }

    @GetMapping("/admin/all")
    @Operation(
            summary = "Get all student replicas (admin)",
            description = "Returns the progress summaries of all students. Access restricted to ADMIN."
    )
    public ResponseEntity<?> getAllStudents(@RequestHeader("X-User-Role") String role)
    {
        if (!"ADMIN".equals(role))
        {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access forbidden");
        }

        return ResponseEntity.ok(studentReplicaService.getAllStudents());
    }


    private boolean isForbidden(Long requestedStudentId, Long authenticatedUserId, String role)
    {
        return "STUDENT".equals(role) && !authenticatedUserId.equals(requestedStudentId);
    }
}