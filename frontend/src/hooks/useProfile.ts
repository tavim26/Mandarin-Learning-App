import { useState, useEffect } from 'react';
import { usersApi } from '@/api/usersApi';
import { useAuthStore } from '@/store/authStore';
import type { StudentDto, TeacherDto } from '@/types';

export const useProfile = () => {
  const { userId, role, fullName } = useAuthStore();

  const [studentProfile, setStudentProfile] = useState<StudentDto | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<TeacherDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const loadExtended = async () => {
      setIsLoading(true);
      try {
        if (role === 'STUDENT') {
          const sp = await usersApi.getStudentById(userId);
          setStudentProfile(sp);
        } else if (role === 'TEACHER') {
          const tp = await usersApi.getTeacherById(userId);
          setTeacherProfile(tp);
        }
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    };
    loadExtended();
  }, [userId, role]);

  const updateEmail = async (newEmail: string): Promise<boolean> => {
    if (!userId) return false;
    setError(null);
    setSuccessMessage(null);
    try {
      await usersApi.updateEmail(userId, newEmail);
      setSuccessMessage('Email updated successfully.');
      return true;
    } catch {
      setError('Failed to update email.');
      return false;
    }
  };

  const updatePassword = async (
    oldPassword: string,
    newPassword: string
  ): Promise<boolean> => {
    if (!userId) return false;
    setError(null);
    setSuccessMessage(null);
    try {
      await usersApi.updatePassword(userId, oldPassword, newPassword);
      setSuccessMessage('Password updated successfully.');
      return true;
    } catch {
      setError('Current password is incorrect.');
      return false;
    }
  };

  const updateNickname = async (newNickname: string): Promise<boolean> => {
    if (!userId) return false;
    setError(null);
    setSuccessMessage(null);
    try {
      const updated = await usersApi.updateStudentNickname(userId, newNickname);
      setStudentProfile(updated);
      setSuccessMessage('Nickname updated successfully.');
      return true;
    } catch {
      setError('Nickname is already taken.');
      return false;
    }
  };

  const updateTitle = async (newTitle: string): Promise<boolean> => {
    if (!userId) return false;
    setError(null);
    setSuccessMessage(null);
    try {
      const updated = await usersApi.updateTeacherTitle(userId, newTitle);
      setTeacherProfile(updated);
      setSuccessMessage('Title updated successfully.');
      return true;
    } catch {
      setError('Failed to update title.');
      return false;
    }
  };

  return {
    fullName,
    role,
    studentProfile,
    teacherProfile,
    isLoading,
    error,
    successMessage,
    updateEmail,
    updatePassword,
    updateNickname,
    updateTitle,
  };
};