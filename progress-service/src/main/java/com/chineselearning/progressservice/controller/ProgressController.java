package com.chineselearning.progressservice.controller;

import com.chineselearning.progressservice.domain.dto.ExerciseAttemptDto;
import com.chineselearning.progressservice.domain.dto.StudentLessonProgressDto;
import com.chineselearning.progressservice.domain.dto.SubmitAttemptRequest;

import com.chineselearning.progressservice.service.ProgressService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// http://localhost:8083/swagger-ui/index.html

@RestController
@RequestMapping("/api/progress")
@Tag(name = "Progress Tracking", description = "Endpoints for exercise attempts and lesson progress")
public class ProgressController
{

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService)
    {
        this.progressService = progressService;
    }

    @PostMapping("/attempts")
    @Operation(summary = "Submit exercise attempt", description = "Submit student answer for evaluation. Automatically creates student replica on first attempt (lazy creation).")
    public ResponseEntity<?> submitAttempt(@RequestBody SubmitAttemptRequest request)
    {
        try {
            ExerciseAttemptDto result = progressService.submitAttempt(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/attempts/student/{studentId}/exercise/{exerciseId}")
    @Operation(summary = "Get all attempts for exercise", description = "Returns all attempts made by a student on a specific exercise, ordered by attempt number")
    public ResponseEntity<?> getStudentAttemptsForExercise(@PathVariable Long studentId, @PathVariable Long exerciseId)
    {
        try {
            List<ExerciseAttemptDto> attempts = progressService.getStudentAttemptsForExercise(studentId, exerciseId);
            return ResponseEntity.ok(attempts);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/lessons/student/{studentId}/lesson/{lessonId}")
    @Operation(summary = "Get lesson progress", description = "Returns progress for a specific lesson (completion %, status, XP awarded)")
    public ResponseEntity<?> getLessonProgress(@PathVariable Long studentId, @PathVariable Long lessonId)
    {
        try {
            StudentLessonProgressDto progress = progressService.getLessonProgress(studentId, lessonId);
            return ResponseEntity.ok(progress);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/lessons/student/{studentId}")
    @Operation(summary = "Get all progress for student", description = "Returns all lesson progress records for a student")
    public ResponseEntity<List<StudentLessonProgressDto>> getAllProgressForStudent(@PathVariable Long studentId)
    {
        List<StudentLessonProgressDto> progressList = progressService.getAllProgressForStudent(studentId);
        return ResponseEntity.ok(progressList);
    }

    @GetMapping("/lessons/student/{studentId}/in-progress")
    @Operation(summary = "Get in-progress lessons", description = "Returns only lessons with status IN_PROGRESS for a student")
    public ResponseEntity<List<StudentLessonProgressDto>> getInProgressLessons(@PathVariable Long studentId)
    {
        List<StudentLessonProgressDto> inProgress = progressService.getInProgressLessons(studentId);
        return ResponseEntity.ok(inProgress);
    }

    @GetMapping("/lessons/{lessonId}/leaderboard")
    @Operation(summary = "Get lesson leaderboard", description = "Returns top 10 students by completion percentage for a specific lesson")
    public ResponseEntity<List<StudentLessonProgressDto>> getLessonLeaderboard(@PathVariable Long lessonId)
    {
        List<StudentLessonProgressDto> leaderboard = progressService.getLessonLeaderboard(lessonId);
        return ResponseEntity.ok(leaderboard);
    }
}