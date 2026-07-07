package com.chineselearning.progressservice.controller;

import com.chineselearning.progressservice.domain.dto.*;

import com.chineselearning.progressservice.service.ProgressService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// http://localhost:8083/swagger-ui/index.html

@RestController
@RequestMapping("/api/progress")
@Tag(name = "Progress Tracking", description = "Endpoints for managing exercise attempts and lesson progress")
public class ProgressController
{

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService)
    {
        this.progressService = progressService;
    }

    @PostMapping("/attempts")
    @Operation(
            summary = "Submit an exercise attempt",
            description = "Evaluates the student's answer and updates the lesson progress. Automatically creates the student replica on the first attempt."
    )
    public ResponseEntity<?> submitAttempt(
            @Valid
            @RequestBody SubmitAttemptRequest request,
            @RequestHeader("X-User-Id") Long authenticatedUserId)
    {
        try {
            ExerciseAttemptDto result = progressService.submitAttempt(authenticatedUserId, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(e.getMessage());
        }
    }



    @GetMapping("/attempts/student/{studentId}/exercise/{exerciseId}")
    @Operation(
            summary = "Get all attempts of a student for an exercise",
            description = "Returns the list of a student's attempts for a specific exercise, ordered by attempt number."
    )
    public ResponseEntity<?> getStudentAttemptsForExercise(
            @PathVariable Long studentId,
            @PathVariable Long exerciseId,
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @RequestHeader("X-User-Role") String role)
    {
        if (isForbidden(studentId, authenticatedUserId, role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access forbidden");
        }

        try {
            List<ExerciseAttemptDto> attempts = progressService.getStudentAttemptsForExercise(studentId, exerciseId);
            return ResponseEntity.ok(attempts);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }



    @GetMapping("/lessons/student/{studentId}/lesson/{lessonId}")
    @Operation(
            summary = "Get a student's progress for a lesson",
            description = "Returns the completion percentage, status, and XP awarded for a specific lesson."
    )
    public ResponseEntity<?> getLessonProgress(
            @PathVariable Long studentId,
            @PathVariable Long lessonId,
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @RequestHeader("X-User-Role") String role)
    {
        if (isForbidden(studentId, authenticatedUserId, role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access forbidden");
        }

        try {
            StudentLessonProgressDto progress = progressService.getLessonProgress(studentId, lessonId);
            return ResponseEntity.ok(progress);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }


    @GetMapping("/lessons/student/{studentId}")
    @Operation(
            summary = "Get all progress records of a student",
            description = "Returns all progress records of a student, for every lesson started."
    )
    public ResponseEntity<?> getAllProgressForStudent(
            @PathVariable Long studentId,
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @RequestHeader("X-User-Role") String role)
    {
        if (isForbidden(studentId, authenticatedUserId, role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access forbidden");
        }

        List<StudentLessonProgressDto> progressList = progressService.getAllProgressForStudent(studentId);
        return ResponseEntity.ok(progressList);
    }




    @GetMapping("/lessons/student/{studentId}/in-progress")
    @Operation(
            summary = "Get the lessons currently in progress",
            description = "Returns only the lessons with status IN_PROGRESS for a student."
    )
    public ResponseEntity<?> getInProgressLessons(
            @PathVariable Long studentId,
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @RequestHeader("X-User-Role") String role)
    {
        if (isForbidden(studentId, authenticatedUserId, role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access forbidden");
        }

        List<StudentLessonProgressDto> inProgress = progressService.getInProgressLessons(studentId);
        return ResponseEntity.ok(inProgress);
    }



    @GetMapping("/lessons/{lessonId}/leaderboard")
    @Operation(
            summary = "Get the leaderboard for a lesson",
            description = "Returns the top 10 students ordered by completion percentage for a specific lesson."
    )
    public ResponseEntity<List<StudentLessonProgressDto>> getLessonLeaderboard(@PathVariable Long lessonId)
    {
        List<StudentLessonProgressDto> leaderboard = progressService.getLessonLeaderboard(lessonId);
        return ResponseEntity.ok(leaderboard);
    }



    @GetMapping("/students/{studentId}/summary")
    @Operation(
            summary = "Get a student's dashboard summary",
            description = "Returns XP, level, and the number of completed and in-progress lessons in a single call."
    )
    public ResponseEntity<?> getStudentSummary(
            @PathVariable Long studentId,
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @RequestHeader("X-User-Role") String role)
    {
        if (isForbidden(studentId, authenticatedUserId, role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access forbidden");
        }

        StudentSummaryDto summary = progressService.getStudentSummary(studentId);
        return ResponseEntity.ok(summary);
    }



    @GetMapping("/units/{unitId}/student/{studentId}/progress")
    @Operation(
            summary = "Get a student's progress for a unit",
            description = "Returns the number of completed, in-progress, and not-started lessons in a unit, plus the unit completion percentage."
    )
    public ResponseEntity<?> getUnitProgress(
            @PathVariable Long unitId,
            @PathVariable Long studentId,
            @RequestHeader("X-User-Id") Long authenticatedUserId,
            @RequestHeader("X-User-Role") String role)
    {
        if (isForbidden(studentId, authenticatedUserId, role)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Access forbidden");
        }

        try {
            StudentUnitProgressDto progress = progressService.getUnitProgress(studentId, unitId);
            return ResponseEntity.ok(progress);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(e.getMessage());
        }
    }



    private boolean isForbidden(Long requestedStudentId, Long authenticatedUserId, String role)
    {
        return "STUDENT".equals(role) && !authenticatedUserId.equals(requestedStudentId);
    }
}