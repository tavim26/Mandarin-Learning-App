package com.chineselearning.contentservice.controller;

import com.chineselearning.contentservice.dto.CourseUnitDto;
import com.chineselearning.contentservice.dto.ExerciseDto;
import com.chineselearning.contentservice.dto.LessonDto;
import com.chineselearning.contentservice.dto.LessonMaterialDto;
import com.chineselearning.contentservice.service.ContentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/content")
public class ContentController {

    private final ContentService contentService;

    public ContentController(ContentService contentService) {
        this.contentService = contentService;
    }

    // =================================================================================
    // 1. COURSE UNITS ENDPOINTS
    // =================================================================================

    @Tag(name = "1. Course Units", description = "Managementul modulelor principale de curs")
    @Operation(summary = "Obtine toate unitatile", description = "Returneaza o lista cu toate unitatile de curs ordonate dupa index.")
    @GetMapping("/units")
    public ResponseEntity<List<CourseUnitDto>> getAllUnits() {
        return ResponseEntity.ok(contentService.getAllCourseUnits());
    }

    @Tag(name = "1. Course Units")
    @Operation(summary = "Gaseste o unitate", description = "Returneaza detaliile unei unitati pe baza ID-ului.")
    @GetMapping("/units/{id}")
    public ResponseEntity<CourseUnitDto> getUnit(@PathVariable Long id) {
        return ResponseEntity.ok(contentService.getCourseUnit(id));
    }

    @Tag(name = "1. Course Units")
    @Operation(summary = "Creeaza o unitate noua", description = "Adauga un nou modul/capitol in structura cursului.")
    @PostMapping("/units")
    public ResponseEntity<CourseUnitDto> createUnit(@RequestBody CourseUnitDto dto) {
        return ResponseEntity.ok(contentService.createCourseUnit(dto));
    }

    @Tag(name = "1. Course Units")
    @Operation(summary = "Sterge o unitate", description = "Sterge unitatea si toate lectiile asociate (Cascade).")
    @DeleteMapping("/units/{id}")
    public ResponseEntity<Void> deleteUnit(@PathVariable Long id) {
        contentService.deleteCourseUnit(id);
        return ResponseEntity.noContent().build();
    }

    // =================================================================================
    // 2. LESSONS ENDPOINTS
    // =================================================================================

    @Tag(name = "2. Lessons", description = "Managementul lectiilor individuale")
    @Operation(summary = "Lectiile unei unitati", description = "Obtine toate lectiile care apartin de un Unit ID specific.")
    @GetMapping("/units/{unitId}/lessons")
    public ResponseEntity<List<LessonDto>> getLessonsByUnit(@PathVariable Long unitId) {
        return ResponseEntity.ok(contentService.getLessonsByUnitId(unitId));
    }

    @Tag(name = "2. Lessons")
    @Operation(summary = "Detalii lectie", description = "Returneaza detaliile complete ale unei lectii.")
    @GetMapping("/lessons/{id}")
    public ResponseEntity<LessonDto> getLesson(@PathVariable Long id) {
        return ResponseEntity.ok(contentService.getLesson(id));
    }

    @Tag(name = "2. Lessons")
    @Operation(summary = "Creeaza o lectie", description = "Adauga o lectie noua intr-o unitate existenta.")
    @PostMapping("/lessons")
    public ResponseEntity<LessonDto> createLesson(@RequestBody LessonDto dto) {
        return ResponseEntity.ok(contentService.createLesson(dto));
    }

    @Tag(name = "2. Lessons")
    @DeleteMapping("/lessons/{id}")
    public ResponseEntity<Void> deleteLesson(@PathVariable Long id) {
        contentService.deleteLesson(id);
        return ResponseEntity.noContent().build();
    }

    // =================================================================================
    // 3. MATERIALS ENDPOINTS
    // =================================================================================

    @Tag(name = "3. Materials", description = "Resurse educationale (Video, PDF, Link)")
    @Operation(summary = "Materialele unei lectii", description = "Lista de resurse pentru o lectie data.")
    @GetMapping("/lessons/{lessonId}/materials")
    public ResponseEntity<List<LessonMaterialDto>> getMaterials(@PathVariable Long lessonId) {
        return ResponseEntity.ok(contentService.getMaterialsForLesson(lessonId));
    }

    @Tag(name = "3. Materials")
    @Operation(summary = "Adauga material", description = "Ataseaza o resursa noua la o lectie.")
    @PostMapping("/materials")
    public ResponseEntity<LessonMaterialDto> addMaterial(@RequestBody LessonMaterialDto dto) {
        return ResponseEntity.ok(contentService.addLessonMaterial(dto));
    }

    @Tag(name = "3. Materials")
    @DeleteMapping("/materials/{id}")
    public ResponseEntity<Void> deleteMaterial(@PathVariable Long id) {
        contentService.deleteLessonMaterial(id);
        return ResponseEntity.noContent().build();
    }

    // =================================================================================
    // 4. EXERCISES ENDPOINTS
    // =================================================================================

    @Tag(name = "4. Exercises", description = "Exercitii si teste grila")
    @Operation(summary = "Exercitiile unei lectii", description = "Returneaza lista de exercitii asociate lectiei.")
    @GetMapping("/lessons/{lessonId}/exercises")
    public ResponseEntity<List<ExerciseDto>> getExercises(@PathVariable Long lessonId) {
        return ResponseEntity.ok(contentService.getExercisesForLesson(lessonId));
    }

    @Tag(name = "4. Exercises")
    @Operation(summary = "Adauga exercitiu", description = "Creeaza un exercitiu nou (suporta structura JSON dinamica).")
    @PostMapping("/exercises")
    public ResponseEntity<ExerciseDto> addExercise(@RequestBody ExerciseDto dto) {
        return ResponseEntity.ok(contentService.addExercise(dto));
    }

    @Tag(name = "4. Exercises")
    @DeleteMapping("/exercises/{id}")
    public ResponseEntity<Void> deleteExercise(@PathVariable Long id) {
        contentService.deleteExercise(id);
        return ResponseEntity.noContent().build();
    }
}