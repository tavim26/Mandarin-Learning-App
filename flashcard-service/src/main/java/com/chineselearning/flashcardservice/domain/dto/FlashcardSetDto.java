package com.chineselearning.flashcardservice.domain.dto;

public class FlashcardSetDto {

    private Long id;
    private Long studentId;
    private String title;
    private String description;

    private Integer cardCount;

    public FlashcardSetDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public Integer getCardCount() { return cardCount; }
    public void setCardCount(Integer cardCount) { this.cardCount = cardCount; }
}