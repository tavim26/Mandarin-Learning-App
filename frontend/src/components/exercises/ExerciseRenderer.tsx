import { useMemo } from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { MultipleChoice } from './MultipleChoice';
import { TranslationExercise } from './TranslationExercise';
import { FillBlank } from './FillBlank';
import { MatchingExercise } from './MatchingExercise';
import { OrderingExercise } from './OrderingExercise';

import type {
  ExerciseDto,
  SubmittedAnswer,
  MultipleChoiceData,
  FillBlankData,
  MatchingData,
  OrderingData,
  MultipleChoiceAnswer,
  TranslationAnswer,
  FillBlankAnswer,
  MatchingAnswer,
  OrderingAnswer,
} from '@/hooks/useContent';

interface AttemptResult {
  isCorrect: boolean;
  score: number;
  feedbackText: string | null;
}

interface Props {
  exercise: ExerciseDto;
  onAnswer: (answer: SubmittedAnswer) => void;
  attemptResult?: AttemptResult | null;
  disabled?: boolean;
}

export const ExerciseRenderer = ({
  exercise,
  onAnswer,
  attemptResult = null,
  disabled = false,
}: Props) => {
  const isDisabled = disabled || attemptResult !== null;

  const feedbackBar = useMemo(() => {
    if (!attemptResult) return null;
    if (attemptResult.isCorrect) {
      return (
        <div className="flex items-center gap-2 rounded-lg border border-student/30 bg-student/8 px-4 py-3 text-sm text-student animate-slide-up">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span className="font-medium">Correct!</span>
          {attemptResult.feedbackText && (
            <span className="text-student/80 ml-1">{attemptResult.feedbackText}</span>
          )}
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-3 text-sm text-destructive animate-slide-up">
        <XCircle className="h-4 w-4 shrink-0" />
        <span className="font-medium">Incorrect</span>
        {attemptResult.feedbackText && (
          <span className="text-destructive/80 ml-1">{attemptResult.feedbackText}</span>
        )}
        <span className="ml-auto text-xs font-medium">
          Score: {attemptResult.score.toFixed(0)}%
        </span>
      </div>
    );
  }, [attemptResult]);

  const renderExercise = () => {
    if (!exercise.contentData) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          Exercise data unavailable.
        </div>
      );
    }

    switch (exercise.type) {
      case 'MULTIPLE_CHOICE':
        return (
          <MultipleChoice
            data={exercise.contentData as MultipleChoiceData}
            onAnswer={(a) => onAnswer(a as MultipleChoiceAnswer)}
            disabled={isDisabled}
          />
        );
      case 'TRANSLATION':
        return (
          <TranslationExercise
            prompt={exercise.prompt}
            onAnswer={(a) => onAnswer(a as TranslationAnswer)}
            disabled={isDisabled}
          />
        );
      case 'FILL_BLANK':
        return (
          <FillBlank
            prompt={exercise.prompt}
            data={exercise.contentData as FillBlankData}
            onAnswer={(a) => onAnswer(a as FillBlankAnswer)}
            disabled={isDisabled}
          />
        );
      case 'MATCHING':
        return (
          <MatchingExercise
            data={exercise.contentData as MatchingData}
            onAnswer={(a) => onAnswer(a as MatchingAnswer)}
            disabled={isDisabled}
          />
        );
      case 'ORDERING':
        return (
          <OrderingExercise
            data={exercise.contentData as OrderingData}
            onAnswer={(a) => onAnswer(a as OrderingAnswer)}
            disabled={isDisabled}
          />
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Prompt exercitiu */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {exercise.type.replace('_', ' ')}
          </span>
          {exercise.difficulty && (
            <span className="flex gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 w-1.5 rounded-full ${
                    i < exercise.difficulty!
                      ? 'bg-primary'
                      : 'bg-muted'
                  }`}
                />
              ))}
            </span>
          )}
        </div>
        {exercise.type !== 'TRANSLATION' && (
          <p className="font-display text-lg font-medium text-foreground">
            {exercise.prompt}
          </p>
        )}
      </div>

      {/* Componenta specifica tipului */}
      {renderExercise()}

      {/* Feedback dupa submit */}
      {feedbackBar}
    </div>
  );
};