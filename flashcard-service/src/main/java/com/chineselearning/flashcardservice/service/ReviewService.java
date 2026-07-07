package com.chineselearning.flashcardservice.service;

import com.chineselearning.flashcardservice.domain.Flashcard;
import com.chineselearning.flashcardservice.domain.FlashcardProgress;
import com.chineselearning.flashcardservice.domain.FlashcardReview;

import com.chineselearning.flashcardservice.domain.dao.IFlashcardDao;
import com.chineselearning.flashcardservice.domain.dao.IFlashcardProgressDao;
import com.chineselearning.flashcardservice.domain.dao.IFlashcardReviewDao;

import com.chineselearning.flashcardservice.domain.dto.FlashcardProgressDto;
import com.chineselearning.flashcardservice.domain.dto.FlashcardReviewDto;
import com.chineselearning.flashcardservice.domain.dto.ReviewResultDto;
import com.chineselearning.flashcardservice.domain.dto.SubmitReviewRequest;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ReviewService
{

    private final IFlashcardDao flashcardDao;
    private final IFlashcardProgressDao flashcardProgressDao;
    private final IFlashcardReviewDao flashcardReviewDao;

    public ReviewService(IFlashcardDao flashcardDao, IFlashcardProgressDao flashcardProgressDao, IFlashcardReviewDao flashcardReviewDao)
    {
        this.flashcardDao = flashcardDao;
        this.flashcardProgressDao = flashcardProgressDao;
        this.flashcardReviewDao = flashcardReviewDao;
    }

    @Transactional
    public ReviewResultDto submitReview(Long studentId, SubmitReviewRequest request)
    {
        Flashcard flashcard = flashcardDao.findById(request.getFlashcardId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Flashcard-ul cu id " + request.getFlashcardId() + " nu exista"));

        FlashcardProgress progress = flashcardProgressDao
                .findByStudentIdAndFlashcardId(studentId, request.getFlashcardId())
                .orElseGet(() -> createInitialProgress(studentId, flashcard.getId()));

        Sm2Result result = Sm2Algorithm.calculate(
                progress.getEasinessFactor(),
                progress.getIntervalDays(),
                progress.getRepetitionCount(),
                request.getQuality()
        );

        progress.setEasinessFactor(result.getEasinessFactor());
        progress.setIntervalDays(result.getIntervalDays());
        progress.setRepetitionCount(result.getRepetitionCount());
        progress.setNextReviewAt(result.getNextReviewAt());
        progress.setLastReviewedAt(LocalDateTime.now());
        FlashcardProgress savedProgress = flashcardProgressDao.save(progress);

        FlashcardReview review = new FlashcardReview();
        review.setStudentId(studentId);
        review.setFlashcardId(request.getFlashcardId());
        review.setReviewedAt(LocalDateTime.now());
        review.setQuality(request.getQuality());
        FlashcardReview savedReview = flashcardReviewDao.save(review);

        ReviewResultDto resultDto = new ReviewResultDto();
        resultDto.setReview(toReviewDto(savedReview));
        resultDto.setProgress(toProgressDto(savedProgress));
        return resultDto;
    }



    @Transactional(readOnly = true)
    public List<FlashcardProgressDto> getDueFlashcards(Long userId, Long studentId, Long setId)
    {

        verifyStudentAccess(userId, studentId);

        List<Flashcard> allCards = flashcardDao.findBySetId(setId);

        if (allCards.isEmpty())
        {
            return List.of();
        }

        List<Long> allCardIds = allCards.stream()
                .map(Flashcard::getId)
                .toList();

        List<FlashcardProgress> existingProgress = flashcardProgressDao
                .findByStudentIdAndFlashcardIdIn(studentId, allCardIds);

        Set<Long> seenCardIds = existingProgress.stream()
                .map(FlashcardProgress::getFlashcardId)
                .collect(Collectors.toSet());

        List<FlashcardProgressDto> result = new ArrayList<>();

        LocalDateTime now = LocalDateTime.now();
        existingProgress.stream()
                .filter(p -> p.getNextReviewAt() != null && !p.getNextReviewAt().isAfter(now))
                .map(this::toProgressDto)
                .forEach(result::add);

        allCards.stream()
                .filter(card -> !seenCardIds.contains(card.getId()))
                .map(card -> toDefaultProgressDto(studentId, card.getId()))
                .forEach(result::add);

        return result;
    }

    @Transactional(readOnly = true)
    public List<FlashcardReviewDto> getReviewHistory(Long userId, Long studentId, Long flashcardId)
    {
        verifyStudentAccess(userId, studentId);

        return flashcardReviewDao
                .findByStudentIdAndFlashcardIdOrderByReviewedAtAsc(studentId, flashcardId)
                .stream()
                .map(this::toReviewDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public FlashcardProgressDto getProgress(Long userId, Long studentId, Long flashcardId)
    {
        verifyStudentAccess(userId, studentId);

        FlashcardProgress progress = flashcardProgressDao
                .findByStudentIdAndFlashcardId(studentId, flashcardId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "There is not progress for student " + studentId + " and flashcard " + flashcardId));
        return toProgressDto(progress);
    }





    private void verifyStudentAccess(Long userId, Long studentId)
    {
        if (!userId.equals(studentId))
        {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Access forbidden: you cannot access other students cards.");
        }
    }

    private FlashcardProgress createInitialProgress(Long studentId, Long flashcardId)
    {
        FlashcardProgress progress = new FlashcardProgress();
        progress.setStudentId(studentId);
        progress.setFlashcardId(flashcardId);
        progress.setEasinessFactor(new BigDecimal("2.5"));
        progress.setIntervalDays(0);
        progress.setRepetitionCount(0);
        return progress;
    }

    private FlashcardProgressDto toDefaultProgressDto(Long studentId, Long flashcardId)
    {
        FlashcardProgressDto dto = new FlashcardProgressDto();
        dto.setId(null);
        dto.setStudentId(studentId);
        dto.setFlashcardId(flashcardId);
        dto.setEasinessFactor(new BigDecimal("2.5"));
        dto.setIntervalDays(0);
        dto.setRepetitionCount(0);
        dto.setNextReviewAt(null);
        dto.setLastReviewedAt(null);
        return dto;
    }

    private FlashcardProgressDto toProgressDto(FlashcardProgress progress)
    {
        FlashcardProgressDto dto = new FlashcardProgressDto();
        dto.setId(progress.getId());
        dto.setStudentId(progress.getStudentId());
        dto.setFlashcardId(progress.getFlashcardId());
        dto.setEasinessFactor(progress.getEasinessFactor());
        dto.setIntervalDays(progress.getIntervalDays());
        dto.setRepetitionCount(progress.getRepetitionCount());
        dto.setNextReviewAt(progress.getNextReviewAt());
        dto.setLastReviewedAt(progress.getLastReviewedAt());
        return dto;
    }

    private FlashcardReviewDto toReviewDto(FlashcardReview review)
    {
        FlashcardReviewDto dto = new FlashcardReviewDto();
        dto.setId(review.getId());
        dto.setStudentId(review.getStudentId());
        dto.setFlashcardId(review.getFlashcardId());
        dto.setReviewedAt(review.getReviewedAt());
        dto.setQuality(review.getQuality());
        return dto;
    }
}