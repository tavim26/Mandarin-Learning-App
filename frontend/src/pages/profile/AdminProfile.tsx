import { useState, useEffect } from 'react';
import { User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorBanner } from '@/components/common/ErrorBanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProfile } from '@/hooks/useProfile';
import { useAuthStore } from '@/store/authStore';

const emailSchema = z.object({
  email: z.string().email('Invalid email address.'),
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
type PasswordForm = z.infer<typeof passwordSchema>;

const AdminProfile = () => {
  const { fullName, token } = useAuthStore();
  const { error, successMessage, updateEmail, updatePassword } = useProfile();

  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);


  
  

  const emailForm = useForm<EmailForm>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      oldPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

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



  return (
    <div className="space-y-6 animate-fade-in max-w-2xl">
      <PageHeader
        title="My Profile"
        subtitle="Manage your administrator account."
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

export default AdminProfile;