import apiClient from './client';
import type {
  CourseUnitDto,
  CourseUnitFullDto,
  LessonDto,
  ExerciseDto,
  LessonMaterialDto,
  UnitXpStatsDto,
  UnitLessonCountDto,
  LessonExerciseTypesDto,
} from '@/types';

export const contentApi = {
  
  getUnits: async (hskLevel?: number): Promise<CourseUnitDto[]> => {
    const res = await apiClient.get<CourseUnitDto[]>('/api/content/units', {
      params: hskLevel !== undefined ? { hskLevel } : {},
    });
    return res.data;
  },

  getUnitById: async (id: number): Promise<CourseUnitDto> => {
    const res = await apiClient.get<CourseUnitDto>(`/api/content/units/${id}`);
    return res.data;
  },

  getUnitFull: async (id: number): Promise<CourseUnitFullDto> => {
    const res = await apiClient.get<CourseUnitFullDto>(
      `/api/content/units/${id}/full`
    );
    return res.data;
  },

  getUnitsByTeacher: async (teacherId: number): Promise<CourseUnitDto[]> => {
    const res = await apiClient.get<CourseUnitDto[]>(
      `/api/content/units/teacher/${teacherId}`
    );
    return res.data;
  },

  getUnitXpStats: async (id: number): Promise<UnitXpStatsDto> => {
    const res = await apiClient.get<UnitXpStatsDto>(
      `/api/content/units/${id}/stats/xp`
    );
    return res.data;
  },

  getUnitLessonCount: async (id: number): Promise<UnitLessonCountDto> => {
    const res = await apiClient.get<UnitLessonCountDto>(
      `/api/content/units/${id}/stats/lessons`
    );
    return res.data;
  },

  createUnit: async (
    data: Omit<CourseUnitDto, 'id' | 'createdByTeacherId'>
  ): Promise<CourseUnitDto> => {
    const res = await apiClient.post<CourseUnitDto>('/api/content/units', data);
    return res.data;
  },

  updateUnit: async (
    id: number,
    data: Omit<CourseUnitDto, 'id' | 'createdByTeacherId'>
  ): Promise<CourseUnitDto> => {
    const res = await apiClient.put<CourseUnitDto>(
      `/api/content/units/${id}`,
      data
    );
    return res.data;
  },

  deleteUnit: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/content/units/${id}`);
  },

  
  getLessonsByUnit: async (unitId: number): Promise<LessonDto[]> => {
    const res = await apiClient.get<LessonDto[]>(
      `/api/content/units/${unitId}/lessons`
    );
    return res.data;
  },

  
  getLessonById: async (id: number): Promise<LessonDto> => {
    
    const res = await apiClient.get<LessonDto>(`/api/content/lessons/${id}`);
    return res.data;
  },


  getLessonExerciseTypes: async (
    id: number
  ): Promise<LessonExerciseTypesDto> => {
    const res = await apiClient.get<LessonExerciseTypesDto>(
      `/api/content/lessons/${id}/stats/exercise-types`
    );
    return res.data;
  },


  createLesson: async (
    data: Omit<LessonDto, 'id' | 'exercises'>
  ): Promise<LessonDto> => {
    const res = await apiClient.post<LessonDto>('/api/content/lessons', data);
    return res.data;
  },

  updateLesson: async (
    id: number,
    data: Omit<LessonDto, 'id' | 'exercises'>
  ): Promise<LessonDto> => {
    const res = await apiClient.put<LessonDto>(
      `/api/content/lessons/${id}`,
      data
    );
    return res.data;
  },

  deleteLesson: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/content/lessons/${id}`);
  },

 


  getExercisesByLesson: async (lessonId: number): Promise<ExerciseDto[]> => {
    const res = await apiClient.get<ExerciseDto[]>(
      `/api/content/lessons/${lessonId}/exercises`
    );
    return res.data;
  },

  getExerciseById: async (id: number): Promise<ExerciseDto> => {
    const res = await apiClient.get<ExerciseDto>(
      `/api/content/exercises/${id}`
    );
    return res.data;
  },

  createExercise: async (
    data: Omit<ExerciseDto, 'id'>
  ): Promise<ExerciseDto> => {
    const res = await apiClient.post<ExerciseDto>(
      '/api/content/exercises',
      data
    );
    return res.data;
  },

  updateExercise: async (
    id: number,
    data: Omit<ExerciseDto, 'id' | 'lessonId'>
  ): Promise<ExerciseDto> => {
    const res = await apiClient.put<ExerciseDto>(
      `/api/content/exercises/${id}`,
      data
    );
    return res.data;
  },

  deleteExercise: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/content/exercises/${id}`);
  },




  getMaterialsByLesson: async (
    lessonId: number
  ): Promise<LessonMaterialDto[]> => {
    const res = await apiClient.get<LessonMaterialDto[]>(
      `/api/content/lessons/${lessonId}/materials`
    );
    return res.data;
  },

  createMaterial: async (
    data: Omit<LessonMaterialDto, 'id'>
  ): Promise<LessonMaterialDto> => {
    const res = await apiClient.post<LessonMaterialDto>(
      '/api/content/materials',
      data
    );
    return res.data;
  },



  uploadMaterialFile: async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<string>(
      '/api/content/materials/upload',
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return res.data;
  },

  deleteMaterial: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/content/materials/${id}`);
  },
};