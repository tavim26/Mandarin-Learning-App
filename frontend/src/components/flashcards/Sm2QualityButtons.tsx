import { useCallback } from 'react';
import type { ReviewQuality } from '@/hooks/useFlashcards';

interface QualityOption {
  quality: ReviewQuality;
  label: string;
  sublabel: string;
  className: string;
}

const QUALITY_OPTIONS: QualityOption[] = [
  {
    quality: 0,
    label: 'Again',
    sublabel: 'Complete blackout',
    className:
      'border-sm2-due/40 bg-sm2-due/8 text-sm2-due hover:bg-sm2-due/15',
  },
  {
    quality: 2,
    label: 'Hard',
    sublabel: 'Correct with difficulty',
    className:
      'border-sm2-learning/40 bg-sm2-learning/8 text-sm2-learning hover:bg-sm2-learning/15',
  },
  {
    quality: 3,
    label: 'Good',
    sublabel: 'Correct with effort',
    className:
      'border-primary/40 bg-primary/8 text-primary hover:bg-primary/15',
  },
  {
    quality: 5,
    label: 'Easy',
    sublabel: 'Perfect recall',
    className:
      'border-sm2-mature/40 bg-sm2-mature/8 text-sm2-mature hover:bg-sm2-mature/15',
  },
];

interface Props {
  onSelect: (quality: ReviewQuality) => void;
  disabled?: boolean;
}

export const Sm2QualityButtons = ({ onSelect, disabled = false }: Props) => {
  const handleSelect = useCallback(
    (quality: ReviewQuality) => {
      if (disabled) return;
      onSelect(quality);
    },
    [disabled, onSelect]
  );

  return (
    <div className="space-y-2">
      <p className="text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
        How well did you remember?
      </p>
      <div className="grid grid-cols-4 gap-2">
        {QUALITY_OPTIONS.map(({ quality, label, sublabel, className }) => (
          <button
            key={quality}
            onClick={() => handleSelect(quality)}
            disabled={disabled}
            className={`
              flex flex-col items-center rounded-lg border-2 px-2 py-3
              transition-all duration-150 disabled:cursor-not-allowed
              disabled:opacity-50 ${className}
            `}
          >
            <span className="text-sm font-bold">{label}</span>
            <span className="mt-0.5 text-[10px] opacity-70 text-center leading-tight">
              {sublabel}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};