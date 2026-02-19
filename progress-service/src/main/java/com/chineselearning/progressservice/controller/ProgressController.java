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

// http://localhost:8083/swagger-ui/index.html

@RestController
@RequestMapping("/api/progress")
@Tag(name = "Progress Tracking", description = "Endpointuri pentru gestionarea incercarilor la exercitii si progresul lectiilor")
public class ProgressController
{

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService)
    {
        this.progressService = progressService;
    }

    @PostMapping("/attempts")
    @Operation(
            summary = "Trimite o incercare la un exercitiu",
            description = "Evalueaza raspunsul studentului si actualizeaza progresul lectiei. Creeaza automat replica studentului la prima incercare."
    )
    public ResponseEntity<?> submitAttempt(@Valid @RequestBody SubmitAttemptRequest request)
    {
        try {
            ExerciseAttemptDto result = progressService.submitAttempt(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(e.getMessage());
        }
    }

    @GetMapping("/attempts/student/{studentId}/exercise/{exerciseId}")
    @Operation(
            summary = "Obtine toate incercarile unui student la un exercitiu",
            description = "Returneaza lista incercarilor unui student pentru un exercitiu specific, ordonate dupa numarul incercarii."
    )
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
    @Operation(
            summary = "Obtine progresul unui student la o lectie",
            description = "Returneaza procentul de completare, statusul si XP-ul acordat pentru o lectie specifica."
    )
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
    @Operation(
            summary = "Obtine tot progresul unui student",
            description = "Returneaza toate inregistrarile de progres ale unui student, pentru toate lectiile incepute."
    )
    public ResponseEntity<List<StudentLessonProgressDto>> getAllProgressForStudent(@PathVariable Long studentId)
    {
        List<StudentLessonProgressDto> progressList = progressService.getAllProgressForStudent(studentId);
        return ResponseEntity.ok(progressList);
    }

    @GetMapping("/lessons/student/{studentId}/in-progress")
    @Operation(
            summary = "Obtine lectiile in curs de desfasurare",
            description = "Returneaza doar lectiile cu statusul IN_PROGRESS pentru un student."
    )
    public ResponseEntity<List<StudentLessonProgressDto>> getInProgressLessons(@PathVariable Long studentId)
    {
        List<StudentLessonProgressDto> inProgress = progressService.getInProgressLessons(studentId);
        return ResponseEntity.ok(inProgress);
    }

    @GetMapping("/lessons/{lessonId}/leaderboard")
    @Operation(
            summary = "Obtine clasamentul unei lectii",
            description = "Returneaza primii 10 studenti ordonati dupa procentul de completare pentru o lectie specifica."
    )
    public ResponseEntity<List<StudentLessonProgressDto>> getLessonLeaderboard(@PathVariable Long lessonId)
    {
        List<StudentLessonProgressDto> leaderboard = progressService.getLessonLeaderboard(lessonId);
        return ResponseEntity.ok(leaderboard);
    }
}