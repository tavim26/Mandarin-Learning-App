package com.chineselearning.contentservice.repository.entities;

import jakarta.persistence.*;

@Entity
@Table(name = "lesson_materials")
public class LessonMaterialEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "lesson_id", nullable = false)
    private LessonEntity lesson;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false, length = 1000)
    private String url;

    public LessonMaterialEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LessonEntity getLesson() { return lesson; }
    public void setLesson(LessonEntity lesson) { this.lesson = lesson; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
}