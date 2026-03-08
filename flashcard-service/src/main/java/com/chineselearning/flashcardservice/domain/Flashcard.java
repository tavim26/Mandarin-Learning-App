package com.chineselearning.flashcardservice.domain;

public class Flashcard {

    private Long id;
    private Long setId;
    private String frontText;
    private String backText;

    public Flashcard() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getSetId() { return setId; }
    public void setSetId(Long setId) { this.setId = setId; }

    public String getFrontText() { return frontText; }
    public void setFrontText(String frontText) { this.frontText = frontText; }

    public String getBackText() { return backText; }
    public void setBackText(String backText) { this.backText = backText; }
}