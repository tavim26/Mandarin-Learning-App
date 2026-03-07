package com.chineselearning.progressservice.domain.dao;

import com.chineselearning.progressservice.domain.StudentReplica;

import java.util.List;
import java.util.Optional;

// Interfata pura Java - defineste contractul de persistenta fara detalii de implementare
public interface IStudentReplicaDao {

    StudentReplica save(StudentReplica replica);

    Optional<StudentReplica> findById(Long studentId);

    boolean existsByStudentId(Long studentId);

    // Folosit pentru clasamentul global - toate replicile ordonate dupa XP
    List<StudentReplica> findAllOrderByXpTotalDesc();
}