import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { useContent } from '@/hooks/useContent';
import type {
  ExerciseDto,
  ExerciseType,
  MultipleChoiceData,
  TranslationData,
  FillBlankData,
  MatchingData,
  OrderingData,
} from '@/hooks/useContent';



// Tipuri exercitii
interface ExerciseTypeOption {
  type: ExerciseType;
  label: string;
  description: string;
  icon: string;
}

const EXERCISE_TYPE_OPTIONS: ExerciseTypeOption[] = [
  {
    type: 'MULTIPLE_CHOICE',
    label: 'Multiple Choice',
    description: 'Student alege raspunsul corect din 4 variante.',
    icon: '☑',
  },
  {
    type: 'TRANSLATION',
    label: 'Translation',
    description: 'Student traduce un text chinezesc.',
    icon: '🔤',
  },
  {
    type: 'FILL_BLANK',
    label: 'Fill in the Blank',
    description: 'Student completeaza spatiile goale dintr-o propozitie.',
    icon: '✏️',
  },
  {
    type: 'MATCHING',
    label: 'Matching',
    description: 'Student potriveste cuvintele cu traducerile.',
    icon: '🔗',
  },
  {
    type: 'ORDERING',
    label: 'Word Ordering',
    description: 'Student ordoneaza cuvintele pentru a forma o propozitie.',
    icon: '🔢',
  },
];

const baseSchema = z.object({
  prompt: z.string().min(2, 'Prompt must be at least 2 characters.'),
  difficulty: z.string().optional(),
});

type BaseForm = z.infer<typeof baseSchema>;



// Pasul 1 — Selectie tip 

const StepSelectType = ({
  onSelect,
}: {
  onSelect: (type: ExerciseType) => void;
}) => (
  <div className="space-y-3 py-2">
    <p className="text-sm text-muted-foreground">
      Choose the type of exercise you want to create:
    </p>
    <div className="grid gap-2">
      {EXERCISE_TYPE_OPTIONS.map((option) => (
        <button
          key={option.type}
          onClick={() => onSelect(option.type)}
          className="
            flex items-center gap-4 rounded-xl border-2 border-border
            bg-card px-4 py-3 text-left
            hover:border-primary/40 hover:bg-accent
            transition-all duration-150 group
          "
        >
          <span className="text-2xl">{option.icon}</span>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-foreground">{option.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {option.description}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
        </button>
      ))}
    </div>
  </div>
);



// MULTIPLE CHOICE FORM
interface MultipleChoiceFormProps {
  initial?: { prompt: string; difficulty: number | null; data: MultipleChoiceData };
  onSubmit: (data: {
    prompt: string;
    difficulty: number | null;
    contentData: MultipleChoiceData;
  }) => Promise<void>;
  isSaving: boolean;
  isEditing: boolean;
}

