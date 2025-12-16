package com.chineselearning.userservice.domain.dao;

import com.chineselearning.userservice.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IUserDao extends JpaRepository<User, Long> {

     List<User> findByFullNameContaining(String fragment);
}