package com.chineselearning.progressservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * REST client for communicating with User Service.
 * Updates student XP when lessons are completed.
 */
@Service
public class UserServiceClient {

    private static final Logger log = LoggerFactory.getLogger(UserServiceClient.class);

    @Value("${user-service.url:http://localhost:8082}")
    private String userServiceUrl;

    private final RestTemplate restTemplate;

    public UserServiceClient() {
        this.restTemplate = new RestTemplate();
    }

    /**
     * Add XP to a student in User Service.
     *
     * @param studentId Student ID
     * @param xpToAdd Amount of XP to add
     * @throws RuntimeException if User Service call fails
     */
    public void addStudentXp(Long studentId, int xpToAdd) {
        String url = String.format("%s/api/users/students/%d/xp?xpToAdd=%d",
                userServiceUrl, studentId, xpToAdd);

        try {
            log.debug("Adding {} XP to student {} via User Service", xpToAdd, studentId);
            restTemplate.put(url, null);
            log.info("Successfully added {} XP to student {}", xpToAdd, studentId);
        } catch (Exception e) {
            log.error("Failed to add XP to student {}: {}", studentId, e.getMessage());
            throw new RuntimeException("Failed to update student XP in User Service", e);
        }
    }
}