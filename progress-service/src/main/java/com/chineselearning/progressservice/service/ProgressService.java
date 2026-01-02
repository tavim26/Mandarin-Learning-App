package com.chineselearning.progressservice.service;

import com.chineselearning.progressservice.domain.ExerciseAttempt;
import com.chineselearning.progressservice.domain.StudentLessonProgress;
import com.chineselearning.progressservice.domain.StudentReplica;
import com.chineselearning.progressservice.domain.dao.IExerciseAttemptDao;
import com.chineselearning.progressservice.domain.dao.IStudentLessonProgressDao;
import com.chineselearning.progressservice.domain.dao.IStudentReplicaDao;
import com.chineselearning.progressservice.domain.dto.ExerciseAttemptDto;
import com.chineselearning.progressservice.domain.dto.StudentLessonProgressDto;
import com.chineselearning.progressservice.domain.dto.SubmitAttemptRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Service for managing student progress tracking.
 * Handles exercise attempts and lesson progress calculations.
 */
@Service
@Transactional
public class ProgressService {

    private static final Logger log = LoggerFactory.getLogger(ProgressService.class);

    private final IExerciseAttemptDao exerciseAttemptDao;
    private final IStudentLessonProgressDao lessonProgressDao;
    private final IStudentReplicaDao studentReplicaDao;
    private final ContentServiceClient contentServiceClient;
    private final UserServiceClient userServiceClient;

    public ProgressService(
            IExerciseAttemptDao exerciseAttemptDao,
            IStudentLessonProgressDao lessonProgressDao,
            IStudentReplicaDao studentReplicaDao,
            ContentServiceClient contentServiceClient,
            UserServiceClient userServiceClient
    ) {
        this.exerciseAttemptDao = exerciseAttemptDao;
        this.lessonProgressDao = lessonProgressDao;
        this.studentReplicaDao = studentReplicaDao;
        this.contentServiceClient = contentServiceClient;
        this.userServiceClient = userServiceClient;
    }

    // ========== EXERCISE ATTEMPT OPERATIONS ==========

    /**
     * Submit an exercise attempt and update lesson progress.
     *
     * @param request SubmitAttemptRequest containing student ID, exercise ID, and submitted answer
     * @return ExerciseAttemptDto with evaluation results
     */
    public ExerciseAttemptDto submitAttempt(SubmitAttemptRequest request) {
        log.info("Submitting attempt for studentId={}, exerciseId={}",
                request.getStudentId(), request.getExerciseId());

        // 1. Validate student exists in replica
        if (!studentReplicaDao.existsByStudentId(request.getStudentId())) {
            throw new IllegalArgumentException(
                    "Student not found in replica: " + request.getStudentId());
        }

        // 2. Fetch exercise from Content Service (validates exercise exists)
        Map<String, Object> exercise = contentServiceClient.getExercise(request.getExerciseId());
        Long lessonId = ((Number) exercise.get("lessonId")).longValue();

        // 3. Calculate attempt number
        long previousAttempts = exerciseAttemptDao.countByStudentIdAndExerciseId(
                request.getStudentId(),
                request.getExerciseId()
        );
        int attemptNumber = (int) previousAttempts + 1;

        // 4. Evaluate answer
        EvaluationResult evalResult = evaluateAnswer(
                exercise,
                request.getSubmittedAnswer()
        );

        // 5. Create and save attempt
        ExerciseAttempt attempt = new ExerciseAttempt();
        attempt.setStudentId(request.getStudentId());
        attempt.setExerciseId(request.getExerciseId());
        attempt.setAttemptNumber(attemptNumber);
        attempt.setSubmittedAnswer(request.getSubmittedAnswer());
        attempt.setScore(evalResult.getScore());
        attempt.setIsCorrect(evalResult.getScore().compareTo(new BigDecimal("70")) >= 0);
        attempt.setFeedbackText(evalResult.getFeedback());
        attempt.setSubmittedAt(LocalDateTime.now());

        ExerciseAttempt saved = exerciseAttemptDao.save(attempt);
        log.info("Saved attempt: id={}, score={}, correct={}",
                saved.getId(), saved.getScore(), saved.getIsCorrect());

        // 6. Update lesson progress
        updateLessonProgress(request.getStudentId(), lessonId);

        return mapAttemptToDto(saved);
    }

