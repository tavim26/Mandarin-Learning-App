package com.chineselearning.flashcardservice.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;

// Implementare pura a algoritmului SM-2 (SuperMemo 2, Wozniak 1987)
// Clasa nu are dependente Spring - poate fi testata unitar fara context
public class Sm2Algorithm {

    // Valoarea minima permisa pentru easiness factor, conform specificatiei SM-2
    private static final BigDecimal MIN_EASINESS_FACTOR = new BigDecimal("1.3");

    // Intervalul fix pentru prima recenzie consecutiv corecta
    private static final int FIRST_CORRECT_INTERVAL = 1;

    // Intervalul fix pentru a doua recenzie consecutiv corecta
    private static final int SECOND_CORRECT_INTERVAL = 6;

    // Clasa care transporta rezultatul unui calcul SM-2
    public static class Sm2Result {

        private final BigDecimal easinessFactor;
        private final int intervalDays;
        private final int repetitionCount;
        private final LocalDateTime nextReviewAt;

        public Sm2Result(BigDecimal easinessFactor, int intervalDays,
                         int repetitionCount, LocalDateTime nextReviewAt) {
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

    // Metoda principala - primeste starea curenta SM-2 si scorul de calitate, returneaza starea noua
    public static Sm2Result calculate(BigDecimal currentEF, int currentInterval,
                                      int currentRepetitionCount, int quality) {
        BigDecimal newEF = calculateNewEasinessFactor(currentEF, quality);

        int newInterval;
        int newRepetitionCount;

        if (quality < 3) {
            // Raspuns incorect - resetam progresul cardului la valorile initiale
            newRepetitionCount = 0;
            newInterval = 1;
        } else {
            // Raspuns corect - avansam in functie de numarul de repetari consecutive
            newRepetitionCount = currentRepetitionCount + 1;
            newInterval = calculateNewInterval(currentInterval, newRepetitionCount, newEF);
        }

        // Data urmatoarei recenzii se calculeaza adaugand intervalul la momentul curent
        LocalDateTime nextReviewAt = LocalDateTime.now().plusDays(newInterval);

        return new Sm2Result(newEF, newInterval, newRepetitionCount, nextReviewAt);
    }

    // Formula EF din specificatia SM-2: EF = EF + (0.1 - (5-q) * (0.08 + (5-q) * 0.02))
    private static BigDecimal calculateNewEasinessFactor(BigDecimal currentEF, int quality) {
        double ef = currentEF.doubleValue();
        double delta = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
        double newEf = ef + delta;

        BigDecimal result = new BigDecimal(newEf).setScale(2, RoundingMode.HALF_UP);

        // EF nu poate scadea sub 1.3 - limita minima impusa de specificatia SM-2
        return result.compareTo(MIN_EASINESS_FACTOR) < 0 ? MIN_EASINESS_FACTOR : result;
    }

    // Intervalul urmator depinde de numarul de repetari consecutive corecte acumulate
    private static int calculateNewInterval(int currentInterval, int repetitionCount,
                                            BigDecimal easinessFactor) {
        if (repetitionCount == 1) {
            return FIRST_CORRECT_INTERVAL;
        }
        if (repetitionCount == 2) {
            return SECOND_CORRECT_INTERVAL;
        }
        // De la a 3-a repetare, intervalul creste proportional cu easiness factor-ul
        double newInterval = currentInterval * easinessFactor.doubleValue();
        return (int) Math.round(newInterval);
    }
}