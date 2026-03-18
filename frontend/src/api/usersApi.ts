import apiClient from './client';

// Tipul unui utilizator returnat de backend
export interface UserDto {
  id: number;
  fullName: string;
  role: 'STUDENT' | 'TEACHER' | 'ADMIN';
}

// Returneaza toti utilizatorii — ADMIN only
export const getAllUsers = async (): Promise<UserDto[]> => {
  const response = await apiClient.get<UserDto[]>('/api/users');
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


// Cauta utilizatori dupa nume — ADMIN only
export const searchUsers = async (name: string): Promise<UserDto[]> => {
  const response = await apiClient.get<UserDto[]>(`/api/users/search?name=${name}`);
  return response.data;
};

// Redenumeste un utilizator — ADMIN only
export const updateUserName = async (id: number, newName: string): Promise<UserDto> => {
  const response = await apiClient.put<UserDto>(`/api/users/${id}/name?newName=${newName}`);
  return response.data;
};