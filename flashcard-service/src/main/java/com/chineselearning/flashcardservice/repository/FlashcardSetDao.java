package com.chineselearning.flashcardservice.repository;

import com.chineselearning.flashcardservice.domain.Flashcard;
import com.chineselearning.flashcardservice.domain.FlashcardSet;
import com.chineselearning.flashcardservice.domain.dao.IFlashcardSetDao;
import com.chineselearning.flashcardservice.repository.entities.FlashcardEntity;
import com.chineselearning.flashcardservice.repository.entities.FlashcardSetEntity;
import com.chineselearning.flashcardservice.repository.jpa.FlashcardSetJpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Repository
public class FlashcardSetDao implements IFlashcardSetDao
{

    private final FlashcardSetJpaRepository flashcardSetJpaRepository;

    public FlashcardSetDao(FlashcardSetJpaRepository flashcardSetJpaRepository)
    {
        this.flashcardSetJpaRepository = flashcardSetJpaRepository;
    }

    @Override
    public FlashcardSet save(FlashcardSet flashcardSet)
    {
        FlashcardSetEntity entity = toEntity(flashcardSet);
        FlashcardSetEntity saved = flashcardSetJpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    @Transactional
    public Optional<FlashcardSet> findById(Long id)
    {
        return flashcardSetJpaRepository.findById(id)
                .map(this::toDomain);
    }

    @Override
    @Transactional
    public List<FlashcardSet> findByStudentIdOrderByIdDesc(Long studentId)
    {
        return flashcardSetJpaRepository.findByStudentIdOrderByIdDesc(studentId)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public void delete(FlashcardSet flashcardSet)
    {
        flashcardSetJpaRepository.deleteById(flashcardSet.getId());
    }


    private FlashcardSetEntity toEntity(FlashcardSet domain)
    {
        FlashcardSetEntity entity = domain.getId() != null
                ? flashcardSetJpaRepository.findById(domain.getId())
                .orElse(new FlashcardSetEntity())
                : new FlashcardSetEntity();

        entity.setId(domain.getId());
        entity.setStudentId(domain.getStudentId());
        entity.setTitle(domain.getTitle());
        entity.setDescription(domain.getDescription());
        return entity;
    }

    private FlashcardSet toDomain(FlashcardSetEntity entity)
    {
        FlashcardSet domain = new FlashcardSet();
        domain.setId(entity.getId());
        domain.setStudentId(entity.getStudentId());
        domain.setTitle(entity.getTitle());
        domain.setDescription(entity.getDescription());

        List<Flashcard> flashcards = entity.getFlashcards()
                .stream()
                .map(this::flashcardToDomain)
                .toList();
        domain.setFlashcards(flashcards);

        return domain;
    }

    private Flashcard flashcardToDomain(FlashcardEntity entity) {
        Flashcard domain = new Flashcard();
        domain.setId(entity.getId());
        domain.setSetId(entity.getSet().getId());
        domain.setFrontText(entity.getFrontText());
        domain.setBackText(entity.getBackText());
        return domain;
    }
}