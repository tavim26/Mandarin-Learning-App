import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import type { RegisterFormData } from '@/hooks/useAuth';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email:    z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN'] as const, {
    message: 'Please select a role',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const ROLES: { value: RegisterFormData['role']; label: string; description: string }[] = [
  { value: 'STUDENT', label: 'Student',  description: 'Learn Mandarin' },
  { value: 'TEACHER', label: 'Teacher',  description: 'Manage content' },
  { value: 'ADMIN',   label: 'Admin',    description: 'Full access' },
];

const RegisterPage = () => {
  const { register: registerUser, registerError, isSubmitting } = useAuth();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const selectedRole = watch('role');

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

      <DecorativePanel />

      <div className="flex flex-col justify-center items-center p-8 bg-app-bg">
        <div className="w-full max-w-sm bg-white rounded-2xl p-8 space-y-6 shadow-form animate-fade-in-scale">

          <div className="space-y-1">
            <h1 className="font-display text-3xl font-bold text-gray-900 tracking-tight">
              Create account
            </h1>
            <p className="text-sm text-gray-400">
              Join MandarinApp and start learning today
            </p>
          </div>

          <form onSubmit={handleSubmit(registerUser)} className="space-y-4">

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider" htmlFor="fullName">
                Full name
              </label>
              <Input
                id="fullName"
                type="text"
                placeholder="Full name"
                className="h-11 rounded-xl border-gray-200 bg-gray-50 text-gray-900"
                {...register('fullName')}
              />
              {errors.fullName && (
                <p className="text-xs text-error">{errors.fullName.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider" htmlFor="email">
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="Email address"
                className="h-11 rounded-xl border-gray-200 bg-gray-50 text-gray-900"
                {...register('email')}
              />
              {errors.email && (
                <p className="text-xs text-error">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider" htmlFor="password">
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Password"
                className="h-11 rounded-xl border-gray-200 bg-gray-50 text-gray-900"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-error">{errors.password.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider" htmlFor="confirmPassword">
                Confirm password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm password"
                className="h-11 rounded-xl border-gray-200 bg-gray-50 text-gray-900"
                {...register('confirmPassword')}
              />
              {errors.confirmPassword && (
                <p className="text-xs text-error">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Selectare rol */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                I am a...
              </label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setValue('role', r.value, { shouldValidate: true })}
                    className="flex flex-col items-center justify-center py-3 px-2 rounded-xl border text-center transition-all"
                    style={{
                      borderColor: selectedRole === r.value ? '#e85d04' : '#e5e7eb',
                      background:  selectedRole === r.value ? '#fff7f0' : '#f9fafb',
                    }}
                  >
                    <span className={`text-sm font-semibold ${selectedRole === r.value ? 'text-brand' : 'text-gray-500'}`}>
                      {r.label}
                    </span>
                    <span className={`text-xs mt-0.5 ${selectedRole === r.value ? 'text-brand opacity-70' : 'text-gray-400'}`}>
                      {r.description}
                    </span>
                  </button>
                ))}
              </div>
              {errors.role && (
                <p className="text-xs text-error">{errors.role.message}</p>
              )}
            </div>

            {registerError && (
              <div className="text-sm text-center py-2.5 px-4 rounded-xl bg-red-50 text-error">
                {registerError}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-brand text-white font-semibold text-sm hover:opacity-90 hover:shadow-lg active:scale-[0.98] transition-all"
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <Divider />

          <p className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;

// ----------------------------------------------------------------
// Subcomponente locale
// ----------------------------------------------------------------

const Divider = () => (
  <div className="relative">
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-gray-100" />
    </div>
    <div className="relative flex justify-center text-xs">
      <span className="bg-white px-3 text-gray-400">or</span>
    </div>
  </div>
);

const DecorativePanel = () => (
  <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden bg-[#0f0800]">
    <div
      className="absolute inset-0 opacity-5"
      style={{
        backgroundImage: `repeating-linear-gradient(
          45deg, #e85d04 0px, #e85d04 1px,
          transparent 1px, transparent 12px
        )`,
      }}
    />
    <div className="absolute top-[-150px] left-[-150px] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,#3d1a00_0%,transparent_70%)]" />
    <div className="absolute top-[30%] right-[-100px] w-[300px] h-[300px] rounded-full border border-white/5" />
    <div className="absolute top-[30%] right-[-100px] w-[200px] h-[200px] rounded-full border border-white/10 translate-x-[50px] translate-y-[50px]" />
    <div className="absolute bottom-[15%] left-[10%] w-[120px] h-[120px] border border-white/5 rotate-[30deg]" />
    <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,#2a0f00_0%,transparent_70%)]" />
    <div className="absolute bottom-[35%] right-[25%] w-2 h-2 rounded-full bg-brand opacity-60" />
    <div className="absolute top-[25%] left-[30%] w-1 h-1 rounded-full bg-brand opacity-40" />
    <div className="absolute top-[60%] left-[20%] w-1.5 h-1.5 rounded-full bg-brand opacity-30" />

    <div className="relative z-10">
      <span className="font-display text-xl font-bold tracking-[0.25em] uppercase text-brand">
        MandarinApp
      </span>
    </div>

    <div className="relative z-10 space-y-4">
      <div className="w-12 h-[2px] bg-brand" />
      <p className="font-display text-5xl font-thin leading-tight text-white/[0.08]">LEARN</p>
      <p className="font-display text-5xl font-thin leading-tight text-white/[0.08] pl-8">PRACTICE</p>
      <p className="font-display text-5xl font-thin leading-tight text-white/[0.08] pl-16">MASTER</p>
      <div className="w-12 h-[2px] bg-brand opacity-50 ml-16" />
    </div>

    <div className="relative z-10">
      <p className="text-xs tracking-widest uppercase text-white/20">
        AI-powered language learning
      </p>
    </div>
  </div>
);