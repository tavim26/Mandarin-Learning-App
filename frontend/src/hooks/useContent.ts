import { useState, useEffect } from 'react';
import {
  getAllUnits,
  getUnitFull,
  getLessonsByUnit,
  getLesson,
  getExercisesByLesson,
  getMaterialsByLesson,
  createUnit, updateUnit, deleteUnit,
  createLesson, updateLesson, deleteLesson,
  createExercise, updateExercise, deleteExercise,
  createMaterial, deleteMaterial,
} from '@/api/contentApi';
import type {
  CourseUnitDto,
  CourseUnitFullDto,
  LessonDto,
  ExerciseDto,
  LessonMaterialDto,
  CreateCourseUnitRequest,
  UpdateCourseUnitRequest,
  CreateLessonRequest,
  UpdateLessonRequest,
  CreateExerciseRequest,
  UpdateExerciseRequest,
  CreateMaterialRequest,
} from '@/types';

// --- Hook unitati ---

export const useUnits = (hskLevel?: number) => {
  const [units, setUnits] = useState<CourseUnitDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUnits = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getAllUnits(hskLevel);
      setUnits(data);
    } catch {
      setError('Failed to load units.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUnits(); }, [hskLevel]);

  const addUnit = async (data: CreateCourseUnitRequest): Promise<CourseUnitDto> => {
    const created = await createUnit(data);
    setUnits((prev) => [...prev, created]);
    return created;
  };

  const editUnit = async (id: number, data: UpdateCourseUnitRequest): Promise<CourseUnitDto> => {
    const updated = await updateUnit(id, data);
    setUnits((prev) => prev.map((u) => (u.id === id ? updated : u)));
    return updated;
  };

  const removeUnit = async (id: number): Promise<void> => {
    await deleteUnit(id);
    setUnits((prev) => prev.filter((u) => u.id !== id));
  };

  return { units, loading, error, refetch: fetchUnits, addUnit, editUnit, removeUnit };
};

// --- Hook unitate cu lectii ---

export const useUnitFull = (unitId: number) => {
  const [unit, setUnit] = useState<CourseUnitFullDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getUnitFull(unitId);
        setUnit(data);
      } catch {
        setError('Failed to load unit.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [unitId]);

  return { unit, loading, error };
};

// --- Hook lectii dintr-o unitate ---

export const useLessons = (unitId: number) => {
  const [lessons, setLessons] = useState<LessonDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLessonsByUnit(unitId);
      setLessons(data);
    } catch {
      setError('Failed to load lessons.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLessons(); }, [unitId]);

  const addLesson = async (data: CreateLessonRequest): Promise<LessonDto> => {
    const created = await createLesson(data);
    setLessons((prev) => [...prev, created]);
    return created;
  };

  const editLesson = async (id: number, data: UpdateLessonRequest): Promise<LessonDto> => {
    const updated = await updateLesson(id, data);
    setLessons((prev) => prev.map((l) => (l.id === id ? updated : l)));
    return updated;
  };

  const removeLesson = async (id: number): Promise<void> => {
    await deleteLesson(id);
    setLessons((prev) => prev.filter((l) => l.id !== id));
  };

  return { lessons, loading, error, refetch: fetchLessons, addLesson, editLesson, removeLesson };
};

// --- Hook detaliu lectie (cu exercitii) ---

export const useLesson = (lessonId: number) => {
  const [lesson, setLesson] = useState<LessonDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLesson = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLesson(lessonId);
      setLesson(data);
    } catch {
      setError('Failed to load lesson.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLesson(); }, [lessonId]);

  return { lesson, loading, error, refetch: fetchLesson };
};

// --- Hook exercitii ---

export const useExercises = (lessonId: number) => {
  const [exercises, setExercises] = useState<ExerciseDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExercises = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getExercisesByLesson(lessonId);
      setExercises(data);
    } catch {
      setError('Failed to load exercises.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchExercises(); }, [lessonId]);

  const addExercise = async (data: CreateExerciseRequest): Promise<ExerciseDto> => {
    const created = await createExercise(data);
    setExercises((prev) => [...prev, created]);
    return created;
  };

  const editExercise = async (id: number, data: UpdateExerciseRequest): Promise<ExerciseDto> => {
    const updated = await updateExercise(id, data);
    setExercises((prev) => prev.map((e) => (e.id === id ? updated : e)));
    return updated;
  };

  const removeExercise = async (id: number): Promise<void> => {
    await deleteExercise(id);
    setExercises((prev) => prev.filter((e) => e.id !== id));
  };

  return { exercises, loading, error, refetch: fetchExercises, addExercise, editExercise, removeExercise };
};

// --- Hook materiale ---

export const useMaterials = (lessonId: number) => {
  const [materials, setMaterials] = useState<LessonMaterialDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getMaterialsByLesson(lessonId);
      setMaterials(data);
    } catch {
      setError('Failed to load materials.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMaterials(); }, [lessonId]);

  const addMaterial = async (data: CreateMaterialRequest): Promise<LessonMaterialDto> => {
    const created = await createMaterial(data);
    setMaterials((prev) => [...prev, created]);
    return created;
  };

  const removeMaterial = async (id: number): Promise<void> => {
    await deleteMaterial(id);
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  };

  return { materials, loading, error, refetch: fetchMaterials, addMaterial, removeMaterial };
};