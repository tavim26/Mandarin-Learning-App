package com.chineselearning.progressservice.domain.dao;

import com.chineselearning.progressservice.domain.StudentReplica;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IStudentReplicaDao extends JpaRepository<StudentReplica, Long> {

    boolean existsByStudentId(Long studentId);
}