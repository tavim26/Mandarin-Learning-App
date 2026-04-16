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
import type { CourseUnitDto } from '@/hooks/useContent';

const schema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
  description: z.string().optional(),
  hskLevel: z.string().optional(),
  orderIndex: z.string().min(1, 'Order is required.'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  unit?: CourseUnitDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const UnitModal = ({ open, unit, onClose, onSuccess }: Props) => {
  const { createUnit, updateUnit, isSaving, error } = useContent();
  const isEditing = !!unit;

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
      hskLevel: '',
      orderIndex: '1',
    },
  });

  useEffect(() => {
    if (unit) {
      reset({
        title: unit.title,
        description: unit.description ?? '',
        hskLevel: unit.hskLevel?.toString() ?? '',
        orderIndex: unit.orderIndex.toString(),
      });
    } else {
      reset({
        title: '',
        description: '',
        hskLevel: '',
        orderIndex: '1',
      });
    }
  }, [unit, reset]);

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: FormData) => {
    const payload = {
      title: data.title,
      description: data.description?.trim() || null,
      hskLevel: data.hskLevel ? Number(data.hskLevel) : null,
      orderIndex: Number(data.orderIndex),
    };

    const success = isEditing
      ? await updateUnit(unit.id, payload)
      : await createUnit(payload);

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
            {isEditing ? 'Edit Unit' : 'Create Unit'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
          {error && <ErrorBanner message={error} />}

          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              {...register('title')}
              placeholder="Unit Title"
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
              placeholder="Brief description of this unit"
              className="input-branded"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="hskLevel">HSK Level (optional)</Label>
              <Input
                id="hskLevel"
                type="number"
                min={1}
                max={6}
                {...register('hskLevel')}
                placeholder="1–6"
                className="input-branded"
              />
              {errors.hskLevel && (
                <p className="text-xs text-destructive">
                  {errors.hskLevel.message}
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
                : 'Create Unit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};