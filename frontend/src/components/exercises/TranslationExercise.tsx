import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import type { TranslationAnswer } from '@/hooks/useContent';

interface Props {
  prompt: string;
  onAnswer: (answer: TranslationAnswer) => void;
  disabled?: boolean;
  previousAnswer?: TranslationAnswer | null;
}

export const TranslationExercise = ({
  prompt,
  onAnswer,
  disabled = false,
  previousAnswer = null,
}: Props) => {
  const [value, setValue] = useState(previousAnswer?.translation ?? '');

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    setValue(text);
    if (text.trim()) {
      onAnswer({ translation: text.trim() });
    }
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Translate the following:
      </p>
      <div className="rounded-lg bg-muted/50 border border-border px-4 py-3">
        <p className="font-display text-2xl text-foreground tracking-wide">
          {prompt}
        </p>
      </div>
      <Textarea
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder="Type your translation here..."
        className="input-branded min-h-[100px] resize-none"
      />
      <p className="text-xs text-muted-foreground">
        {value.length} characters
      </p>
    </div>
  );
};