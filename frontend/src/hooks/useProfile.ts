import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  updateUserName,
  updateUserEmail,
  updateOwnPassword,
  updateStudentNickname,
  updateTeacherTitle,
  getTeacherProfile,
} from '@/api/usersApi';
import { getStudentReplica } from '@/api/progressApi';

// --- Hook comun pentru toate profilurile ---

export const useProfilePassword = (userId: number) => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const submit = async () => {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);
      await updateOwnPassword(userId, oldPassword, newPassword);
      setSuccess(true);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setError('Current password is incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return {
    oldPassword, setOldPassword,
    newPassword, setNewPassword,
    confirmPassword, setConfirmPassword,
    showOldPassword, setShowOldPassword,
    loading, error, success,
    submit,
  };
};

// --- Hook profil student ---

export const useStudentProfile = () => {
  const { userId, fullName, role, email, token, setAuth } = useAuthStore();

  const [nameValue, setNameValue] = useState(fullName ?? '');
  const [emailValue, setEmailValue] = useState('');
  const [nicknameValue, setNicknameValue] = useState('');
  const [studentStats, setStudentStats] = useState<{ xpTotal: number; level: number } | null>(null);
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [infoSuccess, setInfoSuccess] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const fetch = async () => {
      try {
        const data = await getStudentReplica(userId);
        setStudentStats({ xpTotal: data.xpTotal, level: data.level });
      } catch {
        // 404 — student fara activitate
        setStudentStats({ xpTotal: 0, level: 1 });
      }
    };
    fetch();
  }, [userId]);

  const saveInfo = async () => {
    if (!userId || !token || !role) return;
    try {
      setInfoLoading(true);
      setInfoError(null);
      setInfoSuccess(false);
      if (nameValue !== fullName) await updateUserName(userId, nameValue);
      if (emailValue.trim() !== '') await updateUserEmail(userId, emailValue);
      await updateStudentNickname(userId, nicknameValue);
      setAuth({
        token, userId, role,
        fullName: nameValue,
        email: emailValue.trim() !== '' ? emailValue : (email ?? ''),
      });
      setInfoSuccess(true);
      setEmailValue('');
    } catch {
      setInfoError('Failed to update profile.');
    } finally {
      setInfoLoading(false);
    }
  };

  return {
    nameValue, setNameValue,
    emailValue, setEmailValue,
    nicknameValue, setNicknameValue,
    studentStats,
    infoLoading, infoError, infoSuccess,
    saveInfo,
    fullName, role, email, userId: userId!,
  };
};

// --- Hook profil profesor ---

export const useTeacherProfile = () => {
  const { userId, fullName, role, email, token, setAuth } = useAuthStore();

  const [nameValue, setNameValue] = useState(fullName ?? '');
  const [emailValue, setEmailValue] = useState('');
  const [titleValue, setTitleValue] = useState('');
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [infoSuccess, setInfoSuccess] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const fetch = async () => {
      try {
        const profile = await getTeacherProfile(userId);
        setTitleValue(profile.title ?? '');
      } catch {
        // Titlul ramane gol
      }
    };
    fetch();
  }, [userId]);

  const saveInfo = async () => {
    if (!userId || !token || !role) return;
    try {
      setInfoLoading(true);
      setInfoError(null);
      setInfoSuccess(false);
      if (nameValue !== fullName) await updateUserName(userId, nameValue);
      if (emailValue.trim() !== '') await updateUserEmail(userId, emailValue);
      await updateTeacherTitle(userId, titleValue);
      setAuth({
        token, userId, role,
        fullName: nameValue,
        email: emailValue.trim() !== '' ? emailValue : (email ?? ''),
      });
      setInfoSuccess(true);
      setEmailValue('');
    } catch {
      setInfoError('Failed to update profile.');
    } finally {
      setInfoLoading(false);
    }
  };

  return {
    nameValue, setNameValue,
    emailValue, setEmailValue,
    titleValue, setTitleValue,
    infoLoading, infoError, infoSuccess,
    saveInfo,
    fullName, role, email, userId: userId!,
  };
};

// --- Hook profil admin ---

export const useAdminProfile = () => {
  const { userId, fullName, role, email, token, setAuth } = useAuthStore();

  const [nameValue, setNameValue] = useState(fullName ?? '');
  const [emailValue, setEmailValue] = useState('');
  const [infoLoading, setInfoLoading] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [infoSuccess, setInfoSuccess] = useState(false);

  const saveInfo = async () => {
    if (!userId || !token || !role) return;
    try {
      setInfoLoading(true);
      setInfoError(null);
      setInfoSuccess(false);
      if (nameValue !== fullName) await updateUserName(userId, nameValue);
      if (emailValue.trim() !== '') await updateUserEmail(userId, emailValue);
      setAuth({
        token, userId, role,
        fullName: nameValue,
        email: emailValue.trim() !== '' ? emailValue : (email ?? ''),
      });
      setInfoSuccess(true);
      setEmailValue('');
    } catch {
      setInfoError('Failed to update profile.');
    } finally {
      setInfoLoading(false);
    }
  };

  return {
    nameValue, setNameValue,
    emailValue, setEmailValue,
    infoLoading, infoError, infoSuccess,
    saveInfo,
    fullName, role, email, userId: userId!,
  };
};