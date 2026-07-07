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
@Tag(name = "Student Progress Summary", description = "Endpointuri pentru gestionarea XP-ului, nivelului si clasamentului studentilor")
public class StudentReplicaController
{

    private final StudentReplicaService studentReplicaService;

    public StudentReplicaController(StudentReplicaService studentReplicaService)
    {
        this.studentReplicaService = studentReplicaService;
    }

    @GetMapping("/leaderboard")
    @Operation(
            summary = "Obtine clasamentul global",
            description = "Returneaza primii 10 studenti ordonati dupa XP-ul total acumulat din toate lectiile."
    )
    public ResponseEntity<List<StudentReplicaDto>> getLeaderboard()
    {
        return ResponseEntity.ok(studentReplicaService.getLeaderboard());
    }

    @GetMapping("/{studentId}")
    @Operation(
            summary = "Obtine rezumatul progresului unui student",
            description = "Returneaza XP-ul total si nivelul curent al studentului."
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
            summary = "Verifica existenta replicii unui student",
            description = "Returneaza true daca studentul a trimis cel putin o incercare si replica a fost creata."
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
            summary = "Obtine toate replicile studentilor (admin)",
            description = "Returneaza rezumatele de progres ale tuturor studentilor. Acces restrictionat la ADMIN."
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