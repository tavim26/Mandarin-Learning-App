package com.chineselearning.contentservice.controller;

import com.chineselearning.contentservice.domain.dto.*;

import com.chineselearning.contentservice.service.ContentService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

// http://localhost:8081/swagger-ui/index.html

@RestController
@RequestMapping("/api/content")
@Tag(name = "Content Service API")
public class ContentController {

    private final ContentService contentService;

    public ContentController(ContentService contentService) {
        this.contentService = contentService;
    }


    // 1. COURSE UNITS

    @Operation(summary = "Obtine toate unitatile", description = "Returneaza unitatile de curs, optional filtrate dupa nivelul HSK.")
    @GetMapping("/units")
    public ResponseEntity<List<CourseUnitDto>> getAllUnits(
            @RequestParam(required = false) Integer hskLevel) {
        return ResponseEntity.ok(contentService.getAllCourseUnits(hskLevel));
    }

    @Operation(summary = "Gaseste o unitate", description = "Returneaza detaliile unei unitati pe baza ID-ului.")
    @GetMapping("/units/{id}")
    public ResponseEntity<CourseUnitDto> getUnit(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(contentService.getCourseUnit(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Unitate completa cu lectii", description = "Returneaza unitatea cu toate lectiile asociate.")
    @GetMapping("/units/{id}/full")
    public ResponseEntity<CourseUnitFullDto> getUnitFull(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(contentService.getCourseUnitFull(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Creeaza o unitate noua", description = "Adauga un nou modul/capitol in structura cursului.")
    @PostMapping("/units")
    public ResponseEntity<CourseUnitDto> createUnit(@RequestBody CourseUnitDto dto) {
        if (dto.getTitle() == null || dto.getTitle().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (dto.getOrderIndex() == null) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.status(201).body(contentService.createCourseUnit(dto));
    }

    @Operation(summary = "Actualizeaza o unitate", description = "Modifica detaliile unei unitati existente.")
    @PutMapping("/units/{id}")
    public ResponseEntity<CourseUnitDto> updateUnit(@PathVariable Long id, @RequestBody CourseUnitDto dto) {
        if (dto.getTitle() == null || dto.getTitle().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            return ResponseEntity.ok(contentService.updateCourseUnit(id, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Sterge o unitate", description = "Sterge unitatea si toate lectiile asociate.")
    @DeleteMapping("/units/{id}")
    public ResponseEntity<Void> deleteUnit(@PathVariable Long id) {
        try {
            contentService.deleteCourseUnit(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }


    // 2. LESSONS

    @Operation(summary = "Lectiile unei unitati", description = "Obtine toate lectiile care apartin de un Unit ID specific.")
    @GetMapping("/units/{unitId}/lessons")
    public ResponseEntity<List<LessonDto>> getLessonsByUnit(@PathVariable Long unitId) {
        return ResponseEntity.ok(contentService.getLessonsByUnitId(unitId));
    }

    @Operation(summary = "Detalii lectie", description = "Returneaza detaliile complete ale unei lectii, inclusiv exercitiile.")
    @GetMapping("/lessons/{id}")
    public ResponseEntity<LessonDto> getLesson(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(contentService.getLesson(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Creeaza o lectie", description = "Adauga o lectie noua la o unitate existenta.")
    @PostMapping("/lessons")
    public ResponseEntity<LessonDto> createLesson(@RequestBody LessonDto dto) {
        if (dto.getUnitId() == null) {
            return ResponseEntity.badRequest().build();
        }
        if (dto.getTitle() == null || dto.getTitle().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (dto.getOrderIndex() == null) {
            return ResponseEntity.badRequest().build();
        }
        try {
            return ResponseEntity.status(201).body(contentService.createLesson(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Actualizeaza o lectie", description = "Modifica continutul unei lectii existente.")
    @PutMapping("/lessons/{id}")
    public ResponseEntity<LessonDto> updateLesson(@PathVariable Long id, @RequestBody LessonDto dto) {
        if (dto.getTitle() == null || dto.getTitle().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            return ResponseEntity.ok(contentService.updateLesson(id, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Sterge o lectie")
    @DeleteMapping("/lessons/{id}")
    public ResponseEntity<Void> deleteLesson(@PathVariable Long id) {
        try {
            contentService.deleteLesson(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }


    // 3. MATERIALS

    @Operation(summary = "Materialele unei lectii", description = "Lista de resurse pentru o lectie data.")
    @GetMapping("/lessons/{lessonId}/materials")
    public ResponseEntity<List<LessonMaterialDto>> getMaterials(@PathVariable Long lessonId) {
        return ResponseEntity.ok(contentService.getMaterialsForLesson(lessonId));
    }

    @Operation(summary = "Adauga material", description = "Ataseaza o resursa noua la o lectie.")
    @PostMapping("/materials")
    public ResponseEntity<LessonMaterialDto> addMaterial(@RequestBody LessonMaterialDto dto) {
        if (dto.getLessonId() == null) {
            return ResponseEntity.badRequest().build();
        }
        if (dto.getTitle() == null || dto.getTitle().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (dto.getUrl() == null || dto.getUrl().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            return ResponseEntity.status(201).body(contentService.addLessonMaterial(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Sterge un material")
    @DeleteMapping("/materials/{id}")
    public ResponseEntity<Void> deleteMaterial(@PathVariable Long id) {
        try {
            contentService.deleteLessonMaterial(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }


    // 4. EXERCISES

    @Operation(summary = "Gaseste un exercitiu", description = "Returneaza detaliile unui exercitiu pe baza ID-ului.")
    @GetMapping("/exercises/{id}")
    public ResponseEntity<ExerciseDto> getExercise(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(contentService.getExercise(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Exercitiile unei lectii", description = "Returneaza lista de exercitii asociate lectiei.")
    @GetMapping("/lessons/{lessonId}/exercises")
    public ResponseEntity<List<ExerciseDto>> getExercises(@PathVariable Long lessonId) {
        return ResponseEntity.ok(contentService.getExercisesForLesson(lessonId));
    }

    @Operation(summary = "Adauga exercitiu", description = "Creeaza un exercitiu nou.")
    @PostMapping("/exercises")
    public ResponseEntity<ExerciseDto> addExercise(@RequestBody ExerciseDto dto) {
        if (dto.getLessonId() == null) {
            return ResponseEntity.badRequest().build();
        }
        if (dto.getType() == null || dto.getType().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (dto.getPrompt() == null || dto.getPrompt().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            return ResponseEntity.status(201).body(contentService.addExercise(dto));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Actualizeaza exercitiu", description = "Modifica exercitiul.")
    @PutMapping("/exercises/{id}")
    public ResponseEntity<ExerciseDto> updateExercise(@PathVariable Long id, @RequestBody ExerciseDto dto) {
        if (dto.getType() == null || dto.getType().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (dto.getPrompt() == null || dto.getPrompt().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        try {
            return ResponseEntity.ok(contentService.updateExercise(id, dto));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @Operation(summary = "Sterge un exercitiu")
    @DeleteMapping("/exercises/{id}")
    public ResponseEntity<Void> deleteExercise(@PathVariable Long id) {
        try {
            contentService.deleteExercise(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}