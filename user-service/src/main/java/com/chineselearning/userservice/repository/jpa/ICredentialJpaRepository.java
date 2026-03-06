package com.chineselearning.userservice.repository.jpa;

import com.chineselearning.userservice.repository.entities.CredentialEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ICredentialJpaRepository extends JpaRepository<CredentialEntity, Long>
{
    Optional<CredentialEntity> findByEmail(String email);
    boolean existsByEmail(String email);
}