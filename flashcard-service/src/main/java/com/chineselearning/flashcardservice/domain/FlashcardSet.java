package com.chineselearning.flashcardservice.domain;

import java.util.ArrayList;
import java.util.List;

public class FlashcardSet {

    private Long id;
    private Long studentId;
    private String title;
    private String description;
    private List<Flashcard> flashcards = new ArrayList<>();

    public FlashcardSet() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getStudentId() { return studentId; }
    public void setStudentId(Long studentId) { this.studentId = studentId; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public List<Flashcard> getFlashcards() { return flashcards; }
    public void setFlashcards(List<Flashcard> flashcards) { this.flashcards = flashcards; }
}