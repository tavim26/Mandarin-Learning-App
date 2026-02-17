package com.chineselearning.progressservice.service;

import com.chineselearning.progressservice.clients.ContentServiceClient;
import com.chineselearning.progressservice.clients.UserServiceClient;
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

@Service
@Transactional
public class ProgressService {

    private static final Logger log = LoggerFactory.getLogger(ProgressService.class);

    private final IStudentReplicaDao studentReplicaDao;
    private final IExerciseAttemptDao exerciseAttemptDao;
    private final IStudentLessonProgressDao lessonProgressDao;
    private final ContentServiceClient contentServiceClient;
    private final UserServiceClient userServiceClient;
    private final EvaluationService evaluationService;

    public ProgressService(
            IStudentReplicaDao studentReplicaDao,
            IExerciseAttemptDao exerciseAttemptDao,
            IStudentLessonProgressDao lessonProgressDao,
            ContentServiceClient contentServiceClient,
            UserServiceClient userServiceClient,
            EvaluationService evaluationService
    ) {
        this.studentReplicaDao = studentReplicaDao;
        this.exerciseAttemptDao = exerciseAttemptDao;
        this.lessonProgressDao = lessonProgressDao;
        this.contentServiceClient = contentServiceClient;
        this.userServiceClient = userServiceClient;
        this.evaluationService = evaluationService;
    }

    public ExerciseAttemptDto submitAttempt(SubmitAttemptRequest request) {
        Long studentId = request.getStudentId();
        Long exerciseId = request.getExerciseId();

        // STEP 1: Lazy creation - ensure student replica exists
        ensureStudentReplicaExists(studentId);

        // STEP 2: Fetch exercise from Content Service (validate + get contentData)
        Map<String, Object> exercise = contentServiceClient.getExercise(exerciseId);
        Long lessonId = ((Number) exercise.get("lessonId")).longValue();
        String exerciseType = (String) exercise.get("type");
        Map<String, Object> contentData = (Map<String, Object>) exercise.get("contentData");

        // STEP 3: Calculate attempt number (count previous attempts + 1)
        int attemptNumber = exerciseAttemptDao.countByStudentIdAndExerciseId(studentId, exerciseId) + 1;

        // STEP 4: Evaluate answer based on exercise type
        EvaluationService.EvaluationResult result = evaluationService.evaluate(
                exerciseType,
                contentData,
                request.getSubmittedAnswer()
        );

        // STEP 5: Determine if correct (score >= 70)
        boolean isCorrect = result.getScore().compareTo(new BigDecimal("70")) >= 0;

        // STEP 6: Create and save ExerciseAttempt entity
        ExerciseAttempt attempt = new ExerciseAttempt();
        attempt.setStudentId(studentId);
        attempt.setExerciseId(exerciseId);
        attempt.setAttemptNumber(attemptNumber);
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt.setSubmittedAnswer(request.getSubmittedAnswer());
        attempt.setIsCorrect(isCorrect);
        attempt.setScore(result.getScore());
        attempt.setFeedbackText(result.getFeedback());

        ExerciseAttempt saved = exerciseAttemptDao.save(attempt);
        log.info("Saved attempt: studentId={}, exerciseId={}, attemptNumber={}, isCorrect={}",
                studentId, exerciseId, attemptNumber, isCorrect);

        // STEP 7: Update lesson progress (completion % + XP award if completed)
        updateLessonProgress(studentId, lessonId);

        return mapToExerciseAttemptDto(saved);
    }

