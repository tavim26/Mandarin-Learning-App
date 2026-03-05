package com.chineselearning.flashcardservice.domain.dto;

import jakarta.validation.constraints.NotBlank;

public class UpdateFlashcardRequest {

    @NotBlank
    private String frontText;

    @NotBlank
    private String backText;

    public UpdateFlashcardRequest() {}

    public String getFrontText() { return frontText; }
    public void setFrontText(String frontText) { this.frontText = frontText; }

    public String getBackText() { return backText; }
    public void setBackText(String backText) { this.backText = backText; }
}