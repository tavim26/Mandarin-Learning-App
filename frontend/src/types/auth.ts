export type Role = 'STUDENT' | 'TEACHER' | 'ADMIN';

export interface AuthUser {
  token: string;
  userId: number;
  role: Role;
  fullName: string;
  email?: string; 
}

export interface AuthRequestDto {
  email: string;
  password: string;
}

export interface RegisterRequestDto {
  email: string;
  password: string;
  fullName: string;
  role: Role;
}

export interface AuthResponseDto {
  token: string;
  userId: number;
  role: Role;
  fullName: string;
}

export interface RegisterResponseDto {
  userId: number;
  role: Role;
  fullName: string;
}