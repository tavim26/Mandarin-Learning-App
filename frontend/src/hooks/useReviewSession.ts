import { useState, useEffect } from 'react';
import { getDueCards, submitReview, getCardsForSet } from '@/api/flashcardApi';
import type { FlashcardDto, FlashcardProgressDto, ReviewQuality } from '@/types';
import { REVIEW_QUALITY } from '@/config/constants';

// Starea unui card in cadrul sesiunii curente
interface ReviewCard {
  progress: FlashcardProgressDto;
  card: FlashcardDto | null;
}

// Sumar la finalul sesiunii
export interface ReviewSummary {
  total: number;
  again: number;
  hard: number;
  good: number;
  easy: number;
}

interface ReviewSessionState {
  cards: ReviewCard[];
  currentIndex: number;
  flipped: boolean;
  loading: boolean;
  submitting: boolean;
  error: string | null;
  finished: boolean;
  summary: ReviewSummary;
  currentCard: ReviewCard | null;
  totalCards: number;
  flip: () => void;
  submitQuality: (quality: ReviewQuality) => Promise<void>;
}

export const useReviewSession = (
  studentId: number,
  setId: number
): ReviewSessionState => {
  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const [summary, setSummary] = useState<ReviewSummary>({
    total: 0,
    again: 0,
    hard: 0,
    good: 0,
    easy: 0,
  });

  useEffect(() => {
    const fetchDueCards = async () => {
      try {
        setLoading(true);
        setError(null);

        // Incarca cardurile scadente si datele cardurilor in paralel
        const [dueProgress, allCards] = await Promise.all([
          getDueCards(studentId, setId),
          getCardsForSet(setId),
        ]);

        // Mapeaza progress-ul la datele cardului corespunzator
        const cardMap = new Map(allCards.map((c) => [c.id, c]));
        const reviewCards: ReviewCard[] = dueProgress.map((p) => ({
          progress: p,
          card: cardMap.get(p.flashcardId) ?? null,
        }));

        setCards(reviewCards);
        if (reviewCards.length === 0) setFinished(true);
      } catch {
        setError('Failed to load review session.');
      } finally {
        setLoading(false);
      }
    };

    fetchDueCards();
  }, [studentId, setId]);

  const flip = () => setFlipped((prev) => !prev);

  const submitQuality = async (quality: ReviewQuality): Promise<void> => {
    const current = cards[currentIndex];
    if (!current) return;

    setSubmitting(true);
    try {
      await submitReview({
        flashcardId: current.progress.flashcardId,
        quality,
      });

      // Actualizeaza sumarul
      setSummary((prev) => {
        const next = { ...prev, total: prev.total + 1 };
        if (quality === REVIEW_QUALITY.AGAIN) next.again += 1;
        else if (quality === REVIEW_QUALITY.HARD) next.hard += 1;
        else if (quality === REVIEW_QUALITY.GOOD) next.good += 1;
        else if (quality === REVIEW_QUALITY.EASY) next.easy += 1;
        return next;
      });

      // Avanseaza la urmatorul card
      const nextIndex = currentIndex + 1;
      if (nextIndex >= cards.length) {
        setFinished(true);
      } else {
        setCurrentIndex(nextIndex);
        setFlipped(false);
      }
    } catch {
      setError('Failed to submit review.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    cards,
    currentIndex,
    flipped,
    loading,
    submitting,
    error,
    finished,
    summary,
    currentCard: cards[currentIndex] ?? null,
    totalCards: cards.length,
    flip,
    submitQuality,
  };
};