import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { getStudentSummary, getInProgressLessons } from '@/api/progressApi';
import { getDueAll } from '@/api/flashcardApi';
import type { StudentSummaryDto, StudentLessonProgressDto, TotalDueStatsDto } from '@/types';
import { XP_PER_LEVEL } from '@/config/constants';

interface StudentDashboardState {
  summary: StudentSummaryDto | null;
  inProgress: StudentLessonProgressDto[];
  dueStats: TotalDueStatsDto | null;
  loading: boolean;
  error: string | null;
  xpProgress: number;
  xpPct: number;
}

export const useStudentDashboard = (): StudentDashboardState => {
  const { userId } = useAuthStore();

  const [summary, setSummary] = useState<StudentSummaryDto | null>(null);
  const [inProgress, setInProgress] = useState<StudentLessonProgressDto[]>([]);
  const [dueStats, setDueStats] = useState<TotalDueStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [summaryData, inProgressData, dueData] = await Promise.all([
          getStudentSummary(userId).catch(() => null),
          getInProgressLessons(userId).catch(() => [] as StudentLessonProgressDto[]),
          getDueAll().catch(() => null),
        ]);
        setSummary(summaryData);
        setInProgress(inProgressData);
        setDueStats(dueData);
      } catch {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  // Calculeaza XP spre urmatorul nivel
  const xpForCurrentLevel = summary ? (summary.level - 1) * XP_PER_LEVEL : 0;
  const xpProgress = summary ? summary.xpTotal - xpForCurrentLevel : 0;
  const xpPct = Math.min((xpProgress / XP_PER_LEVEL) * 100, 100);

  return { summary, inProgress, dueStats, loading, error, xpProgress, xpPct };
};