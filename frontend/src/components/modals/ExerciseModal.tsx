import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { useContent } from '@/hooks/useContent';
import type { ExerciseDto, ExerciseType } from '@/hooks/useContent';

const EXERCISE_TYPES: ExerciseType[] = [
  'MULTIPLE_CHOICE',
  'TRANSLATION',
  'FILL_BLANK',
  'MATCHING',
  'ORDERING',
];

const schema = z.object({
  prompt: z.string().min(2, 'Prompt must be at least 2 characters.'),
  type: z.enum([
    'MULTIPLE_CHOICE',
    'TRANSLATION',
    'FILL_BLANK',
    'MATCHING',
    'ORDERING',
  ]),
  difficulty: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

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
  const { createExercise, updateExercise, isSaving, error } = useContent();
  const isEditing = !!exercise;

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      prompt: '',
      type: 'MULTIPLE_CHOICE',
      difficulty: '',
    },
  });

  // selectedType deriva din form state — fara useState separat
  const selectedType = watch('type');

  useEffect(() => {
    if (exercise) {
      reset({
        prompt: exercise.prompt,
        type: exercise.type,
        difficulty: exercise.difficulty?.toString() ?? '',
      });
    } else {
      reset({
        prompt: '',
        type: 'MULTIPLE_CHOICE',
        difficulty: '',
      });
    }
  }, [exercise, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      lessonId,
      prompt: data.prompt,
      type: data.type,
      difficulty: data.difficulty ? Number(data.difficulty) : null,
      contentData: exercise?.contentData ?? null,
    };

    const success = isEditing
      ? await updateExercise(exercise.id, {
          type: payload.type,
          prompt: payload.prompt,
          difficulty: payload.difficulty,
          contentData: payload.contentData,
        })
      : await createExercise(payload);

    if (success) {
      onSuccess();
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md animate-scale-in">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? 'Edit Exercise' : 'Create Exercise'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {error && <ErrorBanner message={error} />}

          <div className="space-y-1.5">
            <Label>Exercise Type</Label>
            <Select
              value={selectedType}
              onValueChange={(val) => setValue('type', val as ExerciseType)}
            >
              <SelectTrigger className="input-branded">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EXERCISE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type.replace(/_/g, ' ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="prompt">Prompt</Label>
            <Input
              id="prompt"
              {...register('prompt')}
              placeholder="e.g. 你好 means..."
              className="input-branded"
            />
            {errors.prompt && (
              <p className="text-xs text-destructive">
                {errors.prompt.message}
              </p>
            )}
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
            {errors.difficulty && (
              <p className="text-xs text-destructive">
                {errors.difficulty.message}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="btn-brand"
              disabled={isSaving}
            >
              {isSaving
                ? isEditing
                  ? 'Saving...'
                  : 'Creating...'
                : isEditing
                ? 'Save Changes'
                : 'Create Exercise'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};