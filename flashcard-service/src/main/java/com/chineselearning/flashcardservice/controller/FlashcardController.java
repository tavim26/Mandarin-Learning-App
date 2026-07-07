package com.chineselearning.flashcardservice.controller;

import com.chineselearning.flashcardservice.domain.dto.*;

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



    @Operation(
            summary = "Creare set nou",
            description = "Creeaza un set nou de flashcard-uri pentru studentul autentificat."
    )
    @PostMapping("/sets")
    public ResponseEntity<FlashcardSetDto> createSet(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody CreateFlashcardSetRequest request)
    {
        FlashcardSetDto created = flashcardSetService.createSet(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }



    @Operation(
            summary = "Seturi ale unui student",
            description = "Returneaza toate seturile de flashcard-uri apartinand unui student, ordonate descrescator dupa id."
    )
    @GetMapping("/sets/student/{studentId}")
    public ResponseEntity<List<FlashcardSetDto>> getSetsByStudent(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long studentId)
    {
        List<FlashcardSetDto> sets = flashcardSetService.getSetsByStudent(userId, studentId);
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
            description = "Modifica titlul si descrierea unui set existent. Operatia este permisa doar proprietarului setului."
    )
    @PutMapping("/sets/{setId}")
    public ResponseEntity<FlashcardSetDto> updateSet(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long setId,
            @Valid @RequestBody UpdateFlashcardSetRequest request)
    {
        FlashcardSetDto updated = flashcardSetService.updateSet(userId, setId, request);
        return ResponseEntity.ok(updated);
    }

    @Operation(
            summary = "Stergere set",
            description = "Sterge un set si toate flashcard-urile din el. Operatia este permisa doar proprietarului setului."
    )
    @DeleteMapping("/sets/{setId}")
    public ResponseEntity<Void> deleteSet(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long setId)
    {
        flashcardSetService.deleteSet(userId, setId);
        return ResponseEntity.noContent().build();
    }




    // FLASHCARD-URI INDIVIDUALE

    @Operation(
            summary = "Adaugare flashcard",
            description = "Adauga un flashcard nou intr-un set existent. Operatia este permisa doar proprietarului setului."
    )
    @PostMapping("/cards")
    public ResponseEntity<FlashcardDto> createFlashcard(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody CreateFlashcardRequest request)
    {
        FlashcardDto created = flashcardSetService.createFlashcard(userId, request);
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
            description = "Modifica textul fetei si al versoului unui flashcard existent. Operatia este permisa doar proprietarului setului."
    )
    @PutMapping("/cards/{flashcardId}")
    public ResponseEntity<FlashcardDto> updateFlashcard(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long flashcardId,
            @Valid @RequestBody UpdateFlashcardRequest request)
    {
        FlashcardDto updated = flashcardSetService.updateFlashcard(userId, flashcardId, request);
        return ResponseEntity.ok(updated);
    }




    @Operation(
            summary = "Stergere flashcard",
            description = "Sterge un flashcard dupa id. Operatia este permisa doar proprietarului setului."
    )
    @DeleteMapping("/cards/{flashcardId}")
    public ResponseEntity<Void> deleteFlashcard(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long flashcardId)
    {
        flashcardSetService.deleteFlashcard(userId, flashcardId);
        return ResponseEntity.noContent().build();
    }





    @Operation(
            summary = "Statistici set",
            description = "Returneaza distributia cardurilor dintr-un set per categorie SM-2: " +
                    "new, learning, mature, scadente azi si easiness factor mediu."
    )
    @GetMapping("/sets/{setId}/stats")
    public ResponseEntity<FlashcardSetStatsDto> getSetStats(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long setId)
    {
        FlashcardSetStatsDto stats = flashcardSetService.getSetStats(userId, setId);
        return ResponseEntity.ok(stats);
    }


    @Operation(
            summary = "Total carduri scadente — toate seturile",
            description = "Returneaza numarul total de carduri scadente azi pentru studentul autentificat, " +
                    "detaliat per set. Include carduri nevazute niciodata si carduri cu nextReviewAt <= now. " +
                    "Seturile fara carduri scadente sunt excluse din raspuns."
    )
    @GetMapping("/reviews/due/all")
    public ResponseEntity<TotalDueStatsDto> getTotalDueStats(
            @RequestHeader("X-User-Id") Long userId)
    {
        TotalDueStatsDto stats = flashcardSetService.getTotalDueStats(userId);
        return ResponseEntity.ok(stats);
    }




    // RECENZII SI PROGRES SM-2

    @Operation(
            summary = "Trimitere recenzie",
            description = "Inregistreaza scorul de calitate (0-5) al studentului pentru un flashcard. " +
                    "Ruleaza algoritmul SM-2 si returneaza recenzia salvata impreuna cu starea SM-2 actualizata."
    )
    @PostMapping("/reviews")
    public ResponseEntity<ReviewResultDto> submitReview(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody SubmitReviewRequest request)
    {
        ReviewResultDto result = reviewService.submitReview(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }




    @Operation(
            summary = "Carduri scadente pentru recenzie",
            description = "Returneaza toate flashcard-urile unui student pentru care next_review_at este in trecut, " +
                    "precum si cardurile care nu au fost niciodata recenzate."
    )
    @GetMapping("/reviews/due/{studentId}")
    public ResponseEntity<List<FlashcardProgressDto>> getDueFlashcards(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long studentId,
            @RequestParam Long setId)
    {
        List<FlashcardProgressDto> due = reviewService.getDueFlashcards(userId, studentId, setId);
        return ResponseEntity.ok(due);
    }




    @Operation(
            summary = "Istoric recenzii",
            description = "Returneaza istoricul complet al recenziilor unui student pentru un flashcard specific, " +
                    "ordonat cronologic ascendent."
    )
    @GetMapping("/reviews/history/{studentId}/{flashcardId}")
    public ResponseEntity<List<FlashcardReviewDto>> getReviewHistory(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long studentId,
            @PathVariable Long flashcardId)
    {
        List<FlashcardReviewDto> history = reviewService.getReviewHistory(userId, studentId, flashcardId);
        return ResponseEntity.ok(history);
    }




    @Operation(
            summary = "Stare SM-2 curenta",
            description = "Returneaza starea curenta a algoritmului SM-2 pentru un student si un flashcard specific. " +
                    "Contine easiness factor, interval curent si data urmatoarei recenzii."
    )
    @GetMapping("/reviews/progress/{studentId}/{flashcardId}")
    public ResponseEntity<FlashcardProgressDto> getProgress(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long studentId,
            @PathVariable Long flashcardId)
    {
        FlashcardProgressDto progress = reviewService.getProgress(userId, studentId, flashcardId);
        return ResponseEntity.ok(progress);
    }
}