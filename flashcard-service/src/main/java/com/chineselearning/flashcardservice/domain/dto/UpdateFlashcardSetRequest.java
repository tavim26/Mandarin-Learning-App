package com.chineselearning.flashcardservice.domain.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateFlashcardSetRequest {

    @NotBlank
    private String title;

    private String description;

    public UpdateFlashcardSetRequest() {}

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}