    /**
     * Get all attempts for a specific exercise by a student.
     */
    public List<ExerciseAttemptDto> getStudentAttemptsForExercise(Long studentId, Long exerciseId) {
        return exerciseAttemptDao.findByStudentIdAndExerciseIdOrderByAttemptNumberAsc(studentId, exerciseId)
                .stream()
                .map(this::mapAttemptToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get recent attempts by a student (across all exercises).
     */
    public List<ExerciseAttemptDto> getRecentAttempts(Long studentId, int limit) {
        List<ExerciseAttempt> attempts = exerciseAttemptDao.findByStudentIdOrderBySubmittedAtDesc(studentId);
        return attempts.stream()
                .limit(limit)
                .map(this::mapAttemptToDto)
                .collect(Collectors.toList());
    }

    // ========== LESSON PROGRESS OPERATIONS ==========

    /**
     * Get progress for a specific lesson by a student.
     */
    public StudentLessonProgressDto getLessonProgress(Long studentId, Long lessonId) {
        StudentLessonProgress progress = lessonProgressDao.findByStudentIdAndLessonId(studentId, lessonId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No progress found for studentId=" + studentId + ", lessonId=" + lessonId));
        return mapProgressToDto(progress);
    }

    /**
     * Get all progress records for a student.
     */
    public List<StudentLessonProgressDto> getAllProgressForStudent(Long studentId) {
        return lessonProgressDao.findByStudentId(studentId)
                .stream()
                .map(this::mapProgressToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get in-progress lessons for a student.
     */
    public List<StudentLessonProgressDto> getInProgressLessons(Long studentId) {
        return lessonProgressDao.findByStudentIdAndStatus(studentId, "IN_PROGRESS")
                .stream()
                .map(this::mapProgressToDto)
                .collect(Collectors.toList());
    }

    /**
     * Get leaderboard for a specific lesson (top students by completion percentage).
     */
    public List<StudentLessonProgressDto> getLessonLeaderboard(Long lessonId) {
        return lessonProgressDao.findByLessonIdOrderByCompletionPctDesc(lessonId)
                .stream()
                .limit(10)
                .map(this::mapProgressToDto)
                .collect(Collectors.toList());
    }

    // ========== PRIVATE HELPER METHODS ==========

    /**
     * Update lesson progress based on completed exercises.
     * Calculates completion percentage and awards XP if lesson is completed.
     */
    private void updateLessonProgress(Long studentId, Long lessonId) {
        log.info("Updating lesson progress for studentId={}, lessonId={}", studentId, lessonId);

        // Fetch lesson from Content Service
        Map<String, Object> lesson = contentServiceClient.getLesson(lessonId);
        List<Map<String, Object>> exercises = (List<Map<String, Object>>) lesson.get("exercises");

        if (exercises == null || exercises.isEmpty()) {
            log.warn("Lesson {} has no exercises, skipping progress update", lessonId);
            return;
        }

        List<Long> exerciseIds = exercises.stream()
                .map(ex -> ((Number) ex.get("id")).longValue())
                .collect(Collectors.toList());

        // Count how many exercises have correct attempts
        long completedCount = exerciseAttemptDao.countDistinctCorrectExercises(studentId, exerciseIds);
        BigDecimal completionPct = BigDecimal.valueOf((completedCount * 100.0) / exercises.size())
                .setScale(2, BigDecimal.ROUND_HALF_UP);

        // Fetch or create progress record
        StudentLessonProgress progress = lessonProgressDao.findByStudentIdAndLessonId(studentId, lessonId)
                .orElse(new StudentLessonProgress(studentId, lessonId));

        // Update fields
        if (progress.getStartedAt() == null) {
            progress.setStartedAt(LocalDateTime.now());
            progress.setStatus("IN_PROGRESS");
        }
        progress.setCompletionPct(completionPct);
        progress.setLastAccessedAt(LocalDateTime.now());

        // Check if lesson just completed
        if (completionPct.compareTo(new BigDecimal("100")) == 0
                && !"COMPLETED".equals(progress.getStatus())) {

            progress.setStatus("COMPLETED");
            progress.setCompletedAt(LocalDateTime.now());

            // Award XP
            int xpReward = ((Number) lesson.get("xpReward")).intValue();
            progress.setXpAwarded(xpReward);

            // Call User Service to update student XP
            try {
                userServiceClient.addStudentXp(studentId, xpReward);
                log.info("Awarded {} XP to student {} for completing lesson {}",
                        xpReward, studentId, lessonId);
            } catch (Exception e) {
                log.error("Failed to award XP to student {}: {}", studentId, e.getMessage(), e);
                // Continue anyway - XP is saved in progress table for audit
            }
        }

        lessonProgressDao.save(progress);
        log.info("Updated lesson progress: completionPct={}, status={}",
                completionPct, progress.getStatus());
    }

    /**
     * Evaluate student's submitted answer against correct answer.
     * Returns score (0-100) and feedback text.
     */
    private EvaluationResult evaluateAnswer(Map<String, Object> exercise, Map<String, Object> submittedAnswer) {
        String exerciseType = (String) exercise.get("type");
        Map<String, Object> contentData = (Map<String, Object>) exercise.get("contentData");

        // Evaluation logic based on exercise type
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
                log.warn("Unknown exercise type: {}, defaulting to 0 score", exerciseType);
                return new EvaluationResult(BigDecimal.ZERO, "Unknown exercise type");
        }
    }

    private EvaluationResult evaluateMultipleChoice(Map<String, Object> contentData, Map<String, Object> submitted) {
        String correctOption = (String) contentData.get("correctOption");
        String selectedOption = (String) submitted.get("selectedOption");

        if (correctOption.equals(selectedOption)) {
            return new EvaluationResult(new BigDecimal("100"), "Correct!");
        } else {
            return new EvaluationResult(BigDecimal.ZERO,
                    "Incorrect. The correct answer was: " + correctOption);
        }
    }

    private EvaluationResult evaluateTranslation(Map<String, Object> contentData, Map<String, Object> submitted) {
        String correctTranslation = (String) contentData.get("correctTranslation");
        List<String> alternatives = (List<String>) contentData.get("alternativeTranslations");
        String userTranslation = (String) submitted.get("translation");

        // Exact match
        if (correctTranslation.equals(userTranslation)) {
            return new EvaluationResult(new BigDecimal("100"), "Perfect translation!");
        }

        // Check alternatives
        if (alternatives != null && alternatives.contains(userTranslation)) {
            return new EvaluationResult(new BigDecimal("100"), "Correct alternative translation!");
        }

        // Partial credit for close matches (simplified - could use Levenshtein distance)
        if (userTranslation.contains(correctTranslation) || correctTranslation.contains(userTranslation)) {
            return new EvaluationResult(new BigDecimal("50"),
                    "Partially correct. Expected: " + correctTranslation);
        }

        return new EvaluationResult(BigDecimal.ZERO,
                "Incorrect. Correct translation: " + correctTranslation);
    }

    private EvaluationResult evaluateFillBlank(Map<String, Object> contentData, Map<String, Object> submitted) {
        List<String> correctAnswers = (List<String>) contentData.get("correctAnswers");
        List<String> userAnswers = (List<String>) submitted.get("answers");

        if (correctAnswers.size() != userAnswers.size()) {
            return new EvaluationResult(BigDecimal.ZERO, "Invalid number of answers");
        }

        int correct = 0;
        for (int i = 0; i < correctAnswers.size(); i++) {
            if (correctAnswers.get(i).equalsIgnoreCase(userAnswers.get(i))) {
                correct++;
            }
        }

        BigDecimal score = BigDecimal.valueOf((correct * 100.0) / correctAnswers.size())
                .setScale(2, BigDecimal.ROUND_HALF_UP);

        String feedback = correct == correctAnswers.size()
                ? "All correct!"
                : String.format("You got %d out of %d correct", correct, correctAnswers.size());

        return new EvaluationResult(score, feedback);
    }

    private EvaluationResult evaluateMatching(Map<String, Object> contentData, Map<String, Object> submitted) {
        List<Map<String, String>> correctPairs = (List<Map<String, String>>) contentData.get("pairs");
        Map<String, String> userMatches = (Map<String, String>) submitted.get("matches");

        int correct = 0;
        for (Map<String, String> pair : correctPairs) {
            String left = pair.get("left");
            String correctRight = pair.get("right");
            String userRight = userMatches.get(left);

            if (correctRight.equals(userRight)) {
                correct++;
            }
        }

        BigDecimal score = BigDecimal.valueOf((correct * 100.0) / correctPairs.size())
                .setScale(2, BigDecimal.ROUND_HALF_UP);

        String feedback = correct == correctPairs.size()
                ? "All pairs matched correctly!"
                : String.format("You matched %d out of %d pairs correctly", correct, correctPairs.size());

        return new EvaluationResult(score, feedback);
    }

    // ========== DTO MAPPING METHODS ==========

    private ExerciseAttemptDto mapAttemptToDto(ExerciseAttempt attempt) {
        return new ExerciseAttemptDto(
                attempt.getId(),
                attempt.getStudentId(),
                attempt.getExerciseId(),
                attempt.getAttemptNumber(),
                attempt.getSubmittedAt(),
                attempt.getSubmittedAnswer(),
                attempt.getIsCorrect(),
                attempt.getScore(),
                attempt.getFeedbackText()
        );
    }

    private StudentLessonProgressDto mapProgressToDto(StudentLessonProgress progress) {
        return new StudentLessonProgressDto(
                progress.getStudentId(),
                progress.getLessonId(),
                progress.getStatus(),
                progress.getCompletionPct(),
                progress.getXpAwarded(),
                progress.getStartedAt(),
                progress.getLastAccessedAt(),
                progress.getCompletedAt()
        );
    }

    /**
     * Internal class for evaluation results.
     */
    private static class EvaluationResult {
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