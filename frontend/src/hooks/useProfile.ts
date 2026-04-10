import { useState, useEffect } from 'react';
import { usersApi } from '@/api/usersApi';
import { useAuthStore } from '@/store/authStore';
import type { StudentDto, TeacherDto, UserDto } from '@/types';

export const useProfile = () => {
  const { userId, role } = useAuthStore();

  const [userInfo, setUserInfo] = useState<UserDto | null>(null);
  const [studentProfile, setStudentProfile] = useState<StudentDto | null>(null);
  const [teacherProfile, setTeacherProfile] = useState<TeacherDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      setIsLoading(true);
      try {
        const me = await usersApi.getMe();
        setUserInfo(me);
        if (role === 'STUDENT') {
          const sp = await usersApi.getStudentById(userId);
          setStudentProfile(sp);
        } else if (role === 'TEACHER') {
          const tp = await usersApi.getTeacherById(userId);
          setTeacherProfile(tp);
        }
      } catch {
        setError('Nu s-au putut incarca datele profilului.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [userId, role]);

  const updateEmail = async (newEmail: string): Promise<boolean> => {
    if (!userId) return false;
    setError(null);
    setSuccessMessage(null);
    try {
      const updated = await usersApi.updateEmail(userId, newEmail);
      setUserInfo(updated);
      setSuccessMessage('Email actualizat cu succes.');
      return true;
    } catch {
      setError('Actualizarea email-ului a esuat.');
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
      setSuccessMessage('Parola actualizata cu succes.');
      return true;
    } catch {
      setError('Parola veche este incorecta.');
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
      setSuccessMessage('Nickname actualizat cu succes.');
      return true;
    } catch {
      setError('Nickname-ul este deja folosit.');
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
      setSuccessMessage('Titlul academic actualizat cu succes.');
      return true;
    } catch {
      setError('Actualizarea titlului a esuat.');
      return false;
    }
  };

  return {
    userInfo,
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