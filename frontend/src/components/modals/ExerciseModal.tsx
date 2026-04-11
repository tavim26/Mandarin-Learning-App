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
import type { ExerciseDto, ExerciseType } from '@/hooks/useContent';

// ============================================================
// Tipuri exercitii — cu etichete si descrieri prietenoase
// ============================================================
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

// ============================================================
// Schema de baza — comuna tuturor tipurilor
// ============================================================
const baseSchema = z.object({
  prompt: z.string().min(2, 'Prompt must be at least 2 characters.'),
  difficulty: z.string().optional(),
});

type BaseForm = z.infer<typeof baseSchema>;

// ============================================================
// Pasul 1 — Selectie tip exercitiu
// ============================================================
interface StepSelectTypeProps {
  onSelect: (type: ExerciseType) => void;
}

const StepSelectType = ({ onSelect }: StepSelectTypeProps) => {
  return (
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
};

// ============================================================
// Pasul 2 — Formular specific per tip
// ============================================================

// --- MULTIPLE CHOICE ---
interface MultipleChoiceFormProps {
  onSubmit: (data: {
    prompt: string;
    difficulty: number | null;
    contentData: { options: string[]; correctIndex: number };
  }) => Promise<void>;
  isSaving: boolean;
}

const MultipleChoiceForm = ({ onSubmit, isSaving }: MultipleChoiceFormProps) => {
  const { register, handleSubmit, formState: { errors } } =
    useForm<BaseForm>({ resolver: zodResolver(baseSchema) });

  const [options, setOptions] = useState(['', '', '', '']);
  const [correctIndex, setCorrectIndex] = useState(0);

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((o, i) => (i === index ? value : o)));
  };

  const onFormSubmit = async (base: BaseForm) => {
    const filledOptions = options.map((o) => o.trim()).filter(Boolean);
    if (filledOptions.length < 2) return;
    await onSubmit({
      prompt: base.prompt,
      difficulty: base.difficulty ? Number(base.difficulty) : null,
      contentData: { options: filledOptions, correctIndex },
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4 py-2">
      <div className="space-y-1.5">
        <Label htmlFor="prompt">Question / Prompt</Label>
        <Input
          id="prompt"
          {...register('prompt')}
          placeholder="e.g. What does 三 mean?"
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
          {isSaving ? 'Saving...' : 'Create Exercise'}
        </Button>
      </DialogFooter>
    </form>
  );
};

// --- TRANSLATION ---
interface TranslationFormProps {
  onSubmit: (data: {
    prompt: string;
    difficulty: number | null;
    contentData: { acceptedAnswers: string[] };
  }) => Promise<void>;
  isSaving: boolean;
}

const TranslationForm = ({ onSubmit, isSaving }: TranslationFormProps) => {
  const { register, handleSubmit, formState: { errors } } =
    useForm<BaseForm>({ resolver: zodResolver(baseSchema) });

  const [answers, setAnswers] = useState(['', '']);

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
          placeholder="e.g. 我是老师，不是学生。"
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
        <p className="text-xs text-muted-foreground">
          Add all acceptable translation variants.
        </p>
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
          {isSaving ? 'Saving...' : 'Create Exercise'}
        </Button>
      </DialogFooter>
    </form>
  );
};

// --- FILL BLANK ---
interface FillBlankFormProps {
  onSubmit: (data: {
    prompt: string;
    difficulty: number | null;
    contentData: { correctAnswers: string[] };
  }) => Promise<void>;
  isSaving: boolean;
}

const FillBlankForm = ({ onSubmit, isSaving }: FillBlankFormProps) => {
  const { register, handleSubmit, formState: { errors } } =
    useForm<BaseForm>({ resolver: zodResolver(baseSchema) });

  const [answers, setAnswers] = useState(['']);

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
          placeholder="e.g. 你好！我 ___ 学生，我 ___ 中国。"
          className="input-branded font-display"
        />
        <p className="text-xs text-muted-foreground">
          Use <span className="font-mono bg-muted px-1 rounded">___</span> to
          mark each blank in the sentence.
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
          {isSaving ? 'Saving...' : 'Create Exercise'}
        </Button>
      </DialogFooter>
    </form>
  );
};

// --- MATCHING ---
interface MatchingFormProps {
  onSubmit: (data: {
    prompt: string;
    difficulty: number | null;
    contentData: { pairs: { left: string; right: string }[] };
  }) => Promise<void>;
  isSaving: boolean;
}

