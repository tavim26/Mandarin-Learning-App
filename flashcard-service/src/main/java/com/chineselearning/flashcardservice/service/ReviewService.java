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

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReviewService {

    private final IFlashcardDao flashcardDao;
    private final IFlashcardProgressDao flashcardProgressDao;
    private final IFlashcardReviewDao flashcardReviewDao;

    public ReviewService(IFlashcardDao flashcardDao,
                         IFlashcardProgressDao flashcardProgressDao,
                         IFlashcardReviewDao flashcardReviewDao) {
        this.flashcardDao = flashcardDao;
        this.flashcardProgressDao = flashcardProgressDao;
        this.flashcardReviewDao = flashcardReviewDao;
    }

    // Fluxul principal: primeste scorul studentului, ruleaza SM-2, salveaza recenzia si actualizeaza progresul
    @Transactional
    public ReviewResultDto submitReview(SubmitReviewRequest request) {
        // Verificam ca flashcard-ul exista inainte de orice operatie
        Flashcard flashcard = flashcardDao.findById(request.getFlashcardId())
                .orElseThrow(() -> new RuntimeException(
                        "Flashcard-ul cu id " + request.getFlashcardId() + " nu exista"));

        // Incarcam starea SM-2 existenta sau cream una noua daca studentul vede cardul prima data
        FlashcardProgress progress = flashcardProgressDao
                .findByStudentIdAndFlashcardId(request.getStudentId(), request.getFlashcardId())
                .orElseGet(() -> createInitialProgress(request.getStudentId(), flashcard.getId()));

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

        // Salvam recenzia in istoricul de audit - acest rand nu va fi niciodata modificat
        FlashcardReview review = new FlashcardReview();
        review.setStudentId(request.getStudentId());
        review.setFlashcardId(request.getFlashcardId());
        review.setReviewedAt(LocalDateTime.now());
        review.setQuality(request.getQuality());
        FlashcardReview savedReview = flashcardReviewDao.save(review);

        // Returnam atat recenzia salvata cat si starea SM-2 actualizata
        ReviewResultDto resultDto = new ReviewResultDto();
        resultDto.setReview(toReviewDto(savedReview));
        resultDto.setProgress(toProgressDto(savedProgress));
        return resultDto;
    }

    // Returneaza toate cardurile scadente pentru recenzie ale unui student la momentul curent
    @Transactional(readOnly = true)
    public List<FlashcardProgressDto> getDueFlashcards(Long studentId) {
        return flashcardProgressDao
                .findByStudentIdAndNextReviewAtLessThanEqual(studentId, LocalDateTime.now())
                .stream()
                .map(this::toProgressDto)
                .toList();
    }

    // Returneaza istoricul complet al recenziilor unui student pentru un card specific
    @Transactional(readOnly = true)
    public List<FlashcardReviewDto> getReviewHistory(Long studentId, Long flashcardId) {
        return flashcardReviewDao
                .findByStudentIdAndFlashcardIdOrderByReviewedAtAsc(studentId, flashcardId)
                .stream()
                .map(this::toReviewDto)
                .toList();
    }

    // Returneaza starea SM-2 curenta a unui student pentru un card specific
    @Transactional(readOnly = true)
    public FlashcardProgressDto getProgress(Long studentId, Long flashcardId) {
        FlashcardProgress progress = flashcardProgressDao
                .findByStudentIdAndFlashcardId(studentId, flashcardId)
                .orElseThrow(() -> new RuntimeException(
                        "Nu exista progres pentru studentul " + studentId +
                                " si flashcard-ul " + flashcardId));
        return toProgressDto(progress);
    }

    // -------------------------
    // METODE HELPER PRIVATE
    // -------------------------

    // Creeaza o inregistrare initiala de progres cu valorile default SM-2
    private FlashcardProgress createInitialProgress(Long studentId, Long flashcardId) {
        FlashcardProgress progress = new FlashcardProgress();
        progress.setStudentId(studentId);
        progress.setFlashcardId(flashcardId);
        // Valori initiale SM-2: EF=2.5, interval=0, repetitii=0
        progress.setEasinessFactor(new BigDecimal("2.5"));
        progress.setIntervalDays(0);
        progress.setRepetitionCount(0);
        return progress;
    }

    // Mapping domain -> DTO pentru FlashcardProgress
    private FlashcardProgressDto toProgressDto(FlashcardProgress progress) {
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

    // Mapping domain -> DTO pentru FlashcardReview
    private FlashcardReviewDto toReviewDto(FlashcardReview review) {
        FlashcardReviewDto dto = new FlashcardReviewDto();
        dto.setId(review.getId());
        dto.setStudentId(review.getStudentId());
        dto.setFlashcardId(review.getFlashcardId());
        dto.setReviewedAt(review.getReviewedAt());
        dto.setQuality(review.getQuality());
        return dto;
    }
}