    public StudentLessonProgressDto getLessonProgress(Long studentId, Long lessonId) {
        StudentLessonProgress progress = lessonProgressDao.findByStudentIdAndLessonId(studentId, lessonId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No progress found for studentId=" + studentId + ", lessonId=" + lessonId));

        return mapToStudentLessonProgressDto(progress);
    }

    public List<StudentLessonProgressDto> getAllProgressForStudent(Long studentId) {
        return lessonProgressDao.findByStudentId(studentId).stream()
                .map(this::mapToStudentLessonProgressDto)
                .collect(Collectors.toList());
    }

    public List<StudentLessonProgressDto> getInProgressLessons(Long studentId) {
        return lessonProgressDao.findByStudentIdAndStatus(studentId, "IN_PROGRESS").stream()
                .map(this::mapToStudentLessonProgressDto)
                .collect(Collectors.toList());
    }

    public List<StudentLessonProgressDto> getLessonLeaderboard(Long lessonId) {
        return lessonProgressDao.findTop10ByLessonIdOrderByCompletionPctDesc(lessonId).stream()
                .map(this::mapToStudentLessonProgressDto)
                .collect(Collectors.toList());
    }

    public List<ExerciseAttemptDto> getStudentAttemptsForExercise(Long studentId, Long exerciseId) {
        return exerciseAttemptDao.findByStudentIdAndExerciseIdOrderByAttemptNumberAsc(studentId, exerciseId)
                .stream()
                .map(this::mapToExerciseAttemptDto)
                .collect(Collectors.toList());
    }

    // ========== PRIVATE HELPER METHODS ==========

    private void ensureStudentReplicaExists(Long studentId) {
        if (!studentReplicaDao.existsByStudentId(studentId)) {
            // Student replica NU exista - lazy creation triggered
            log.info("Student replica not found for studentId={}, creating now...", studentId);

            // Validate student exists in User Service
            userServiceClient.getUserById(studentId);

            // Create minimal replica (xpTotal=0, level=1)
            StudentReplica replica = new StudentReplica(studentId);
            studentReplicaDao.save(replica);

            log.info("Lazy-created student replica for studentId={}", studentId);
        }
    }

    private void updateLessonProgress(Long studentId, Long lessonId) {
        // STEP 1: Fetch lesson from Content Service (get exercises array)
        Map<String, Object> lesson = contentServiceClient.getLesson(lessonId);
        List<Map<String, Object>> exercises = (List<Map<String, Object>>) lesson.get("exercises");

        if (exercises == null || exercises.isEmpty()) {
            log.warn("Lesson {} has no exercises, skipping progress update", lessonId);
            return;
        }

        // STEP 2: Extract exercise IDs
        List<Long> exerciseIds = exercises.stream()
                .map(ex -> ((Number) ex.get("id")).longValue())
                .collect(Collectors.toList());

        // STEP 3: Count distinct correct exercises
        long correctCount = exerciseAttemptDao.countDistinctCorrectExercises(studentId, exerciseIds);

        // STEP 4: Calculate completion percentage
        BigDecimal completionPct = BigDecimal.valueOf((correctCount * 100.0) / exercises.size())
                .setScale(2, BigDecimal.ROUND_HALF_UP);

        // STEP 5: Fetch or create progress record
        StudentLessonProgress progress = lessonProgressDao.findByStudentIdAndLessonId(studentId, lessonId)
                .orElse(new StudentLessonProgress(studentId, lessonId));

        // STEP 6: Set started_at if first attempt
        if (progress.getStartedAt() == null) {
            progress.setStartedAt(LocalDateTime.now());
        }

        // STEP 7: Update fields
        progress.setCompletionPct(completionPct);
        progress.setLastAccessedAt(LocalDateTime.now());

        // STEP 8: Status management + XP award logic
        if (completionPct.compareTo(new BigDecimal("100")) == 0) {
            // Lesson 100% complete

            if (!"COMPLETED".equals(progress.getStatus())) {
                // Just became completed
                progress.setStatus("COMPLETED");
                progress.setCompletedAt(LocalDateTime.now());

                // Award XP ONLY if not already awarded (duplicate prevention)
                if (progress.getXpAwarded() == null || progress.getXpAwarded() == 0) {
                    int xpReward = ((Number) lesson.get("xpReward")).intValue();
                    progress.setXpAwarded(xpReward);

                    // Update student replica XP + level
                    awardXpToStudent(studentId, xpReward);

                    log.info("Awarded {} XP to student {} for completing lesson {}",
                            xpReward, studentId, lessonId);
                } else {
                    log.info("XP already awarded for lesson {}, skipping duplicate award", lessonId);
                }
            }

        } else if (completionPct.compareTo(BigDecimal.ZERO) > 0) {
            // Partially complete (0% < completion < 100%)

            if (!"IN_PROGRESS".equals(progress.getStatus())) {
                progress.setStatus("IN_PROGRESS");
                progress.setCompletedAt(null);
            }

        } else {
            // Not started (0% completion)
            progress.setStatus("NOT_STARTED");
            progress.setCompletedAt(null);
        }

        // STEP 9: Save progress
        lessonProgressDao.save(progress);
        log.info("Updated lesson progress: studentId={}, lessonId={}, completionPct={}, status={}",
                studentId, lessonId, completionPct, progress.getStatus());
    }

    private void awardXpToStudent(Long studentId, int xpToAdd) {
        StudentReplica student = studentReplicaDao.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException("Student replica not found: " + studentId));

        // Add XP using business logic method
        student.addXp(xpToAdd);

        studentReplicaDao.save(student);
        log.info("Student {} now has {} XP (level {})", studentId, student.getXpTotal(), student.getLevel());
    }

    // ========== DTO MAPPING METHODS ==========

    private ExerciseAttemptDto mapToExerciseAttemptDto(ExerciseAttempt attempt) {
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

    private StudentLessonProgressDto mapToStudentLessonProgressDto(StudentLessonProgress progress) {
        return new StudentLessonProgressDto(
                progress.getId(),
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
}