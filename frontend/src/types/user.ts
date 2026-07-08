import type { Role } from './auth';

export interface UserDto {
  id: number;
  fullName: string;
  role: Role;
  banned: boolean;
}

export interface StudentDto {
  userId: number;
  nickname: string;
}

export interface StudentProfileDto {
  userId: number;
  fullName: string;
  role: 'STUDENT';
  nickname: string;
  email: string;
  banned: boolean;
}

export interface TeacherDto {
  userId: number;
  title: string;
}

export interface TeacherProfileDto {
  userId: number;
  fullName: string;
  role: 'TEACHER';
  title: string;
  email: string;
  banned: boolean;
}