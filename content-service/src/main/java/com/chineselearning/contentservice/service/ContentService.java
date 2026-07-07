package com.chineselearning.contentservice.service;

import com.chineselearning.contentservice.domain.CourseUnit;
import com.chineselearning.contentservice.domain.Exercise;
import com.chineselearning.contentservice.domain.Lesson;
import com.chineselearning.contentservice.domain.LessonMaterial;

import com.chineselearning.contentservice.domain.dao.ICourseUnitDao;
import com.chineselearning.contentservice.domain.dao.IExerciseDao;
import com.chineselearning.contentservice.domain.dao.ILessonDao;
import com.chineselearning.contentservice.domain.dao.ILessonMaterialDao;

import com.chineselearning.contentservice.domain.dto.*;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ContentService
{

    private final ICourseUnitDao courseUnitDao;
    private final ILessonDao lessonDao;
    private final ILessonMaterialDao lessonMaterialDao;
    private final IExerciseDao exerciseDao;
    private final StorageService storageService;

    @Value("${storage.base-url}")
    private String storageBaseUrl;

    public ContentService(ICourseUnitDao courseUnitDao, ILessonDao lessonDao, ILessonMaterialDao lessonMaterialDao, IExerciseDao exerciseDao, StorageService storageService) {
        this.courseUnitDao = courseUnitDao;
        this.lessonDao = lessonDao;
        this.lessonMaterialDao = lessonMaterialDao;
        this.exerciseDao = exerciseDao;
        this.storageService = storageService;
    }





    @Transactional(readOnly = true)
    public List<CourseUnitDto> getAllCourseUnits(Integer hskLevel)
    {
        List<CourseUnit> units = (hskLevel != null)
                ? courseUnitDao.findByHskLevel(hskLevel)
                : courseUnitDao.findAllByOrderByOrderIndexAsc();

        return units.stream()
                .map(this::mapUnitToDto)
                .collect(Collectors.toList());
    }


    @Transactional(readOnly = true)
    public CourseUnitDto getCourseUnit(Long id)
    {
        CourseUnit unit = courseUnitDao.findById(id)
                .orElseThrow(() -> new RuntimeException("CourseUnit not found with id: " + id));
        return mapUnitToDto(unit);
    }


    @Transactional(readOnly = true)
    public CourseUnitFullDto getCourseUnitFull(Long id)
    {
        CourseUnit unit = courseUnitDao.findById(id)
                .orElseThrow(() -> new RuntimeException("CourseUnit not found with id: " + id));

        List<LessonDto> lessons = lessonDao.findByUnitIdOrderByOrderIndexAsc(id).stream()
                .map(this::mapLessonToDto)
                .collect(Collectors.toList());

        return new CourseUnitFullDto(
                unit.getId(),
                unit.getTitle(),
                unit.getDescription(),
                unit.getHskLevel(),
                unit.getOrderIndex(),
                lessons
        );
    }


    @Transactional
    public CourseUnitDto createCourseUnit(CourseUnitDto dto, Long teacherId)
    {
        CourseUnit unit = new CourseUnit();
        unit.setTitle(dto.getTitle());
        unit.setDescription(dto.getDescription());
        unit.setHskLevel(dto.getHskLevel());
        unit.setOrderIndex(dto.getOrderIndex());
        unit.setCreatedByTeacherId(teacherId);

        CourseUnit savedUnit = courseUnitDao.save(unit);
        return mapUnitToDto(savedUnit);
    }


    @Transactional
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


    @Transactional
    public void deleteCourseUnit(Long id)
    {
        if (!courseUnitDao.existsById(id))
        {
            throw new RuntimeException("Cannot delete. CourseUnit not found with id: " + id);
        }
        courseUnitDao.deleteById(id);
    }


    @Transactional(readOnly = true)
    public List<CourseUnitDto> getCourseUnitsByTeacher(Long teacherId)
    {
        return courseUnitDao.findByCreatedByTeacherId(teacherId).stream()
                .map(this::mapUnitToDto)
                .collect(Collectors.toList());
    }




    @Transactional(readOnly = true)
    public List<LessonDto> getLessonsByUnitId(Long unitId)
    {
        return lessonDao.findByUnitIdOrderByOrderIndexAsc(unitId).stream()
                .map(this::mapLessonToDto)
                .collect(Collectors.toList());
    }


    @Transactional(readOnly = true)
    public LessonDto getLesson(Long id)
    {
        Lesson lesson = lessonDao.findById(id)
                .orElseThrow(() -> new RuntimeException("Lesson not found with id: " + id));

        LessonDto dto = mapLessonToDto(lesson);

        List<ExerciseDto> exerciseDtos = exerciseDao.findByLessonId(id).stream()
                .map(this::mapExerciseToDto)
                .collect(Collectors.toList());

        dto.setExercises(exerciseDtos);

        return dto;
    }


    @Transactional
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



    @Transactional
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


    @Transactional
    public void deleteLesson(Long id)
    {
        if (!lessonDao.existsById(id))
        {
            throw new RuntimeException("Lesson not found: " + id);
        }
        lessonDao.deleteById(id);
    }





    @Transactional(readOnly = true)
    public List<LessonMaterialDto> getMaterialsForLesson(Long lessonId)
    {
        return lessonMaterialDao.findByLessonId(lessonId).stream()
                .map(this::mapMaterialToDto)
                .collect(Collectors.toList());
    }


    @Transactional
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


    @Transactional
    public void deleteLessonMaterial(Long id)
    {
        LessonMaterial material = lessonMaterialDao.findById(id)
                .orElseThrow(() -> new RuntimeException("LessonMaterial not found: " + id));

        if (material.getUrl() != null && material.getUrl().startsWith(storageBaseUrl)) {
            storageService.delete(material.getUrl());
        }

        lessonMaterialDao.deleteById(id);
    }





    @Transactional(readOnly = true)
    public ExerciseDto getExercise(Long id)
    {
        Exercise exercise = exerciseDao.findById(id)
                .orElseThrow(() -> new RuntimeException("Exercise not found with id: " + id));
        return mapExerciseToDto(exercise);
    }


    @Transactional(readOnly = true)
    public List<ExerciseDto> getExercisesForLesson(Long lessonId)
    {
        return exerciseDao.findByLessonId(lessonId).stream()
                .map(this::mapExerciseToDto)
                .collect(Collectors.toList());
    }


    @Transactional
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



    @Transactional
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


    @Transactional
    public void deleteExercise(Long id)
    {
        if (!exerciseDao.existsById(id))
        {
            throw new RuntimeException("Exercise not found: " + id);
        }
        exerciseDao.deleteById(id);
    }




    @Transactional(readOnly = true)
    public UnitXpStatsDto getUnitXpStats(Long unitId)
    {
        if (!courseUnitDao.existsById(unitId))
        {
            throw new RuntimeException("CourseUnit not found with id: " + unitId);
        }

        Integer totalXp = lessonDao.findByUnitIdOrderByOrderIndexAsc(unitId).stream()
                .filter(lesson -> lesson.getXpReward() != null)
                .mapToInt(Lesson::getXpReward)
                .sum();

        return new UnitXpStatsDto(unitId, totalXp);
    }


    @Transactional(readOnly = true)
    public UnitLessonCountDto getUnitLessonCount(Long unitId)
    {
        if (!courseUnitDao.existsById(unitId))
        {
            throw new RuntimeException("CourseUnit not found with id: " + unitId);
        }
        int totalLessons = (int) lessonDao.countByUnitId(unitId);
        return new UnitLessonCountDto(unitId, totalLessons);
    }


    @Transactional(readOnly = true)
    public LessonExerciseTypesDto getLessonExerciseTypes(Long lessonId)
    {
        if (!lessonDao.existsById(lessonId))
        {
            throw new RuntimeException("Lesson not found with id: " + lessonId);
        }

        Map<String, Long> exerciseTypes = exerciseDao.findByLessonId(lessonId).stream()
                .collect(Collectors.groupingBy(Exercise::getType, Collectors.counting()));

        return new LessonExerciseTypesDto(lessonId, exerciseTypes);
    }





    private CourseUnitDto mapUnitToDto(CourseUnit unit) {
        CourseUnitDto dto = new CourseUnitDto(
                unit.getId(),
                unit.getTitle(),
                unit.getDescription(),
                unit.getHskLevel(),
                unit.getOrderIndex()
        );
        dto.setCreatedByTeacherId(unit.getCreatedByTeacherId());
        return dto;
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