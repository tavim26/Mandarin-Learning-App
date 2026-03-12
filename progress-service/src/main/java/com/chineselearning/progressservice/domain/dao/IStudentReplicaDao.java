package com.chineselearning.progressservice.domain.dao;

import com.chineselearning.progressservice.domain.StudentReplica;

import java.util.List;
import java.util.Optional;

public interface IStudentReplicaDao
{

    StudentReplica save(StudentReplica replica);

    Optional<StudentReplica> findById(Long studentId);

    boolean existsByStudentId(Long studentId);

    List<StudentReplica> findAllOrderByXpTotalDesc();
}