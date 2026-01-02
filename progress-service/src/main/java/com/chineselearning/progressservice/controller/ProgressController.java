package com.chineselearning.progressservice.controller;

import com.chineselearning.progressservice.domain.dto.ExerciseAttemptDto;
import com.chineselearning.progressservice.domain.dto.StudentLessonProgressDto;
import com.chineselearning.progressservice.domain.dto.SubmitAttemptRequest;
import com.chineselearning.progressservice.service.ProgressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


//  http://localhost:8083/swagger-ui/index.html

@RestController
@RequestMapping("/api/progress")
@Tag(name = "Progress", description = "API pentru tracking progres studenti")
public class ProgressController {

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    // ========== EXERCISE ATTEMPT ENDPOINTS ==========

    @PostMapping("/attempts")
    @Operation(summary = "Trimite incercare exercitiu", description = "Trimite incercarea unui student la un exercitiu. Returneaza rezultatul evaluarii si actualizeaza progresul.")
    public ResponseEntity<ExerciseAttemptDto> submitAttempt(@Valid @RequestBody SubmitAttemptRequest request) {
        try {
            ExerciseAttemptDto result = progressService.submitAttempt(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/attempts/student/{studentId}/exercise/{exerciseId}")
    @Operation(summary = "Obtine incercarile studentului pentru exercitiu", description = "Returneaza toate incercarile unui student la un exercitiu specific")
    public ResponseEntity<List<ExerciseAttemptDto>> getStudentAttemptsForExercise(@PathVariable Long studentId, @PathVariable Long exerciseId) {
        try {
            List<ExerciseAttemptDto> attempts = progressService.getStudentAttemptsForExercise(studentId, exerciseId);
            return ResponseEntity.ok(attempts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/attempts/student/{studentId}/recent")
    @Operation(summary = "Obtine incercari recente ale studentului", description = "Returneaza cele mai recente incercari ale unui student la orice exercitii")
    public ResponseEntity<List<ExerciseAttemptDto>> getRecentAttempts(@PathVariable Long studentId, @RequestParam(defaultValue = "10") int limit) {
        try {
            List<ExerciseAttemptDto> attempts = progressService.getRecentAttempts(studentId, limit);
            return ResponseEntity.ok(attempts);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ========== LESSON PROGRESS ENDPOINTS ==========

    @GetMapping("/lessons/student/{studentId}/lesson/{lessonId}")
    @Operation(summary = "Obtine progres lectie", description = "Returneaza progresul unui student la o lectie specifica")
    public ResponseEntity<StudentLessonProgressDto> getLessonProgress(@PathVariable Long studentId, @PathVariable Long lessonId) {
        try {
            StudentLessonProgressDto progress = progressService.getLessonProgress(studentId, lessonId);
            return ResponseEntity.ok(progress);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/lessons/student/{studentId}")
    @Operation(summary = "Obtine tot progresul studentului", description = "Returneaza progresul la toate lectiile pentru un student")
    public ResponseEntity<List<StudentLessonProgressDto>> getAllProgressForStudent(
            @PathVariable Long studentId) {
        try {
            List<StudentLessonProgressDto> progress = progressService.getAllProgressForStudent(studentId);
            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/lessons/student/{studentId}/in-progress")
    @Operation(summary = "Obtine lectii in progres", description = "Returneaza lectiile pe care studentul le-a inceput dar nu le-a finalizat")
    public ResponseEntity<List<StudentLessonProgressDto>> getInProgressLessons(@PathVariable Long studentId) {
        try {
            List<StudentLessonProgressDto> progress = progressService.getInProgressLessons(studentId);
            return ResponseEntity.ok(progress);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/lessons/{lessonId}/leaderboard")
    @Operation(summary = "Obtine clasament lectie", description = "Returneaza top 10 studenti dupa procentul de completare pentru o lectie")
    public ResponseEntity<List<StudentLessonProgressDto>> getLessonLeaderboard(@PathVariable Long lessonId) {
        try {
            List<StudentLessonProgressDto> leaderboard = progressService.getLessonLeaderboard(lessonId);
            return ResponseEntity.ok(leaderboard);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    // ========== HEALTH CHECK ENDPOINT ==========

    @GetMapping("/health")
    @Operation(summary = "Verificare stare serviciu", description = "Verifica daca Progress Service functioneaza")
    public ResponseEntity<String> healthCheck() {
        return ResponseEntity.ok("Progress Service is running");
    }
}