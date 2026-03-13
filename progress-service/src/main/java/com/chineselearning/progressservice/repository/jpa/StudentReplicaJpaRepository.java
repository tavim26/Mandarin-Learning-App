package com.chineselearning.progressservice.repository.jpa;

import com.chineselearning.progressservice.repository.entities.StudentReplicaEntity;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface StudentReplicaJpaRepository extends JpaRepository<StudentReplicaEntity, Long>
{

    boolean existsByStudentId(Long studentId);

    // Primii 10 studenti ordonati dupa XP descrescator — limitat la nivel de query
    List<StudentReplicaEntity> findTop10ByOrderByXpTotalDesc();
}