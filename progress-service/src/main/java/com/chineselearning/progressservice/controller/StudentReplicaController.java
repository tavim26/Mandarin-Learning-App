package com.chineselearning.progressservice.controller;

import com.chineselearning.progressservice.domain.dto.StudentReplicaDto;
import com.chineselearning.progressservice.service.StudentReplicaService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/progress/admin/students")
@Tag(name = "Admin - Student Replica", description = "Endpoints admin pentru gestionare replici studenti")
public class StudentReplicaController {

    private final StudentReplicaService studentReplicaService;

    public StudentReplicaController(StudentReplicaService studentReplicaService) {
        this.studentReplicaService = studentReplicaService;
    }

    @GetMapping
    @Operation(summary = "Obtine toate replicile studenti",
            description = "Returneaza toti studentii sincronizati (doar admin)")
    public ResponseEntity<List<StudentReplicaDto>> getAllStudents() {
        List<StudentReplicaDto> students = studentReplicaService.getAllStudents();
        return ResponseEntity.ok(students);
    }

    @GetMapping("/{studentId}")
    @Operation(summary = "Obtine replica student dupa ID",
            description = "Returneaza datele sincronizate pentru un student specific")
    public ResponseEntity<StudentReplicaDto> getStudentById(@PathVariable Long studentId) {
        return studentReplicaService.getStudentById(studentId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{studentId}/exists")
    @Operation(summary = "Verifica existenta student",
            description = "Verifica daca un student a fost sincronizat in Progress Service")
    public ResponseEntity<Boolean> studentExists(@PathVariable Long studentId) {
        boolean exists = studentReplicaService.studentExists(studentId);
        return ResponseEntity.ok(exists);
    }
}