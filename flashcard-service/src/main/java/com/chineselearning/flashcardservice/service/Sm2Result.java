package com.chineselearning.flashcardservice.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class Sm2Result
{

    private final BigDecimal easinessFactor;
    private final int intervalDays;
    private final int repetitionCount;
    private final LocalDateTime nextReviewAt;

    public Sm2Result(BigDecimal easinessFactor, int intervalDays, int repetitionCount, LocalDateTime nextReviewAt)
    {
        this.easinessFactor = easinessFactor;
        this.intervalDays = intervalDays;
        this.repetitionCount = repetitionCount;
        this.nextReviewAt = nextReviewAt;
    }

    public BigDecimal getEasinessFactor() { return easinessFactor; }
    public int getIntervalDays() { return intervalDays; }
    public int getRepetitionCount() { return repetitionCount; }
    public LocalDateTime getNextReviewAt() { return nextReviewAt; }
}