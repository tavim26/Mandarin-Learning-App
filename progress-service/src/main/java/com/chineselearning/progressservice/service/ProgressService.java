package com.chineselearning.progressservice.service;

import com.chineselearning.progressservice.clients.ContentServiceClient;

import com.chineselearning.progressservice.domain.ExerciseAttempt;
import com.chineselearning.progressservice.domain.StudentLessonProgress;
import com.chineselearning.progressservice.domain.StudentReplica;

import com.chineselearning.progressservice.domain.dao.IExerciseAttemptDao;
import com.chineselearning.progressservice.domain.dao.IStudentLessonProgressDao;
import com.chineselearning.progressservice.domain.dao.IStudentReplicaDao;

import com.chineselearning.progressservice.domain.dto.EvaluationResultDto;
import com.chineselearning.progressservice.domain.dto.ExerciseAttemptDto;
import com.chineselearning.progressservice.domain.dto.ExerciseResponseDto;
import com.chineselearning.progressservice.domain.dto.LessonResponseDto;
import com.chineselearning.progressservice.domain.dto.StudentLessonProgressDto;
import com.chineselearning.progressservice.domain.dto.SubmitAttemptRequest;

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

    private final ContentServiceClient contentServiceClient;
    private final EvaluationService evaluationService;

    public ProgressService(IStudentReplicaDao studentReplicaDao, IExerciseAttemptDao exerciseAttemptDao, IStudentLessonProgressDao lessonProgressDao, ContentServiceClient contentServiceClient, EvaluationService evaluationService) {
        this.studentReplicaDao = studentReplicaDao;
        this.exerciseAttemptDao = exerciseAttemptDao;
        this.lessonProgressDao = lessonProgressDao;
        this.contentServiceClient = contentServiceClient;
        this.evaluationService = evaluationService;
    }


    public ExerciseAttemptDto submitAttempt(SubmitAttemptRequest request)
    {
        Long studentId = request.getStudentId();
        Long exerciseId = request.getExerciseId();

        ExerciseResponseDto exercise = contentServiceClient.getExercise(exerciseId);

        LessonResponseDto lesson = contentServiceClient.getLesson(exercise.getLessonId());

        //Evaluare raspuns
        EvaluationResultDto result = evaluationService.evaluate(
                exercise.getType(),
                exercise.getContentData(),
                request.getSubmittedAnswer()
        );

        //Toate operatiile de scriere in DB intr-o singura tranzactie
        return saveAttemptAndUpdateProgress(studentId, exerciseId, lesson, request, result);
    }




    @Transactional
    protected ExerciseAttemptDto saveAttemptAndUpdateProgress(Long studentId, Long exerciseId, LessonResponseDto lesson, SubmitAttemptRequest request, EvaluationResultDto result)
    {
        // Lazy creation - creaza replica studentului la prima incercare
        ensureStudentReplicaExists(studentId);

        // Calcul numar incercare curenta
        int attemptNumber = exerciseAttemptDao.countByStudentIdAndExerciseId(studentId, exerciseId) + 1;

        // Constructie si salvare entitate ExerciseAttempt
        ExerciseAttempt attempt = buildAttempt(studentId, exerciseId, attemptNumber, request, result);
        ExerciseAttempt saved = exerciseAttemptDao.save(attempt);

        log.info("Attempt salvat: studentId={}, exerciseId={}, attemptNumber={}, isCorrect={}", studentId, exerciseId, attemptNumber, result.isCorrect());

        // Actualizare progres lectie folosind datele deja obtinute din content-service
        updateLessonProgress(studentId, lesson);

        return mapToExerciseAttemptDto(saved);
    }


    @Transactional(readOnly = true)
    public StudentLessonProgressDto getLessonProgress(Long studentId, Long lessonId)
    {
        StudentLessonProgress progress = lessonProgressDao
                .findByStudentIdAndLessonId(studentId, lessonId)
                .orElseThrow(() -> new IllegalArgumentException("Nu exista progres pentru studentId=" + studentId + ", lessonId=" + lessonId));

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







    // ========== METODE PRIVATE ==========

    private void ensureStudentReplicaExists(Long studentId)
    {
        if (!studentReplicaDao.existsByStudentId(studentId))
        {
            log.info("Prima incercare pentru studentId={}, creare replica", studentId);
            studentReplicaDao.save(new StudentReplica(studentId));
            log.info("Replica creata pentru studentId={}", studentId);
        }
    }


    // Constructie entitate ExerciseAttempt din date deja procesate
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
            log.warn("Lectia {} nu are exercitii, progresul nu va fi actualizat", lesson.getId());
            return;
        }

        BigDecimal completionPct = calculateCompletionPct(studentId, lesson);
        StudentLessonProgress progress = fetchOrCreateProgress(studentId, lesson.getId());

        updateProgressFields(progress, completionPct);
        handleStatusTransition(progress, completionPct, studentId, lesson);

        lessonProgressDao.save(progress);
        log.info("Progres actualizat: studentId={}, lessonId={}, completionPct={}, status={}", studentId, lesson.getId(), completionPct, progress.getStatus());
    }



    // Calculeaza procentul de exercitii rezolvate corect din totalul lectiei
    private BigDecimal calculateCompletionPct(Long studentId, LessonResponseDto lesson)
    {
        List<Long> exerciseIds = lesson.getExercises().stream()
                .map(ex -> ex.getId())
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

    // Actualizeaza campurile de timp la fiecare incercare
    private void updateProgressFields(StudentLessonProgress progress, BigDecimal completionPct)
    {
        if (progress.getStartedAt() == null)
        {
            progress.setStartedAt(LocalDateTime.now());
        }
        progress.setCompletionPct(completionPct);
        progress.setLastAccessedAt(LocalDateTime.now());
    }

    // Gestioneaza tranzitiile de status si acordarea XP
    // Statusuri posibile: NOT_STARTED -> IN_PROGRESS -> COMPLETED
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

            // XP se acorda o singura data per lectie
            if (progress.getXpAwarded() == null || progress.getXpAwarded() == 0)
            {
                int xpReward = lesson.getXpReward();
                progress.setXpAwarded(xpReward);
                awardXpToStudent(studentId, xpReward);
                log.info("XP acordat: studentId={}, lessonId={}, xp={}", studentId, lesson.getId(), xpReward);

            }
            else
            {
                log.info("XP deja acordat pentru lectia {}, se omite acordarea duplicata", lesson.getId());
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
                .orElseThrow(() -> new IllegalArgumentException("Student replica negasita pentru studentId=" + studentId));
        student.addXp(xpToAdd);
        studentReplicaDao.save(student);
        log.info("Student {} are acum {} XP (nivel {})", studentId, student.getXpTotal(), student.getLevel());
    }




    // ========== DTO MAPPING ==========

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