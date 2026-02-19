package com.chineselearning.progressservice.clients;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class UserServiceClient
{

    private static final Logger log = LoggerFactory.getLogger(UserServiceClient.class);

    @Value("${user-service.url}")
    private String userServiceUrl;

    private final RestTemplate restTemplate;

    public UserServiceClient(RestTemplate restTemplate)
    {
        this.restTemplate = restTemplate;
    }

    public Map<String, Object> getUserById(Long userId)
    {
        String url = userServiceUrl + "/api/users/" + userId;

        try {
            log.debug("Validating user exists in User Service: userId={}", userId);

            Map<String, Object> user = restTemplate.getForObject(url, Map.class);

            if (user == null)
            {
                throw new IllegalArgumentException("User not found in User Service: " + userId);
            }

            // Validate user is a STUDENT
            String role = (String) user.get("role");
            if (!"STUDENT".equals(role)) {
                throw new IllegalArgumentException("User is not a student: userId=" + userId + ", role=" + role);
            }

            log.debug("Successfully validated student: userId={}, fullName={}",
                    userId, user.get("fullName"));
            return user;

        } catch (Exception e) {
            log.error("Failed to validate user in User Service: userId={}, error={}", userId, e.getMessage());
            throw new IllegalArgumentException("User validation failed: " + e.getMessage());
        }
    }
}