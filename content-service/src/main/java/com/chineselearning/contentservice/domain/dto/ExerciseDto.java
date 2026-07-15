package com.chineselearning.contentservice.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.Map;

public class ExerciseDto {

    private Long id;

    private Long lessonId;

    @NotBlank(message = "Exercise type is mandatory")
    private String type;

    @NotBlank(message = "Exercise prompt is mandatory")
    private String prompt;

    private Integer difficulty;
    private Map<String, Object> contentData;

    public ExerciseDto() {}

    public ExerciseDto(Long id, Long lessonId, String type, String prompt, Integer difficulty, Map<String, Object> contentData) {
        this.id = id;
        this.lessonId = lessonId;
        this.type = type;
        this.prompt = prompt;
        this.difficulty = difficulty;
        this.contentData = contentData;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }

    public Integer getDifficulty() { return difficulty; }
    public void setDifficulty(Integer difficulty) { this.difficulty = difficulty; }

    public Map<String, Object> getContentData() { return contentData; }
    public void setContentData(Map<String, Object> contentData) { this.contentData = contentData; }
}