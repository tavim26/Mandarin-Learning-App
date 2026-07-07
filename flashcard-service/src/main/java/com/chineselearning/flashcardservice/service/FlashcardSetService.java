package com.chineselearning.flashcardservice.service;

import com.chineselearning.flashcardservice.domain.Flashcard;
import com.chineselearning.flashcardservice.domain.FlashcardSet;

import com.chineselearning.flashcardservice.domain.dao.IFlashcardDao;
import com.chineselearning.flashcardservice.domain.dao.IFlashcardProgressDao;
import com.chineselearning.flashcardservice.domain.dao.IFlashcardSetDao;

import com.chineselearning.flashcardservice.domain.dto.*;

import com.chineselearning.flashcardservice.domain.FlashcardProgress;
import com.chineselearning.flashcardservice.domain.dto.FlashcardSetStatsDto;
import java.math.BigDecimal;
import java.time.LocalDateTime;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class FlashcardSetService
{

    private final IFlashcardSetDao flashcardSetDao;
    private final IFlashcardDao flashcardDao;
    private final IFlashcardProgressDao flashcardProgressDao;

    public FlashcardSetService(IFlashcardSetDao flashcardSetDao,
                               IFlashcardDao flashcardDao,
                               IFlashcardProgressDao flashcardProgressDao)
    {
        this.flashcardSetDao = flashcardSetDao;
        this.flashcardDao = flashcardDao;
        this.flashcardProgressDao = flashcardProgressDao;
    }


    @Transactional
    public FlashcardSetDto createSet(Long studentId, CreateFlashcardSetRequest request)
    {
        FlashcardSet set = new FlashcardSet();
        set.setStudentId(studentId);
        set.setTitle(request.getTitle());
        set.setDescription(request.getDescription());

        FlashcardSet saved = flashcardSetDao.save(set);
        return toSetDto(saved);
    }

    @Transactional(readOnly = true)
    public List<FlashcardSetDto> getSetsByStudent(Long userId, Long studentId)
    {
        verifyStudentAccess(userId, studentId);
        return flashcardSetDao.findByStudentIdOrderByIdDesc(studentId)
                .stream()
                .map(this::toSetDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public FlashcardSetDto getSetById(Long setId)
    {
        FlashcardSet set = findSetOrThrow(setId);
        return toSetDto(set);
    }

    @Transactional
    public FlashcardSetDto updateSet(Long studentId, Long setId, UpdateFlashcardSetRequest request)
    {
        FlashcardSet set = findSetOrThrow(setId);
        verifySetOwnership(set, studentId);

        set.setTitle(request.getTitle());
        set.setDescription(request.getDescription());

        FlashcardSet saved = flashcardSetDao.save(set);
        return toSetDto(saved);
    }

    @Transactional
    public void deleteSet(Long studentId, Long setId)
    {
        FlashcardSet set = findSetOrThrow(setId);
        verifySetOwnership(set, studentId);
        flashcardSetDao.delete(set);
    }




    @Transactional
    public FlashcardDto createFlashcard(Long studentId, CreateFlashcardRequest request)
    {
        FlashcardSet set = findSetOrThrow(request.getSetId());
        verifySetOwnership(set, studentId);

        Flashcard flashcard = new Flashcard();
        flashcard.setSetId(request.getSetId());
        flashcard.setFrontText(request.getFrontText());
        flashcard.setBackText(request.getBackText());

        Flashcard saved = flashcardDao.save(flashcard);
        return toFlashcardDto(saved);
    }

    @Transactional(readOnly = true)
    public List<FlashcardDto> getFlashcardsBySet(Long setId)
    {
        findSetOrThrow(setId);
        return flashcardDao.findBySetId(setId)
                .stream()
                .map(this::toFlashcardDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public FlashcardDto getFlashcardById(Long flashcardId)
    {
        Flashcard flashcard = findFlashcardOrThrow(flashcardId);
        return toFlashcardDto(flashcard);
    }

    @Transactional
    public FlashcardDto updateFlashcard(Long studentId, Long flashcardId, UpdateFlashcardRequest request)
    {
        Flashcard flashcard = findFlashcardOrThrow(flashcardId);
        FlashcardSet set = findSetOrThrow(flashcard.getSetId());
        verifySetOwnership(set, studentId);

        flashcard.setFrontText(request.getFrontText());
        flashcard.setBackText(request.getBackText());

        Flashcard saved = flashcardDao.save(flashcard);
        return toFlashcardDto(saved);
    }

    @Transactional
    public void deleteFlashcard(Long studentId, Long flashcardId)
    {
        Flashcard flashcard = findFlashcardOrThrow(flashcardId);
        FlashcardSet set = findSetOrThrow(flashcard.getSetId());
        verifySetOwnership(set, studentId);
        flashcardDao.delete(flashcard);
    }


    @Transactional(readOnly = true)
    public FlashcardSetStatsDto getSetStats(Long studentId, Long setId)
    {
        findSetOrThrow(setId);

        List<Flashcard> allCards = flashcardDao.findBySetId(setId);

        if (allCards.isEmpty())
        {
            FlashcardSetStatsDto dto = new FlashcardSetStatsDto();
            dto.setSetId(setId);
            dto.setTotalCards(0);
            dto.setNewCards(0);
            dto.setLearningCards(0);
            dto.setMatureCards(0);
            dto.setDueToday(0);
            dto.setAverageEasinessFactor(new BigDecimal("2.5"));
            return dto;
        }

        List<Long> allCardIds = allCards.stream()
                .map(Flashcard::getId)
                .toList();

        List<FlashcardProgress> existingProgress = flashcardProgressDao
                .findByStudentIdAndFlashcardIdIn(studentId, allCardIds);

        LocalDateTime now = LocalDateTime.now();

        int totalCards = allCards.size();
        int newCards = totalCards - existingProgress.size();
        int learningCards = (int) existingProgress.stream()
                .filter(p -> p.getIntervalDays() < 21)
                .count();

        int matureCards   = (int) existingProgress.stream()
                .filter(p -> p.getIntervalDays() >= 21)
                .count();

        int dueFromExisting = (int) existingProgress.stream()
                .filter(p -> p.getNextReviewAt() != null && !p.getNextReviewAt().isAfter(now))
                .count();

        int dueToday = dueFromExisting + newCards;

        BigDecimal averageEF = existingProgress.isEmpty()
                ? new BigDecimal("2.5")
                : existingProgress.stream()
                .map(FlashcardProgress::getEasinessFactor)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .divide(new BigDecimal(existingProgress.size()), 2, java.math.RoundingMode.HALF_UP);

        FlashcardSetStatsDto dto = new FlashcardSetStatsDto();
        dto.setSetId(setId);
        dto.setTotalCards(totalCards);
        dto.setNewCards(newCards);
        dto.setLearningCards(learningCards);
        dto.setMatureCards(matureCards);
        dto.setDueToday(dueToday);
        dto.setAverageEasinessFactor(averageEF);
        return dto;
    }


    @Transactional(readOnly = true)
    public TotalDueStatsDto getTotalDueStats(Long studentId)
    {
        List<FlashcardSet> allSets = flashcardSetDao.findByStudentIdOrderByIdDesc(studentId);

        if (allSets.isEmpty())
        {
            TotalDueStatsDto empty = new TotalDueStatsDto();
            empty.setTotalDue(0);
            empty.setBySet(List.of());
            return empty;
        }

        List<Long> allSetIds = allSets.stream().map(FlashcardSet::getId).toList();
        List<Flashcard> allCards = flashcardDao.findBySetIdIn(allSetIds);

        Map<Long, List<Long>> cardIdsBySetId = allCards.stream()
                .collect(Collectors.groupingBy(
                        Flashcard::getSetId,
                        Collectors.mapping(Flashcard::getId, Collectors.toList())
                ));

        List<Long> allCardIds = allCards.stream().map(Flashcard::getId).toList();
        List<FlashcardProgress> allProgress = allCardIds.isEmpty()
                ? List.of()
                : flashcardProgressDao.findByStudentIdAndFlashcardIdIn(studentId, allCardIds);

        Set<Long> seenCardIds = allProgress.stream()
                .map(FlashcardProgress::getFlashcardId)
                .collect(Collectors.toSet());

        LocalDateTime now = LocalDateTime.now();
        Set<Long> dueCardIds = allProgress.stream()
                .filter(p -> p.getNextReviewAt() != null && !p.getNextReviewAt().isAfter(now))
                .map(FlashcardProgress::getFlashcardId)
                .collect(Collectors.toSet());

        List<DueCountBySetDto> bySet = allSets.stream()
                .map(set -> {
                    List<Long> cardIds = cardIdsBySetId.getOrDefault(set.getId(), List.of());
                    int newCards        = (int) cardIds.stream().filter(id -> !seenCardIds.contains(id)).count();
                    int dueFromExisting = (int) cardIds.stream().filter(dueCardIds::contains).count();
                    int dueCount        = newCards + dueFromExisting;

                    DueCountBySetDto dto = new DueCountBySetDto();
                    dto.setSetId(set.getId());
                    dto.setSetTitle(set.getTitle());
                    dto.setDueCount(dueCount);
                    return dto;
                })
                .filter(dto -> dto.getDueCount() > 0)
                .toList();

        int totalDue = bySet.stream().mapToInt(DueCountBySetDto::getDueCount).sum();

        TotalDueStatsDto result = new TotalDueStatsDto();
        result.setTotalDue(totalDue);
        result.setBySet(bySet);
        return result;
    }




    private void verifyStudentAccess(Long userId, Long studentId)
    {
        if (!userId.equals(studentId))
        {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Access denied: you cannot access other students cards.");
        }
    }

    private FlashcardSet findSetOrThrow(Long setId)
    {
        return flashcardSetDao.findById(setId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Set with it " + setId + " does not exist."));
    }

    private Flashcard findFlashcardOrThrow(Long flashcardId)
    {
        return flashcardDao.findById(flashcardId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Flashcard with id " + flashcardId + " does not exist."));
    }

    private void verifySetOwnership(FlashcardSet set, Long studentId)
    {
        if (!set.getStudentId().equals(studentId))
        {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Student " + studentId + " does not have access to the set with ID " + set.getId());
        }
    }

    private FlashcardSetDto toSetDto(FlashcardSet set)
    {
        FlashcardSetDto dto = new FlashcardSetDto();
        dto.setId(set.getId());
        dto.setStudentId(set.getStudentId());
        dto.setTitle(set.getTitle());
        dto.setDescription(set.getDescription());
        dto.setCardCount(set.getFlashcards().size());
        return dto;
    }

    private FlashcardDto toFlashcardDto(Flashcard flashcard)
    {
        FlashcardDto dto = new FlashcardDto();
        dto.setId(flashcard.getId());
        dto.setSetId(flashcard.getSetId());
        dto.setFrontText(flashcard.getFrontText());
        dto.setBackText(flashcard.getBackText());
        return dto;
    }
}