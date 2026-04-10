import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useProgress } from './useProgress';
import { useFlashcards } from './useFlashcards';
import { useContent } from './useContent';

// Hook compozit — agrega datele necesare exclusiv pentru dashboard-ul studentului.
// O singura sursa pentru pagina StudentDashboard, evita apeluri multiple in componenta.
export const useStudentDashboard = () => {
  const { userId } = useAuthStore();

  const {
    summary,
    inProgressLessons,
    leaderboard,
    isLoading: isLoadingProgress,
    fetchSummary,
    fetchInProgressLessons,
    fetchLeaderboard,
  } = useProgress();

  const {
    totalDue,
    isLoading: isLoadingFlashcards,
    fetchTotalDue,
  } = useFlashcards();

  const {
    units,
    isLoading: isLoadingContent,
    fetchUnits,
  } = useContent();

  useEffect(() => {
    if (!userId) return;
    fetchSummary();
    fetchInProgressLessons();
    fetchLeaderboard();
    fetchTotalDue();
    fetchUnits();
  }, [
    userId,
    fetchSummary,
    fetchInProgressLessons,
    fetchLeaderboard,
    fetchTotalDue,
    fetchUnits,
  ]);

  const isLoading =
    isLoadingProgress || isLoadingFlashcards || isLoadingContent;

  return {
    summary,
    inProgressLessons,
    leaderboard,
    totalDue,
    units,
    isLoading,
  };
};