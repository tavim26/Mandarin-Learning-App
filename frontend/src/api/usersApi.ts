import apiClient from './client';

export interface UserDto {
  id: number;
  fullName: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

export interface StudentProfileDto {
  userId: number;
  fullName: string;
  role: 'STUDENT';
  nickname: string | null;
  email: string;
}

export interface TeacherProfileDto {
  userId: number;
  fullName: string;
  role: 'TEACHER';
  title: string | null;
  email: string;
}

// Returneaza toti utilizatorii — ADMIN only
export const getAllUsers = async (): Promise<UserDto[]> => {
  const response = await apiClient.get<UserDto[]>('/api/users');
  return response.data;
};

// Returneaza toti studentii cu profil complet — ADMIN only
export const getAllStudents = async (): Promise<StudentProfileDto[]> => {
  const response = await apiClient.get<StudentProfileDto[]>('/api/users/students');
  return response.data;
};

// Returneaza toti profesorii cu profil complet — ADMIN only
export const getAllTeachers = async (): Promise<TeacherProfileDto[]> => {
  const response = await apiClient.get<TeacherProfileDto[]>('/api/users/teachers');
  return response.data;
};

// Sterge un utilizator dupa ID — ADMIN only
export const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/users/${id}`);
};

// Creeaza un utilizator nou — ADMIN only
export const createUser = async (data: {
  fullName: string;
  email: string;
  password: string;
  role: 'STUDENT' | 'TEACHER';
}): Promise<UserDto> => {
  const response = await apiClient.post<UserDto>('/api/users', data);
  return response.data;
};

// Redenumeste un utilizator — ADMIN only
export const updateUserName = async (id: number, newName: string): Promise<UserDto> => {
  const response = await apiClient.put<UserDto>(`/api/users/${id}/name?newName=${encodeURIComponent(newName)}`);
  return response.data;
};

// Schimba emailul unui utilizator — ADMIN only
export const updateUserEmail = async (id: number, newEmail: string): Promise<UserDto> => {
  const response = await apiClient.put<UserDto>(`/api/users/${id}/email?newEmail=${encodeURIComponent(newEmail)}`);
  return response.data;
};

// Reseteaza parola unui utilizator — ADMIN only
export const resetUserPassword = async (id: number, newPassword: string): Promise<void> => {
  await apiClient.put(`/api/users/${id}/password/reset?newPassword=${encodeURIComponent(newPassword)}`);
};


// Actualizeaza titlul unui profesor
export const updateTeacherTitle = async (userId: number, newTitle: string): Promise<void> => {
  await apiClient.put(`/api/users/teachers/${userId}/title?newTitle=${encodeURIComponent(newTitle)}`);
};



// Obtine datele profilului unui student
export const getStudentProfile = async (userId: number): Promise<StudentProfileDto> => {
  const response = await apiClient.get<StudentProfileDto>(`/api/users/students/${userId}`);
  return response.data;
};

// Obtine datele profilului unui profesor
export const getTeacherProfile = async (userId: number): Promise<TeacherProfileDto> => {
  const response = await apiClient.get<TeacherProfileDto>(`/api/users/teachers/${userId}`);
  return response.data;
};

// Schimba parola utilizatorului autentificat
export const updateOwnPassword = async (
  id: number,
  oldPassword: string,
  newPassword: string
): Promise<void> => {
  await apiClient.put(
    `/api/users/${id}/password?oldPassword=${encodeURIComponent(oldPassword)}&newPassword=${encodeURIComponent(newPassword)}`
  );
};

// Schimba nickname-ul unui student
export const updateStudentNickname = async (userId: number, newNickname: string): Promise<void> => {
  await apiClient.put(
    `/api/users/students/${userId}/nickname?newNickname=${encodeURIComponent(newNickname)}`
  );
};