import apiClient from './client';
import type {
  UserDto,
  StudentDto,
  StudentProfileDto,
  TeacherDto,
  TeacherProfileDto,
} from '@/types';

export const usersApi = {
 
  createUser: async (data: {
    email: string;
    password: string;
    fullName: string;
    role: 'STUDENT' | 'TEACHER';
  }): Promise<UserDto> => {
    const res = await apiClient.post<UserDto>('/api/users', data);
    return res.data;
  },

  getAllUsers: async (): Promise<UserDto[]> => {
    const res = await apiClient.get<UserDto[]>('/api/users');
    return res.data;
  },

  getUserById: async (id: number): Promise<UserDto> => {
    const res = await apiClient.get<UserDto>(`/api/users/${id}`);
    return res.data;
  },

  searchUsers: async (name: string): Promise<UserDto[]> => {
    const res = await apiClient.get<UserDto[]>('/api/users/search', {
      params: { name },
    });
    return res.data;
  },

  getMe: async (): Promise<UserDto> => {
    const res = await apiClient.get<UserDto>('/api/users/me');
    return res.data;
  },

  updateName: async (id: number, newName: string): Promise<UserDto> => {
    const res = await apiClient.put<UserDto>(`/api/users/${id}/name`, null, {
      params: { newName },
    });
    return res.data;
  },

  updateEmail: async (id: number, newEmail: string): Promise<UserDto> => {
    const res = await apiClient.put<UserDto>(`/api/users/${id}/email`, null, {
      params: { newEmail },
    });
    return res.data;
  },

  updatePassword: async (
    id: number,
    oldPassword: string,
    newPassword: string
  ): Promise<void> => {
    await apiClient.put(`/api/users/${id}/password`, null, {
      params: { oldPassword, newPassword },
    });
  },

  resetPassword: async (id: number, newPassword: string): Promise<void> => {
    await apiClient.put(`/api/users/${id}/password/reset`, null, {
      params: { newPassword },
    });
  },

  banUser: async (id: number): Promise<void> => {
    await apiClient.put(`/api/users/${id}/ban`);
  },

  unbanUser: async (id: number): Promise<void> => {
    await apiClient.put(`/api/users/${id}/unban`);
  },

  deleteUser: async (id: number): Promise<void> => {
    await apiClient.delete(`/api/users/${id}`);
  },

  
  getAllStudents: async (): Promise<StudentProfileDto[]> => {
    const res = await apiClient.get<StudentProfileDto[]>('/api/users/students');
    return res.data;
  },

  getStudentById: async (userId: number): Promise<StudentDto> => {
    const res = await apiClient.get<StudentDto>(`/api/users/students/${userId}`);
    return res.data;
  },

  searchStudents: async (nickname: string): Promise<StudentDto[]> => {
    const res = await apiClient.get<StudentDto[]>('/api/users/students/search', {
      params: { nickname },
    });
    return res.data;
  },

  updateStudentNickname: async (
    userId: number,
    newNickname: string
  ): Promise<StudentDto> => {
    const res = await apiClient.put<StudentDto>(
      `/api/users/students/${userId}/nickname`,
      null,
      { params: { newNickname } }
    );
    return res.data;
  },

  
  getAllTeachers: async (): Promise<TeacherProfileDto[]> => {
    const res = await apiClient.get<TeacherProfileDto[]>('/api/users/teachers');
    return res.data;
  },

  getTeacherById: async (userId: number): Promise<TeacherDto> => {
    const res = await apiClient.get<TeacherDto>(`/api/users/teachers/${userId}`);
    return res.data;
  },

  updateTeacherTitle: async (
    userId: number,
    newTitle: string
  ): Promise<TeacherDto> => {
    const res = await apiClient.put<TeacherDto>(
      `/api/users/teachers/${userId}/title`,
      null,
      { params: { newTitle } }
    );
    return res.data;
  },
};