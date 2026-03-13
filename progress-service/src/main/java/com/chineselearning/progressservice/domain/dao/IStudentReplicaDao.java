package com.chineselearning.progressservice.domain.dao;

import com.chineselearning.progressservice.domain.StudentReplica;

import java.util.List;
import java.util.Optional;

public interface IStudentReplicaDao
{

    StudentReplica save(StudentReplica replica);

    void saveIfNotExists(StudentReplica replica);

    Optional<StudentReplica> findById(Long studentId);

    boolean existsByStudentId(Long studentId);

    // Toti studentii ordonati dupa XP — folosit doar de admin
    List<StudentReplica> findAllOrderByXpTotalDesc();

    // Primii 10 studenti — folosit de leaderboard
    List<StudentReplica> findTop10OrderByXpTotalDesc();
}