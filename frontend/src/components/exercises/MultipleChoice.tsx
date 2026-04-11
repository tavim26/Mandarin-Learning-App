import { useState } from 'react';
import type {
  MultipleChoiceData,
  MultipleChoiceAnswer,
} from '@/hooks/useContent';

interface Props {
  data: MultipleChoiceData;
  onAnswer: (answer: MultipleChoiceAnswer) => void;
  disabled?: boolean;
  previousAnswer?: MultipleChoiceAnswer | null;
}

export const MultipleChoice = ({
  data,
  onAnswer,
  disabled = false,
  previousAnswer = null,
}: Props) => {
  const [selected, setSelected] = useState<number | null>(
    previousAnswer?.selectedIndex ?? null
  );

  const handleSelect = (index: number) => {
    if (disabled) return;
    setSelected(index);
    onAnswer({ selectedIndex: index });
  };

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {data.options.map((option, index) => {
        const isSelected = selected === index;
        return (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={disabled}
            className={`
              relative flex items-center gap-3 rounded-lg border-2 px-4 py-3
              text-sm font-medium text-left transition-all duration-150
              disabled:cursor-not-allowed disabled:opacity-60
              ${
                isSelected
                  ? 'border-primary bg-primary/8 text-primary'
                  : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-accent'
              }
            `}
          >
            {/* Index indicator */}
            <span
              className={`
                flex h-6 w-6 shrink-0 items-center justify-center
                rounded-full text-xs font-bold
                ${isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}
              `}
            >
              {String.fromCharCode(65 + index)}
            </span>
            {option}
          </button>
        );
      })}
    </div>
  );
};