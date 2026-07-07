package com.chineselearning.contentservice.controller;

import com.chineselearning.contentservice.domain.dto.*;
import com.chineselearning.contentservice.service.ContentService;
import com.chineselearning.contentservice.service.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

// http://localhost:8081/swagger-ui/index.html

@RestController
@RequestMapping("/api/content")
@Tag(name = "Content Service API")
public class ContentController
{

    private final ContentService contentService;
    private final StorageService storageService;

    public ContentController(ContentService contentService, StorageService storageService)
    {
        this.contentService = contentService;
        this.storageService = storageService;
    }



    @Operation(summary = "Get all course units", description = "Returns all course units, optionally filtered by HSK level.")
    @GetMapping("/units")
    public ResponseEntity<List<CourseUnitDto>> getAllUnits(@RequestParam(required = false) Integer hskLevel)
    {
        return ResponseEntity.ok(contentService.getAllCourseUnits(hskLevel));
    }

    @Operation(summary = "Get a course unit", description = "Returns the details of a course unit by its ID.")
    @GetMapping("/units/{id}")
    public ResponseEntity<CourseUnitDto> getUnit(@PathVariable Long id)
    {
        try {
            return ResponseEntity.ok(contentService.getCourseUnit(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Get a course unit with lessons", description = "Returns the unit along with all its associated lessons.")
    @GetMapping("/units/{id}/full")
    public ResponseEntity<CourseUnitFullDto> getUnitFull(@PathVariable Long id)
    {
        try {
            return ResponseEntity.ok(contentService.getCourseUnitFull(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Create a course unit", description = "Adds a new module to the course structure.")
    @PostMapping("/units")
    public ResponseEntity<CourseUnitDto> createUnit(
            @Valid @RequestBody CourseUnitDto dto, @RequestHeader("X-User-Id") Long teacherId)
    {
        return ResponseEntity.status(201).body(contentService.createCourseUnit(dto, teacherId));
    }

    @Operation(summary = "Update a course unit", description = "Updates the details of an existing course unit.")
    @PutMapping("/units/{id}")
    public ResponseEntity<CourseUnitDto> updateUnit(@PathVariable Long id, @Valid @RequestBody CourseUnitDto dto)
    {
        try {
            return ResponseEntity.ok(contentService.updateCourseUnit(id, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Delete a course unit", description = "Deletes the unit and all its associated lessons.")
    @DeleteMapping("/units/{id}")
    public ResponseEntity<Void> deleteUnit(@PathVariable Long id)
    {
        try {
            contentService.deleteCourseUnit(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Get units by teacher", description = "Returns all course units created by a specific teacher.")
    @GetMapping("/units/teacher/{teacherId}")
    public ResponseEntity<List<CourseUnitDto>> getUnitsByTeacher(@PathVariable Long teacherId)
    {
        return ResponseEntity.ok(contentService.getCourseUnitsByTeacher(teacherId));
    }



    @Operation(summary = "Get lessons by unit", description = "Returns all lessons belonging to a specific unit, ordered by index.")
    @GetMapping("/units/{unitId}/lessons")
    public ResponseEntity<List<LessonDto>> getLessonsByUnit(@PathVariable Long unitId)
    {
        return ResponseEntity.ok(contentService.getLessonsByUnitId(unitId));
    }

    @Operation(summary = "Get a lesson", description = "Returns the full details of a lesson, including its exercises.")
    @GetMapping("/lessons/{id}")
    public ResponseEntity<LessonDto> getLesson(@PathVariable Long id)
    {
        try {
            return ResponseEntity.ok(contentService.getLesson(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Create a lesson", description = "Adds a new lesson to an existing unit.")
    @PostMapping("/lessons")
    public ResponseEntity<LessonDto> createLesson(@Valid @RequestBody LessonDto dto)
    {
        try {
            return ResponseEntity.status(201).body(contentService.createLesson(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Update a lesson", description = "Updates the content of an existing lesson.")
    @PutMapping("/lessons/{id}")
    public ResponseEntity<LessonDto> updateLesson(@PathVariable Long id, @Valid @RequestBody LessonDto dto)
    {
        try {
            return ResponseEntity.ok(contentService.updateLesson(id, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Delete a lesson", description = "Deletes the lesson and all its associated exercises and materials.")
    @DeleteMapping("/lessons/{id}")
    public ResponseEntity<Void> deleteLesson(@PathVariable Long id)
    {
        try {
            contentService.deleteLesson(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }



    @Operation(summary = "Get lesson materials", description = "Returns all resources attached to a specific lesson.")
    @GetMapping("/lessons/{lessonId}/materials")
    public ResponseEntity<List<LessonMaterialDto>> getMaterials(@PathVariable Long lessonId)
    {
        return ResponseEntity.ok(contentService.getMaterialsForLesson(lessonId));
    }

    @Operation(summary = "Add a material", description = "Attaches a new resource to a lesson.")
    @PostMapping("/materials")
    public ResponseEntity<LessonMaterialDto> addMaterial(@Valid @RequestBody LessonMaterialDto dto)
    {
        try {
            return ResponseEntity.status(201).body(contentService.addLessonMaterial(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Delete a material", description = "Deletes the material record and its associated file from disk, if any.")
    @DeleteMapping("/materials/{id}")
    public ResponseEntity<Void> deleteMaterial(@PathVariable Long id)
    {
        try {
            contentService.deleteLessonMaterial(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Upload a file", description = "Uploads a file to the server and returns its access URL. Accepted types: JPEG, PNG, GIF, PDF, DOC, DOCX, MP3, WAV, MP4. Maximum size: 50MB.")
    @PostMapping("/materials/upload")
    public ResponseEntity<String> uploadFile(@RequestParam("file") MultipartFile file)
    {
        try {
            String url = storageService.upload(file);
            return ResponseEntity.status(201).body(url);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        } catch (IOException e) {
            return ResponseEntity.status(500).build();
        }
    }

    @Operation(summary = "Serve a file", description = "Returns the binary content of a previously uploaded file, identified by its name.")
    @GetMapping("/files/{fileName}")
    public ResponseEntity<byte[]> serveFile(@PathVariable String fileName)
    {
        try {
            byte[] fileBytes = storageService.loadFile(fileName);
            String contentType = storageService.getContentType(fileName);
            return ResponseEntity.ok()
                    .header("Content-Type", contentType)
                    .body(fileBytes);
        } catch (IOException e) {
            return ResponseEntity.notFound().build();
        }
    }



    @Operation(summary = "Get an exercise", description = "Returns the details of an exercise by its ID.")
    @GetMapping("/exercises/{id}")
    public ResponseEntity<ExerciseDto> getExercise(@PathVariable Long id)
    {
        try {
            return ResponseEntity.ok(contentService.getExercise(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Get exercises by lesson", description = "Returns all exercises associated with a specific lesson.")
    @GetMapping("/lessons/{lessonId}/exercises")
    public ResponseEntity<List<ExerciseDto>> getExercises(@PathVariable Long lessonId)
    {
        return ResponseEntity.ok(contentService.getExercisesForLesson(lessonId));
    }

    @Operation(summary = "Add an exercise", description = "Creates a new exercise and attaches it to a lesson.")
    @PostMapping("/exercises")
    public ResponseEntity<ExerciseDto> addExercise(@Valid @RequestBody ExerciseDto dto)
    {
        try {
            return ResponseEntity.status(201).body(contentService.addExercise(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Update an exercise", description = "Updates the content of an existing exercise.")
    @PutMapping("/exercises/{id}")
    public ResponseEntity<ExerciseDto> updateExercise(@PathVariable Long id, @Valid @RequestBody ExerciseDto dto)
    {
        try {
            return ResponseEntity.ok(contentService.updateExercise(id, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Delete an exercise", description = "Deletes an exercise from its associated lesson.")
    @DeleteMapping("/exercises/{id}")
    public ResponseEntity<Void> deleteExercise(@PathVariable Long id)
    {
        try {
            contentService.deleteExercise(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }



    @Operation(summary = "Get unit XP stats", description = "Returns the total XP earned across all lessons in a unit.")
    @GetMapping("/units/{id}/stats/xp")
    public ResponseEntity<UnitXpStatsDto> getUnitXpStats(@PathVariable Long id)
    {
        try {
            return ResponseEntity.ok(contentService.getUnitXpStats(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Get unit lesson count", description = "Returns the total number of lessons in a unit.")
    @GetMapping("/units/{id}/stats/lessons")
    public ResponseEntity<UnitLessonCountDto> getUnitLessonCount(@PathVariable Long id)
    {
        try {
            return ResponseEntity.ok(contentService.getUnitLessonCount(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Get exercise type distribution", description = "Returns the count of exercises grouped by type, useful for rendering a pie chart.")
    @GetMapping("/lessons/{id}/stats/exercise-types")
    public ResponseEntity<LessonExerciseTypesDto> getLessonExerciseTypes(@PathVariable Long id)
    {
        try {
            return ResponseEntity.ok(contentService.getLessonExerciseTypes(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}