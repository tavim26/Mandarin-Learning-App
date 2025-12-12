package com.chineselearning.contentservice.dto;

import java.util.Map;

public class ExerciseDto {
    private Long id;
    private Long lessonId;
    private String type;
    private String prompt;
    private Integer difficulty;
    private Map<String, Object> contentData; // Aici va sta JSON-ul cu raspunsurile

    public ExerciseDto() {}

    public ExerciseDto(Long id, Long lessonId, String type, String prompt, Integer difficulty, Map<String, Object> contentData) {
        this.id = id;
        this.lessonId = lessonId;
        this.type = type;
        this.prompt = prompt;
        this.difficulty = difficulty;
        this.contentData = contentData;
    }

    // Getters si Setters
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