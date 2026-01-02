package com.chineselearning.progressservice.domain.dao;

import com.chineselearning.progressservice.domain.StudentReplica;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface IStudentReplicaDao extends JpaRepository<StudentReplica, Long> {

    /**
     * Find student replica by email (for sync validation).
     */
    Optional<StudentReplica> findByEmail(String email);

    /**
     * Check if student exists by ID.
     */
    boolean existsByStudentId(Long studentId);
}