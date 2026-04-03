import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  getFlashcardSets,
  createFlashcardSet,
  deleteFlashcardSet,
  getCardsForSet,
  createFlashcard,
  deleteFlashcard,
  getSetStats,
} from '@/api/flashcardApi';
import type {
  FlashcardSetDto,
  FlashcardDto,
  FlashcardSetStatsDto,
  CreateFlashcardSetRequest,
  CreateFlashcardRequest,
} from '@/types';

// --- Hook seturi ---

export const useFlashcardSets = () => {
  const { userId } = useAuthStore();
  const [sets, setSets] = useState<FlashcardSetDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSets = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      setError(null);
      const data = await getFlashcardSets(userId);
      setSets(data);
    } catch {
      setError('Failed to load flashcard sets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSets(); }, [userId]);

  const addSet = async (data: CreateFlashcardSetRequest): Promise<FlashcardSetDto> => {
    const created = await createFlashcardSet(data);
    setSets((prev) => [created, ...prev]);
    return created;
  };

  const removeSet = async (setId: number): Promise<void> => {
    await deleteFlashcardSet(setId);
    setSets((prev) => prev.filter((s) => s.id !== setId));
  };

  return { sets, loading, error, refetch: fetchSets, addSet, removeSet };
};

// --- Hook carduri dintr-un set ---

export const useFlashcards = (setId: number) => {
  const [cards, setCards] = useState<FlashcardDto[]>([]);
  const [stats, setStats] = useState<FlashcardSetStatsDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCards = async () => {
    try {
      setLoading(true);
      setError(null);
      const [cardsData, statsData] = await Promise.all([
        getCardsForSet(setId),
        getSetStats(setId),
      ]);
      setCards(cardsData);
      setStats(statsData);
    } catch {
      setError('Failed to load cards.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCards(); }, [setId]);

  const addCard = async (data: CreateFlashcardRequest): Promise<FlashcardDto> => {
    const created = await createFlashcard(data);
    setCards((prev) => [...prev, created]);
    // Actualizeaza cardCount in stats
    setStats((prev) => prev ? { ...prev, totalCards: prev.totalCards + 1, newCards: prev.newCards + 1 } : prev);
    return created;
  };

  const removeCard = async (flashcardId: number): Promise<void> => {
    await deleteFlashcard(flashcardId);
    setCards((prev) => prev.filter((c) => c.id !== flashcardId));
    setStats((prev) => prev ? { ...prev, totalCards: prev.totalCards - 1 } : prev);
  };

  return { cards, stats, loading, error, refetch: fetchCards, addCard, removeCard };
};