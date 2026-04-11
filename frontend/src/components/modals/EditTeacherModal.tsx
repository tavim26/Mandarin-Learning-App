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
import { useUsers } from '@/hooks/useUsers';
import type { TeacherProfileDto } from '@/hooks/useUsers';

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters.'),
  title: z.string().min(1, 'Title is required.'),
  email: z.string().email('Invalid email address.'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  teacher: TeacherProfileDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

const EditTeacherContent = ({
  teacher,
  onClose,
  onSuccess,
}: {
  teacher: TeacherProfileDto;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { updateUserName, updateTeacherTitle, error } = useUsers();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: teacher.fullName,
      title: teacher.title,
      email: teacher.email,
    },
  });

  const onSubmit = async (data: FormData) => {
    const results = await Promise.all([
      data.fullName !== teacher.fullName
        ? updateUserName(teacher.userId, data.fullName)
        : Promise.resolve(true),
      data.title !== teacher.title
        ? updateTeacherTitle(teacher.userId, data.title)
        : Promise.resolve(true),
    ]);

    if (results.every(Boolean)) {
      onSuccess();
      onClose();
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="font-display">Edit Teacher</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-2">
        {error && <ErrorBanner message={error} />}

        <div className="space-y-1.5">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            {...register('fullName')}
            className="input-branded"
          />
          {errors.fullName && (
            <p className="text-xs text-destructive">
              {errors.fullName.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="title">Academic Title</Label>
          <Input
            id="title"
            {...register('title')}
            placeholder="e.g. Dr., Prof."
            className="input-branded"
          />
          {errors.title && (
            <p className="text-xs text-destructive">
              {errors.title.message}
            </p>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="btn-brand"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
};

export const EditTeacherModal = ({
  open,
  teacher,
  onClose,
  onSuccess,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {teacher && (
          <EditTeacherContent
            key={open ? teacher.userId : 'closed'}
            teacher={teacher}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};