import apiClient from './client';

export interface StudentReplicaDto {
  studentId: number;
  xpTotal: number;
  level: number;
}

// Returneaza toti studentii cu XP si nivel — ADMIN only
export const getAllStudentsProgress = async (): Promise<StudentReplicaDto[]> => {
  const response = await apiClient.get<StudentReplicaDto[]>('/api/progress/students/admin/all');
  return response.data;
};

// Returneaza leaderboard-ul global — accesibil tuturor rolurilor
export const getStudentsLeaderboard = async (): Promise<StudentReplicaDto[]> => {
  const response = await apiClient.get<StudentReplicaDto[]>('/api/progress/students/leaderboard');
  return response.data;
};


// Returneaza XP-ul si nivelul unui student dupa ID
export const getStudentReplica = async (studentId: number): Promise<StudentReplicaDto> => {
  const response = await apiClient.get<StudentReplicaDto>(`/api/progress/students/${studentId}`);
  return response.data;
};


export interface StudentLessonProgressDto {
  id: number;
  studentId: number;
  lessonId: number;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  completionPct: number;
  xpAwarded: number | null;
  startedAt: string | null;
  lastAccessedAt: string | null;
  completedAt: string | null;
}

// Leaderboard global — top 10 studenti dupa XP (accesibil TEACHER)
export const getLeaderboard = async (): Promise<StudentReplicaDto[]> => {
  const response = await apiClient.get<StudentReplicaDto[]>('/api/progress/students/leaderboard');
  return response.data;
};

// Leaderboard per lectie — top 10 studenti dupa completionPct (accesibil TEACHER)
export const getLessonLeaderboard = async (lessonId: number): Promise<StudentLessonProgressDto[]> => {
  const response = await apiClient.get<StudentLessonProgressDto[]>(`/api/progress/lessons/${lessonId}/leaderboard`);
  return response.data;
};


export interface StudentSummaryDto {
  studentId: number;
  xpTotal: number;
  level: number;
  completedLessonsCount: number;
  inProgressLessonsCount: number;
}

export interface StudentUnitProgressDto {
  unitId: number;
  studentId: number;
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  notStartedLessons: number;
  unitCompletionPct: number;
}

export const getStudentSummary = async (studentId: number): Promise<StudentSummaryDto> => {
  const response = await apiClient.get<StudentSummaryDto>(`/api/progress/students/${studentId}/summary`);
  return response.data;
};

export const getInProgressLessons = async (studentId: number): Promise<StudentLessonProgressDto[]> => {
  const response = await apiClient.get<StudentLessonProgressDto[]>(`/api/progress/lessons/student/${studentId}/in-progress`);
  return response.data;
};

export const getUnitProgress = async (unitId: number, studentId: number): Promise<StudentUnitProgressDto> => {
  const response = await apiClient.get<StudentUnitProgressDto>(`/api/progress/units/${unitId}/student/${studentId}/progress`);
  return response.data;
};

export const getAllLessonProgress = async (studentId: number): Promise<StudentLessonProgressDto[]> => {
  const response = await apiClient.get<StudentLessonProgressDto[]>(`/api/progress/lessons/student/${studentId}`);
  return response.data;
};


export interface ExerciseAttemptDto {
  id: number;
  studentId: number;
  exerciseId: number;
  attemptNumber: number;
  submittedAt: string;
  submittedAnswer: Record<string, unknown>;
  isCorrect: boolean;
  score: number;
  feedbackText: string | null;
}

export interface SubmitAttemptRequest {
  exerciseId: number;
  submittedAnswer: Record<string, unknown>;
}

export const submitAttempt = async (data: SubmitAttemptRequest): Promise<ExerciseAttemptDto> => {
  const response = await apiClient.post<ExerciseAttemptDto>('/api/progress/attempts', data);
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