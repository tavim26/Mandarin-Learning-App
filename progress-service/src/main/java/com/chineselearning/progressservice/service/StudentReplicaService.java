package com.chineselearning.progressservice.service;

import com.chineselearning.progressservice.domain.StudentReplica;
import com.chineselearning.progressservice.domain.dao.IStudentReplicaDao;
import com.chineselearning.progressservice.domain.dto.StudentReplicaDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class StudentReplicaService {

    private final IStudentReplicaDao studentReplicaDao;

    public StudentReplicaService(IStudentReplicaDao studentReplicaDao) {
        this.studentReplicaDao = studentReplicaDao;
    }

    @Transactional(readOnly = true)
    public List<StudentReplicaDto> getAllStudents() {
        return studentReplicaDao.findAllOrderByXpTotalDesc().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Optional<StudentReplicaDto> getStudentById(Long studentId) {
        return studentReplicaDao.findById(studentId)
                .map(this::mapToDto);
    }

    @Transactional(readOnly = true)
    public boolean studentExists(Long studentId) {
        return studentReplicaDao.existsByStudentId(studentId);
    }

    @Transactional(readOnly = true)
    public List<StudentReplicaDto> getLeaderboard() {
        // Limitarea la top 10 se face in service prin stream
        // PageRequest si Sort nu mai sunt necesare - zero importuri Spring Data
        return studentReplicaDao.findAllOrderByXpTotalDesc().stream()
                .limit(10)
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    private StudentReplicaDto mapToDto(StudentReplica replica) {
        return new StudentReplicaDto(
                replica.getStudentId(),
                replica.getXpTotal(),
                replica.getLevel()
        );
    }
}