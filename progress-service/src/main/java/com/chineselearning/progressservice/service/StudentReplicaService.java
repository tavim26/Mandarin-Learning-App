package com.chineselearning.progressservice.service;

import com.chineselearning.progressservice.domain.StudentReplica;
import com.chineselearning.progressservice.domain.dao.IStudentReplicaDao;
import com.chineselearning.progressservice.domain.dto.StudentReplicaDto;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Transactional
public class StudentReplicaService
{

    private final IStudentReplicaDao studentReplicaDao;

    public StudentReplicaService(IStudentReplicaDao studentReplicaDao)
    {
        this.studentReplicaDao = studentReplicaDao;
    }

    public List<StudentReplicaDto> getAllStudents()
    {
        return studentReplicaDao.findAll().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }

    public Optional<StudentReplicaDto> getStudentById(Long studentId)
    {
        return studentReplicaDao.findById(studentId)
                .map(this::mapToDto);
    }

    public boolean studentExists(Long studentId)
    {
        return studentReplicaDao.existsByStudentId(studentId);
    }

    public List<StudentReplicaDto> getLeaderboard()
    {
        // Top 10 students by XP (descending order)
        PageRequest pageRequest = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "xpTotal"));
        return studentReplicaDao.findAll(pageRequest).stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());
    }




    private StudentReplicaDto mapToDto(StudentReplica replica)
    {
        return new StudentReplicaDto(
                replica.getStudentId(),
                replica.getXpTotal(),
                replica.getLevel()
        );
    }
}