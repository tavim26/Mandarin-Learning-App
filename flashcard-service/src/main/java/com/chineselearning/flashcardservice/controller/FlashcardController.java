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
@Tag(name = "Flashcard Service", description = "Management of flashcard sets, individual cards, and SM-2 reviews")
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
            summary = "Create new set",
            description = "Creates a new flashcard set for the authenticated student."
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
            summary = "Sets belonging to a student",
            description = "Returns all flashcard sets belonging to a student, ordered descending by id."
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
            summary = "Get set by id",
            description = "Returns the details of a flashcard set identified by id."
    )
    @GetMapping("/sets/{setId}")
    public ResponseEntity<FlashcardSetDto> getSetById(@PathVariable Long setId)
    {
        FlashcardSetDto set = flashcardSetService.getSetById(setId);
        return ResponseEntity.ok(set);
    }




    @Operation(
            summary = "Update set",
            description = "Modifies the title and description of an existing set. This operation is only allowed for the owner of the set."
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
            summary = "Delete set",
            description = "Deletes a set and all flashcards within it. This operation is only allowed for the owner of the set."
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
            summary = "Add flashcard",
            description = "Adds a new flashcard to an existing set. This operation is only allowed for the owner of the set."
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
            summary = "Cards belonging to a set",
            description = "Returns the list of all flashcards within a set identified by id."
    )
    @GetMapping("/sets/{setId}/cards")
    public ResponseEntity<List<FlashcardDto>> getFlashcardsBySet(@PathVariable Long setId)
    {
        List<FlashcardDto> flashcards = flashcardSetService.getFlashcardsBySet(setId);
        return ResponseEntity.ok(flashcards);
    }



    @Operation(
            summary = "Get flashcard by id",
            description = "Returns the details of an individual flashcard identified by id."
    )
    @GetMapping("/cards/{flashcardId}")
    public ResponseEntity<FlashcardDto> getFlashcardById(@PathVariable Long flashcardId)
    {
        FlashcardDto flashcard = flashcardSetService.getFlashcardById(flashcardId);
        return ResponseEntity.ok(flashcard);
    }



    @Operation(
            summary = "Update flashcard",
            description = "Modifies the front and back text of an existing flashcard. This operation is only allowed for the owner of the set."
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
            summary = "Delete flashcard",
            description = "Deletes a flashcard by id. This operation is only allowed for the owner of the set."
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
            summary = "Set statistics",
            description = "Returns the distribution of cards within a set per SM-2 category: " +
                    "new, learning, mature, due today, and average easiness factor."
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
            summary = "Total due cards — all sets",
            description = "Returns the total number of cards due today for the authenticated student, " +
                    "broken down per set. Includes cards never seen before and cards with nextReviewAt <= now. " +
                    "Sets with no due cards are excluded from the response."
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
            summary = "Submit review",
            description = "Records the student's quality score (0-5) for a flashcard. " +
                    "Runs the SM-2 algorithm and returns the saved review together with the updated SM-2 state."
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
            summary = "Cards due for review",
            description = "Returns all of a student's flashcards for which next_review_at is in the past, " +
                    "as well as cards that have never been reviewed."
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
            summary = "Review history",
            description = "Returns the complete review history of a student for a specific flashcard, " +
                    "ordered chronologically ascending."
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
            summary = "Current SM-2 state",
            description = "Returns the current SM-2 algorithm state for a specific student and flashcard. " +
                    "Contains the easiness factor, current interval, and the date of the next review."
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