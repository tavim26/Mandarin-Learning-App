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
import type { StudentProfileDto } from '@/hooks/useUsers';

const schema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters.'),
  nickname: z.string().min(2, 'Nickname must be at least 2 characters.'),
  email: z.string().email('Invalid email address.'),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  student: StudentProfileDto | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Continutul formularului — montat fresh prin key la fiecare deschidere
const EditStudentContent = ({
  student,
  onClose,
  onSuccess,
}: {
  student: StudentProfileDto;
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const { updateUserName, updateStudentNickname, error } = useUsers();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: student.fullName,
      nickname: student.nickname,
      email: student.email,
    },
  });

  const onSubmit = async (data: FormData) => {
    const results = await Promise.all([
      data.fullName !== student.fullName
        ? updateUserName(student.userId, data.fullName)
        : Promise.resolve(true),
      data.nickname !== student.nickname
        ? updateStudentNickname(student.userId, data.nickname)
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
        <DialogTitle className="font-display">Edit Student</DialogTitle>
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
          <Label htmlFor="nickname">Nickname</Label>
          <Input
            id="nickname"
            {...register('nickname')}
            className="input-branded"
          />
          {errors.nickname && (
            <p className="text-xs text-destructive">
              {errors.nickname.message}
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

export const EditStudentModal = ({
  open,
  student,
  onClose,
  onSuccess,
}: Props) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        {student && (
          <EditStudentContent
            key={open ? student.userId : 'closed'}
            student={student}
            onClose={onClose}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};