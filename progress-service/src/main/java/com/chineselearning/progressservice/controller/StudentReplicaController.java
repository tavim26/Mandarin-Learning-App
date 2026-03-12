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
        List<StudentReplicaDto> leaderboard = studentReplicaService.getLeaderboard();
        return ResponseEntity.ok(leaderboard);
    }

    @GetMapping("/{studentId}")
    @Operation(
            summary = "Obtine rezumatul progresului unui student",
            description = "Returneaza XP-ul total si nivelul curent al studentului."
    )
    public ResponseEntity<?> getStudentById(@PathVariable Long studentId)
    {
        Optional<StudentReplicaDto> student = studentReplicaService.getStudentById(studentId);

        if (student.isPresent())
        {
            return ResponseEntity.ok(student.get());

        }
        else
        {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{studentId}/exists")
    @Operation(
            summary = "Verifica existenta replicii unui student",
            description = "Returneaza true daca studentul a trimis cel putin o incercare si replica a fost creata."
    )
    public ResponseEntity<Boolean> studentExists(@PathVariable Long studentId)
    {
        boolean exists = studentReplicaService.studentExists(studentId);
        return ResponseEntity.ok(exists);
    }

    @GetMapping("/admin/all")
    @Operation(
            summary = "Obtine toate replicile studentilor (admin)",
            description = "Returneaza rezumatele de progres ale tuturor studentilor."
    )
    public ResponseEntity<List<StudentReplicaDto>> getAllStudents()
    {
        List<StudentReplicaDto> students = studentReplicaService.getAllStudents();
        return ResponseEntity.ok(students);
    }
}