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