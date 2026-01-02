package com.chineselearning.contentservice.service;

import com.chineselearning.contentservice.domain.CourseUnit;
import com.chineselearning.contentservice.domain.Exercise;
import com.chineselearning.contentservice.domain.Lesson;
import com.chineselearning.contentservice.domain.LessonMaterial;

import com.chineselearning.contentservice.domain.dao.ICourseUnitDao;
import com.chineselearning.contentservice.domain.dao.IExerciseDao;
import com.chineselearning.contentservice.domain.dao.ILessonDao;
import com.chineselearning.contentservice.domain.dao.ILessonMaterialDao;

import com.chineselearning.contentservice.domain.dto.CourseUnitDto;
import com.chineselearning.contentservice.domain.dto.ExerciseDto;
import com.chineselearning.contentservice.domain.dto.LessonDto;
import com.chineselearning.contentservice.domain.dto.LessonMaterialDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ContentService {

    private final ICourseUnitDao courseUnitDao;
    private final ILessonDao lessonDao;
    private final ILessonMaterialDao lessonMaterialDao;
    private final IExerciseDao exerciseDao;

    public ContentService(ICourseUnitDao courseUnitDao, ILessonDao lessonDao, ILessonMaterialDao lessonMaterialDao, IExerciseDao exerciseDao) {
        this.courseUnitDao = courseUnitDao;
        this.lessonDao = lessonDao;
        this.lessonMaterialDao = lessonMaterialDao;
        this.exerciseDao = exerciseDao;
    }

    // COURSE UNITS

    public List<CourseUnitDto> getAllCourseUnits()
    {
        List<CourseUnit> units = courseUnitDao.findAllByOrderByOrderIndexAsc();
        return units.stream()
                .map(this::mapUnitToDto)
                .collect(Collectors.toList());
    }

    public CourseUnitDto getCourseUnit(Long id)
    {
        CourseUnit unit = courseUnitDao.findById(id)
                .orElseThrow(() -> new RuntimeException("CourseUnit not found with id: " + id));
        return mapUnitToDto(unit);
    }

    public CourseUnitDto createCourseUnit(CourseUnitDto dto)
    {
        CourseUnit unit = new CourseUnit();
        unit.setTitle(dto.getTitle());
        unit.setDescription(dto.getDescription());
        unit.setHskLevel(dto.getHskLevel());
        unit.setOrderIndex(dto.getOrderIndex());

        CourseUnit savedUnit = courseUnitDao.save(unit);
        return mapUnitToDto(savedUnit);
    }

    public CourseUnitDto updateCourseUnit(Long id, CourseUnitDto dto)
    {
        CourseUnit unit = courseUnitDao.findById(id)
                .orElseThrow(() -> new RuntimeException("CourseUnit not found with id: " + id));

        unit.setTitle(dto.getTitle());
        unit.setDescription(dto.getDescription());
        unit.setHskLevel(dto.getHskLevel());
        unit.setOrderIndex(dto.getOrderIndex());

        CourseUnit updatedUnit = courseUnitDao.save(unit);
        return mapUnitToDto(updatedUnit);
    }

    public void deleteCourseUnit(Long id)
    {
        if (!courseUnitDao.existsById(id))
        {
            throw new RuntimeException("Cannot delete. CourseUnit not found with id: " + id);
        }
        courseUnitDao.deleteById(id);
    }




    // LESSONS LOGIC

    public List<LessonDto> getLessonsByUnitId(Long unitId)
    {
        return lessonDao.findByUnitIdOrderByOrderIndexAsc(unitId).stream()
                .map(this::mapLessonToDto)
                .collect(Collectors.toList());
    }

    public LessonDto getLesson(Long id) {
        Lesson lesson = lessonDao.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson not found with id: " + id));

        // Map lesson to DTO
        LessonDto dto = mapLessonToDto(lesson);

        // CRITICAL: Load and attach exercises
        List<ExerciseDto> exerciseDtos = lesson.getExercises().stream()
                .map(this::mapExerciseToDto)
                .collect(Collectors.toList());

        dto.setExercises(exerciseDtos);

        return dto;
    }

    public LessonDto createLesson(LessonDto dto)
    {
        CourseUnit unit = courseUnitDao.findById(dto.getUnitId())
                .orElseThrow(() -> new RuntimeException("Cannot create lesson. Unit not found: " + dto.getUnitId()));

        Lesson lesson = new Lesson();
        lesson.setUnit(unit);
        lesson.setTitle(dto.getTitle());
        lesson.setDescription(dto.getDescription());
        lesson.setXpReward(dto.getXpReward());
        lesson.setOrderIndex(dto.getOrderIndex());

        Lesson savedLesson = lessonDao.save(lesson);
        return mapLessonToDto(savedLesson);
    }


    public LessonDto updateLesson(Long id, LessonDto dto)
    {
        Lesson lesson = lessonDao.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson not found: " + id));


        if (dto.getUnitId() != null && !dto.getUnitId().equals(lesson.getUnit().getId()))
        {
            CourseUnit newUnit = courseUnitDao.findById(dto.getUnitId())
                    .orElseThrow(() -> new RuntimeException("Unit not found: " + dto.getUnitId()));
            lesson.setUnit(newUnit);
        }

        lesson.setTitle(dto.getTitle());
        lesson.setDescription(dto.getDescription());
        lesson.setXpReward(dto.getXpReward());
        lesson.setOrderIndex(dto.getOrderIndex());

        Lesson updated = lessonDao.save(lesson);
        return mapLessonToDto(updated);
    }

    public void deleteLesson(Long id)
    {
        if (!lessonDao.existsById(id))
        {
            throw new RuntimeException("Lesson not found: " + id);
        }
        lessonDao.deleteById(id);
    }




    // LESSON MATERIALS LOGIC

    public List<LessonMaterialDto> getMaterialsForLesson(Long lessonId)
    {
        return lessonMaterialDao.findByLessonId(lessonId).stream()
                .map(this::mapMaterialToDto)
                .collect(Collectors.toList());
    }

    public LessonMaterialDto addLessonMaterial(LessonMaterialDto dto)
    {
        Lesson lesson = lessonDao.findById(dto.getLessonId())
                .orElseThrow(() -> new RuntimeException("Lesson not found: " + dto.getLessonId()));

        LessonMaterial material = new LessonMaterial();
        material.setLesson(lesson);
        material.setTitle(dto.getTitle());
        material.setType(dto.getType());
        material.setUrl(dto.getUrl());

        LessonMaterial saved = lessonMaterialDao.save(material);
        return mapMaterialToDto(saved);
    }

    public void deleteLessonMaterial(Long id)
    {
        lessonMaterialDao.deleteById(id);
    }



    // EXERCISES LOGIC


    // In ContentService class

    public ExerciseDto getExercise(Long id) {
        Exercise exercise = exerciseDao.findById(id)
                .orElseThrow(() -> new RuntimeException("Exercise not found with id: " + id));
        return mapExerciseToDto(exercise);
    }

    public List<ExerciseDto> getExercisesForLesson(Long lessonId)
    {
        return exerciseDao.findByLessonId(lessonId).stream()
                .map(this::mapExerciseToDto)
                .collect(Collectors.toList());
    }

    public ExerciseDto addExercise(ExerciseDto dto)
    {
        Lesson lesson = lessonDao.findById(dto.getLessonId())
                .orElseThrow(() -> new RuntimeException("Lesson not found: " + dto.getLessonId()));

        Exercise exercise = new Exercise();
        exercise.setLesson(lesson);
        exercise.setType(dto.getType());
        exercise.setPrompt(dto.getPrompt());
        exercise.setDifficulty(dto.getDifficulty());
        exercise.setContentData(dto.getContentData());

        Exercise saved = exerciseDao.save(exercise);
        return mapExerciseToDto(saved);
    }



    public ExerciseDto updateExercise(Long id, ExerciseDto dto)
    {
        Exercise exercise = exerciseDao.findById(id)
                .orElseThrow(() -> new RuntimeException("Exercise not found: " + id));

        exercise.setType(dto.getType());
        exercise.setPrompt(dto.getPrompt());
        exercise.setDifficulty(dto.getDifficulty());
        exercise.setContentData(dto.getContentData());

        Exercise updated = exerciseDao.save(exercise);
        return mapExerciseToDto(updated);
    }

    public void deleteExercise(Long id)
    {
        exerciseDao.deleteById(id);
    }




    // Helpers

    private CourseUnitDto mapUnitToDto(CourseUnit unit) {
        return new CourseUnitDto(
                unit.getId(),
                unit.getTitle(),
                unit.getDescription(),
                unit.getHskLevel(),
                unit.getOrderIndex()
        );
    }

    private LessonDto mapLessonToDto(Lesson lesson) {
        return new LessonDto(
                lesson.getId(),
                lesson.getUnit().getId(),
                lesson.getTitle(),
                lesson.getDescription(),
                lesson.getXpReward(),
                lesson.getOrderIndex()
        );
    }

    private LessonMaterialDto mapMaterialToDto(LessonMaterial material) {
        return new LessonMaterialDto(
                material.getId(),
                material.getLesson().getId(),
                material.getTitle(),
                material.getType(),
                material.getUrl()
        );
    }

    private ExerciseDto mapExerciseToDto(Exercise exercise) {
        return new ExerciseDto(
                exercise.getId(),
                exercise.getLesson().getId(),
                exercise.getType(),
                exercise.getPrompt(),
                exercise.getDifficulty(),
                exercise.getContentData()
        );
    }
}