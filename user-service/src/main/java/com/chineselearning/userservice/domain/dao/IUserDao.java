package com.chineselearning.userservice.domain.dao;

import com.chineselearning.userservice.domain.User;
import java.util.List;
import java.util.Optional;

public interface IUserDao
{
     User save(User user);
     Optional<User> findById(Long id);
     List<User> findAll();
     List<User> findByFullNameContaining(String fragment);
     boolean existsById(Long id);
     void deleteById(Long id);

     List<User> findByRole(String role);
}