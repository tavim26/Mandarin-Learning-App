import apiClient from './client';
import type {
  UserDto,
  StudentDto,
  TeacherDto,
  StudentProfileDto,
  TeacherProfileDto,
  CreateUserRequest,
  CreateUserResponse,
} from '@/types';

export const getAllUsers = async (): Promise<UserDto[]> => {
  const response = await apiClient.get<UserDto[]>('/api/users');
  return response.data;
};

export const getAllStudents = async (): Promise<StudentProfileDto[]> => {
  const response = await apiClient.get<StudentProfileDto[]>('/api/users/students');
  return response.data;
};

export const getAllTeachers = async (): Promise<TeacherProfileDto[]> => {
  const response = await apiClient.get<TeacherProfileDto[]>('/api/users/teachers');
  return response.data;
};

export const createUser = async (data: CreateUserRequest): Promise<CreateUserResponse> => {
  const response = await apiClient.post<CreateUserResponse>('/api/users', data);
  return response.data;
};

export const deleteUser = async (id: number): Promise<void> => {
  await apiClient.delete(`/api/users/${id}`);
};

export const updateUserName = async (id: number, newName: string): Promise<UserDto> => {
  const response = await apiClient.put<UserDto>(
    `/api/users/${id}/name?newName=${encodeURIComponent(newName)}`
  );
  return response.data;
};

export const updateUserEmail = async (id: number, newEmail: string): Promise<UserDto> => {
  const response = await apiClient.put<UserDto>(
    `/api/users/${id}/email?newEmail=${encodeURIComponent(newEmail)}`
  );
  return response.data;
};

export const resetUserPassword = async (id: number, newPassword: string): Promise<void> => {
  await apiClient.put(
    `/api/users/${id}/password/reset?newPassword=${encodeURIComponent(newPassword)}`
  );
};

export const updateOwnPassword = async (
  id: number,
  oldPassword: string,
  newPassword: string
): Promise<void> => {
  await apiClient.put(
    `/api/users/${id}/password?oldPassword=${encodeURIComponent(oldPassword)}&newPassword=${encodeURIComponent(newPassword)}`
  );
};

export const getStudentProfile = async (userId: number): Promise<StudentDto> => {
  const response = await apiClient.get<StudentDto>(`/api/users/students/${userId}`);
  return response.data;
};

export const getTeacherProfile = async (userId: number): Promise<TeacherDto> => {
  const response = await apiClient.get<TeacherDto>(`/api/users/teachers/${userId}`);
  return response.data;
};

export const updateStudentNickname = async (
  userId: number,
  newNickname: string
): Promise<void> => {
  await apiClient.put(
    `/api/users/students/${userId}/nickname?newNickname=${encodeURIComponent(newNickname)}`
  );
};

export const updateTeacherTitle = async (
  userId: number,
  newTitle: string
): Promise<void> => {
  await apiClient.put(
    `/api/users/teachers/${userId}/title?newTitle=${encodeURIComponent(newTitle)}`
  );
};