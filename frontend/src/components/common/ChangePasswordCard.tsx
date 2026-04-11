import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const schema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type FormData = z.infer<typeof schema>;

interface Props {
  onSubmit: (oldPassword: string, newPassword: string) => Promise<boolean>;
}

export const ChangePasswordCard = ({ onSubmit }: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onFormSubmit = async (data: FormData) => {
    const success = await onSubmit(data.oldPassword, data.newPassword);
    if (success) reset();
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="oldPassword">Current Password</Label>
        <Input
          id="oldPassword"
          type="password"
          {...register('oldPassword')}
          placeholder="········"
          className="input-branded"
        />
        {errors.oldPassword && (
          <p className="text-xs text-destructive">
            {errors.oldPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="newPassword">New Password</Label>
        <Input
          id="newPassword"
          type="password"
          {...register('newPassword')}
          placeholder="········"
          className="input-branded"
        />
        {errors.newPassword && (
          <p className="text-xs text-destructive">
            {errors.newPassword.message}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirmPassword">Confirm New Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register('confirmPassword')}
          placeholder="········"
          className="input-branded"
        />
        {errors.confirmPassword && (
          <p className="text-xs text-destructive">
            {errors.confirmPassword.message}
          </p>
        )}
      </div>

      <Button type="submit" className="btn-brand" disabled={isSubmitting}>
        {isSubmitting ? 'Updating...' : 'Update Password'}
      </Button>
    </form>
  );
};