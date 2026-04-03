import apiClient from './client';
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

// --- Course Units ---

export const getAllUnits = async (hskLevel?: number): Promise<CourseUnitDto[]> => {
  const params = hskLevel !== undefined ? { hskLevel } : {};
  const response = await apiClient.get<CourseUnitDto[]>('/api/content/units', { params });
  return response.data;
};

export const getUnit = async (id: number): Promise<CourseUnitDto> => {
  const response = await apiClient.get<CourseUnitDto>(`/api/content/units/${id}`);
  return response.data;
};

// Returneaza unitatea cu lista de lectii inclusa
export const getUnitFull = async (id: number): Promise<CourseUnitFullDto> => {
  const response = await apiClient.get<CourseUnitFullDto>(`/api/content/units/${id}/full`);
  return response.data;
};

export const createUnit = async (data: CreateCourseUnitRequest): Promise<CourseUnitDto> => {
  const response = await apiClient.post<CourseUnitDto>('/api/content/units', data);
  return response.data;
};

export const updateUnit = async (
  id: number,
  data: UpdateCourseUnitRequest
): Promise<CourseUnitDto> => {
  const response = await apiClient.put<CourseUnitDto>(`/api/content/units/${id}`, data);
  return response.data;
};

export const deleteUnit = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/content/units/${id}`);
};

// --- Lessons ---

export const getLessonsByUnit = async (unitId: number): Promise<LessonDto[]> => {
  const response = await apiClient.get<LessonDto[]>(`/api/content/units/${unitId}/lessons`);
  return response.data;
};

// Returneaza lectia cu exercises populate
export const getLesson = async (id: number): Promise<LessonDto> => {
  const response = await apiClient.get<LessonDto>(`/api/content/lessons/${id}`);
  return response.data;
};

export const createLesson = async (data: CreateLessonRequest): Promise<LessonDto> => {
  const response = await apiClient.post<LessonDto>('/api/content/lessons', data);
  return response.data;
};

export const updateLesson = async (
  id: number,
  data: UpdateLessonRequest
): Promise<LessonDto> => {
  const response = await apiClient.put<LessonDto>(`/api/content/lessons/${id}`, data);
  return response.data;
};

export const deleteLesson = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/content/lessons/${id}`);
};

// --- Exercises ---

export const getExercisesByLesson = async (lessonId: number): Promise<ExerciseDto[]> => {
  const response = await apiClient.get<ExerciseDto[]>(
    `/api/content/lessons/${lessonId}/exercises`
  );
  return response.data;
};

export const createExercise = async (data: CreateExerciseRequest): Promise<ExerciseDto> => {
  const response = await apiClient.post<ExerciseDto>('/api/content/exercises', data);
  return response.data;
};

export const updateExercise = async (
  id: number,
  data: UpdateExerciseRequest
): Promise<ExerciseDto> => {
  const response = await apiClient.put<ExerciseDto>(`/api/content/exercises/${id}`, data);
  return response.data;
};

export const deleteExercise = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/content/exercises/${id}`);
};

// --- Materials ---

export const getMaterialsByLesson = async (lessonId: number): Promise<LessonMaterialDto[]> => {
  const response = await apiClient.get<LessonMaterialDto[]>(
    `/api/content/lessons/${lessonId}/materials`
  );
  return response.data;
};

export const createMaterial = async (
  data: CreateMaterialRequest
): Promise<LessonMaterialDto> => {
  const response = await apiClient.post<LessonMaterialDto>('/api/content/materials', data);
  return response.data;
};

export const deleteMaterial = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/content/materials/${id}`);
};