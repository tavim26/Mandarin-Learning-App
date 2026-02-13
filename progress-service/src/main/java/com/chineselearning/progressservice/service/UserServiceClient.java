package com.chineselearning.progressservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

/**
 * REST client pentru comunicare cu User Service.
 * Folosit pentru update la punctele de XP(experienta) ale unui student atunci cand acesta finalizeaza o lectie.
 */
@Service
public class UserServiceClient
{

    private static final Logger log = LoggerFactory.getLogger(UserServiceClient.class);

    @Value("${user-service.url:http://localhost:8082}")
    private String userServiceUrl;

    private final RestTemplate restTemplate;

    public UserServiceClient()
    {
        this.restTemplate = new RestTemplate();
    }

    public void addStudentXp(Long studentId, int xpToAdd)
    {
        String url = String.format("%s/api/users/students/%d/xp?xpToAdd=%d", userServiceUrl, studentId, xpToAdd);

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