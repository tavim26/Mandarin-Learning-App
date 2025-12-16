package com.chineselearning.userservice.domain.dao;

import com.chineselearning.userservice.domain.Credential;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface ICredentialDao extends JpaRepository<Credential, Long> {

    // pentru Login: Gaseste utilizatorul dupa email
    Optional<Credential> findByEmail(String email);

    // pentru Register: Verifica daca emailul e deja folosit
    boolean existsByEmail(String email);
}