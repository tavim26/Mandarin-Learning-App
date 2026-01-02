package com.chineselearning.progressservice.domain.dao;

import com.chineselearning.progressservice.domain.StudentReplica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IStudentReplicaDao extends JpaRepository<StudentReplica, Long> {

    Optional<StudentReplica> findByEmail(String email);

    boolean existsByStudentId(Long studentId);
}