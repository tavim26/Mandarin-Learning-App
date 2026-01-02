package com.chineselearning.progressservice.service;

import com.chineselearning.progressservice.domain.StudentReplica;
import com.chineselearning.progressservice.domain.dao.IStudentReplicaDao;
import com.chineselearning.progressservice.domain.dto.StudentReplicaDto;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class StudentReplicaService {

    private final IStudentReplicaDao studentReplicaDao;

    public StudentReplicaService(IStudentReplicaDao studentReplicaDao) {
        this.studentReplicaDao = studentReplicaDao;
    }

    public List<StudentReplicaDto> getAllStudents() {
        return studentReplicaDao.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public Optional<StudentReplicaDto> getStudentById(Long studentId) {
        return studentReplicaDao.findById(studentId)
                .map(this::mapToDto);
    }

    public boolean studentExists(Long studentId) {
        return studentReplicaDao.existsByStudentId(studentId);
    }

    // ========== PRIVATE MAPPING METHOD ==========

    private StudentReplicaDto mapToDto(StudentReplica replica) {
        return new StudentReplicaDto(
                replica.getStudentId(),
                replica.getFullName(),
                replica.getEmail(),
                replica.getSyncedAt()
        );
    }
}
