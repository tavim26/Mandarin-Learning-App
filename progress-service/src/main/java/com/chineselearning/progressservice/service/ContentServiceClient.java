package com.chineselearning.progressservice.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

/**
 * REST client pentru a comunica cu Content Service.
 */
@Service
public class ContentServiceClient {


    private static final Logger log = LoggerFactory.getLogger(ContentServiceClient.class);

    @Value("${content-service.url:http://localhost:8081}")
    private String contentServiceUrl;

    private final RestTemplate restTemplate;

    public ContentServiceClient()
    {
        this.restTemplate = new RestTemplate();
    }


    public Map<String, Object> getExercise(Long exerciseId)
    {
        String url = contentServiceUrl + "/api/content/exercises/" + exerciseId;

        try {
            log.debug("Fetching exercise from Content Service: {}", url);
            Map<String, Object> exercise = restTemplate.getForObject(url, Map.class);

            if (exercise == null)
            {
                throw new IllegalArgumentException("Exercise not found: " + exerciseId);
            }

            return exercise;
        } catch (Exception e) {
            log.error("Failed to fetch exercise {}: {}", exerciseId, e.getMessage());
            throw new IllegalArgumentException("Exercise not found or Content Service unavailable: " + exerciseId);
        }
    }


    public Map<String, Object> getLesson(Long lessonId)
    {
        String url = contentServiceUrl + "/api/content/lessons/" + lessonId;

        try {
            log.debug("Fetching lesson from Content Service: {}", url);
            Map<String, Object> lesson = restTemplate.getForObject(url, Map.class);

            if (lesson == null)
            {
                throw new IllegalArgumentException("Lesson not found: " + lessonId);
            }

            return lesson;
        } catch (Exception e) {
            log.error("Failed to fetch lesson {}: {}", lessonId, e.getMessage());
            throw new IllegalArgumentException("Lesson not found or Content Service unavailable: " + lessonId);
        }
    }
}