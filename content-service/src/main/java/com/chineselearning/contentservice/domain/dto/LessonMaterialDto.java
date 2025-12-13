package com.chineselearning.contentservice.domain.dto;

public class LessonMaterialDto {
    private Long id;
    private Long lessonId;
    private String title;
    private String type;
    private String url;

    public LessonMaterialDto() {}

    public LessonMaterialDto(Long id, Long lessonId, String title, String type, String url) {
        this.id = id;
        this.lessonId = lessonId;
        this.title = title;
        this.type = type;
        this.url = url;
    }


    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getLessonId() { return lessonId; }
    public void setLessonId(Long lessonId) { this.lessonId = lessonId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
}