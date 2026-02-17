package com.chineselearning.progressservice.service;

import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
public class EvaluationService {

    public EvaluationResult evaluate(String exerciseType, Map<String, Object> contentData,
                                     Map<String, Object> submittedAnswer) {

        if (contentData == null || submittedAnswer == null) {
            return new EvaluationResult(BigDecimal.ZERO, "Invalid exercise or answer data");
        }

        switch (exerciseType) {
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
        String correctOption = (String) contentData.get("correctOption");
        String selectedOption = (String) submittedAnswer.get("selectedOption");

        if (correctOption == null) {
            return new EvaluationResult(BigDecimal.ZERO, "Invalid exercise configuration");
        }

        if (selectedOption == null) {
            return new EvaluationResult(BigDecimal.ZERO, "No option selected");
        }

        if (correctOption.equals(selectedOption)) {
            return new EvaluationResult(new BigDecimal("100"), "Correct!");
        } else {
            return new EvaluationResult(BigDecimal.ZERO,
                    "Incorrect. The correct answer was: " + correctOption);
        }
    }

    private EvaluationResult evaluateTranslation(Map<String, Object> contentData,
                                                 Map<String, Object> submittedAnswer) {
        String correctTranslation = (String) contentData.get("correctTranslation");
        List<String> alternatives = (List<String>) contentData.get("alternativeTranslations");
        String userTranslation = (String) submittedAnswer.get("translation");

        if (correctTranslation == null) {
            return new EvaluationResult(BigDecimal.ZERO, "Invalid exercise configuration");
        }

        if (userTranslation == null || userTranslation.trim().isEmpty()) {
            return new EvaluationResult(BigDecimal.ZERO, "No translation provided");
        }

        // Exact match
        if (correctTranslation.equals(userTranslation)) {
            return new EvaluationResult(new BigDecimal("100"), "Perfect translation!");
        }

        // Alternative match
        if (alternatives != null && alternatives.contains(userTranslation)) {
            return new EvaluationResult(new BigDecimal("100"), "Correct alternative translation!");
        }

        // Partial credit (simplified - contains check)
        if (userTranslation.contains(correctTranslation) || correctTranslation.contains(userTranslation)) {
            return new EvaluationResult(new BigDecimal("50"),
                    "Partially correct. Expected: " + correctTranslation);
        }

        return new EvaluationResult(BigDecimal.ZERO,
                "Incorrect. Correct translation: " + correctTranslation);
    }

    private EvaluationResult evaluateFillBlank(Map<String, Object> contentData,
                                               Map<String, Object> submittedAnswer) {
        List<String> correctAnswers = (List<String>) contentData.get("correctAnswers");
        List<String> userAnswers = (List<String>) submittedAnswer.get("answers");

        if (correctAnswers == null || correctAnswers.isEmpty()) {
            return new EvaluationResult(BigDecimal.ZERO, "Invalid exercise configuration");
        }

        if (userAnswers == null) {
            return new EvaluationResult(BigDecimal.ZERO, "No answers provided");
        }

        if (correctAnswers.size() != userAnswers.size()) {
            return new EvaluationResult(BigDecimal.ZERO,
                    "Invalid number of answers. Expected: " + correctAnswers.size());
        }

        // Compare each blank
        int correct = 0;
        for (int i = 0; i < correctAnswers.size(); i++) {
            if (correctAnswers.get(i).equalsIgnoreCase(userAnswers.get(i))) {
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

    private EvaluationResult evaluateMatching(Map<String, Object> contentData,
                                              Map<String, Object> submittedAnswer) {
        List<Map<String, String>> correctPairs = (List<Map<String, String>>) contentData.get("pairs");
        Map<String, String> userMatches = (Map<String, String>) submittedAnswer.get("matches");

        if (correctPairs == null || correctPairs.isEmpty()) {
            return new EvaluationResult(BigDecimal.ZERO, "Invalid exercise configuration");
        }

        if (userMatches == null || userMatches.isEmpty()) {
            return new EvaluationResult(BigDecimal.ZERO, "No matches provided");
        }

        // Compare pairs
        int correct = 0;
        for (Map<String, String> pair : correctPairs) {
            String left = pair.get("left");
            String correctRight = pair.get("right");
            String userRight = userMatches.get(left);

            if (correctRight != null && correctRight.equals(userRight)) {
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

    public static class EvaluationResult {
        private final BigDecimal score;
        private final String feedback;

        public EvaluationResult(BigDecimal score, String feedback) {
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