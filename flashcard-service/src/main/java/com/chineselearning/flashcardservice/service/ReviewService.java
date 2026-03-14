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

    // Fluxul principal: primeste scorul studentului, ruleaza SM-2, salveaza recenzia si actualizeaza progresul
    @Transactional
    public ReviewResultDto submitReview(Long studentId, SubmitReviewRequest request)
    {
        // Verificam ca flashcard-ul exista inainte de orice operatie
        Flashcard flashcard = flashcardDao.findById(request.getFlashcardId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Flashcard-ul cu id " + request.getFlashcardId() + " nu exista"));

        // Incarcam starea SM-2 existenta sau cream una noua daca studentul vede cardul prima data
        FlashcardProgress progress = flashcardProgressDao
                .findByStudentIdAndFlashcardId(studentId, request.getFlashcardId())
                .orElseGet(() -> createInitialProgress(studentId, flashcard.getId()));

        // Rulam calculul SM-2 cu starea curenta si scorul primit de la student
        Sm2Algorithm.Sm2Result result = Sm2Algorithm.calculate(
                progress.getEasinessFactor(),
                progress.getIntervalDays(),
                progress.getRepetitionCount(),
                request.getQuality()
        );

        // Actualizam starea SM-2 cu valorile calculate de algoritm
        progress.setEasinessFactor(result.getEasinessFactor());
        progress.setIntervalDays(result.getIntervalDays());
        progress.setRepetitionCount(result.getRepetitionCount());
        progress.setNextReviewAt(result.getNextReviewAt());
        progress.setLastReviewedAt(LocalDateTime.now());
        FlashcardProgress savedProgress = flashcardProgressDao.save(progress);

        // Salvam recenzia in istoricul de audit
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

    // Returneaza cardurile scadente + cardurile nevazute niciodata din setul specificat
    @Transactional(readOnly = true)
    public List<FlashcardProgressDto> getDueFlashcards(Long studentId, Long setId)
    {
        // Toti cardii din set
        List<Flashcard> allCards = flashcardDao.findBySetId(setId);
        List<Long> allCardIds = allCards.stream()
                .map(Flashcard::getId)
                .toList();

        // Progresul existent pentru cardurile din set
        List<FlashcardProgress> existingProgress = flashcardProgressDao
                .findByStudentIdAndFlashcardIdIn(studentId, allCardIds);

        // ID-urile cardurilor care au deja un progress record
        Set<Long> seenCardIds = existingProgress.stream()
                .map(FlashcardProgress::getFlashcardId)
                .collect(Collectors.toSet());

        List<FlashcardProgressDto> result = new ArrayList<>();

        // Cardurile cu progress record si scadente (next_review_at <= acum)
        LocalDateTime now = LocalDateTime.now();
        existingProgress.stream()
                .filter(p -> p.getNextReviewAt() != null && !p.getNextReviewAt().isAfter(now))
                .map(this::toProgressDto)
                .forEach(result::add);

        // Cardurile nevazute niciodata — progress record absent — reprezentate cu valori default SM-2
        allCards.stream()
                .filter(card -> !seenCardIds.contains(card.getId()))
                .map(card -> toDefaultProgressDto(studentId, card.getId()))
                .forEach(result::add);

        return result;
    }

    // Returneaza istoricul complet al recenziilor unui student pentru un card specific
    @Transactional(readOnly = true)
    public List<FlashcardReviewDto> getReviewHistory(Long studentId, Long flashcardId)
    {
        return flashcardReviewDao
                .findByStudentIdAndFlashcardIdOrderByReviewedAtAsc(studentId, flashcardId)
                .stream()
                .map(this::toReviewDto)
                .toList();
    }

    // Returneaza starea SM-2 curenta a unui student pentru un card specific
    @Transactional(readOnly = true)
    public FlashcardProgressDto getProgress(Long studentId, Long flashcardId)
    {
        FlashcardProgress progress = flashcardProgressDao
                .findByStudentIdAndFlashcardId(studentId, flashcardId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Nu exista progres pentru studentul " + studentId + " si flashcard-ul " + flashcardId));
        return toProgressDto(progress);
    }




    // METODE HELPER

    // Creeaza o inregistrare initiala de progres cu valorile default SM-2
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

    // ProgressDto cu valori default pentru un card nevazut niciodata — id null semnaleaza frontend-ului absenta unui progress record
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