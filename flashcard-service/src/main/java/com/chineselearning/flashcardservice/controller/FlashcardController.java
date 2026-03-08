package com.chineselearning.flashcardservice.controller;

import com.chineselearning.flashcardservice.domain.dto.CreateFlashcardRequest;
import com.chineselearning.flashcardservice.domain.dto.CreateFlashcardSetRequest;
import com.chineselearning.flashcardservice.domain.dto.FlashcardDto;
import com.chineselearning.flashcardservice.domain.dto.FlashcardProgressDto;
import com.chineselearning.flashcardservice.domain.dto.FlashcardReviewDto;
import com.chineselearning.flashcardservice.domain.dto.FlashcardSetDto;
import com.chineselearning.flashcardservice.domain.dto.ReviewResultDto;
import com.chineselearning.flashcardservice.domain.dto.SubmitReviewRequest;
import com.chineselearning.flashcardservice.domain.dto.UpdateFlashcardRequest;
import com.chineselearning.flashcardservice.domain.dto.UpdateFlashcardSetRequest;

import com.chineselearning.flashcardservice.service.FlashcardSetService;
import com.chineselearning.flashcardservice.service.ReviewService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;


// http://localhost:8086/swagger-ui/index.html

@RestController
@RequestMapping("/api/flashcards")
@Tag(name = "Flashcard Service", description = "Gestionarea seturilor de flashcard-uri, a cardurilor individuale si a recenziilor SM-2")
public class FlashcardController
{

    private final FlashcardSetService flashcardSetService;
    private final ReviewService reviewService;

    public FlashcardController(FlashcardSetService flashcardSetService, ReviewService reviewService)
    {
        this.flashcardSetService = flashcardSetService;
        this.reviewService = reviewService;
    }

    // SETURI DE FLASHCARD-URI

