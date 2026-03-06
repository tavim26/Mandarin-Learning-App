package com.chineselearning.contentservice.repository.entities;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "lessons")
public class LessonEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "unit_id", nullable = false)
    private CourseUnitEntity unit;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "xp_reward", nullable = false)
    private Integer xpReward;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExerciseEntity> exercises = new ArrayList<>();

    @OneToMany(mappedBy = "lesson", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<LessonMaterialEntity> materials = new ArrayList<>();

    public LessonEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public CourseUnitEntity getUnit() { return unit; }
    public void setUnit(CourseUnitEntity unit) { this.unit = unit; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getXpReward() { return xpReward; }
    public void setXpReward(Integer xpReward) { this.xpReward = xpReward; }

    public Integer getOrderIndex() { return orderIndex; }
    public void setOrderIndex(Integer orderIndex) { this.orderIndex = orderIndex; }

    public List<ExerciseEntity> getExercises() { return exercises; }
    public void setExercises(List<ExerciseEntity> exercises) { this.exercises = exercises; }

    public List<LessonMaterialEntity> getMaterials() { return materials; }
    public void setMaterials(List<LessonMaterialEntity> materials) { this.materials = materials; }
}