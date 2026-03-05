package com.chineselearning.flashcardservice.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class CreateFlashcardRequest {

    @NotNull
    private Long setId;

    @NotBlank
    private String frontText;

    @NotBlank
    private String backText;

    public CreateFlashcardRequest() {}

    public Long getSetId() { return setId; }
    public void setSetId(Long setId) { this.setId = setId; }

    public String getFrontText() { return frontText; }
    public void setFrontText(String frontText) { this.frontText = frontText; }

    public String getBackText() { return backText; }
    public void setBackText(String backText) { this.backText = backText; }
}