    @Operation(
            summary = "Creare set nou",
            description = "Creeaza un set nou de flashcard-uri pentru un student. Setul este initial gol."
    )
    @PostMapping("/sets")
    public ResponseEntity<FlashcardSetDto> createSet(@Valid @RequestBody CreateFlashcardSetRequest request)
    {
        FlashcardSetDto created = flashcardSetService.createSet(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @Operation(
            summary = "Seturi ale unui student",
            description = "Returneaza toate seturile de flashcard-uri apartinand unui student, ordonate descrescator dupa id."
    )
    @GetMapping("/sets/student/{studentId}")
    public ResponseEntity<List<FlashcardSetDto>> getSetsByStudent(@PathVariable Long studentId)
    {
        List<FlashcardSetDto> sets = flashcardSetService.getSetsByStudent(studentId);
        return ResponseEntity.ok(sets);
    }

    @Operation(
            summary = "Obtinere set dupa id",
            description = "Returneaza detaliile unui set de flashcard-uri identificat prin id."
    )
    @GetMapping("/sets/{setId}")
    public ResponseEntity<FlashcardSetDto> getSetById(@PathVariable Long setId)
    {
        FlashcardSetDto set = flashcardSetService.getSetById(setId);
        return ResponseEntity.ok(set);
    }

    @Operation(
            summary = "Actualizare set",
            description = "Modifica titlul si descrierea unui set existent. Nu afecteaza cardurile din set."
    )
    @PutMapping("/sets/{setId}")
    public ResponseEntity<FlashcardSetDto> updateSet(@PathVariable Long setId, @Valid @RequestBody UpdateFlashcardSetRequest request)
    {
        FlashcardSetDto updated = flashcardSetService.updateSet(setId, request);
        return ResponseEntity.ok(updated);
    }

    @Operation(
            summary = "Stergere set",
            description = "Sterge un set si toate flashcard-urile din el. Operatia este ireversibila."
    )
    @DeleteMapping("/sets/{setId}")
    public ResponseEntity<Void> deleteSet(@PathVariable Long setId)
    {
        flashcardSetService.deleteSet(setId);
        return ResponseEntity.noContent().build();
    }




    // FLASHCARD-URI INDIVIDUALE

    @Operation(
            summary = "Adaugare flashcard",
            description = "Adauga un flashcard nou intr-un set existent. Sunt necesare textul fetei si al versoului."
    )
    @PostMapping("/cards")
    public ResponseEntity<FlashcardDto> createFlashcard(@Valid @RequestBody CreateFlashcardRequest request)
    {
        FlashcardDto created = flashcardSetService.createFlashcard(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @Operation(
            summary = "Cardurile unui set",
            description = "Returneaza lista tuturor flashcard-urilor dintr-un set identificat prin id."
    )
    @GetMapping("/sets/{setId}/cards")
    public ResponseEntity<List<FlashcardDto>> getFlashcardsBySet(@PathVariable Long setId)
    {
        List<FlashcardDto> flashcards = flashcardSetService.getFlashcardsBySet(setId);
        return ResponseEntity.ok(flashcards);
    }

    @Operation(
            summary = "Obtinere flashcard dupa id",
            description = "Returneaza detaliile unui flashcard individual identificat prin id."
    )
    @GetMapping("/cards/{flashcardId}")
    public ResponseEntity<FlashcardDto> getFlashcardById(@PathVariable Long flashcardId)
    {
        FlashcardDto flashcard = flashcardSetService.getFlashcardById(flashcardId);
        return ResponseEntity.ok(flashcard);
    }

    @Operation(
            summary = "Actualizare flashcard",
            description = "Modifica textul fetei si al versoului unui flashcard existent."
    )
    @PutMapping("/cards/{flashcardId}")
    public ResponseEntity<FlashcardDto> updateFlashcard(@PathVariable Long flashcardId, @Valid @RequestBody UpdateFlashcardRequest request)
    {
        FlashcardDto updated = flashcardSetService.updateFlashcard(flashcardId, request);
        return ResponseEntity.ok(updated);
    }

    @Operation(
            summary = "Stergere flashcard",
            description = "Sterge un flashcard dupa id. Operatia este ireversibila."
    )
    @DeleteMapping("/cards/{flashcardId}")
    public ResponseEntity<Void> deleteFlashcard(@PathVariable Long flashcardId)
    {
        flashcardSetService.deleteFlashcard(flashcardId);
        return ResponseEntity.noContent().build();
    }




    // RECENZII SI PROGRES SM-2

    @Operation(
            summary = "Trimitere recenzie",
            description = "Inregistreaza scorul de calitate (0-5) al studentului pentru un flashcard. " + "Ruleaza algoritmul SM-2 si returneaza recenzia salvata impreuna cu starea SM-2 actualizata."
    )
    @PostMapping("/reviews")
    public ResponseEntity<ReviewResultDto> submitReview(@Valid @RequestBody SubmitReviewRequest request)
    {
        ReviewResultDto result = reviewService.submitReview(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }

    @Operation(
            summary = "Carduri scadente pentru recenzie",
            description = "Returneaza toate flashcard-urile unui student pentru care next_review_at este in trecut. " + "Acestea sunt cardurile care trebuie recenzate in sesiunea curenta."
    )
    @GetMapping("/reviews/due/{studentId}")
    public ResponseEntity<List<FlashcardProgressDto>> getDueFlashcards(@PathVariable Long studentId)
    {
        List<FlashcardProgressDto> due = reviewService.getDueFlashcards(studentId);
        return ResponseEntity.ok(due);
    }

    @Operation(
            summary = "Istoric recenzii",
            description = "Returneaza istoricul complet al recenziilor unui student pentru un flashcard specific, " + "ordonat cronologic ascendent."
    )
    @GetMapping("/reviews/history/{studentId}/{flashcardId}")
    public ResponseEntity<List<FlashcardReviewDto>> getReviewHistory(@PathVariable Long studentId, @PathVariable Long flashcardId)
    {
        List<FlashcardReviewDto> history = reviewService.getReviewHistory(studentId, flashcardId);
        return ResponseEntity.ok(history);
    }

    @Operation(
            summary = "Stare SM-2 curenta",
            description = "Returneaza starea curenta a algoritmului SM-2 pentru un student si un flashcard specific. " + "Contine easiness factor, interval curent si data urmatoarei recenzii."
    )
    @GetMapping("/reviews/progress/{studentId}/{flashcardId}")
    public ResponseEntity<FlashcardProgressDto> getProgress(@PathVariable Long studentId, @PathVariable Long flashcardId)
    {
        FlashcardProgressDto progress = reviewService.getProgress(studentId, flashcardId);
        return ResponseEntity.ok(progress);
    }
}