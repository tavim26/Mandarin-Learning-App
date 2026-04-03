import apiClient from './client';
import type {
  StudentReplicaDto,
  StudentSummaryDto,
  StudentLessonProgressDto,
  StudentUnitProgressDto,
  ExerciseAttemptDto,
  SubmitAttemptRequest,
} from '@/types';

// --- Studenti si XP ---

// Top 10 studenti dupa XP — accesibil tuturor rolurilor
export const getLeaderboard = async (): Promise<StudentReplicaDto[]> => {
  const response = await apiClient.get<StudentReplicaDto[]>(
    '/api/progress/students/leaderboard'
  );
  return response.data;
};

// Lista completa studenti cu XP — ADMIN only
export const getAllStudentsProgress = async (): Promise<StudentReplicaDto[]> => {
  const response = await apiClient.get<StudentReplicaDto[]>(
    '/api/progress/students/admin/all'
  );
  return response.data;
};

export const getStudentReplica = async (studentId: number): Promise<StudentReplicaDto> => {
  const response = await apiClient.get<StudentReplicaDto>(
    `/api/progress/students/${studentId}`
  );
  return response.data;
};

export const getStudentSummary = async (studentId: number): Promise<StudentSummaryDto> => {
  const response = await apiClient.get<StudentSummaryDto>(
    `/api/progress/students/${studentId}/summary`
  );
  return response.data;
};

// --- Progres lectii ---

export const getLessonLeaderboard = async (
  lessonId: number
): Promise<StudentLessonProgressDto[]> => {
  const response = await apiClient.get<StudentLessonProgressDto[]>(
    `/api/progress/lessons/${lessonId}/leaderboard`
  );
  return response.data;
};

export const getLessonProgress = async (
  studentId: number,
  lessonId: number
): Promise<StudentLessonProgressDto> => {
  const response = await apiClient.get<StudentLessonProgressDto>(
    `/api/progress/lessons/student/${studentId}/lesson/${lessonId}`
  );
  return response.data;
};

export const getAllLessonProgress = async (
  studentId: number
): Promise<StudentLessonProgressDto[]> => {
  const response = await apiClient.get<StudentLessonProgressDto[]>(
    `/api/progress/lessons/student/${studentId}`
  );
  return response.data;
};

export const getInProgressLessons = async (
  studentId: number
): Promise<StudentLessonProgressDto[]> => {
  const response = await apiClient.get<StudentLessonProgressDto[]>(
    `/api/progress/lessons/student/${studentId}/in-progress`
  );
  return response.data;
};

// --- Progres unitati ---

export const getUnitProgress = async (
  unitId: number,
  studentId: number
): Promise<StudentUnitProgressDto> => {
  const response = await apiClient.get<StudentUnitProgressDto>(
    `/api/progress/units/${unitId}/student/${studentId}/progress`
  );
  return response.data;
};

// --- Tentative exercitii ---

export const submitAttempt = async (
  data: SubmitAttemptRequest
): Promise<ExerciseAttemptDto> => {
  const response = await apiClient.post<ExerciseAttemptDto>('/api/progress/attempts', data);
  return response.data;
};