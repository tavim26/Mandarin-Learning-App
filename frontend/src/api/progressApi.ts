import apiClient from './client';
import type {
  ExerciseAttemptDto,
  StudentLessonProgressDto,
  StudentReplicaDto,
  StudentSummaryDto,
  StudentUnitProgressDto,
  SubmitAttemptRequest,
} from '@/types';

export const progressApi = {
  // --- Tentative ---
  submitAttempt: async (
    data: SubmitAttemptRequest
  ): Promise<ExerciseAttemptDto> => {
    const res = await apiClient.post<ExerciseAttemptDto>(
      '/api/progress/attempts',
      data
    );
    return res.data;
  },

  getAttemptsByExercise: async (
    studentId: number,
    exerciseId: number
  ): Promise<ExerciseAttemptDto[]> => {
    const res = await apiClient.get<ExerciseAttemptDto[]>(
      `/api/progress/attempts/student/${studentId}/exercise/${exerciseId}`
    );
    return res.data;
  },

  // --- Progres lectii ---
  getLessonProgress: async (
    studentId: number,
    lessonId: number
  ): Promise<StudentLessonProgressDto> => {
    const res = await apiClient.get<StudentLessonProgressDto>(
      `/api/progress/lessons/student/${studentId}/lesson/${lessonId}`
    );
    return res.data;
  },

  getAllLessonProgress: async (
    studentId: number
  ): Promise<StudentLessonProgressDto[]> => {
    const res = await apiClient.get<StudentLessonProgressDto[]>(
      `/api/progress/lessons/student/${studentId}`
    );
    return res.data;
  },

  getInProgressLessons: async (
    studentId: number
  ): Promise<StudentLessonProgressDto[]> => {
    const res = await apiClient.get<StudentLessonProgressDto[]>(
      `/api/progress/lessons/student/${studentId}/in-progress`
    );
    return res.data;
  },

  getLessonLeaderboard: async (
    lessonId: number
  ): Promise<StudentLessonProgressDto[]> => {
    const res = await apiClient.get<StudentLessonProgressDto[]>(
      `/api/progress/lessons/${lessonId}/leaderboard`
    );
    return res.data;
  },

  getStudentSummary: async (studentId: number): Promise<StudentSummaryDto> => {
    const res = await apiClient.get<StudentSummaryDto>(
      `/api/progress/students/${studentId}/summary`
    );
    return res.data;
  },

  getUnitProgress: async (
    unitId: number,
    studentId: number
  ): Promise<StudentUnitProgressDto> => {
    const res = await apiClient.get<StudentUnitProgressDto>(
      `/api/progress/units/${unitId}/student/${studentId}/progress`
    );
    return res.data;
  },

  // --- XP si nivel ---
  getStudentReplica: async (studentId: number): Promise<StudentReplicaDto> => {
    const res = await apiClient.get<StudentReplicaDto>(
      `/api/progress/students/${studentId}`
    );
    return res.data;
  },

  studentExists: async (studentId: number): Promise<boolean> => {
    const res = await apiClient.get<boolean>(
      `/api/progress/students/${studentId}/exists`
    );
    return res.data;
  },

  getLeaderboard: async (): Promise<StudentReplicaDto[]> => {
    const res = await apiClient.get<StudentReplicaDto[]>(
      '/api/progress/students/leaderboard'
    );
    return res.data;
  },

  getAllStudentsAdmin: async (): Promise<StudentReplicaDto[]> => {
    const res = await apiClient.get<StudentReplicaDto[]>(
      '/api/progress/students/admin/all'
    );
    return res.data;
  },
};