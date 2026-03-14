package com.chineselearning.flashcardservice.service;

import com.chineselearning.flashcardservice.domain.Flashcard;
import com.chineselearning.flashcardservice.domain.FlashcardSet;

import com.chineselearning.flashcardservice.domain.dao.IFlashcardDao;
import com.chineselearning.flashcardservice.domain.dao.IFlashcardSetDao;

import com.chineselearning.flashcardservice.domain.dto.CreateFlashcardRequest;
import com.chineselearning.flashcardservice.domain.dto.CreateFlashcardSetRequest;
import com.chineselearning.flashcardservice.domain.dto.FlashcardDto;
import com.chineselearning.flashcardservice.domain.dto.FlashcardSetDto;
import com.chineselearning.flashcardservice.domain.dto.UpdateFlashcardRequest;
import com.chineselearning.flashcardservice.domain.dto.UpdateFlashcardSetRequest;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class FlashcardSetService
{

    private final IFlashcardSetDao flashcardSetDao;
    private final IFlashcardDao flashcardDao;

    public FlashcardSetService(IFlashcardSetDao flashcardSetDao, IFlashcardDao flashcardDao)
    {
        this.flashcardSetDao = flashcardSetDao;
        this.flashcardDao = flashcardDao;
    }

    // OPERATII PE SETURI

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
    public List<FlashcardSetDto> getSetsByStudent(Long studentId)
    {
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




    // OPERATII PE FLASHCARD-URI

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



    // METODE HELPER

    private FlashcardSet findSetOrThrow(Long setId)
    {
        return flashcardSetDao.findById(setId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Setul cu id " + setId + " nu exista"));
    }

    private Flashcard findFlashcardOrThrow(Long flashcardId)
    {
        return flashcardDao.findById(flashcardId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Flashcard-ul cu id " + flashcardId + " nu exista"));
    }

    private void verifySetOwnership(FlashcardSet set, Long studentId)
    {
        if (!set.getStudentId().equals(studentId))
        {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN, "Studentul " + studentId + " nu are acces la setul " + set.getId());
        }
    }

    private FlashcardSetDto toSetDto(FlashcardSet set)
    {
        FlashcardSetDto dto = new FlashcardSetDto();
        dto.setId(set.getId());
        dto.setStudentId(set.getStudentId());
        dto.setTitle(set.getTitle());
        dto.setDescription(set.getDescription());
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