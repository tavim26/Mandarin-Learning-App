import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { X, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { ReviewCard } from '@/components/flashcards/ReviewCard';
import { Sm2QualityButtons } from '@/components/flashcards/Sm2QualityButtons';
import { useReviewSession } from '@/hooks/useReviewSession';
import type { ReviewQuality } from '@/hooks/useFlashcards';

// ReviewSession este full-screen intentionat — fara sidebar
const ReviewSessionPage = () => {
  const { setId } = useParams<{ setId: string }>();
  const navigate = useNavigate();

  const {
    currentCard,
    currentIndex,
    totalCards,
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
  } = useReviewSession();

  useEffect(() => {
    if (!setId) return;
    startSession(Number(setId));
  }, [setId, startSession]);

  const handleQuality = async (quality: ReviewQuality) => {
    await submitReview(quality);
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <LoadingSpinner size="lg" className="mx-auto" />
          <p className="text-sm text-muted-foreground">
            Loading review session...
          </p>
        </div>
      </div>
    );
  }

  // Sesiune terminata
  if (isFinished) {
    return (
      <div className="flex h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm text-center space-y-6 animate-scale-in">
          <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-student/10">
            <CheckCircle2 className="h-10 w-10 text-student" />
          </div>

          <div className="space-y-2">
            <h1 className="font-display text-2xl font-bold text-foreground">
              Session Complete!
            </h1>
            <p className="text-sm text-muted-foreground">
              You reviewed{' '}
              <span className="font-semibold text-foreground">
                {summary?.total ?? 0}
              </span>{' '}
              cards in this session.
            </p>
          </div>

          {summary && summary.total > 0 && (
            <div className="card-base p-4 grid grid-cols-4 gap-3 text-center">
              <div>
                <p className="font-bold text-sm2-due text-lg">
                  {summary.again}
                </p>
                <p className="text-[10px] text-muted-foreground">Again</p>
              </div>
              <div>
                <p className="font-bold text-sm2-learning text-lg">
                  {summary.hard}
                </p>
                <p className="text-[10px] text-muted-foreground">Hard</p>
              </div>
              <div>
                <p className="font-bold text-primary text-lg">
                  {summary.good}
                </p>
                <p className="text-[10px] text-muted-foreground">Good</p>
              </div>
              <div>
                <p className="font-bold text-sm2-mature text-lg">
                  {summary.easy}
                </p>
                <p className="text-[10px] text-muted-foreground">Easy</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Button
              onClick={() => navigate('/flashcards')}
              className="btn-brand w-full"
            >
              Back to Flashcards
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Sesiune activa
  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <button
          onClick={() => navigate('/flashcards')}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Exit session"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Progress bar */}
        <div className="flex-1 mx-4 space-y-1">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {currentIndex + 1} / {totalCards}
          </p>
        </div>

        <div className="w-8" />
      </div>

      {/* Card area */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 gap-8">
        {error && (
          <ErrorBanner message={error} className="w-full max-w-lg" />
        )}

        {currentCard && (
          <div className="w-full max-w-lg space-y-6">
            <ReviewCard
              card={currentCard.card!}
              progress={currentCard.progress}
              isFlipped={isFlipped}
              onFlip={flip}
            />

            {/* Quality buttons — vizibile doar dupa flip */}
            {isFlipped && (
              <div className="animate-slide-up">
                <Sm2QualityButtons
                  onSelect={handleQuality}
                  disabled={isSubmitting}
                />
              </div>
            )}

            {isSubmitting && (
              <div className="flex justify-center">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewSessionPage;