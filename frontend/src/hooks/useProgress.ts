import { useState, useCallback } from 'react';
import { progressApi } from '@/api/progressApi';
import { useAuthStore } from '@/store/authStore';
import type {
  ExerciseAttemptDto,
  StudentLessonProgressDto,
  StudentReplicaDto,
  StudentSummaryDto,
  StudentUnitProgressDto,
  SubmitAttemptRequest,
} from '@/types';

export type {
  ExerciseAttemptDto,
  StudentLessonProgressDto,
  StudentReplicaDto,
  StudentSummaryDto,
  StudentUnitProgressDto,
  SubmitAttemptRequest,
  SubmittedAnswer,
} from '@/types';


export const useProgress = () => {
  const { userId } = useAuthStore();

  const [summary, setSummary] = useState<StudentSummaryDto | null>(null);
  const [replica, setReplica] = useState<StudentReplicaDto | null>(null);

  const [lessonProgress, setLessonProgress] = useState <StudentLessonProgressDto | null | undefined>(undefined); 

  const [allLessonProgress, setAllLessonProgress] = useState <StudentLessonProgressDto[]
  >([]);
  const [inProgressLessons, setInProgressLessons] = useState <StudentLessonProgressDto[]
  >([]);
  
  const [unitProgress, setUnitProgress] =
    useState<StudentUnitProgressDto | null>(null);

  const [leaderboard, setLeaderboard] = useState<StudentReplicaDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);




  const fetchSummary = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await progressApi.getStudentSummary(userId);
      setSummary(data);
    } catch {
      setError('Could not load student summary.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchReplica = useCallback(async () => {
    if (!userId) return;
    try {
      const exists = await progressApi.studentExists(userId);
      if (exists) {
        const data = await progressApi.getStudentReplica(userId);
        setReplica(data);
      }
    } catch {
      // ignore
    }
  }, [userId]);

  const fetchLessonProgress = useCallback(
    async (lessonId: number) => {
      if (!userId) return;
      setIsLoading(true);
      try {
        const data = await progressApi.getLessonProgress(userId, lessonId);
        setLessonProgress(data);
      } catch {
        // ignore
        setLessonProgress(null);
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  const fetchAllLessonProgress = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const data = await progressApi.getAllLessonProgress(userId);
      setAllLessonProgress(data);
    } catch {
      setError('Could not load lesson progress');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchInProgressLessons = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await progressApi.getInProgressLessons(userId);
      setInProgressLessons(data);
    } catch {
      setInProgressLessons([]);
    }
  }, [userId]);

  const fetchUnitProgress = useCallback(
    async (unitId: number) => {
      if (!userId) return;
      setIsLoading(true);
      try {
        const data = await progressApi.getUnitProgress(unitId, userId);
        setUnitProgress(data);
      } catch {
        setError('Could not load unit progress.');
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  const fetchLeaderboard = useCallback(async () => {
    try {
      const data = await progressApi.getLeaderboard();
      setLeaderboard(data);
    } catch {
      setLeaderboard([]);
    }
  }, []);

  const submitAttempt = async (
    data: SubmitAttemptRequest
  ): Promise<ExerciseAttemptDto | null> => {
    try {
      const result = await progressApi.submitAttempt(data);
      if (replica) {
        fetchReplica();
      }
      return result;
    } catch {
      setError('Sending has failed.');
      return null;
    }
  };

  const getLessonProgressFromCache = useCallback(
    (lessonId: number): StudentLessonProgressDto | undefined => {
      return allLessonProgress.find(
        (p: StudentLessonProgressDto) => p.lessonId === lessonId
      );
    },
    [allLessonProgress]
  );


  const getLatestLessonProgress = async (lessonId: number): Promise<StudentLessonProgressDto | null> => {
    if (!userId) return null;
    try {
      return await progressApi.getLessonProgress(userId, lessonId);
    } catch {
      return null;
    }
  };

  return {
    summary,
    replica,
    lessonProgress,
    allLessonProgress,
    inProgressLessons,
    unitProgress,
    leaderboard,
    isLoading,
    error,
    fetchSummary,
    fetchReplica,
    fetchLessonProgress,
    fetchAllLessonProgress,
    fetchInProgressLessons,
    fetchUnitProgress,
    fetchLeaderboard,
    submitAttempt,
    getLessonProgressFromCache,
    getLatestLessonProgress
  };
};