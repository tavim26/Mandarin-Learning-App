package com.chineselearning.progressservice.clients;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Map;

@Service
public class ContentServiceClient
{

    private static final Logger log = LoggerFactory.getLogger(ContentServiceClient.class);

    @Value("${content-service.url}")
    private String contentServiceUrl;

    private final RestTemplate restTemplate;

    public ContentServiceClient(RestTemplate restTemplate)
    {
        this.restTemplate = restTemplate;
    }

    public Map<String, Object> getExercise(Long exerciseId)
    {
        String url = contentServiceUrl + "/api/content/exercises/" + exerciseId;

        try {
            log.debug("Fetching exercise from Content Service: exerciseId={}", exerciseId);

            Map<String, Object> exercise = restTemplate.getForObject(url, Map.class);

            if (exercise == null)
            {
                throw new IllegalArgumentException("Exercise not found: " + exerciseId);
            }

            // Validate essential fields
            if (!exercise.containsKey("lessonId") || !exercise.containsKey("type") || !exercise.containsKey("contentData")) {
                throw new IllegalArgumentException("Invalid exercise structure from Content Service");
            }

            log.debug("Successfully fetched exercise: exerciseId={}, type={}", exerciseId, exercise.get("type"));
            return exercise;

        } catch (Exception e) {
            log.error("Failed to fetch exercise from Content Service: exerciseId={}, error={}",
                    exerciseId, e.getMessage());
            throw new IllegalArgumentException("Exercise validation failed: " + e.getMessage());
        }
    }

    public Map<String, Object> getLesson(Long lessonId)
    {
        String url = contentServiceUrl + "/api/content/lessons/" + lessonId;

        try {
            log.debug("Fetching lesson from Content Service: lessonId={}", lessonId);

            Map<String, Object> lesson = restTemplate.getForObject(url, Map.class);

            if (lesson == null) {
                throw new IllegalArgumentException("Lesson not found: " + lessonId);
            }

            // Validate essential fields
            if (!lesson.containsKey("exercises") || !lesson.containsKey("xpReward")) {
                throw new IllegalArgumentException("Invalid lesson structure from Content Service");
            }

            log.debug("Successfully fetched lesson: lessonId={}, exercisesCount={}, xpReward={}",
                    lessonId,
                    ((java.util.List<?>) lesson.get("exercises")).size(),
                    lesson.get("xpReward"));
            return lesson;

        } catch (Exception e) {
            log.error("Failed to fetch lesson from Content Service: lessonId={}, error={}",
                    lessonId, e.getMessage());
            throw new IllegalArgumentException("Lesson validation failed: " + e.getMessage());
        }
    }
}