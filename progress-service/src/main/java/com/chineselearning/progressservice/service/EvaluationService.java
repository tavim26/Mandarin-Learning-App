package com.chineselearning.progressservice.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
public class EvaluationService
{

    public EvaluationResult evaluate(String exerciseType, Map<String, Object> contentData, Map<String, Object> submittedAnswer) {

        if (contentData == null || submittedAnswer == null)
        {
            return new EvaluationResult(BigDecimal.ZERO, "Invalid exercise or answer data");
        }

        switch (exerciseType)
        {
            case "MULTIPLE_CHOICE":
                return evaluateMultipleChoice(contentData, submittedAnswer);
            case "TRANSLATION":
                return evaluateTranslation(contentData, submittedAnswer);
            case "FILL_BLANK":
                return evaluateFillBlank(contentData, submittedAnswer);
            case "MATCHING":
                return evaluateMatching(contentData, submittedAnswer);
            default:
                return new EvaluationResult(BigDecimal.ZERO, "Unknown exercise type: " + exerciseType);
        }
    }

    private EvaluationResult evaluateMultipleChoice(Map<String, Object> contentData,
                                                    Map<String, Object> submittedAnswer) {

        List<String> options = (List<String>) contentData.get("options");
        Integer correctIndex = (Integer) contentData.get("correctIndex");
        Integer selectedIndex = (Integer) submittedAnswer.get("selectedIndex");

        if (options == null || correctIndex == null) {
            return new EvaluationResult(BigDecimal.ZERO, "Invalid exercise configuration");
        }

        if (selectedIndex == null) {
            return new EvaluationResult(BigDecimal.ZERO, "No option selected");
        }

        if (correctIndex.equals(selectedIndex)) {
            return new EvaluationResult(new BigDecimal("100"), "Correct!");
        } else {
            String correctAnswer = options.get(correctIndex);
            return new EvaluationResult(BigDecimal.ZERO,
                    "Incorrect. The correct answer was: " + correctAnswer);
        }
    }

    private EvaluationResult evaluateTranslation(Map<String, Object> contentData,
                                                 Map<String, Object> submittedAnswer) {

        List<String> acceptedAnswers = (List<String>) contentData.get("acceptedAnswers");
        String userTranslation = (String) submittedAnswer.get("translation");

        if (acceptedAnswers == null || acceptedAnswers.isEmpty()) {
            return new EvaluationResult(BigDecimal.ZERO, "Invalid exercise configuration");
        }

        if (userTranslation == null || userTranslation.trim().isEmpty()) {
            return new EvaluationResult(BigDecimal.ZERO, "No translation provided");
        }

        // Normalize for comparison (lowercase, trim)
        String normalizedUser = userTranslation.toLowerCase().trim();

        // Check against all accepted answers
        for (String accepted : acceptedAnswers) {
            if (accepted.toLowerCase().trim().equals(normalizedUser)) {
                return new EvaluationResult(new BigDecimal("100"), "Perfect translation!");
            }
        }

        // Partial credit: check if user answer contains key words
        for (String accepted : acceptedAnswers) {
            String normalizedAccepted = accepted.toLowerCase().trim();
            if (normalizedUser.contains(normalizedAccepted) || normalizedAccepted.contains(normalizedUser)) {
                return new EvaluationResult(new BigDecimal("50"),
                        "Partially correct. Expected: " + acceptedAnswers.get(0));
            }
        }

        return new EvaluationResult(BigDecimal.ZERO,
                "Incorrect. Correct translation: " + acceptedAnswers.get(0));
    }

    private EvaluationResult evaluateFillBlank(Map<String, Object> contentData, Map<String, Object> submittedAnswer) {

        List<String> correctAnswers = (List<String>) contentData.get("correctAnswers");
        List<String> userAnswers = (List<String>) submittedAnswer.get("answers");

        if (correctAnswers == null || correctAnswers.isEmpty())
        {
            return new EvaluationResult(BigDecimal.ZERO, "Invalid exercise configuration");
        }

        if (userAnswers == null)
        {
            return new EvaluationResult(BigDecimal.ZERO, "No answers provided");
        }

        if (correctAnswers.size() != userAnswers.size())
        {
            return new EvaluationResult(BigDecimal.ZERO, "Invalid number of answers. Expected: " + correctAnswers.size());
        }

        // Compare each blank
        int correct = 0;
        for (int i = 0; i < correctAnswers.size(); i++)
        {
            if (correctAnswers.get(i).equalsIgnoreCase(userAnswers.get(i)))
            {
                correct++;
            }
        }

        // Calculate score
        BigDecimal score = BigDecimal.valueOf((correct * 100.0) / correctAnswers.size())
                .setScale(2, BigDecimal.ROUND_HALF_UP);

        String feedback = correct == correctAnswers.size()
                ? "All correct!"
                : String.format("You got %d out of %d correct", correct, correctAnswers.size());

        return new EvaluationResult(score, feedback);
    }

    private EvaluationResult evaluateMatching(Map<String, Object> contentData, Map<String, Object> submittedAnswer) {

        List<Map<String, String>> correctPairs = (List<Map<String, String>>) contentData.get("pairs");
        Map<String, String> userMatches = (Map<String, String>) submittedAnswer.get("matches");

        if (correctPairs == null || correctPairs.isEmpty())
        {
            return new EvaluationResult(BigDecimal.ZERO, "Invalid exercise configuration");
        }

        if (userMatches == null || userMatches.isEmpty())
        {
            return new EvaluationResult(BigDecimal.ZERO, "No matches provided");
        }

        // Compare pairs
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

        // Calculate score
        BigDecimal score = BigDecimal.valueOf((correct * 100.0) / correctPairs.size())
                .setScale(2, BigDecimal.ROUND_HALF_UP);

        String feedback = correct == correctPairs.size()
                ? "All pairs matched correctly!"
                : String.format("You matched %d out of %d pairs correctly", correct, correctPairs.size());

        return new EvaluationResult(score, feedback);
    }

    public static class EvaluationResult
    {
        private final BigDecimal score;
        private final String feedback;

        public EvaluationResult(BigDecimal score, String feedback)
        {
            this.score = score;
            this.feedback = feedback;
        }

        public BigDecimal getScore() {
            return score;
        }

        public String getFeedback() {
            return feedback;
        }
    }
}