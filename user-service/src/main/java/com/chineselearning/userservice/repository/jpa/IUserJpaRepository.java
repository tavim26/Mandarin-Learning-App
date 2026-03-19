package com.chineselearning.userservice.repository.jpa;

import com.chineselearning.userservice.repository.entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface IUserJpaRepository extends JpaRepository<UserEntity, Long>
{
    List<UserEntity> findByFullNameContaining(String fragment);

    List<UserEntity> findByCredential_Role(String role);
}