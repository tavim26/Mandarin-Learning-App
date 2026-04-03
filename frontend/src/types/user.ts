import type { Role } from './auth';

// --- DTOs primite de la backend ---

export interface UserDto {
  id: number;
  fullName: string;
  role: Role;
}

export interface StudentDto {
  userId: number;
  nickname: string | null;
}

export interface TeacherDto {
  userId: number;
  title: string | null;
}

// Profil complet student — folosit in lista de admin
export interface StudentProfileDto {
  userId: number;
  fullName: string;
  role: 'STUDENT';
  nickname: string | null;
  email: string;
}

// Profil complet profesor — folosit in lista de admin
export interface TeacherProfileDto {
  userId: number;
  fullName: string;
  role: 'TEACHER';
  title: string | null;
  email: string;
}

// Raspuns la POST /api/users (creare de catre admin)
export interface CreateUserResponse {
  id: number;
  fullName: string;
  role: Role;
}

// --- Request bodies ---

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  role: 'STUDENT' | 'TEACHER';
}