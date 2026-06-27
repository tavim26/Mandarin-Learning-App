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

    public EvaluationResultDto evaluate(String exerciseType, Map<String, Object> contentData, Map<String, Object> submittedAnswer)
    {
        if (exerciseType == null || contentData == null || submittedAnswer == null)
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "Invalid exercise data.");
        }

        switch (exerciseType)
        {
            case "MULTIPLE_CHOICE": return evaluateMultipleChoice(contentData, submittedAnswer);
            case "TRANSLATION":     return evaluateTranslation(contentData, submittedAnswer);
            case "FILL_BLANK":      return evaluateFillBlank(contentData, submittedAnswer);
            case "MATCHING":        return evaluateMatching(contentData, submittedAnswer);
            case "ORDERING":        return evaluateOrdering(contentData, submittedAnswer);
            default:
                throw new IllegalArgumentException("Unknown exercise type: " + exerciseType);
        }
    }


    private EvaluationResultDto evaluateMultipleChoice(Map<String, Object> contentData, Map<String, Object> submittedAnswer)
    {
        List<String> options = safeCast(contentData.get("options"), List.class, "options");
        Integer correctIndex = safeCast(contentData.get("correctIndex"), Integer.class, "correctIndex");
        Integer selectedIndex = safeCast(submittedAnswer.get("selectedIndex"), Integer.class, "selectedIndex");

        if (options == null || correctIndex == null)
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "Invalid exercise configuration.");
        }

        if (selectedIndex == null)
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "No option selected.");
        }

        if (correctIndex < 0 || correctIndex >= options.size())
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "Invalid correct index in exercise configuration.");
        }

        if (correctIndex.equals(selectedIndex))
        {
            return new EvaluationResultDto(new BigDecimal("100"), "Correct!");
        }

        return new EvaluationResultDto(BigDecimal.ZERO, "Incorrect. The correct answer was: " + options.get(correctIndex));
    }


    private EvaluationResultDto evaluateTranslation(Map<String, Object> contentData, Map<String, Object> submittedAnswer)
    {
        List<String> acceptedAnswers = safeCast(contentData.get("acceptedAnswers"), List.class, "acceptedAnswers");
        String userTranslation = safeCast(submittedAnswer.get("translation"), String.class, "translation");

        if (acceptedAnswers == null || acceptedAnswers.isEmpty())
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "Invalid exercise configuration.");
        }

        if (userTranslation == null || userTranslation.trim().isEmpty())
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "No translation provided.");
        }

        String normalizedUser = normalize(userTranslation);

        for (String accepted : acceptedAnswers)
        {
            if (normalize(accepted).equals(normalizedUser))
            {
                return new EvaluationResultDto(new BigDecimal("100"), "Correct translation!");
            }
        }

        BigDecimal overlapScore = calculateWordOverlapScore(normalizedUser, normalize(acceptedAnswers.get(0)));

        if (overlapScore.compareTo(new BigDecimal("40")) >= 0)
        {
            return new EvaluationResultDto(
                    new BigDecimal("50"),
                    "Partially correct (" + overlapScore.toPlainString() + "% words matched). Expected: " + acceptedAnswers.get(0)
            );
        }

        return new EvaluationResultDto(BigDecimal.ZERO, "Incorrect. Correct translation: " + acceptedAnswers.get(0));
    }


    private EvaluationResultDto evaluateFillBlank(Map<String, Object> contentData, Map<String, Object> submittedAnswer)
    {
        List<String> correctAnswers = safeCast(contentData.get("correctAnswers"), List.class, "correctAnswers");
        List<String> userAnswers = safeCast(submittedAnswer.get("answers"), List.class, "answers");

        if (correctAnswers == null || correctAnswers.isEmpty())
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "Invalid exercise configuration.");
        }

        if (userAnswers == null)
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "No answers provided.");
        }

        if (correctAnswers.size() != userAnswers.size())
        {
            return new EvaluationResultDto(BigDecimal.ZERO,
                    "Incorrect number of answers. Expected: " + correctAnswers.size());
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
                ? "All answers are correct!"
                : String.format("You filled %d out of %d blanks correctly.", correct, correctAnswers.size());

        return new EvaluationResultDto(score, feedback);
    }


    private EvaluationResultDto evaluateMatching(Map<String, Object> contentData, Map<String, Object> submittedAnswer)
    {
        List<Map<String, String>> correctPairs = safeCast(contentData.get("pairs"), List.class, "pairs");
        Map<String, String> userMatches = safeCast(submittedAnswer.get("matches"), Map.class, "matches");

        if (correctPairs == null || correctPairs.isEmpty())
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "Invalid exercise configuration.");
        }

        if (userMatches == null || userMatches.isEmpty())
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "No matches provided.");
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
                ? "All pairs matched correctly!"
                : String.format("You matched %d out of %d pairs correctly.", correct, correctPairs.size());

        return new EvaluationResultDto(score, feedback);
    }


    private EvaluationResultDto evaluateOrdering(Map<String, Object> contentData, Map<String, Object> submittedAnswer)
    {
        List<String> correctOrder = safeCast(contentData.get("correctOrder"), List.class, "correctOrder");
        List<String> submittedOrder = safeCast(submittedAnswer.get("order"), List.class, "order");

        if (correctOrder == null || correctOrder.isEmpty())
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "Invalid exercise configuration.");
        }

        if (submittedOrder == null || submittedOrder.isEmpty())
        {
            return new EvaluationResultDto(BigDecimal.ZERO, "No order provided.");
        }

        if (correctOrder.size() != submittedOrder.size())
        {
            return new EvaluationResultDto(BigDecimal.ZERO,
                    "Incorrect number of words. Expected: " + correctOrder.size());
        }

        if (correctOrder.equals(submittedOrder))
        {
            return new EvaluationResultDto(new BigDecimal("100"), "Correct! The sentence order is right.");
        }

        int correctPositions = 0;
        for (int i = 0; i < correctOrder.size(); i++)
        {
            if (correctOrder.get(i).equals(submittedOrder.get(i)))
            {
                correctPositions++;
            }
        }

        BigDecimal score = BigDecimal.valueOf((correctPositions * 100.0) / correctOrder.size())
                .setScale(2, RoundingMode.HALF_UP);

        if (score.compareTo(new BigDecimal("70")) >= 0)
        {
            return new EvaluationResultDto(score,
                    String.format("Almost correct! %d out of %d words in the right position.",
                            correctPositions, correctOrder.size()));
        }

        return new EvaluationResultDto(score,
                String.format("Incorrect. You placed %d out of %d words correctly. Correct order: %s",
                        correctPositions, correctOrder.size(), String.join(" ", correctOrder)));
    }


    private String normalize(String input)
    {
        return input.toLowerCase().trim().replaceAll("\\s+", " ");
    }

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


    @SuppressWarnings("unchecked")
    private <T> T safeCast(Object value, Class<T> type, String fieldName)
    {
        if (value == null) return null;
        if (!type.isInstance(value))
        {
            throw new IllegalArgumentException(
                    "Field '" + fieldName + "' has unexpected type: " + value.getClass().getSimpleName()
            );
        }
        return (T) value;
    }
}