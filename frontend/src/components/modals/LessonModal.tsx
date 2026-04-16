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
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { useContent } from '@/hooks/useContent';
import type { LessonDto } from '@/hooks/useContent';

const schema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  description: z.string().optional(),
  xpReward: z.string().min(1, 'XP reward is required.'),
  orderIndex: z.string().min(1, 'Order is required.'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  unitId: number;
  lesson?: LessonDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const LessonModal = ({
  open,
  unitId,
  lesson,
  onClose,
  onSuccess,
}: Props) => {
  const { createLesson, updateLesson, isSaving, error } = useContent();
  const isEditing = !!lesson;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      xpReward: '100',
      orderIndex: '1',
    },
  });

  useEffect(() => {
    if (lesson) {
      reset({
        title: lesson.title,
        description: lesson.description ?? '',
        xpReward: lesson.xpReward.toString(),
        orderIndex: lesson.orderIndex.toString(),
      });
    } else {
      reset({
        title: '',
        description: '',
        xpReward: '100',
        orderIndex: '1',
      });
    }
  }, [lesson, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      unitId,
      title: data.title,
      description: data.description?.trim() || null,
      xpReward: Number(data.xpReward),
      orderIndex: Number(data.orderIndex),
    };

    const success = isEditing
      ? await updateLesson(lesson.id, payload)
      : await createLesson(payload);

    if (success) {
      onSuccess();
      handleClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">
            {isEditing ? 'Edit Lesson' : 'Create Lesson'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {error && <ErrorBanner message={error} />}

          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Lesson Title"
              className="input-branded"
            />
            {errors.title && (
              <p className="text-xs text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              {...register('description')}
              placeholder="What will students learn?"
              className="input-branded"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="xpReward">XP Reward</Label>
              <Input
                id="xpReward"
                type="number"
                min={0}
                {...register('xpReward')}
                className="input-branded"
              />
              {errors.xpReward && (
                <p className="text-xs text-destructive">
                  {errors.xpReward.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="orderIndex">Order</Label>
              <Input
                id="orderIndex"
                type="number"
                min={1}
                {...register('orderIndex')}
                className="input-branded"
              />
              {errors.orderIndex && (
                <p className="text-xs text-destructive">
                  {errors.orderIndex.message}
                </p>
              )}
            </div>
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
                : 'Create Lesson'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};