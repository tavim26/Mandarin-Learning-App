package com.chineselearning.progressservice.clients;

import com.chineselearning.progressservice.domain.dto.ExerciseResponseDto;
import com.chineselearning.progressservice.domain.dto.LessonResponseDto;

import com.chineselearning.progressservice.domain.ports.IContentServicePort;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class ContentServiceClient implements IContentServicePort
{

    private static final Logger log = LoggerFactory.getLogger(ContentServiceClient.class);

    @Value("${content-service.url}")
    private String contentServiceUrl;

    private final RestTemplate restTemplate;

    public ContentServiceClient(RestTemplate restTemplate)
    {
        this.restTemplate = restTemplate;
    }


    public ExerciseResponseDto getExercise(Long exerciseId)
    {
        String url = contentServiceUrl + "/api/content/exercises/" + exerciseId;

        try {
            log.debug("Fetching exercise from Content Service: exerciseId={}", exerciseId);

            ExerciseResponseDto exercise = restTemplate.getForObject(url, ExerciseResponseDto.class);

            if (exercise == null)
            {
                throw new IllegalArgumentException("Exercise was not found: " + exerciseId);
            }

            log.debug("Exercise fetched successfully: exerciseId={}, type={}", exerciseId, exercise.getType());
            return exercise;

        } catch (HttpClientErrorException e) {

            if (e.getStatusCode() == HttpStatus.NOT_FOUND)
            {
                throw new IllegalArgumentException("Exercise does not exist in content-service: " + exerciseId);
            }
            log.error("HTTP error fetching exercise: exerciseId={}, status={}", exerciseId, e.getStatusCode());
            throw new IllegalStateException("Communication error with content-service: " + e.getMessage());

        } catch (IllegalArgumentException e) {
            throw e;

        } catch (Exception e) {
            log.error("Unexpected error fetching exercise: exerciseId={}, error={}", exerciseId, e.getMessage());
            throw new IllegalStateException("Content-service unavailable: " + e.getMessage());
        }
    }



    public LessonResponseDto getLesson(Long lessonId)
    {
        String url = contentServiceUrl + "/api/content/lessons/" + lessonId;

        try {
            log.debug("Fetching lesson from Content Service: lessonId={}", lessonId);

            LessonResponseDto lesson = restTemplate.getForObject(url, LessonResponseDto.class);

            if (lesson == null)
            {
                throw new IllegalArgumentException("Lectia nu a fost gasita: " + lessonId);
            }

            log.debug("Lesson fetched successfully: lessonId={}, exercisesCount={}, xpReward={}", lessonId, lesson.getExercises() != null ? lesson.getExercises().size() : 0, lesson.getXpReward());
            return lesson;

        } catch (HttpClientErrorException e)
        {
            if (e.getStatusCode() == HttpStatus.NOT_FOUND)
            {
                throw new IllegalArgumentException("Lesson does not exist in content-service: " + lessonId);
            }

            log.error("HTTP error fetching lesson: lessonId={}, status={}", lessonId, e.getStatusCode());
            throw new IllegalStateException("Communication error with content-service: " + e.getMessage());

        } catch (IllegalArgumentException e) {
            throw e;

        } catch (Exception e) {
            log.error("Unexpected error fetching lesson: lessonId={}, error={}", lessonId, e.getMessage());
            throw new IllegalStateException("Content-service unavailable: " + e.getMessage());
        }
    }



    @Override
    public List<LessonResponseDto> getLessonsForUnit(Long unitId)
    {
        String url = contentServiceUrl + "/api/content/units/" + unitId + "/lessons";

        try {
            log.debug("Fetching lessons for unit from Content Service: unitId={}", unitId);

            LessonResponseDto[] lessons = restTemplate.getForObject(url, LessonResponseDto[].class);

            if (lessons == null)
            {
                return List.of();
            }

            log.debug("Lessons fetched for unitId={}, count={}", unitId, lessons.length);
            return List.of(lessons);

        } catch (HttpClientErrorException e) {

            if (e.getStatusCode() == HttpStatus.NOT_FOUND)
            {
                throw new IllegalArgumentException("Unit does not exist in content-service: " + unitId);
            }
            log.error("HTTP error fetching lessons for unit: unitId={}, status={}", unitId, e.getStatusCode());
            throw new IllegalStateException("Communication error with content-service: " + e.getMessage());

        } catch (IllegalArgumentException e) {
            throw e;

        } catch (Exception e) {
            log.error("Unexpected error fetching lessons for unit: unitId={}, error={}", unitId, e.getMessage());
            throw new IllegalStateException("Content-service unavailable: " + e.getMessage());
        }
    }
}