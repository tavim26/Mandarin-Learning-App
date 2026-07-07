import { useState, useCallback } from 'react';
import { usersApi } from '@/api/usersApi';
import type {
  UserDto,
  StudentProfileDto,
  TeacherProfileDto,
} from '@/types';


export type { UserDto, StudentDto, StudentProfileDto, TeacherDto, TeacherProfileDto } from '@/types';

export const useUsers = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [students, setStudents] = useState<StudentProfileDto[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfileDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await usersApi.getAllUsers();
      setUsers(data);
    } catch {
      setError('Failed to load users');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStudents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await usersApi.getAllStudents();
      setStudents(data);
    } catch {
      setError('Failed to load students.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTeachers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await usersApi.getAllTeachers();
      setTeachers(data);
    } catch {
      setError('Failed to load teachers.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createUser = async (data: {
    email: string;
    password: string;
    fullName: string;
    role: 'STUDENT' | 'TEACHER';
  }): Promise<boolean> => {
    try {
      const newUser = await usersApi.createUser(data);
      setUsers((prev) => [...prev, newUser]);
      return true;
    } catch {
      setError('User creation has failed.');
      return false;
    }
  };

  const updateUserName = async (
    id: number,
    newName: string
  ): Promise<boolean> => {
    try {
      const updated = await usersApi.updateName(id, newName);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
      return true;
    } catch {
      setError('Name update has failed.');
      return false;
    }
  };

  const resetUserPassword = async (
    id: number,
    newPassword: string
  ): Promise<boolean> => {
    try {
      await usersApi.resetPassword(id, newPassword);
      return true;
    } catch {
      setError('Password reset has failed.');
      return false;
    }
  };

  const banUser = async (id: number): Promise<boolean> => {
    try {
      await usersApi.banUser(id);
      return true;
    } catch {
      setError('Ban operation has failed.');
      return false;
    }
  };

  const unbanUser = async (id: number): Promise<boolean> => {
    try {
      await usersApi.unbanUser(id);
      return true;
    } catch {
      setError('Unban operation has failed.');
      return false;
    }
  };

  const deleteUser = async (id: number): Promise<boolean> => {
    try {
      await usersApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      setStudents((prev) => prev.filter((s) => s.userId !== id));
      setTeachers((prev) => prev.filter((t) => t.userId !== id));
      return true;
    } catch {
      setError('User deletion has failed.');
      return false;
    }
  };

  const searchUsers = async (name: string): Promise<UserDto[]> => {
    try {
      return await usersApi.searchUsers(name);
    } catch {
      return [];
    }
  };


  const updateStudentNickname = async (userId: number, newNickname: string) => {
    try {
      await usersApi.updateStudentNickname(userId, newNickname);
      await fetchStudents();
      return true;
    } catch {
      setError('Failed to update nickname.');
      return false;
    }
  };

  const updateTeacherTitle = async (userId: number, newTitle: string) => {
    try {
      await usersApi.updateTeacherTitle(userId, newTitle);
      await fetchTeachers();
      return true;
    } catch {
      setError('Failed to update title.');
      return false;
    }
  };

  return {
    users,
    students,
    teachers,
    isLoading,
    error,
    fetchAllUsers,
    fetchStudents,
    fetchTeachers,
    createUser,
    updateUserName,
    resetUserPassword,
    banUser,
    unbanUser,
    deleteUser,
    searchUsers,
    updateStudentNickname,
    updateTeacherTitle
  };
};