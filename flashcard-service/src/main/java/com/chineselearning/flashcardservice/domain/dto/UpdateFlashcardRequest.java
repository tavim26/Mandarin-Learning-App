package com.chineselearning.flashcardservice.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UpdateFlashcardRequest {

    @NotBlank(message = "Front text must not be blank")
    @Size(max = 2000, message = "Front text must not exceed 2000 characters")
    private String frontText;

    @NotBlank(message = "Back text must not be blank")
    @Size(max = 2000, message = "Back text must not exceed 2000 characters")
    private String backText;

    public UpdateFlashcardRequest() {}

    public String getFrontText() { return frontText; }
    public void setFrontText(String frontText) { this.frontText = frontText; }

    public String getBackText() { return backText; }
    public void setBackText(String backText) { this.backText = backText; }
}