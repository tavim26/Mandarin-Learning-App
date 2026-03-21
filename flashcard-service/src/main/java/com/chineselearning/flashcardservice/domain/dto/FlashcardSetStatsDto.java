package com.chineselearning.flashcardservice.domain.dto;

import java.math.BigDecimal;

public class FlashcardSetStatsDto {

    private Long setId;
    private Integer totalCards;

    // Carduri fara niciun progress record
    private Integer newCards;

    // repetitionCount < 3
    private Integer learningCards;

    // intervalDays >= 21
    private Integer matureCards;

    // nextReviewAt <= now + carduri fara progress record
    private Integer dueToday;

    private BigDecimal averageEasinessFactor;

    public FlashcardSetStatsDto() {}

    public Long getSetId() { return setId; }
    public void setSetId(Long setId) { this.setId = setId; }

    public Integer getTotalCards() { return totalCards; }
    public void setTotalCards(Integer totalCards) { this.totalCards = totalCards; }

    public Integer getNewCards() { return newCards; }
    public void setNewCards(Integer newCards) { this.newCards = newCards; }

    public Integer getLearningCards() { return learningCards; }
    public void setLearningCards(Integer learningCards) { this.learningCards = learningCards; }

    public Integer getMatureCards() { return matureCards; }
    public void setMatureCards(Integer matureCards) { this.matureCards = matureCards; }

    public Integer getDueToday() { return dueToday; }
    public void setDueToday(Integer dueToday) { this.dueToday = dueToday; }

    public BigDecimal getAverageEasinessFactor() { return averageEasinessFactor; }
    public void setAverageEasinessFactor(BigDecimal averageEasinessFactor) { this.averageEasinessFactor = averageEasinessFactor; }
}