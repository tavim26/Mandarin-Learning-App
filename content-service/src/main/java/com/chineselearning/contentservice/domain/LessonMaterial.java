package com.chineselearning.contentservice.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "lesson_materials")
public class LessonMaterial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "lesson_id", nullable = false)
    private Lesson lesson;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String type; // ex: VIDEO, PDF, LINK

    @Column(nullable = false, length = 1000)
    private String url;

    // Constructor gol
    public LessonMaterial() {}

    // Constructor cu parametri
    public LessonMaterial(String title, String type, String url) {
        this.title = title;
        this.type = type;
        this.url = url;
    }

    // GETTERS & SETTERS (Fara Lombok)
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Lesson getLesson() { return lesson; }
    public void setLesson(Lesson lesson) { this.lesson = lesson; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getUrl() { return url; }
    public void setUrl(String url) { this.url = url; }
}