package com.chineselearning.contentservice.repository.entities;

import jakarta.persistence.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.util.Map;

@Entity
@Table(name = "exercises")
public class ExerciseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "lesson_id", nullable = false)
    private LessonEntity lesson;

    @Column(nullable = false)
    private String type;

    @Column(columnDefinition = "TEXT", nullable = false)
    private String prompt;

    private Integer difficulty;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "content_data", columnDefinition = "jsonb")
    private Map<String, Object> contentData;

    public ExerciseEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LessonEntity getLesson() { return lesson; }
    public void setLesson(LessonEntity lesson) { this.lesson = lesson; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getPrompt() { return prompt; }
    public void setPrompt(String prompt) { this.prompt = prompt; }

    public Integer getDifficulty() { return difficulty; }
    public void setDifficulty(Integer difficulty) { this.difficulty = difficulty; }

    public Map<String, Object> getContentData() { return contentData; }
    public void setContentData(Map<String, Object> contentData) { this.contentData = contentData; }
}