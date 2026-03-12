package com.chineselearning.progressservice.repository.jpa;

import com.chineselearning.progressservice.repository.entities.StudentReplicaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.domain.Sort;

import java.util.List;

public interface StudentReplicaJpaRepository extends JpaRepository<StudentReplicaEntity, Long>
{

    // Verifica existenta replicii unui student
    boolean existsByStudentId(Long studentId);

    // Toate replicile ordonate dupa XP descrescator
    List<StudentReplicaEntity> findAll(Sort sort);
}