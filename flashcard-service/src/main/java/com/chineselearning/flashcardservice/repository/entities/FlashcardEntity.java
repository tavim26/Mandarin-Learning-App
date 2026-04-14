package com.chineselearning.flashcardservice.repository.entities;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "flashcards", indexes = {
        @Index(name = "idx_flashcards_set_id", columnList = "set_id")
})
public class FlashcardEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "set_id", nullable = false)
    private FlashcardSetEntity set;

    @Column(name = "front_text", columnDefinition = "TEXT", nullable = false)
    private String frontText;

    @Column(name = "back_text", columnDefinition = "TEXT", nullable = false)
    private String backText;

    // Cascade DELETE spre progress si reviews — evita FK violation la stergerea cardului
    @OneToMany(mappedBy = "flashcard", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FlashcardProgressEntity> progressRecords = new ArrayList<>();

    @OneToMany(mappedBy = "flashcard", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<FlashcardReviewEntity> reviews = new ArrayList<>();

    public FlashcardEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public FlashcardSetEntity getSet() { return set; }
    public void setSet(FlashcardSetEntity set) { this.set = set; }

    public String getFrontText() { return frontText; }
    public void setFrontText(String frontText) { this.frontText = frontText; }

    public String getBackText() { return backText; }
    public void setBackText(String backText) { this.backText = backText; }

    public List<FlashcardProgressEntity> getProgressRecords() { return progressRecords; }
    public void setProgressRecords(List<FlashcardProgressEntity> progressRecords) { this.progressRecords = progressRecords; }

    public List<FlashcardReviewEntity> getReviews() { return reviews; }
    public void setReviews(List<FlashcardReviewEntity> reviews) { this.reviews = reviews; }
}