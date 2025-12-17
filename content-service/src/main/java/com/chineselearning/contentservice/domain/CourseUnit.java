package com.chineselearning.contentservice.domain;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "course_units")
public class CourseUnit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "hsk_level")
    private Integer hskLevel;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    // Relatia one-to-many cu Lesson
    // Cascade all
    @OneToMany(mappedBy = "unit", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Lesson> lessons = new ArrayList<>();

    public CourseUnit() {}

    public CourseUnit(String title, String description, Integer hskLevel, Integer orderIndex) {
        this.title = title;
        this.description = description;
        this.hskLevel = hskLevel;
        this.orderIndex = orderIndex;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getHskLevel() { return hskLevel; }
    public void setHskLevel(Integer hskLevel) { this.hskLevel = hskLevel; }

    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }

    public List<Lesson> getLessons() { return lessons; }
    public void setLessons(List<Lesson> lessons) { this.lessons = lessons; }
}