const MatchingForm = ({ onSubmit, isSaving }: MatchingFormProps) => {
  const { register, handleSubmit, formState: { errors } } =
    useForm<BaseForm>({ resolver: zodResolver(baseSchema) });

  const [pairs, setPairs] = useState([
    { left: '', right: '' },
    { left: '', right: '' },
  ]);

  const addPair = () => setPairs((prev) => [...prev, { left: '', right: '' }]);
  const removePair = (index: number) =>
    setPairs((prev) => prev.filter((_, i) => i !== index));
  const updatePair = (
    index: number,
    side: 'left' | 'right',
    value: string
  ) =>
    setPairs((prev) =>
      prev.map((p, i) => (i === index ? { ...p, [side]: value } : p))
    );

  const onFormSubmit = async (base: BaseForm) => {
    const filledPairs = pairs.filter(
      (p) => p.left.trim() && p.right.trim()
    );
    if (filledPairs.length < 2) return;
    await onSubmit({
      prompt: base.prompt,
      difficulty: base.difficulty ? Number(base.difficulty) : null,
      contentData: {
        pairs: filledPairs.map((p) => ({
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
          placeholder="e.g. Match the numbers with their translations:"
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

        {/* Header coloane */}
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
                placeholder="e.g. 六"
                className="input-branded font-display"
              />
              <Input
                value={pair.right}
                onChange={(e) => updatePair(index, 'right', e.target.value)}
                placeholder="e.g. six"
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
          {isSaving ? 'Saving...' : 'Create Exercise'}
        </Button>
      </DialogFooter>
    </form>
  );
};

// --- ORDERING ---
interface OrderingFormProps {
  onSubmit: (data: {
    prompt: string;
    difficulty: number | null;
    contentData: {
      words: string[];
      correctOrder: string[];
      translation: string;
    };
  }) => Promise<void>;
  isSaving: boolean;
}

const OrderingForm = ({ onSubmit, isSaving }: OrderingFormProps) => {
  const { register, handleSubmit, formState: { errors } } =
    useForm<BaseForm>({ resolver: zodResolver(baseSchema) });

  const [wordsInput, setWordsInput] = useState('');
  const [correctOrderInput, setCorrectOrderInput] = useState('');
  const [translation, setTranslation] = useState('');

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
          placeholder="e.g. Order the words to form the correct sentence:"
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
          placeholder="e.g. 雨 下 天 会 今"
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
          placeholder="e.g. 今 天 会 下 雨"
          className="input-branded font-display"
        />
        <p className="text-xs text-muted-foreground">
          The correct arrangement of the words above.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="translation">Translation hint (optional)</Label>
        <Input
          id="translation"
          value={translation}
          onChange={(e) => setTranslation(e.target.value)}
          placeholder="e.g. Today it will rain."
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
          {isSaving ? 'Saving...' : 'Create Exercise'}
        </Button>
      </DialogFooter>
    </form>
  );
};

// ============================================================
// ExerciseModalContent — orchestreaza pasii
// ============================================================
interface ExerciseModalContentProps {
  lessonId: number;
  onClose: () => void;
  onSuccess: () => void;
}

const ExerciseModalContent = ({
  lessonId,
  onClose,
  onSuccess,
}: ExerciseModalContentProps) => {
  const { createExercise, isSaving, error } = useContent();
  const [selectedType, setSelectedType] = useState<ExerciseType | null>(null);

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

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display">
          {selectedType ? (
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
      </DialogHeader>

      {error && <ErrorBanner message={error} />}

      {!selectedType ? (
        <StepSelectType onSelect={setSelectedType} />
      ) : (
        <>
          {selectedType === 'MULTIPLE_CHOICE' && (
            <MultipleChoiceForm
              onSubmit={handleCreate}
              isSaving={isSaving}
            />
          )}
          {selectedType === 'TRANSLATION' && (
            <TranslationForm
              onSubmit={handleCreate}
              isSaving={isSaving}
            />
          )}
          {selectedType === 'FILL_BLANK' && (
            <FillBlankForm
              onSubmit={handleCreate}
              isSaving={isSaving}
            />
          )}
          {selectedType === 'MATCHING' && (
            <MatchingForm
              onSubmit={handleCreate}
              isSaving={isSaving}
            />
          )}
          {selectedType === 'ORDERING' && (
            <OrderingForm
              onSubmit={handleCreate}
              isSaving={isSaving}
            />
          )}
        </>
      )}

      {!selectedType && (
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </DialogFooter>
      )}
    </>
  );
};

// ============================================================
// ExerciseModal — wrapper
// Nota: editarea contentData unui exercitiu existent este
// intentionat omisa — complexitatea unui editor de tip WYSIWYG
// per tip de exercitiu depaseste scopul unui modal simplu.
// Profesorul poate sterge si recrea exercitiul.
// ============================================================
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
  onClose,
  onSuccess,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <ExerciseModalContent
          key={open ? lessonId : 'closed'}
          lessonId={lessonId}
          onClose={onClose}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  );
};