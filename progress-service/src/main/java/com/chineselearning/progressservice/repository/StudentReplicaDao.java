package com.chineselearning.progressservice.repository;

import com.chineselearning.progressservice.domain.StudentReplica;
import com.chineselearning.progressservice.domain.dao.IStudentReplicaDao;
import com.chineselearning.progressservice.repository.entities.StudentReplicaEntity;
import com.chineselearning.progressservice.repository.jpa.StudentReplicaJpaRepository;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Repository
public class StudentReplicaDao implements IStudentReplicaDao {

    private final StudentReplicaJpaRepository jpaRepository;

    public StudentReplicaDao(StudentReplicaJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public StudentReplica save(StudentReplica replica) {
        StudentReplicaEntity saved = jpaRepository.save(toEntity(replica));
        return toDomain(saved);
    }

    @Override
    public Optional<StudentReplica> findById(Long studentId) {
        return jpaRepository.findById(studentId)
                .map(this::toDomain);
    }

    @Override
    public boolean existsByStudentId(Long studentId) {
        return jpaRepository.existsByStudentId(studentId);
    }

    @Override
    public List<StudentReplica> findAllOrderByXpTotalDesc() {
        // Sortare DESC dupa xpTotal - limitarea la top 10 se face in StudentReplicaService
        return jpaRepository.findAll(Sort.by(Sort.Direction.DESC, "xpTotal"))
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }

    // ========== CONVERSIE ==========

    private StudentReplicaEntity toEntity(StudentReplica domain) {
        StudentReplicaEntity entity = new StudentReplicaEntity();
        entity.setStudentId(domain.getStudentId());
        entity.setXpTotal(domain.getXpTotal());
        entity.setLevel(domain.getLevel());
        return entity;
    }

    private StudentReplica toDomain(StudentReplicaEntity entity) {
        // Folosim constructorul cu toti parametrii pentru a restaura starea completa
        return new StudentReplica(
                entity.getStudentId(),
                entity.getXpTotal(),
                entity.getLevel()
        );
    }
}