import { useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import type { FlashcardDto, FlashcardProgressDto } from '@/hooks/useFlashcards';

interface Props {
  card: FlashcardDto;
  progress: FlashcardProgressDto;
  isFlipped: boolean;
  onFlip: () => void;
}

const getCategoryLabel = (progress: FlashcardProgressDto): {
  label: string;
  className: string;
} => {
  if (progress.id === null) return { label: 'New', className: 'text-sm2-new bg-sm2-new/10' };
  if (progress.intervalDays >= 21) return { label: 'Mature', className: 'text-sm2-mature bg-sm2-mature/10' };
  if (progress.repetitionCount < 3) return { label: 'Learning', className: 'text-sm2-learning bg-sm2-learning/10' };
  return { label: 'Review', className: 'text-primary bg-primary/10' };
};

export const ReviewCard = ({ card, progress, isFlipped, onFlip }: Props) => {
  const category = useMemo(() => getCategoryLabel(progress), [progress]);

  return (
    <div
      className="relative w-full cursor-pointer"
      style={{ perspective: '1200px' }}
      onClick={onFlip}
    >
      {/* Container flip 3D */}
      <div
        className="relative w-full transition-transform duration-500"
        style={{
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          minHeight: '280px',
        }}
      >
        {/* Fata — Front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-border bg-card p-8 shadow-card"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <span
            className={`mb-6 rounded-full px-2.5 py-1 text-xs font-medium ${category.className}`}
          >
            {category.label}
          </span>
          <p className="font-display text-5xl font-bold text-foreground tracking-wide text-center">
            {card.frontText}
          </p>
          <div className="mt-8 flex items-center gap-1.5 text-xs text-muted-foreground">
            <RotateCcw className="h-3 w-3" />
            Click to reveal
          </div>
        </div>

        {/* Spate — Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl border-2 border-primary/30 bg-primary/5 p-8 shadow-card"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <p className="font-display text-3xl font-semibold text-foreground text-center leading-relaxed">
            {card.backText}
          </p>
          {progress.intervalDays > 0 && (
            <p className="mt-6 text-xs text-muted-foreground">
              Next review in {progress.intervalDays} day
              {progress.intervalDays !== 1 ? 's' : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};