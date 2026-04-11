import { useState, useCallback } from 'react';
import type { MatchingData, MatchingAnswer } from '@/hooks/useContent';

interface Props {
  data: MatchingData;
  onAnswer: (answer: MatchingAnswer) => void;
  disabled?: boolean;
}

export const MatchingExercise = ({
  data,
  onAnswer,
  disabled = false,
}: Props) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});

  const leftItems = data.pairs.map((p) => p.left);
  // Amesteca coloana dreapta pentru dificultate
const [rightItems] = useState<string[]>(() =>
    [...data.pairs.map((p) => p.right)].sort(() => Math.random() - 0.5)
  );

  const handleLeftClick = useCallback(
    (left: string) => {
      if (disabled) return;
      setSelectedLeft((prev) => (prev === left ? null : left));
    },
    [disabled]
  );

  const handleRightClick = useCallback(
    (right: string) => {
      if (disabled || !selectedLeft) return;

      const updated = { ...matches, [selectedLeft]: right };
      setMatches(updated);
      setSelectedLeft(null);

      if (Object.keys(updated).length === data.pairs.length) {
        onAnswer({ matches: updated });
      }
    },
    [disabled, selectedLeft, matches, data.pairs.length, onAnswer]
  );

  const getLeftStatus = (left: string) => {
    if (selectedLeft === left) return 'selected';
    if (matches[left]) return 'matched';
    return 'idle';
  };

  const getRightStatus = (right: string) => {
    const isMatched = Object.values(matches).includes(right);
    if (isMatched) return 'matched';
    return 'idle';
  };

  return (
    <div className="grid grid-cols-2 gap-3">
      {/* Coloana stanga */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Chinese
        </p>
        {leftItems.map((left) => {
          const status = getLeftStatus(left);
          return (
            <button
              key={left}
              onClick={() => handleLeftClick(left)}
              disabled={disabled || status === 'matched'}
              className={`
                w-full rounded-lg border-2 px-4 py-3 text-center
                font-display text-xl transition-all duration-150
                disabled:cursor-not-allowed
                ${status === 'selected'
                  ? 'border-primary bg-primary/10 text-primary'
                  : status === 'matched'
                  ? 'border-student/40 bg-student/8 text-student opacity-60'
                  : 'border-border bg-card hover:border-primary/40 hover:bg-accent'
                }
              `}
            >
              {left}
              {status === 'matched' && (
                <span className="block text-xs font-sans mt-0.5 opacity-70">
                  {matches[left]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Coloana dreapta */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">
          Translation
        </p>
        {rightItems.map((right) => {
          const status = getRightStatus(right);
          return (
            <button
              key={right}
              onClick={() => handleRightClick(right)}
              disabled={disabled || status === 'matched' || !selectedLeft}
              className={`
                w-full rounded-lg border-2 px-4 py-3 text-center
                text-sm font-medium transition-all duration-150
                disabled:cursor-not-allowed
                ${status === 'matched'
                  ? 'border-student/40 bg-student/8 text-student opacity-60'
                  : selectedLeft
                  ? 'border-primary/40 bg-accent text-foreground hover:border-primary hover:bg-primary/10 cursor-pointer'
                  : 'border-border bg-card text-muted-foreground'
                }
              `}
            >
              {right}
            </button>
          );
        })}
      </div>
    </div>
  );
};