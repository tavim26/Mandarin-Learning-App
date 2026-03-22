import apiClient from './client';

// --- DTO-uri ---

export interface CourseUnitDto {
  id: number;
  title: string;
  description: string | null;
  hskLevel: number | null;
  orderIndex: number;
}

export interface LessonDto {
  id: number;
  unitId: number;
  title: string;
  description: string | null;
  xpReward: number;
  orderIndex: number;
  exercises: ExerciseDto[] | null;
}

export interface ExerciseDto {
  id: number;
  lessonId: number;
  type: string;
  prompt: string;
  difficulty: number | null;
  contentData: Record<string, unknown> | null;
}

export interface LessonMaterialDto {
  id: number;
  lessonId: number;
  title: string;
  type: string;
  url: string;
}

// --- Course Units ---

export const getAllUnits = async (hskLevel?: number): Promise<CourseUnitDto[]> => {
  const params = hskLevel !== undefined ? { hskLevel } : {};
  const response = await apiClient.get<CourseUnitDto[]>('/api/content/units', { params });
  return response.data;
};

export const getUnitFull = async (id: number): Promise<CourseUnitDto> => {
  const response = await apiClient.get<CourseUnitDto>(`/api/content/units/${id}`);
  return response.data;
};

export const createUnit = async (dto: Omit<CourseUnitDto, 'id'>): Promise<CourseUnitDto> => {
  const response = await apiClient.post<CourseUnitDto>('/api/content/units', dto);
  return response.data;
};

export const updateUnit = async (id: number, dto: Omit<CourseUnitDto, 'id'>): Promise<CourseUnitDto> => {
  const response = await apiClient.put<CourseUnitDto>(`/api/content/units/${id}`, dto);
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

export const getLesson = async (id: number): Promise<LessonDto> => {
  const response = await apiClient.get<LessonDto>(`/api/content/lessons/${id}`);
  return response.data;
};

export const createLesson = async (dto: Omit<LessonDto, 'id' | 'exercises'>): Promise<LessonDto> => {
  const response = await apiClient.post<LessonDto>('/api/content/lessons', dto);
  return response.data;
};

export const updateLesson = async (id: number, dto: Omit<LessonDto, 'id' | 'exercises'>): Promise<LessonDto> => {
  const response = await apiClient.put<LessonDto>(`/api/content/lessons/${id}`, dto);
  return response.data;
};

export const deleteLesson = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/content/lessons/${id}`);
};

// --- Exercises ---

export const getExercisesByLesson = async (lessonId: number): Promise<ExerciseDto[]> => {
  const response = await apiClient.get<ExerciseDto[]>(`/api/content/lessons/${lessonId}/exercises`);
  return response.data;
};

export const createExercise = async (dto: Omit<ExerciseDto, 'id'>): Promise<ExerciseDto> => {
  const response = await apiClient.post<ExerciseDto>('/api/content/exercises', dto);
  return response.data;
};

export const updateExercise = async (id: number, dto: Omit<ExerciseDto, 'id' | 'lessonId'>): Promise<ExerciseDto> => {
  const response = await apiClient.put<ExerciseDto>(`/api/content/exercises/${id}`, dto);
  return response.data;
};

export const deleteExercise = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/content/exercises/${id}`);
};

// --- Materials ---

export const getMaterialsByLesson = async (lessonId: number): Promise<LessonMaterialDto[]> => {
  const response = await apiClient.get<LessonMaterialDto[]>(`/api/content/lessons/${lessonId}/materials`);
  return response.data;
};

export const createMaterial = async (dto: Omit<LessonMaterialDto, 'id'>): Promise<LessonMaterialDto> => {
  const response = await apiClient.post<LessonMaterialDto>('/api/content/materials', dto);
  return response.data;
};

export const deleteMaterial = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/content/materials/${id}`);
};