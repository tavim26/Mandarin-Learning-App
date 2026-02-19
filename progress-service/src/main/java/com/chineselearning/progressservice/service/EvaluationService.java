package com.chineselearning.progressservice.service;

import com.chineselearning.progressservice.domain.dto.EvaluationResultDto;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.Arrays;

@Service
public class EvaluationService
{

    public EvaluationResultDto evaluate(String exerciseType, Map<String, Object> contentData, Map<String, Object> submittedAnswer) {

        if (exerciseType == null || contentData == null || submittedAnswer == null)
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "Date invalide pentru evaluare");
        }

        switch (exerciseType)
        {
            case "MULTIPLE_CHOICE": return evaluateMultipleChoice(contentData, submittedAnswer);
            case "TRANSLATION":     return evaluateTranslation(contentData, submittedAnswer);
            case "FILL_BLANK":      return evaluateFillBlank(contentData, submittedAnswer);
            case "MATCHING":        return evaluateMatching(contentData, submittedAnswer);
            default:
                throw new IllegalArgumentException("Tip de exercitiu necunoscut: " + exerciseType);
        }
    }


    private EvaluationResultDto evaluateMultipleChoice(Map<String, Object> contentData, Map<String, Object> submittedAnswer) {

        List<String> options = safeCast(contentData.get("options"), List.class, "options");
        Integer correctIndex = safeCast(contentData.get("correctIndex"), Integer.class, "correctIndex");
        Integer selectedIndex = safeCast(submittedAnswer.get("selectedIndex"), Integer.class, "selectedIndex");

        if (options == null || correctIndex == null)
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "Configuratie invalida a exercitiului");
        }

        if (selectedIndex == null)
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "Nicio optiune selectata");
        }

        if (correctIndex < 0 || correctIndex >= options.size())
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "Index corect invalid in configuratia exercitiului");
        }

        if (correctIndex.equals(selectedIndex))
        {
            return new EvaluationResultDto(new BigDecimal("100"), "Corect!");
        }

        return new EvaluationResultDto(BigDecimal.ZERO, "Incorect. Raspunsul corect era: " + options.get(correctIndex));
    }


    private EvaluationResultDto evaluateTranslation(Map<String, Object> contentData, Map<String, Object> submittedAnswer) {

        List<String> acceptedAnswers = safeCast(contentData.get("acceptedAnswers"), List.class, "acceptedAnswers");
        String userTranslation = safeCast(submittedAnswer.get("translation"), String.class, "translation");

        if (acceptedAnswers == null || acceptedAnswers.isEmpty())
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "Configuratie invalida a exercitiului");
        }

        if (userTranslation == null || userTranslation.trim().isEmpty())
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "Nu a fost furnizata nicio traducere");
        }

        String normalizedUser = normalize(userTranslation);

        // Verificare potrivire exacta cu oricare din raspunsurile acceptate
        for (String accepted : acceptedAnswers)
        {
            if (normalize(accepted).equals(normalizedUser))
            {
                return new EvaluationResultDto(new BigDecimal("100"), "Traducere corecta!");
            }
        }

        // Credit partial bazat pe procentul de cuvinte cheie comune
        // Se calculeaza fata de primul raspuns acceptat (considerat referinta principala)
        BigDecimal overlapScore = calculateWordOverlapScore(normalizedUser, normalize(acceptedAnswers.get(0)));

        // Pragul de 40% overlap acorda credit partial de 50 de puncte
        if (overlapScore.compareTo(new BigDecimal("40")) >= 0)
        {
            return new EvaluationResultDto(
                    new BigDecimal("50"),
                    "Partial corect (" + overlapScore.toPlainString() + "% cuvinte potrivite). Raspuns asteptat: " + acceptedAnswers.get(0)
            );
        }

        return new EvaluationResultDto(BigDecimal.ZERO, "Incorect. Traducere corecta: " + acceptedAnswers.get(0));
    }


    private EvaluationResultDto evaluateFillBlank(Map<String, Object> contentData, Map<String, Object> submittedAnswer) {

        List<String> correctAnswers = safeCast(contentData.get("correctAnswers"), List.class, "correctAnswers");
        List<String> userAnswers = safeCast(submittedAnswer.get("answers"), List.class, "answers");

        if (correctAnswers == null || correctAnswers.isEmpty())
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "Configuratie invalida a exercitiului");
        }

        if (userAnswers == null)
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "Nu au fost furnizate raspunsuri");
        }

        if (correctAnswers.size() != userAnswers.size())
        {
            return new EvaluationResultDto(BigDecimal.ZERO,
                    "Numar incorect de raspunsuri. Asteptat: " + correctAnswers.size());
        }

        int correct = 0;
        for (int i = 0; i < correctAnswers.size(); i++)
        {
            // trim() previne penalizarea pentru spatii accidentale la inceput/sfarsit
            if (correctAnswers.get(i).trim().equalsIgnoreCase(userAnswers.get(i).trim()))
            {
                correct++;
            }
        }

        BigDecimal score = BigDecimal.valueOf((correct * 100.0) / correctAnswers.size())
                .setScale(2, RoundingMode.HALF_UP);

        String feedback = (correct == correctAnswers.size())
                ? "Toate raspunsurile sunt corecte!"
                : String.format("Ai completat corect %d din %d spatii", correct, correctAnswers.size());

        return new EvaluationResultDto(score, feedback);
    }


    private EvaluationResultDto evaluateMatching(Map<String, Object> contentData, Map<String, Object> submittedAnswer) {

        List<Map<String, String>> correctPairs = safeCast(contentData.get("pairs"), List.class, "pairs");
        Map<String, String> userMatches = safeCast(submittedAnswer.get("matches"), Map.class, "matches");

        if (correctPairs == null || correctPairs.isEmpty())
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "Configuratie invalida a exercitiului");
        }

        if (userMatches == null || userMatches.isEmpty())
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "Nu au fost furnizate asocieri");
        }

        int correct = 0;
        for (Map<String, String> pair : correctPairs)
        {
            String left = pair.get("left");
            String correctRight = pair.get("right");
            String userRight = userMatches.get(left);

            if (correctRight != null && correctRight.equals(userRight))
            {
                correct++;
            }
        }

        BigDecimal score = BigDecimal.valueOf((correct * 100.0) / correctPairs.size())
                .setScale(2, RoundingMode.HALF_UP);

        String feedback = (correct == correctPairs.size())
                ? "Toate asocierile sunt corecte!"
                : String.format("Ai asociat corect %d din %d perechi", correct, correctPairs.size());

        return new EvaluationResultDto(score, feedback);
    }








    // Normalizare string pentru comparatie: lowercase + eliminare spatii multiple
    private String normalize(String input)
    {
        return input.toLowerCase().trim().replaceAll("\\s+", " ");
    }

    // Calculeaza procentul de cuvinte comune intre doua stringuri normalizate
    // Folosit pentru credit partial la exercitii de tip TRANSLATION
    private BigDecimal calculateWordOverlapScore(String userAnswer, String referenceAnswer)
    {
        Set<String> userWords = Arrays.stream(userAnswer.split("\\s+"))
                .collect(Collectors.toSet());
        Set<String> referenceWords = Arrays.stream(referenceAnswer.split("\\s+"))
                .collect(Collectors.toSet());

        if (referenceWords.isEmpty()) return BigDecimal.ZERO;

        long commonWords = userWords.stream()
                .filter(referenceWords::contains)
                .count();

        return BigDecimal.valueOf((commonWords * 100.0) / referenceWords.size())
                .setScale(2, RoundingMode.HALF_UP);
    }

    // Cast sigur cu logging - returneaza null in loc sa arunce ClassCastException
    @SuppressWarnings("unchecked")
    private <T> T safeCast(Object value, Class<T> type, String fieldName)
    {
        if (value == null) return null;
        if (!type.isInstance(value))
        {
            throw new IllegalArgumentException(
                    "Camp '" + fieldName + "' are tip neasteptat: " + value.getClass().getSimpleName()
            );
        }
        return (T) value;
    }
}