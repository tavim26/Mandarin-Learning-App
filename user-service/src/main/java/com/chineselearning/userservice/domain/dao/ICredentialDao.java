package com.chineselearning.userservice.domain.dao;

import com.chineselearning.userservice.domain.Credential;
import java.util.Optional;

public interface ICredentialDao
{
    Credential save(Credential credential);
    Optional<Credential> findByEmail(String email);
    boolean existsByEmail(String email);

    Optional<Credential> findById(Long id);

    void deleteById(Long id);
}