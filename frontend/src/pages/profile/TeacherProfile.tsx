import { useEffect, useState } from 'react';
import { User, Mail, Lock, GraduationCap, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/useProfile';
import { useAuthStore } from '@/store/authStore';

const emailSchema = z.object({
  email: z.string().email('Invalid email address.'),
});

const titleSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters.'),
});

const passwordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Current password is required.'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters.'),
    confirmPassword: z.string(),
  })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });

type EmailForm = z.infer<typeof emailSchema>;
type TitleForm = z.infer<typeof titleSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

const TeacherProfile = () => {
  const { fullName, token } = useAuthStore();
  const {
    teacherProfile,
    isLoading,
    error,
    successMessage,
    updateEmail,
    updatePassword,
  } = useProfile();

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const titleForm = useForm<TitleForm>({
    resolver: zodResolver(titleSchema),
    defaultValues: { title: '' },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (teacherProfile?.title) {
      titleForm.reset({ title: teacherProfile.title });
    }
  }, [teacherProfile]);

  useEffect(() => {
    if (token) {
      try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        
        if (payload.sub) {
          emailForm.reset({ email: payload.sub });
        }
      } catch (e) {
        console.error("JWT Token decoding has failed", e);
      }
    }
  }, [token, emailForm]);

  const onEmailSubmit = async (data: EmailForm) => {
    const success = await updateEmail(data.email);
    if (success) emailForm.reset({ email: data.email });
  };

 

  const onPasswordSubmit = async (data: PasswordForm) => {
    const success = await updatePassword(data.oldPassword, data.newPassword);
    if (success) {
      passwordForm.reset({
        oldPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    }
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

      {/* Full Name — readonly */}
      <div className="card-base p-5 space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display font-semibold text-foreground">
            Full Name
          </h2>
        </div>
        <div className="space-y-1.5">
          <Label>Name</Label>
          <Input
            value={fullName ?? ''}
            readOnly
            className="input-branded bg-muted/50 cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">
            Your full name can only be changed by an administrator.
          </p>
        </div>
      </div>

      {/* Academic Title — readonly pentru teacher */}
<div className="card-base p-5 space-y-4">
  <div className="flex items-center gap-2">
    <GraduationCap className="h-4 w-4 text-muted-foreground" />
    <h2 className="font-display font-semibold text-foreground">
      Academic Title
    </h2>
  </div>
  <div className="space-y-1.5">
    <Label>Title</Label>
    <Input
      value={teacherProfile?.title ?? ''}
      readOnly
      className="input-branded bg-muted/50 cursor-not-allowed"
    />
    <p className="text-xs text-muted-foreground">
      Your academic title can only be changed by an administrator.
    </p>
  </div>
</div>



      {/* Email */}
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              {...emailForm.register('email')}
              placeholder="your@email.com"
              className="input-branded"
            />
            {emailForm.formState.errors.email && (
              <p className="text-xs text-destructive">
                {emailForm.formState.errors.email.message}
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

      {/* Password */}
      <div className="card-base p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <h2 className="font-display font-semibold text-foreground">
            Password
          </h2>
        </div>
        <form
          onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
          className="space-y-3"
        >


          <div className="space-y-1.5">
            <Label htmlFor="oldPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="oldPassword"
                type={showOld ? 'text' : 'password'}
                {...passwordForm.register('oldPassword')}
                placeholder="Enter current password"
                className="input-branded pr-10"
              />
              <button
                type="button"
                onClick={() => setShowOld((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordForm.formState.errors.oldPassword && (
              <p className="text-xs text-destructive">
                {passwordForm.formState.errors.oldPassword.message}
              </p>
            )}
          </div>
          

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNew ? 'text' : 'password'}
                {...passwordForm.register('newPassword')}
                placeholder="Min. 6 characters"
                className="input-branded pr-10"
              />
              <button
                type="button"
                onClick={() => setShowNew((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordForm.formState.errors.newPassword && (
              <p className="text-xs text-destructive">
                {passwordForm.formState.errors.newPassword.message}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                {...passwordForm.register('confirmPassword')}
                placeholder="Repeat new password"
                className="input-branded pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {passwordForm.formState.errors.confirmPassword && (
              <p className="text-xs text-destructive">
                {passwordForm.formState.errors.confirmPassword.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="btn-brand"
            disabled={passwordForm.formState.isSubmitting}
          >
            {passwordForm.formState.isSubmitting
              ? 'Updating...'
              : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default TeacherProfile;