const MultipleChoiceForm = ({
  initial,
  onSubmit,
  isSaving,
  isEditing,
}: MultipleChoiceFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<BaseForm>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      prompt: initial?.prompt ?? '',
      difficulty: initial?.difficulty?.toString() ?? '',
    },
  });

  const [options, setOptions] = useState<string[]>(
    initial?.data.options ?? ['', '', '', '']
  );
  const [correctIndex, setCorrectIndex] = useState<number>(
    initial?.data.correctIndex ?? 0
  );

  const updateOption = (index: number, value: string) =>
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));

  const onFormSubmit = async (base: BaseForm) => {
    const filled = options.map((o) => o.trim()).filter(Boolean);
    if (filled.length < 2) return;
    await onSubmit({
      prompt: base.prompt,
      difficulty: base.difficulty ? Number(base.difficulty) : null,
      contentData: { options: filled, correctIndex },
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor="prompt">Question / Prompt</Label>
        <Input
          id="prompt"
          {...register('prompt')}
          placeholder=""
          className="input-branded"
        />
        {errors.prompt && (
          <p className="text-xs text-destructive">{errors.prompt.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Answer Options</Label>
        <p className="text-xs text-muted-foreground">
          Click the radio button to mark the correct answer.
        </p>
        {options.map((option, index) => (
          <div key={index} className="flex items-center gap-2">
            <input
              type="radio"
              name="correctIndex"
              checked={correctIndex === index}
              onChange={() => setCorrectIndex(index)}
              className="accent-primary h-4 w-4 shrink-0"
            />
            <Input
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`Option ${String.fromCharCode(65 + index)}`}
              className="input-branded"
            />
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="difficulty">Difficulty (1–5, optional)</Label>
        <Input
          id="difficulty"
          type="number"
          min={1}
          max={5}
          {...register('difficulty')}
          placeholder="Leave empty for unrated"
          className="input-branded"
        />
      </div>

      <DialogFooter className="pt-2">
        <Button type="submit" className="btn-brand" disabled={isSaving}>
          {isSaving
            ? isEditing ? 'Saving...' : 'Creating...'
            : isEditing ? 'Save Changes' : 'Create Exercise'}
        </Button>
      </DialogFooter>
    </form>
  );
};



// TRANSLATION FORM
interface TranslationFormProps {
  initial?: { prompt: string; difficulty: number | null; data: TranslationData };
  onSubmit: (data: {
    prompt: string;
    difficulty: number | null;
    contentData: TranslationData;
  }) => Promise<void>;
  isSaving: boolean;
  isEditing: boolean;
}

const TranslationForm = ({
  initial,
  onSubmit,
  isSaving,
  isEditing,
}: TranslationFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<BaseForm>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      prompt: initial?.prompt ?? '',
      difficulty: initial?.difficulty?.toString() ?? '',
    },
  });

  const [answers, setAnswers] = useState<string[]>(
    initial?.data.acceptedAnswers ?? ['', '']
  );

  const addAnswer = () => setAnswers((prev) => [...prev, '']);
  const removeAnswer = (index: number) =>
    setAnswers((prev) => prev.filter((_, i) => i !== index));
  const updateAnswer = (index: number, value: string) =>
    setAnswers((prev) => prev.map((a, i) => (i === index ? value : a)));

  const onFormSubmit = async (base: BaseForm) => {
    const filled = answers.map((a) => a.trim()).filter(Boolean);
    if (filled.length === 0) return;
    await onSubmit({
      prompt: base.prompt,
      difficulty: base.difficulty ? Number(base.difficulty) : null,
      contentData: { acceptedAnswers: filled },
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor="prompt">Chinese text to translate</Label>
        <Input
          id="prompt"
          {...register('prompt')}
          placeholder=""
          className="input-branded font-display"
        />
        {errors.prompt && (
          <p className="text-xs text-destructive">{errors.prompt.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Accepted Translations</Label>
          <button
            type="button"
            onClick={addAnswer}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" />
            Add variant
          </button>
        </div>
        {answers.map((answer, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              value={answer}
              onChange={(e) => updateAnswer(index, e.target.value)}
              placeholder={`Translation variant ${index + 1}`}
              className="input-branded"
            />
            {answers.length > 1 && (
              <button
                type="button"
                onClick={() => removeAnswer(index)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="difficulty">Difficulty (1–5, optional)</Label>
        <Input
          id="difficulty"
          type="number"
          min={1}
          max={5}
          {...register('difficulty')}
          placeholder="Leave empty for unrated"
          className="input-branded"
        />
      </div>

      <DialogFooter className="pt-2">
        <Button type="submit" className="btn-brand" disabled={isSaving}>
          {isSaving
            ? isEditing ? 'Saving...' : 'Creating...'
            : isEditing ? 'Save Changes' : 'Create Exercise'}
        </Button>
      </DialogFooter>
    </form>
  );
};



// FILL BLANK FORM
interface FillBlankFormProps {
  initial?: { prompt: string; difficulty: number | null; data: FillBlankData };
  onSubmit: (data: {
    prompt: string;
    difficulty: number | null;
    contentData: FillBlankData;
  }) => Promise<void>;
  isSaving: boolean;
  isEditing: boolean;
}

const FillBlankForm = ({
  initial,
  onSubmit,
  isSaving,
  isEditing,
}: FillBlankFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<BaseForm>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      prompt: initial?.prompt ?? '',
      difficulty: initial?.difficulty?.toString() ?? '',
    },
  });

  const [answers, setAnswers] = useState<string[]>(
    initial?.data.correctAnswers ?? ['']
  );

  const addAnswer = () => setAnswers((prev) => [...prev, '']);
  const removeAnswer = (index: number) =>
    setAnswers((prev) => prev.filter((_, i) => i !== index));
  const updateAnswer = (index: number, value: string) =>
    setAnswers((prev) => prev.map((a, i) => (i === index ? value : a)));

  const onFormSubmit = async (base: BaseForm) => {
    const filled = answers.map((a) => a.trim()).filter(Boolean);
    if (filled.length === 0) return;
    await onSubmit({
      prompt: base.prompt,
      difficulty: base.difficulty ? Number(base.difficulty) : null,
      contentData: { correctAnswers: filled },
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor="prompt">Sentence with blanks</Label>
        <Input
          id="prompt"
          {...register('prompt')}
          placeholder=""
          className="input-branded font-display"
        />
        <p className="text-xs text-muted-foreground">
          Use{' '}
          <span className="font-mono bg-muted px-1 rounded">___</span> to mark
          each blank.
        </p>
        {errors.prompt && (
          <p className="text-xs text-destructive">{errors.prompt.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Correct Answers (in order)</Label>
          <button
            type="button"
            onClick={addAnswer}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" />
            Add blank
          </button>
        </div>
        {answers.map((answer, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground w-16 shrink-0">
              Blank {index + 1}
            </span>
            <Input
              value={answer}
              onChange={(e) => updateAnswer(index, e.target.value)}
              placeholder="Correct answer"
              className="input-branded font-display"
            />
            {answers.length > 1 && (
              <button
                type="button"
                onClick={() => removeAnswer(index)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="difficulty">Difficulty (1–5, optional)</Label>
        <Input
          id="difficulty"
          type="number"
          min={1}
          max={5}
          {...register('difficulty')}
          placeholder="Leave empty for unrated"
          className="input-branded"
        />
      </div>

      <DialogFooter className="pt-2">
        <Button type="submit" className="btn-brand" disabled={isSaving}>
          {isSaving
            ? isEditing ? 'Saving...' : 'Creating...'
            : isEditing ? 'Save Changes' : 'Create Exercise'}
        </Button>
      </DialogFooter>
    </form>
  );
};



// MATCHING FORM
interface MatchingFormProps {
  initial?: { prompt: string; difficulty: number | null; data: MatchingData };
  onSubmit: (data: {
    prompt: string;
    difficulty: number | null;
    contentData: MatchingData;
  }) => Promise<void>;
  isSaving: boolean;
  isEditing: boolean;
}

const MatchingForm = ({
  initial,
  onSubmit,
  isSaving,
  isEditing,
}: MatchingFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<BaseForm>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      prompt: initial?.prompt ?? '',
      difficulty: initial?.difficulty?.toString() ?? '',
    },
  });

  const [pairs, setPairs] = useState<{ left: string; right: string }[]>(
    initial?.data.pairs.length
      ? initial.data.pairs.map((p) => ({ left: p.left, right: p.right }))
      : [{ left: '', right: '' }, { left: '', right: '' }]
  );

  const addPair = () => setPairs((prev) => [...prev, { left: '', right: '' }]);
  const removePair = (index: number) =>
    setPairs((prev) => prev.filter((_, i) => i !== index));
  const updatePair = (index: number, side: 'left' | 'right', value: string) =>
    setPairs((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [side]: value } : p))
    );

  const onFormSubmit = async (base: BaseForm) => {
    const filled = pairs.filter((p) => p.left.trim() && p.right.trim());
    if (filled.length < 2) return;
    await onSubmit({
      prompt: base.prompt,
      difficulty: base.difficulty ? Number(base.difficulty) : null,
      contentData: {
        pairs: filled.map((p) => ({
          left: p.left.trim(),
          right: p.right.trim(),
        })),
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor="prompt">Instructions</Label>
        <Input
          id="prompt"
          {...register('prompt')}
          placeholder=""
          className="input-branded"
        />
        {errors.prompt && (
          <p className="text-xs text-destructive">{errors.prompt.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Pairs</Label>
          <button
            type="button"
            onClick={addPair}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <Plus className="h-3 w-3" />
            Add pair
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2 px-1">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Chinese
          </span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Translation
          </span>
        </div>
        {pairs.map((pair, index) => (
          <div key={index} className="flex items-center gap-2">
            <div className="grid grid-cols-2 gap-2 flex-1">
              <Input
                value={pair.left}
                onChange={(e) => updatePair(index, 'left', e.target.value)}
                placeholder=""
                className="input-branded font-display"
              />
              <Input
                value={pair.right}
                onChange={(e) => updatePair(index, 'right', e.target.value)}
                placeholder=""
                className="input-branded"
              />
            </div>
            {pairs.length > 2 && (
              <button
                type="button"
                onClick={() => removePair(index)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="difficulty">Difficulty (1–5, optional)</Label>
        <Input
          id="difficulty"
          type="number"
          min={1}
          max={5}
          {...register('difficulty')}
          placeholder="Leave empty for unrated"
          className="input-branded"
        />
      </div>

      <DialogFooter className="pt-2">
        <Button type="submit" className="btn-brand" disabled={isSaving}>
          {isSaving
            ? isEditing ? 'Saving...' : 'Creating...'
            : isEditing ? 'Save Changes' : 'Create Exercise'}
        </Button>
      </DialogFooter>
    </form>
  );
};




// ORDERING FORM
interface OrderingFormProps {
  initial?: { prompt: string; difficulty: number | null; data: OrderingData };
  onSubmit: (data: {
    prompt: string;
    difficulty: number | null;
    contentData: OrderingData;
  }) => Promise<void>;
  isSaving: boolean;
  isEditing: boolean;
}

const OrderingForm = ({
  initial,
  onSubmit,
  isSaving,
  isEditing,
}: OrderingFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<BaseForm>({
    resolver: zodResolver(baseSchema),
    defaultValues: {
      prompt: initial?.prompt ?? '',
      difficulty: initial?.difficulty?.toString() ?? '',
    },
  });

  const [wordsInput, setWordsInput] = useState(
    initial?.data.words.join(' ') ?? ''
  );
  const [correctOrderInput, setCorrectOrderInput] = useState(
    initial?.data.correctOrder.join(' ') ?? ''
  );
  const [translation, setTranslation] = useState(
    initial?.data.translation ?? ''
  );

  const onFormSubmit = async (base: BaseForm) => {
    const words = wordsInput
      .split(/[\s,，]+/)
      .map((w) => w.trim())
      .filter(Boolean);
    const correctOrder = correctOrderInput
      .split(/[\s,，]+/)
      .map((w) => w.trim())
      .filter(Boolean);
    if (words.length < 2 || correctOrder.length < 2) return;
    await onSubmit({
      prompt: base.prompt,
      difficulty: base.difficulty ? Number(base.difficulty) : null,
      contentData: { words, correctOrder, translation: translation.trim() },
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor="prompt">Instructions</Label>
        <Input
          id="prompt"
          {...register('prompt')}
          placeholder=""
          className="input-branded"
        />
        {errors.prompt && (
          <p className="text-xs text-destructive">{errors.prompt.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="words">Words (separated by spaces or commas)</Label>
        <Input
          id="words"
          value={wordsInput}
          onChange={(e) => setWordsInput(e.target.value)}
          placeholder=""
          className="input-branded font-display"
        />
        <p className="text-xs text-muted-foreground">
          These are the scrambled words the student will see.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="correctOrder">
          Correct Order (separated by spaces or commas)
        </Label>
        <Input
          id="correctOrder"
          value={correctOrderInput}
          onChange={(e) => setCorrectOrderInput(e.target.value)}
          placeholder=""
          className="input-branded font-display"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="translation">Translation hint (optional)</Label>
        <Input
          id="translation"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          placeholder=""
          className="input-branded"
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="difficulty">Difficulty (1–5, optional)</Label>
        <Input
          id="difficulty"
          type="number"
          min={1}
          max={5}
          {...register('difficulty')}
          placeholder="Leave empty for unrated"
          className="input-branded"
        />
      </div>

      <DialogFooter className="pt-2">
        <Button type="submit" className="btn-brand" disabled={isSaving}>
          {isSaving
            ? isEditing ? 'Saving...' : 'Creating...'
            : isEditing ? 'Save Changes' : 'Create Exercise'}
        </Button>
      </DialogFooter>
    </form>
  );
};




// ExerciseModalContent 
interface ContentProps {
  lessonId: number;
  exercise?: ExerciseDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ExerciseModalContent = ({
  lessonId,
  exercise,
  onClose,
  onSuccess,
}: ContentProps) => {
  const { createExercise, updateExercise, isSaving, error } = useContent();
  const isEditing = !!exercise;

  
  const [selectedType, setSelectedType] = useState<ExerciseType | null>(
    exercise?.type ?? null
  );

  const selectedOption = EXERCISE_TYPE_OPTIONS.find(
    (o) => o.type === selectedType
  );

  const handleCreate = async (payload: {
    prompt: string;
    difficulty: number | null;
    contentData: object;
  }) => {
    const success = await createExercise({
      lessonId,
      type: selectedType!,
      prompt: payload.prompt,
      difficulty: payload.difficulty,
      contentData: payload.contentData as ExerciseDto['contentData'],
    });
    if (success) {
      onSuccess();
      onClose();
    }
  };

  const handleUpdate = async (payload: {
    prompt: string;
    difficulty: number | null;
    contentData: object;
  }) => {
    if (!exercise) return;
    const success = await updateExercise(exercise.id, {
      type: exercise.type,
      prompt: payload.prompt,
      difficulty: payload.difficulty,
      contentData: payload.contentData as ExerciseDto['contentData'],
    });
    if (success) {
      onSuccess();
      onClose();
    }
  };

  const handleSubmit = isEditing ? handleUpdate : handleCreate;

  

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display">
          {isEditing ? (
            <span className="flex items-center gap-2">
              <span>{selectedOption?.icon}</span>
              Edit {selectedOption?.label}
            </span>
          ) : selectedType ? (
            <span className="flex items-center gap-2">
              <button
                onClick={() => setSelectedType(null)}
                className="text-muted-foreground hover:text-foreground transition-colors text-sm font-normal"
              >
                ← Back
              </button>
              <span>{selectedOption?.label}</span>
            </span>
          ) : (
            'Create Exercise'
          )}
        </DialogTitle>

        {/* Badge tip exercitiu la editare */}
        {isEditing && (
          <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
            <span className="rounded-full bg-muted px-2 py-0.5 font-medium">
              {exercise?.type.replace(/_/g, ' ')}
            </span>
            <span>· Exercise type cannot be changed.</span>
          </p>
        )}
      </DialogHeader>

      {error && <ErrorBanner message={error} />}

      {/* Pasul 1 — selectie tip */}
      {!selectedType && !isEditing && (
        <>
          <StepSelectType onSelect={setSelectedType} />
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </DialogFooter>
        </>
      )}

      {/* Pasul 2 — form specific tipului */}
      {selectedType === 'MULTIPLE_CHOICE' && (
        <MultipleChoiceForm
          initial={
            exercise?.contentData
              ? {
                  prompt: exercise.prompt,
                  difficulty: exercise.difficulty,
                  data: exercise.contentData as MultipleChoiceData,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          isSaving={isSaving}
          isEditing={isEditing}
        />
      )}
      {selectedType === 'TRANSLATION' && (
        <TranslationForm
          initial={
            exercise?.contentData
              ? {
                  prompt: exercise.prompt,
                  difficulty: exercise.difficulty,
                  data: exercise.contentData as TranslationData,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          isSaving={isSaving}
          isEditing={isEditing}
        />
      )}
      {selectedType === 'FILL_BLANK' && (
        <FillBlankForm
          initial={
            exercise?.contentData
              ? {
                  prompt: exercise.prompt,
                  difficulty: exercise.difficulty,
                  data: exercise.contentData as FillBlankData,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          isSaving={isSaving}
          isEditing={isEditing}
        />
      )}
      {selectedType === 'MATCHING' && (
        <MatchingForm
          initial={
            exercise?.contentData
              ? {
                  prompt: exercise.prompt,
                  difficulty: exercise.difficulty,
                  data: exercise.contentData as MatchingData,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          isSaving={isSaving}
          isEditing={isEditing}
        />
      )}
      {selectedType === 'ORDERING' && (
        <OrderingForm
          initial={
            exercise?.contentData
              ? {
                  prompt: exercise.prompt,
                  difficulty: exercise.difficulty,
                  data: exercise.contentData as OrderingData,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          isSaving={isSaving}
          isEditing={isEditing}
        />
      )}
    </>
  );
};




// ExerciseModal
interface Props {
  open: boolean;
  lessonId: number;
  exercise?: ExerciseDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExerciseModal = ({
  open,
  lessonId,
  exercise,
  onClose,
  onSuccess,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <ExerciseModalContent
          key={open ? `${lessonId}-${exercise?.id ?? 'new'}` : 'closed'}
          lessonId={lessonId}
          exercise={exercise}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
};