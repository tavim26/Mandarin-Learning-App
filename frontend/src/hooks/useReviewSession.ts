import { useState, useCallback } from 'react';
import { flashcardApi } from '@/api/flashcardApi';
import { useAuthStore } from '@/store/authStore';
import type {
  FlashcardProgressDto,
  FlashcardDto,
  ReviewResultDto,
  ReviewQuality,
} from '@/types';

interface ReviewCard {
  progress: FlashcardProgressDto;
  card: FlashcardDto | null;
}

interface SessionSummary {
  total: number;
  again: number;
  hard: number;
  good: number;
  easy: number;
}

export const useReviewSession = () => {
  const { userId } = useAuthStore();

  const [queue, setQueue] = useState<ReviewCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [summary, setSummary] = useState<SessionSummary | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Acumuleaza calitatile pe parcursul sesiunii
  const [qualityLog, setQualityLog] = useState<ReviewQuality[]>([]);

  const startSession = useCallback(
    async (setId: number) => {
      if (!userId) return;
      setIsLoading(true);
      setError(null);
      setIsFinished(false);
      setCurrentIndex(0);
      setSummary(null);
      setQualityLog([]);

      try {
        const dueList = await flashcardApi.getDueCards(userId, setId);
        if (dueList.length === 0) {
          setQueue([]);
          setIsFinished(true);
          setSummary({ total: 0, again: 0, hard: 0, good: 0, easy: 0 });
          return;
        }

        const cards = await Promise.all(
          dueList.map((p) => flashcardApi.getCardById(p.flashcardId))
        );

        const reviewQueue: ReviewCard[] = dueList.map((progress, i) => ({
          progress,
          card: cards[i] ?? null,
        }));

        setQueue(reviewQueue);
      } catch {
        setError('Failed to load the review session.');
      } finally {
        setIsLoading(false);
      }
    },
    [userId]
  );

  const flip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const submitReview = useCallback(
    async (quality: ReviewQuality): Promise<ReviewResultDto | null> => {
      const current = queue[currentIndex];
      if (!current) return null;

      setIsSubmitting(true);
      try {
        const result = await flashcardApi.submitReview({
          flashcardId: current.progress.flashcardId,
          quality,
        });

        // Acumuleaza calitatea in log
        const updatedLog = [...qualityLog, quality];
        setQualityLog(updatedLog);

        const isLast = currentIndex === queue.length - 1;

        if (isLast) {
          setSummary(computeSummary(updatedLog));
          setIsFinished(true);
        } else {
          setCurrentIndex((prev) => prev + 1);
          setIsFlipped(false);
        }

        return result;
      } catch {
        setError('Failed to submit review. Please try again.');
        return null;
      } finally {
        setIsSubmitting(false);
      }
    },
    [queue, currentIndex, qualityLog]
  );

  const currentCard = queue[currentIndex] ?? null;
  const progress =
    queue.length > 0 ? (currentIndex / queue.length) * 100 : 0;

  return {
    currentCard,
    currentIndex,
    totalCards: queue.length,
    progress,
    isFlipped,
    isLoading,
    isSubmitting,
    isFinished,
    summary,
    error,
    startSession,
    flip,
    submitReview,
  };
};

// Calculeaza sumarul din log-ul complet de calitati
const computeSummary = (log: ReviewQuality[]): SessionSummary => ({
  total: log.length,
  again: log.filter((q) => q <= 1).length,
  hard:  log.filter((q) => q === 2).length,
  good:  log.filter((q) => q === 3 || q === 4).length,
  easy:  log.filter((q) => q === 5).length,
});