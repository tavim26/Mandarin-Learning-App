import { User, Mail, Lock, AtSign } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { ChangePasswordCard } from '@/components/common/ChangePasswordCard';
import { useProfile } from '@/hooks/useProfile';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const emailSchema = z.object({
  newEmail: z.string().email('Invalid email address.'),
});

const nicknameSchema = z.object({
  newNickname: z.string().min(2, 'Nickname must be at least 2 characters.'),
});

type EmailForm = z.infer<typeof emailSchema>;
type NicknameForm = z.infer<typeof nicknameSchema>;

const StudentProfile = () => {
  const {
    userInfo,
    studentProfile,
    isLoading,
    error,
    successMessage,
    updateEmail,
    updatePassword,
    updateNickname,
  } = useProfile();

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
  });

  const nicknameForm = useForm<NicknameForm>({
    resolver: zodResolver(nicknameSchema),
    defaultValues: { newNickname: studentProfile?.nickname ?? '' },
  });

  const onEmailSubmit = async (data: EmailForm) => {
    const success = await updateEmail(data.newEmail);
    if (success) emailForm.reset();
  };

  const onNicknameSubmit = async (data: NicknameForm) => {
    await updateNickname(data.newNickname);
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <PageHeader
        title="My Profile"
        subtitle="Manage your account settings."
        icon={User}
      />

      {error && <ErrorBanner message={error} />}

      {successMessage && (
        <div className="rounded-lg border border-student/30 bg-student/8 px-4 py-3 text-sm text-student animate-fade-in">
          {successMessage}
        </div>
      )}

      {/* Info card */}
      <div className="card-base p-5 space-y-3">
        <h2 className="font-display font-semibold text-foreground text-sm uppercase tracking-wide">
          Account Info
        </h2>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="text-foreground font-medium">
              {userInfo?.fullName ?? '—'}
            </span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <AtSign className="h-4 w-4" />
            <span className="text-foreground">
              {studentProfile?.nickname
                ? `@${studentProfile.nickname}`
                : 'No nickname set'}
            </span>
          </div>
        </div>
      </div>

      {/* Update nickname */}
      <div className="card-base p-5 space-y-4">
        <div className="flex items-center gap-2">
          <AtSign className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display font-semibold text-foreground">
            Nickname
          </h2>
        </div>
        <form
          onSubmit={nicknameForm.handleSubmit(onNicknameSubmit)}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="newNickname">New Nickname</Label>
            <Input
              id="newNickname"
              {...nicknameForm.register('newNickname')}
              placeholder={studentProfile?.nickname ?? 'Choose a nickname'}
              className="input-branded"
            />
            {nicknameForm.formState.errors.newNickname && (
              <p className="text-xs text-destructive">
                {nicknameForm.formState.errors.newNickname.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="btn-brand"
            disabled={nicknameForm.formState.isSubmitting}
          >
            {nicknameForm.formState.isSubmitting
              ? 'Saving...'
              : 'Update Nickname'}
          </Button>
        </form>
      </div>

      {/* Update email */}
      <div className="card-base p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display font-semibold text-foreground">
            Email Address
          </h2>
        </div>
        <form
          onSubmit={emailForm.handleSubmit(onEmailSubmit)}
          className="space-y-3"
        >
          <div className="space-y-1.5">
            <Label htmlFor="newEmail">New Email</Label>
            <Input
              id="newEmail"
              type="email"
              {...emailForm.register('newEmail')}
              placeholder="new@email.com"
              className="input-branded"
            />
            {emailForm.formState.errors.newEmail && (
              <p className="text-xs text-destructive">
                {emailForm.formState.errors.newEmail.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            className="btn-brand"
            disabled={emailForm.formState.isSubmitting}
          >
            {emailForm.formState.isSubmitting ? 'Saving...' : 'Update Email'}
          </Button>
        </form>
      </div>

      {/* Change password */}
      <div className="card-base p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display font-semibold text-foreground">
            Password
          </h2>
        </div>
        <ChangePasswordCard onSubmit={updatePassword} />
      </div>
    </div>
  );
};

export default StudentProfile;