package com.chineselearning.progressservice.domain.dto;

import java.math.BigDecimal;

// Transporta rezultatul evaluarii unui raspuns intre EvaluationService si ProgressService
public class EvaluationResultDto {

    private final BigDecimal score;
    private final String feedback;

    // Un raspuns este considerat corect daca scorul este >= 70
    private final boolean correct;

    public EvaluationResultDto(BigDecimal score, String feedback) {
        this.score = score;
        this.feedback = feedback;
        this.correct = score.compareTo(new BigDecimal("70")) >= 0;
    }

    public BigDecimal getScore() { return score; }
    public String getFeedback() { return feedback; }
    public boolean isCorrect() { return correct; }
}