import { useState, useCallback } from 'react';
import { contentApi } from '@/api/contentApi';
import type {
  CourseUnitDto,
  CourseUnitFullDto,
  LessonDto,
  ExerciseDto,
  LessonMaterialDto,
  LessonExerciseTypesDto,
} from '@/types';

export type {
  CourseUnitDto,
  LessonDto,
  ExerciseDto,
  LessonMaterialDto,
  ExerciseType,
  ExerciseContentData,
  MultipleChoiceData,
  TranslationData,
  FillBlankData,
  MatchingData,
  OrderingData,
  SubmittedAnswer,
  MultipleChoiceAnswer,
  TranslationAnswer,
  FillBlankAnswer,
  MatchingAnswer,
  OrderingAnswer,
  LessonExerciseTypesDto
} from '@/types';


export const useContent = () => {
  const [units, setUnits] = useState<CourseUnitDto[]>([]);
  const [currentUnit, setCurrentUnit] = useState<CourseUnitFullDto | null>(null);
  const [currentLesson, setCurrentLesson] = useState<LessonDto | null>(null);
  const [exerciseTypes, setExerciseTypes] =
    useState<LessonExerciseTypesDto | null>(null);
  const [materials, setMaterials] = useState<LessonMaterialDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUnits = useCallback(async (hskLevel?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await contentApi.getUnits(hskLevel);
      setUnits(data);
    } catch {
      setError('Nu s-au putut incarca unitatile.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUnitFull = useCallback(async (unitId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await contentApi.getUnitFull(unitId);
      setCurrentUnit(data);
    } catch {
      setError('Nu s-a putut incarca unitatea.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchLesson = useCallback(async (lessonId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const [lesson, types, mats] = await Promise.all([
        contentApi.getLessonById(lessonId),
        contentApi.getLessonExerciseTypes(lessonId),
        contentApi.getMaterialsByLesson(lessonId),
      ]);
      setCurrentLesson(lesson);
      setExerciseTypes(types);
      setMaterials(mats);
    } catch {
      setError('Nu s-a putut incarca lectia.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // --- CRUD Unit ---
  const createUnit = async (
    data: Omit<CourseUnitDto, 'id' | 'createdByTeacherId'>
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      const created = await contentApi.createUnit(data);
      setUnits((prev) => [...prev, created]);
      return true;
    } catch {
      setError('Crearea unitatii a esuat.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateUnit = async (
    id: number,
    data: Omit<CourseUnitDto, 'id' | 'createdByTeacherId'>
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      const updated = await contentApi.updateUnit(id, data);
      setUnits((prev) => prev.map((u) => (u.id === id ? updated : u)));
      if (currentUnit?.id === id) {
        setCurrentUnit((prev) => (prev ? { ...prev, ...updated } : prev));
      }
      return true;
    } catch {
      setError('Actualizarea unitatii a esuat.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteUnit = async (id: number): Promise<boolean> => {
    try {
      await contentApi.deleteUnit(id);
      setUnits((prev) => prev.filter((u) => u.id !== id));
      return true;
    } catch {
      setError('Stergerea unitatii a esuat.');
      return false;
    }
  };

  // --- CRUD Lesson ---
  const createLesson = async (
    data: Omit<LessonDto, 'id' | 'exercises'>
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      const created = await contentApi.createLesson(data);
      // Actualizeaza lectiile din unitatea curenta in memorie
      if (currentUnit?.id === created.unitId) {
        setCurrentUnit((prev) =>
          prev
            ? { ...prev, lessons: [...prev.lessons, { ...created, exercises: null }] }
            : prev
        );
      }
      return true;
    } catch {
      setError('Crearea lectiei a esuat.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateLesson = async (
    id: number,
    data: Omit<LessonDto, 'id' | 'exercises'>
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      const updated = await contentApi.updateLesson(id, data);
      if (currentUnit) {
        setCurrentUnit((prev) =>
          prev
            ? {
                ...prev,
                lessons: prev.lessons.map((l) =>
                  l.id === id ? { ...l, ...updated } : l
                ),
              }
            : prev
        );
      }
      if (currentLesson?.id === id) {
        setCurrentLesson((prev) => (prev ? { ...prev, ...updated } : prev));
      }
      return true;
    } catch {
      setError('Actualizarea lectiei a esuat.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteLesson = async (id: number): Promise<boolean> => {
    try {
      await contentApi.deleteLesson(id);
      if (currentUnit) {
        setCurrentUnit((prev) =>
          prev
            ? { ...prev, lessons: prev.lessons.filter((l) => l.id !== id) }
            : prev
        );
      }
      return true;
    } catch {
      setError('Stergerea lectiei a esuat.');
      return false;
    }
  };

  // --- CRUD Exercise ---
  const createExercise = async (
    data: Omit<ExerciseDto, 'id'>
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      const created = await contentApi.createExercise(data);
      if (currentLesson?.id === created.lessonId) {
        setCurrentLesson((prev) =>
          prev
            ? { ...prev, exercises: [...(prev.exercises ?? []), created] }
            : prev
        );
      }
      return true;
    } catch {
      setError('Crearea exercitiului a esuat.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateExercise = async (
    id: number,
    data: Omit<ExerciseDto, 'id' | 'lessonId'>
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      const updated = await contentApi.updateExercise(id, data);
      if (currentLesson) {
        setCurrentLesson((prev) =>
          prev
            ? {
                ...prev,
                exercises: (prev.exercises ?? []).map((e) =>
                  e.id === id ? updated : e
                ),
              }
            : prev
        );
      }
      return true;
    } catch {
      setError('Actualizarea exercitiului a esuat.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteExercise = async (id: number): Promise<boolean> => {
    try {
      await contentApi.deleteExercise(id);
      if (currentLesson) {
        setCurrentLesson((prev) =>
          prev
            ? {
                ...prev,
                exercises: (prev.exercises ?? []).filter((e) => e.id !== id),
              }
            : prev
        );
      }
      return true;
    } catch {
      setError('Stergerea exercitiului a esuat.');
      return false;
    }
  };

  // --- Materials ---
  const uploadAndCreateMaterial = async (
    lessonId: number,
    title: string,
    type: string,
    file: File
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      // Pasul 1: upload fisier → URL MinIO
      const url = await contentApi.uploadMaterialFile(file);
      // Pasul 2: salveaza materialul in DB cu URL-ul primit
      const created = await contentApi.createMaterial({ lessonId, title, type, url });
      setMaterials((prev) => [...prev, created]);
      return true;
    } catch {
      setError('Incarcarea materialului a esuat.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteMaterial = async (id: number): Promise<boolean> => {
    try {
      await contentApi.deleteMaterial(id);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      return true;
    } catch {
      setError('Stergerea materialului a esuat.');
      return false;
    }
  };

  return {
    units,
    currentUnit,
    currentLesson,
    exerciseTypes,
    materials,
    isLoading,
    isSaving,
    error,
    fetchUnits,
    fetchUnitFull,
    fetchLesson,
    createUnit,
    updateUnit,
    deleteUnit,
    createLesson,
    updateLesson,
    deleteLesson,
    createExercise,
    updateExercise,
    deleteExercise,
    uploadAndCreateMaterial,
    deleteMaterial,
  };
};