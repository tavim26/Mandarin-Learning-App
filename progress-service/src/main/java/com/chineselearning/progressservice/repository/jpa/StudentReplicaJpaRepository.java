package com.chineselearning.progressservice.repository.jpa;

import com.chineselearning.progressservice.repository.entities.StudentReplicaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentReplicaJpaRepository extends JpaRepository<StudentReplicaEntity, Long>
{

    boolean existsByStudentId(Long studentId);

    List<StudentReplicaEntity> findTop10ByOrderByXpTotalDesc();
}