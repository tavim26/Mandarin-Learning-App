package com.chineselearning.flashcardservice.repository;

import com.chineselearning.flashcardservice.domain.Flashcard;
import com.chineselearning.flashcardservice.domain.dao.IFlashcardDao;
import com.chineselearning.flashcardservice.repository.entities.FlashcardEntity;
import com.chineselearning.flashcardservice.repository.entities.FlashcardSetEntity;
import com.chineselearning.flashcardservice.repository.jpa.FlashcardJpaRepository;
import com.chineselearning.flashcardservice.repository.jpa.FlashcardSetJpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public class FlashcardDao implements IFlashcardDao
{

    private final FlashcardJpaRepository flashcardJpaRepository;
    private final FlashcardSetJpaRepository flashcardSetJpaRepository;

    public FlashcardDao(FlashcardJpaRepository flashcardJpaRepository, FlashcardSetJpaRepository flashcardSetJpaRepository) {
        this.flashcardJpaRepository = flashcardJpaRepository;
        this.flashcardSetJpaRepository = flashcardSetJpaRepository;
    }

    @Override
    public Flashcard save(Flashcard flashcard)
    {
        FlashcardEntity entity = toEntity(flashcard);
        FlashcardEntity saved = flashcardJpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public Optional<Flashcard> findById(Long id)
    {
        return flashcardJpaRepository.findById(id)
                .map(this::toDomain);
    }

    @Override
    public List<Flashcard> findBySetId(Long setId)
    {
        return flashcardJpaRepository.findBySetId(setId)
                .stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public void delete(Flashcard flashcard)
    {
        flashcardJpaRepository.deleteById(flashcard.getId());
    }



    // Conversie domain -> entity
    private FlashcardEntity toEntity(Flashcard domain)
    {
        FlashcardEntity entity = new FlashcardEntity();
        entity.setId(domain.getId());
        entity.setFrontText(domain.getFrontText());
        entity.setBackText(domain.getBackText());

        FlashcardSetEntity setEntity = flashcardSetJpaRepository.findById(domain.getSetId())
                .orElseThrow(() -> new RuntimeException("Setul cu id " + domain.getSetId() + " nu exista"));
        entity.setSet(setEntity);

        return entity;
    }

    // Conversie entity -> domain
    private Flashcard toDomain(FlashcardEntity entity)
    {
        Flashcard domain = new Flashcard();
        domain.setId(entity.getId());
        domain.setSetId(entity.getSet().getId());
        domain.setFrontText(entity.getFrontText());
        domain.setBackText(entity.getBackText());
        return domain;
    }
}