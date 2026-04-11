import { useState, useCallback } from 'react';
import type { MatchingData, MatchingAnswer } from '@/hooks/useContent';

interface Props {
  data: MatchingData;
  onAnswer: (answer: MatchingAnswer) => void;
  disabled?: boolean;
}

export const MatchingExercise = ({ data, onAnswer, disabled = false }: Props) => {
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
  const [matches, setMatches] = useState<Record<string, string>>({});

  const [rightItems] = useState<string[]>(() =>
    [...data.pairs.map((p) => p.right)].sort(() => Math.random() - 0.5)
  );

  const leftItems = data.pairs.map((p) => p.left);

  const handleLeftClick = useCallback(
    (left: string) => {
      if (disabled) return;
      if (selectedLeft === left) {
        setSelectedLeft(null);
        return;
      }
      // Daca e deja matched, il deselecteaza din matches
      if (matches[left]) {
        const updated = { ...matches };
        delete updated[left];
        setMatches(updated);
        setSelectedLeft(left);
        return;
      }
      setSelectedLeft(left);
    },
    [disabled, selectedLeft, matches]
  );

  const handleRightClick = useCallback(
    (right: string) => {
      if (disabled || !selectedLeft) return;

      // Daca right-ul e deja folosit intr-un alt match, il elibereaza
      const existingLeftForRight = Object.entries(matches).find(
        ([, r]) => r === right
      )?.[0];

      const updated = { ...matches };
      if (existingLeftForRight) {
        delete updated[existingLeftForRight];
      }
      updated[selectedLeft] = right;

      setMatches(updated);
      setSelectedLeft(null);

      if (Object.keys(updated).length === data.pairs.length) {
        onAnswer({ matches: updated });
      }
    },
    [disabled, selectedLeft, matches, data.pairs.length, onAnswer]
  );

  const handleClear = () => {
    setMatches({});
    setSelectedLeft(null);
  };

  const getLeftStatus = (left: string) => {
    if (selectedLeft === left) return 'selected';
    if (matches[left]) return 'matched';
    return 'idle';
  };

  const getRightStatus = (right: string) => {
    if (Object.values(matches).includes(right)) return 'matched';
    return 'idle';
  };

  const matchCount = Object.keys(matches).length;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {/* Coloana stanga */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Chinese
          </p>
          {leftItems.map((left) => {
            const status = getLeftStatus(left);
            return (
              <button
                key={left}
                onClick={() => handleLeftClick(left)}
                disabled={disabled}
                className={`
                  w-full rounded-lg border-2 px-4 py-3 text-center
                  font-display text-xl transition-all duration-150
                  disabled:cursor-not-allowed
                  ${status === 'selected'
                    ? 'border-primary bg-primary/10 text-primary'
                    : status === 'matched'
                    ? 'border-student/50 bg-student/8 text-student'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-accent'
                  }
                `}
              >
                {left}
                {status === 'matched' && (
                  <span className="block text-xs font-sans mt-0.5 opacity-70">
                    → {matches[left]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Coloana dreapta */}
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Translation
          </p>
          {rightItems.map((right) => {
            const status = getRightStatus(right);
            return (
              <button
                key={right}
                onClick={() => handleRightClick(right)}
                disabled={disabled || (status === 'matched' && !selectedLeft)}
                className={`
                  w-full rounded-lg border-2 px-4 py-3 text-center
                  text-sm font-medium transition-all duration-150
                  disabled:cursor-not-allowed
                  ${status === 'matched'
                    ? 'border-student/50 bg-student/8 text-student'
                    : selectedLeft
                    ? 'border-primary/40 bg-accent cursor-pointer hover:border-primary hover:bg-primary/10'
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

      {/* Clear */}
      {matchCount > 0 && !disabled && (
        <button
          onClick={handleClear}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          ↺ Clear all matches
        </button>
      )}

      {/* Hint */}
      {!disabled && selectedLeft && (
        <p className="text-xs text-primary animate-fade-in">
          Now click a translation to match with{' '}
          <span className="font-display font-bold">{selectedLeft}</span>
        </p>
      )}
    </div>
  );
};