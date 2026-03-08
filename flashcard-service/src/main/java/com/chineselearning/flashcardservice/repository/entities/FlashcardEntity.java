package com.chineselearning.flashcardservice.repository.entities;

import jakarta.persistence.*;

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

    public FlashcardEntity() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public FlashcardSetEntity getSet() { return set; }
    public void setSet(FlashcardSetEntity set) { this.set = set; }

    public String getFrontText() { return frontText; }
    public void setFrontText(String frontText) { this.frontText = frontText; }

    public String getBackText() { return backText; }
    public void setBackText(String backText) { this.backText = backText; }
}