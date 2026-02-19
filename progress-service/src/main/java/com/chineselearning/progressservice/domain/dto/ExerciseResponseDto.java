package com.chineselearning.progressservice.domain.dto;

import java.util.Map;

// DTO folosit exclusiv pentru deserializarea raspunsurilor HTTP de la content-service
// Nu este expus prin niciun endpoint al progress-service
public class ExerciseResponseDto {

    private Long id;
    private Long lessonId;
    private String type;

    // contentData este stocat ca JSONB in content-service si deserializat ca Map
    private Map<String, Object> contentData;

    public ExerciseResponseDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Map<String, Object> getContentData() { return contentData; }
    public void setContentData(Map<String, Object> contentData) { this.contentData = contentData; }
}