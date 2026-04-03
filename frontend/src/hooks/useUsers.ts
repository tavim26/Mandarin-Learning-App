import { useState, useEffect, useCallback } from 'react';
import {
  getAllUsers,
  getAllStudents,
  getAllTeachers,
  createUser,
  deleteUser,
  updateUserName,
  updateUserEmail,
  resetUserPassword,
  updateTeacherTitle,
} from '@/api/usersApi';
import type {
  UserDto,
  StudentProfileDto,
  TeacherProfileDto,
  CreateUserRequest,
} from '@/types';

// --- Hook pentru AdminDashboard ---

export const useAdminOverview = () => {
  const [users, setUsers] = useState<UserDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllUsers();
        setUsers(data);
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const totalStudents = users.filter((u) => u.role === 'STUDENT').length;
  const totalTeachers = users.filter((u) => u.role === 'TEACHER').length;
  const totalAdmins   = users.filter((u) => u.role === 'ADMIN').length;

  return { users, totalStudents, totalTeachers, totalAdmins, loading, error };
};

// --- Tipuri pentru edit form (evita import circular cu modaluri) ---

export interface EditUserForm {
  userId: number;
  fullName: string;
  email: string;
  title?: string;
  type: 'STUDENT' | 'TEACHER';
}

// --- Hook pentru AdminUsers ---

export const useAdminUsers = () => {
  const [students, setStudents] = useState<StudentProfileDto[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfileDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [studentsData, teachersData] = await Promise.all([
        getAllStudents(),
        getAllTeachers(),
      ]);
      setStudents(studentsData);
      setTeachers(teachersData);
    } catch {
      setError('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const editUser = async (data: EditUserForm): Promise<void> => {
    const originalStudent = students.find((s) => s.userId === data.userId);
    const originalTeacher = teachers.find((t) => t.userId === data.userId);
    const original = originalStudent ?? originalTeacher;
    if (!original) return;

    if (data.fullName !== original.fullName) {
      await updateUserName(data.userId, data.fullName);
    }
    if (data.email !== original.email) {
      await updateUserEmail(data.userId, data.email);
    }
    if (data.type === 'TEACHER' && data.title !== undefined) {
      const originalTitle = (original as TeacherProfileDto).title ?? '';
      if (data.title !== originalTitle) {
        await updateTeacherTitle(data.userId, data.title);
      }
    }
    await fetchData();
  };

  const addUser = async (data: CreateUserRequest): Promise<void> => {
    await createUser(data);
    await fetchData();
  };

  const removeUser = async (userId: number): Promise<void> => {
    await deleteUser(userId);
    await fetchData();
  };

  const resetPassword = async (userId: number, newPassword: string): Promise<void> => {
    await resetUserPassword(userId, newPassword);
  };

  return {
    students,
    teachers,
    loading,
    error,
    editUser,
    addUser,
    removeUser,
    resetPassword,
  };
};