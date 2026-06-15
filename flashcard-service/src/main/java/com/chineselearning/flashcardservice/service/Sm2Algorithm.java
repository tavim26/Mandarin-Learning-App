package com.chineselearning.flashcardservice.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

public class Sm2Algorithm
{

    private static final BigDecimal MIN_EASINESS_FACTOR = new BigDecimal("1.3");
    private static final int FIRST_CORRECT_INTERVAL = 1;
    private static final int SECOND_CORRECT_INTERVAL = 6;

    public static Sm2Result calculate(BigDecimal currentEF, int currentInterval, int currentRepetitionCount, int quality)
    {
        BigDecimal newEF = calculateNewEasinessFactor(currentEF, quality);

        int newInterval;
        int newRepetitionCount;

        if (quality < 3)
        {
            newRepetitionCount = 0;
            newInterval = 1;
        }
        else
        {
            newRepetitionCount = currentRepetitionCount + 1;
            newInterval = calculateNewInterval(currentInterval, newRepetitionCount, newEF);
        }

        LocalDateTime nextReviewAt = LocalDateTime.now().plusDays(newInterval);

        return new Sm2Result(newEF, newInterval, newRepetitionCount, nextReviewAt);
    }

    private static BigDecimal calculateNewEasinessFactor(BigDecimal currentEF, int quality)
    {
        double ef = currentEF.doubleValue();
        double delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
        double newEf = ef + delta;

        BigDecimal result = new BigDecimal(newEf).setScale(2, RoundingMode.HALF_UP);
        return result.compareTo(MIN_EASINESS_FACTOR) < 0 ? MIN_EASINESS_FACTOR : result;
    }

    private static int calculateNewInterval(int currentInterval, int repetitionCount, BigDecimal easinessFactor)
    {
        if (repetitionCount == 1) return FIRST_CORRECT_INTERVAL;
        if (repetitionCount == 2) return SECOND_CORRECT_INTERVAL;

        double newInterval = currentInterval * easinessFactor.doubleValue();
        return (int) Math.round(newInterval);
    }
}