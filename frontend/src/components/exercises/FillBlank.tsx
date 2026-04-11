import { useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import type { FillBlankData, FillBlankAnswer } from '@/hooks/useContent';

interface Props {
  prompt: string;
  data: FillBlankData;
  onAnswer: (answer: FillBlankAnswer) => void;
  disabled?: boolean;
  previousAnswer?: FillBlankAnswer | null;
}

export const FillBlank = ({
  prompt,
  data,
  onAnswer,
  disabled = false,
  previousAnswer = null,
}: Props) => {
  const [answers, setAnswers] = useState<string[]>(
    previousAnswer?.answers ?? Array(data.correctAnswers.length).fill('')
  );

  const handleChange = useCallback(
    (index: number, value: string) => {
      if (disabled) return;
      const updated = answers.map((a, i) => (i === index ? value : a));
      setAnswers(updated);
      // Trimite raspunsul doar daca toate campurile sunt completate
      if (updated.every((a) => a.trim() !== '')) {
        onAnswer({ answers: updated.map((a) => a.trim()) });
      }
    },
    [answers, disabled, onAnswer]
  );

  // Randare prompt cu ___ inlocuit de input-uri
  // Conventia: fiecare ___ corespunde unui blank in ordine
  const parts = prompt.split('___');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/50 border border-border px-4 py-4 font-display text-xl leading-relaxed">
        {parts.map((part, i) => (
          <span key={i} className="flex items-center gap-2">
            <span className="text-foreground">{part}</span>
            {i < data.correctAnswers.length && (
              <Input
                value={answers[i]}
                onChange={(e) => handleChange(i, e.target.value)}
                disabled={disabled}
                placeholder="___"
                className="input-branded h-9 w-24 text-center font-display text-lg"
              />
            )}
          </span>
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        Fill in {data.correctAnswers.length} blank
        {data.correctAnswers.length > 1 ? 's' : ''}.
      </p>
    </div>
  );
};