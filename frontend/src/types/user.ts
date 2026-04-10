import type { Role } from './auth';

export interface UserDto {
  id: number;
  fullName: string;
  role: Role;
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
}