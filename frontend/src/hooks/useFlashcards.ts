import { useState, useCallback } from 'react';
import { flashcardApi } from '@/api/flashcardApi';
import { useAuthStore } from '@/store/authStore';
import type {
  FlashcardSetDto,
  FlashcardDto,
  FlashcardSetStatsDto,
  TotalDueStatsDto,
  CreateFlashcardSetRequest,
  UpdateFlashcardSetRequest,
  CreateFlashcardRequest,
  UpdateFlashcardRequest,
} from '@/types';

export type { FlashcardSetDto,FlashcardProgressDto, FlashcardDto, FlashcardSetStatsDto, TotalDueStatsDto, ReviewQuality } from '@/types';

export const useFlashcards = () => {
  const { userId } = useAuthStore();

  const [sets, setSets] = useState<FlashcardSetDto[]>([]);
  const [currentCards, setCurrentCards] = useState<FlashcardDto[]>([]);
  const [currentSetStats, setCurrentSetStats] =
    useState<FlashcardSetStatsDto | null>(null);
  const [totalDue, setTotalDue] = useState<TotalDueStatsDto | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSets = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await flashcardApi.getSetsByStudent(userId);
      setSets(data);
    } catch {
      setError('Nu s-au putut incarca seturile de flashcard-uri.');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const fetchCards = useCallback(async (setId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await flashcardApi.getCardsBySet(setId);
      setCurrentCards(data);
    } catch {
      setError('Nu s-au putut incarca cardurile.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchSetStats = useCallback(async (setId: number) => {
    try {
      const data = await flashcardApi.getSetStats(setId);
      setCurrentSetStats(data);
    } catch {
      setCurrentSetStats(null);
    }
  }, []);

  const fetchTotalDue = useCallback(async () => {
    try {
      const data = await flashcardApi.getTotalDue();
      setTotalDue(data);
    } catch {
      setTotalDue(null);
    }
  }, []);

  const createSet = async (
    data: CreateFlashcardSetRequest
  ): Promise<FlashcardSetDto | null> => {
    setIsSaving(true);
    try {
      const created = await flashcardApi.createSet(data);
      setSets((prev) => [created, ...prev]);
      return created;
    } catch {
      setError('Crearea setului a esuat.');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const updateSet = async (
    setId: number,
    data: UpdateFlashcardSetRequest
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      const updated = await flashcardApi.updateSet(setId, data);
      setSets((prev) => prev.map((s) => (s.id === setId ? updated : s)));
      return true;
    } catch {
      setError('Actualizarea setului a esuat.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteSet = async (setId: number): Promise<boolean> => {
    try {
      await flashcardApi.deleteSet(setId);
      setSets((prev) => prev.filter((s) => s.id !== setId));
      return true;
    } catch {
      setError('Stergerea setului a esuat.');
      return false;
    }
  };

  const createCard = async (
    data: CreateFlashcardRequest
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      const created = await flashcardApi.createCard(data);
      setCurrentCards((prev) => [...prev, created]);
      // Actualizeaza cardCount in lista de seturi
      setSets((prev) =>
        prev.map((s) =>
          s.id === data.setId ? { ...s, cardCount: s.cardCount + 1 } : s
        )
      );
      return true;
    } catch {
      setError('Adaugarea cardului a esuat.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const updateCard = async (
    flashcardId: number,
    data: UpdateFlashcardRequest
  ): Promise<boolean> => {
    setIsSaving(true);
    try {
      const updated = await flashcardApi.updateCard(flashcardId, data);
      setCurrentCards((prev) =>
        prev.map((c) => (c.id === flashcardId ? updated : c))
      );
      return true;
    } catch {
      setError('Actualizarea cardului a esuat.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const deleteCard = async (
    flashcardId: number,
    setId: number
  ): Promise<boolean> => {
    try {
      await flashcardApi.deleteCard(flashcardId);
      setCurrentCards((prev) => prev.filter((c) => c.id !== flashcardId));
      setSets((prev) =>
        prev.map((s) =>
          s.id === setId ? { ...s, cardCount: Math.max(0, s.cardCount - 1) } : s
        )
      );
      return true;
    } catch {
      setError('Stergerea cardului a esuat.');
      return false;
    }
  };

  return {
    sets,
    currentCards,
    currentSetStats,
    totalDue,
    isLoading,
    isSaving,
    error,
    fetchSets,
    fetchCards,
    fetchSetStats,
    fetchTotalDue,
    createSet,
    updateSet,
    deleteSet,
    createCard,
    updateCard,
    deleteCard,
  };
};