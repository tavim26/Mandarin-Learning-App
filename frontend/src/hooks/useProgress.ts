import { useState, useEffect } from 'react';
import {
  getLeaderboard,
  getAllStudentsProgress,
  getStudentSummary,
  getStudentReplica,
  getLessonLeaderboard,
  getLessonProgress,
  getAllLessonProgress,
  getInProgressLessons,
  getUnitProgress,
  submitAttempt,
} from '@/api/progressApi';
import type {
  StudentReplicaDto,
  StudentSummaryDto,
  StudentLessonProgressDto,
  StudentUnitProgressDto,
  ExerciseAttemptDto,
  SubmitAttemptRequest,
  CourseUnitDto
} from '@/types';

import { getAllUnits } from '@/api/contentApi';

// --- Leaderboard global ---

export const useLeaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<StudentReplicaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getLeaderboard();
        setLeaderboard(data);
      } catch {
        setError('Failed to load leaderboard.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { leaderboard, loading, error };
};

// --- Leaderboard admin (toti studentii) ---

export const useAllStudentsProgress = () => {
  const [students, setStudents] = useState<StudentReplicaDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllStudentsProgress();
        setStudents(data);
      } catch {
        setError('Failed to load students progress.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  return { students, loading, error };
};

// --- Summary student (XP, nivel, lectii) ---

export const useStudentSummary = (studentId: number) => {
  const [summary, setSummary] = useState<StudentSummaryDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getStudentSummary(studentId);
        setSummary(data);
      } catch {
        setError('Failed to load student summary.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [studentId]);

  return { summary, loading, error };
};

// --- Progres per unitate ---

export const useUnitProgress = (unitId: number, studentId: number) => {
  const [progress, setProgress] = useState<StudentUnitProgressDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getUnitProgress(unitId, studentId);
        setProgress(data);
      } catch {
        setError('Failed to load unit progress.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [unitId, studentId]);

  return { progress, loading, error };
};

// --- Progres per lectie ---

export const useLessonProgress = (studentId: number, lessonId: number) => {
  const [progress, setProgress] = useState<StudentLessonProgressDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLessonProgress(studentId, lessonId);
      setProgress(data);
    } catch {
      // 404 inseamna ca lectia nu a fost inceputa inca
      setProgress(null);
    } finally {
      setLoading(false);
    }
  };

  // Refetch fara loading state — returneaza datele noi direct
  const refetch = async (): Promise<StudentLessonProgressDto | null> => {
    try {
      const data = await getLessonProgress(studentId, lessonId);
      setProgress(data);
      return data;
    } catch {
      return null;
    }
  };

  useEffect(() => { fetchProgress(); }, [studentId, lessonId]);

  return { progress, loading, error, refetch };
};

// --- Leaderboard per lectie ---

export const useLessonLeaderboard = (lessonId: number) => {
  const [leaderboard, setLeaderboard] = useState<StudentLessonProgressDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getLessonLeaderboard(lessonId);
        setLeaderboard(data);
      } catch {
        setError('Failed to load lesson leaderboard.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [lessonId]);

  return { leaderboard, loading, error };
};

// --- Tentative exercitii ---

export const useExerciseAttempts = () => {
  const [attempts, setAttempts] = useState<ExerciseAttemptDto[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (data: SubmitAttemptRequest): Promise<ExerciseAttemptDto> => {
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitAttempt(data);
      setAttempts((prev) => [...prev, result]);
      return result;
    } catch (err) {
      setError('Failed to submit attempt.');
      throw err;
    } finally {
      setSubmitting(false);
    }
  };

  return { attempts, submitting, error, submit };
};

// --- Replica student (XP + nivel, fara detalii lectii) ---

export const useStudentReplica = (studentId: number) => {
  const [replica, setReplica] = useState<StudentReplicaDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getStudentReplica(studentId);
        setReplica(data);
      } catch {
        // 404 inseamna ca studentul nu a trimis nicio tentativa inca
        setReplica(null);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [studentId]);

  return { replica, loading, error };
};

// --- Toate lectiile incepute de un student ---

export const useAllLessonProgress = (studentId: number) => {
  const [lessons, setLessons] = useState<StudentLessonProgressDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getAllLessonProgress(studentId);
        setLessons(data);
      } catch {
        setError('Failed to load lesson progress.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [studentId]);

  return { lessons, loading, error };
};

// --- Lectiile in curs ale unui student ---

export const useInProgressLessons = (studentId: number) => {
  const [lessons, setLessons] = useState<StudentLessonProgressDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getInProgressLessons(studentId);
        setLessons(data);
      } catch {
        setError('Failed to load in-progress lessons.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [studentId]);

  return { lessons, loading, error };
};


// --- Progress pentru toate unitatile unui student (folosit in StudentUnitsPage) ---

export const useUnitsWithProgress = (userId: number) => {
  const [units, setUnits] = useState<CourseUnitDto[]>([]);
  const [progressMap, setProgressMap] = useState<Record<number, StudentUnitProgressDto>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const unitsData = await getAllUnits();
        setUnits(unitsData);

        const progressResults = await Promise.allSettled(
          unitsData.map((u) => getUnitProgress(u.id, userId))
        );

        const map: Record<number, StudentUnitProgressDto> = {};
        progressResults.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            map[unitsData[index].id] = result.value;
          }
        });
        setProgressMap(map);
      } catch {
        setError('Failed to load course units.');
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [userId]);

  return { units, progressMap, loading, error };
};