package com.chineselearning.progressservice.service;

import com.chineselearning.progressservice.domain.dto.*;
import com.chineselearning.progressservice.domain.ports.IContentServicePort;

import com.chineselearning.progressservice.domain.ExerciseAttempt;
import com.chineselearning.progressservice.domain.StudentLessonProgress;
import com.chineselearning.progressservice.domain.StudentReplica;

import com.chineselearning.progressservice.domain.dao.IExerciseAttemptDao;
import com.chineselearning.progressservice.domain.dao.IStudentLessonProgressDao;
import com.chineselearning.progressservice.domain.dao.IStudentReplicaDao;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProgressService
{

    private static final Logger log = LoggerFactory.getLogger(ProgressService.class);

    private final IStudentReplicaDao studentReplicaDao;
    private final IExerciseAttemptDao exerciseAttemptDao;
    private final IStudentLessonProgressDao lessonProgressDao;

    private final IContentServicePort contentServicePort;
    private final EvaluationService evaluationService;

    public ProgressService(IStudentReplicaDao studentReplicaDao,
                           IExerciseAttemptDao exerciseAttemptDao,
                           IStudentLessonProgressDao lessonProgressDao,
                           IContentServicePort contentServicePort,
                           EvaluationService evaluationService)
    {
        this.studentReplicaDao = studentReplicaDao;
        this.exerciseAttemptDao = exerciseAttemptDao;
        this.lessonProgressDao = lessonProgressDao;
        this.contentServicePort = contentServicePort;
        this.evaluationService = evaluationService;
    }



    @Transactional
    public ExerciseAttemptDto submitAttempt(Long studentId, SubmitAttemptRequest request)
    {
        Long exerciseId = request.getExerciseId();

        ExerciseResponseDto exercise = contentServicePort.getExercise(exerciseId);
        LessonResponseDto lesson = contentServicePort.getLesson(exercise.getLessonId());

        EvaluationResultDto result = evaluationService.evaluate(
                exercise.getType(),
                exercise.getContentData(),
                request.getSubmittedAnswer()
        );

        return saveAttemptAndUpdateProgress(studentId, exerciseId, lesson, request, result);
    }





    @Transactional(readOnly = true)
    public StudentLessonProgressDto getLessonProgress(Long studentId, Long lessonId)
    {
        StudentLessonProgress progress = lessonProgressDao
                .findByStudentIdAndLessonId(studentId, lessonId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "There is no progress for studentId=" + studentId + ", lessonId=" + lessonId));

        return mapToStudentLessonProgressDto(progress);
    }

    @Transactional(readOnly = true)
    public List<StudentLessonProgressDto> getAllProgressForStudent(Long studentId)
    {
        return lessonProgressDao.findByStudentId(studentId).stream()
                .map(this::mapToStudentLessonProgressDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StudentLessonProgressDto> getInProgressLessons(Long studentId)
    {
        return lessonProgressDao.findByStudentIdAndStatus(studentId, "IN_PROGRESS").stream()
                .map(this::mapToStudentLessonProgressDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<StudentLessonProgressDto> getLessonLeaderboard(Long lessonId)
    {
        return lessonProgressDao.findTop10ByLessonIdOrderByCompletionPctDesc(lessonId).stream()
                .map(this::mapToStudentLessonProgressDto)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<ExerciseAttemptDto> getStudentAttemptsForExercise(Long studentId, Long exerciseId)
    {
        return exerciseAttemptDao
                .findByStudentIdAndExerciseIdOrderByAttemptNumberAsc(studentId, exerciseId)
                .stream()
                .map(this::mapToExerciseAttemptDto)
                .collect(Collectors.toList());
    }


    @Transactional(readOnly = true)
    public StudentSummaryDto getStudentSummary(Long studentId)
    {
        StudentReplica replica = studentReplicaDao.findById(studentId)
                .orElse(new StudentReplica(studentId)); // student fara tentative inca

        long completed = lessonProgressDao.countByStudentIdAndStatus(studentId, "COMPLETED");
        long inProgress = lessonProgressDao.countByStudentIdAndStatus(studentId, "IN_PROGRESS");

        return new StudentSummaryDto(
                studentId,
                replica.getXpTotal(),
                replica.getLevel(),
                completed,
                inProgress
        );
    }

    @Transactional(readOnly = true)
    public StudentUnitProgressDto getUnitProgress(Long studentId, Long unitId)
    {
        List<LessonResponseDto> lessons = contentServicePort.getLessonsForUnit(unitId);

        if (lessons.isEmpty())
        {
            return new StudentUnitProgressDto(unitId, studentId, 0, 0, 0, 0, BigDecimal.ZERO);
        }

        List<Long> lessonIds = lessons.stream()
                .map(LessonResponseDto::getId)
                .collect(Collectors.toList());

        List<StudentLessonProgress> existingProgresses = lessonProgressDao.findByStudentIdAndLessonIdIn(studentId, lessonIds);

        long completed = existingProgresses.stream()
                .filter(p -> "COMPLETED".equals(p.getStatus()))
                .count();

        long inProgress = existingProgresses.stream()
                .filter(p -> "IN_PROGRESS".equals(p.getStatus()))
                .count();

        long notStarted = lessons.size() - completed - inProgress;

        BigDecimal unitCompletionPct = BigDecimal.valueOf((completed * 100.0) / lessons.size())
                .setScale(2, java.math.RoundingMode.HALF_UP);

        return new StudentUnitProgressDto(
                unitId, studentId, lessons.size(),
                completed, inProgress, notStarted,
                unitCompletionPct
        );
    }




    private ExerciseAttemptDto saveAttemptAndUpdateProgress(Long studentId, Long exerciseId, LessonResponseDto lesson, SubmitAttemptRequest request, EvaluationResultDto result)
    {
        ensureStudentReplicaExists(studentId);

        int attemptNumber = exerciseAttemptDao.countByStudentIdAndExerciseId(studentId, exerciseId) + 1;

        ExerciseAttempt attempt = buildAttempt(studentId, exerciseId, attemptNumber, request, result);
        ExerciseAttempt saved = exerciseAttemptDao.save(attempt);

        log.info("Saved attempt studentId={}, exerciseId={}, attemptNumber={}, isCorrect={}",
                studentId, exerciseId, attemptNumber, result.isCorrect());

        updateLessonProgress(studentId, lesson);

        return mapToExerciseAttemptDto(saved);
    }




    private void ensureStudentReplicaExists(Long studentId)
    {
        if (!studentReplicaDao.existsByStudentId(studentId))
        {
            log.info("First try for student studentId={}, creating replica", studentId);
            studentReplicaDao.saveIfNotExists(new StudentReplica(studentId));
            log.info("Replic already exists for studentId={}", studentId);
        }
    }

    private ExerciseAttempt buildAttempt(Long studentId, Long exerciseId, int attemptNumber, SubmitAttemptRequest request, EvaluationResultDto result)
    {
        ExerciseAttempt attempt = new ExerciseAttempt();
        attempt.setStudentId(studentId);
        attempt.setExerciseId(exerciseId);
        attempt.setAttemptNumber(attemptNumber);
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt.setSubmittedAnswer(request.getSubmittedAnswer());
        attempt.setIsCorrect(result.isCorrect());
        attempt.setScore(result.getScore());
        attempt.setFeedbackText(result.getFeedback());
        return attempt;
    }

    private void updateLessonProgress(Long studentId, LessonResponseDto lesson)
    {
        if (lesson.getExercises() == null || lesson.getExercises().isEmpty())
        {
            log.warn("Lesson {} does not have exercises, progress will not be updated", lesson.getId());
            return;
        }

        BigDecimal completionPct = calculateCompletionPct(studentId, lesson);
        StudentLessonProgress progress = fetchOrCreateProgress(studentId, lesson.getId());

        updateProgressFields(progress, completionPct);
        handleStatusTransition(progress, completionPct, studentId, lesson);

        lessonProgressDao.save(progress);
        log.info("Progress updated: studentId={}, lessonId={}, completionPct={}, status={}",
                studentId, lesson.getId(), completionPct, progress.getStatus());
    }



    private BigDecimal calculateCompletionPct(Long studentId, LessonResponseDto lesson)
    {
        List<Long> exerciseIds = lesson.getExercises().stream()
                .map(ExerciseResponseDto::getId)
                .collect(Collectors.toList());

        long correctCount = exerciseAttemptDao.countDistinctCorrectExercises(studentId, exerciseIds);

        return BigDecimal.valueOf((correctCount * 100.0) / lesson.getExercises().size())
                .setScale(2, java.math.RoundingMode.HALF_UP);
    }



    private StudentLessonProgress fetchOrCreateProgress(Long studentId, Long lessonId)
    {
        return lessonProgressDao
                .findByStudentIdAndLessonId(studentId, lessonId)
                .orElse(new StudentLessonProgress(studentId, lessonId));
    }


    private void updateProgressFields(StudentLessonProgress progress, BigDecimal completionPct)
    {
        if (progress.getStartedAt() == null)
        {
            progress.setStartedAt(LocalDateTime.now());
        }
        progress.setCompletionPct(completionPct);
        progress.setLastAccessedAt(LocalDateTime.now());
    }


    private void handleStatusTransition(StudentLessonProgress progress, BigDecimal completionPct, Long studentId, LessonResponseDto lesson)
    {
        if (completionPct.compareTo(new BigDecimal("100")) == 0)
        {
            handleLessonCompleted(progress, studentId, lesson);
        }
        else if (completionPct.compareTo(BigDecimal.ZERO) > 0)
        {
            handleLessonInProgress(progress);
        }
        else
        {
            progress.setStatus("NOT_STARTED");
            progress.setCompletedAt(null);
        }
    }


    private void handleLessonCompleted(StudentLessonProgress progress, Long studentId, LessonResponseDto lesson)
    {
        if (!"COMPLETED".equals(progress.getStatus()))
        {
            progress.setStatus("COMPLETED");
            progress.setCompletedAt(LocalDateTime.now());

            if (progress.getXpAwarded() == null || progress.getXpAwarded() == 0)
            {
                Integer xpReward = lesson.getXpReward();
                if (xpReward == null)
                {
                    log.warn("Lesson {} has no xpReward configured in content-service, 0 XP given", lesson.getId());
                    xpReward = 0;
                }
                progress.setXpAwarded(xpReward);
                awardXpToStudent(studentId, xpReward);
                log.info("XP given: studentId={}, lessonId={}, xp={}", studentId, lesson.getId(), xpReward);
            }
            else
            {
                log.info("XP already given {}. It can be given one time only", lesson.getId());
            }
        }
    }


    private void handleLessonInProgress(StudentLessonProgress progress)
    {
        if (!"IN_PROGRESS".equals(progress.getStatus()))
        {
            progress.setStatus("IN_PROGRESS");
            progress.setCompletedAt(null);
        }
    }


    private void awardXpToStudent(Long studentId, int xpToAdd)
    {
        StudentReplica student = studentReplicaDao.findById(studentId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Student replica not found for studentId=" + studentId));
        student.addXp(xpToAdd);
        studentReplicaDao.save(student);
        log.info("Student {} now has {} XP (level {})", studentId, student.getXpTotal(), student.getLevel());
    }








    private ExerciseAttemptDto mapToExerciseAttemptDto(ExerciseAttempt attempt)
    {
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

    private StudentLessonProgressDto mapToStudentLessonProgressDto(StudentLessonProgress progress)
    {
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