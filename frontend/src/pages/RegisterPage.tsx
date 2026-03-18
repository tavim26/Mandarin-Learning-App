import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { registerApi } from '@/api/authApi';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['STUDENT', 'TEACHER', 'ADMIN'] as const, {
    message: 'Please select a role',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

// Configuratia vizuala pentru fiecare rol
const ROLES: { value: 'STUDENT' | 'TEACHER' | 'ADMIN'; label: string; description: string }[] = [
  { value: 'STUDENT', label: 'Student', description: 'Learn Mandarin' },
  { value: 'TEACHER', label: 'Teacher', description: 'Manage content' },
  { value: 'ADMIN', label: 'Admin', description: 'Full access' },
];

const RegisterPage = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const selectedRole = watch('role');

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setServerError(null);
      await registerApi({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
        role: data.role,
      });
      navigate('/login');
    } catch (error: unknown) {
  if (error instanceof Error) {
    setServerError(error.message);
  } else {
    setServerError('An unexpected error occurred.');
  }
}
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

      {/* Coloana stanga — panel decorativ abstract */}
      <div
        className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: '#0f0800' }}
      >
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `repeating-linear-gradient(
              45deg,
              #e85d04 0px,
              #e85d04 1px,
              transparent 1px,
              transparent 12px
            )`,
          }}
        />
        <div
          className="absolute top-[-150px] left-[-150px] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle at center, #3d1a00 0%, transparent 70%)' }}
        />
        <div
          className="absolute top-[30%] right-[-100px] w-[300px] h-[300px] rounded-full"
          style={{ border: '1px solid rgba(232, 93, 4, 0.15)' }}
        />
        <div
          className="absolute top-[30%] right-[-100px] w-[200px] h-[200px] rounded-full"
          style={{ border: '1px solid rgba(232, 93, 4, 0.25)', transform: 'translate(50px, 50px)' }}
        />
        <div
          className="absolute"
          style={{
            width: '2px', height: '60%',
            background: 'linear-gradient(to bottom, transparent, #e85d04, transparent)',
            top: '20%', left: '45%', opacity: 0.3, transform: 'rotate(15deg)',
          }}
        />
        <div
          className="absolute bottom-[15%] left-[10%] w-[120px] h-[120px]"
          style={{ border: '1px solid rgba(232, 93, 4, 0.2)', transform: 'rotate(30deg)' }}
        />
        <div
          className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle at center, #2a0f00 0%, transparent 70%)' }}
        />
        <div className="absolute bottom-[35%] right-[25%] w-[8px] h-[8px] rounded-full"
          style={{ background: '#e85d04', opacity: 0.6 }} />
        <div className="absolute top-[25%] left-[30%] w-[4px] h-[4px] rounded-full"
          style={{ background: '#e85d04', opacity: 0.4 }} />
        <div className="absolute top-[60%] left-[20%] w-[6px] h-[6px] rounded-full"
          style={{ background: '#e85d04', opacity: 0.3 }} />

        <div className="relative z-10">
          <span
            className="text-xl font-bold tracking-widest uppercase"
            style={{ color: '#e85d04', letterSpacing: '0.25em', fontFamily: 'Outfit, sans-serif' }}
          >
            MandarinApp
          </span>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="w-12 h-[2px]" style={{ background: '#e85d04' }} />
          <p className="text-5xl font-thin leading-tight" style={{ color: 'rgba(255,255,255,0.08)', fontFamily: 'Outfit, sans-serif' }}>
            LEARN
          </p>
          <p className="text-5xl font-thin leading-tight pl-8" style={{ color: 'rgba(255,255,255,0.08)', fontFamily: 'Outfit, sans-serif' }}>
            PRACTICE
          </p>
          <p className="text-5xl font-thin leading-tight pl-16" style={{ color: 'rgba(255,255,255,0.08)', fontFamily: 'Outfit, sans-serif' }}>
            MASTER
          </p>
          <div className="w-12 h-[2px] ml-16" style={{ background: '#e85d04', opacity: 0.5 }} />
        </div>

        <div className="relative z-10">
          <p style={{ color: 'rgba(255,255,255,0.2)' }} className="text-xs tracking-widest uppercase">
            AI-powered language learning
          </p>
        </div>
      </div>

      {/* Coloana dreapta — fundal gri foarte deschis */}
      <div
        className="flex flex-col justify-center items-center p-8"
        style={{ background: '#f8f7f5' }}
      >
        {/* Card formular cu umbra */}
        <div
          className="w-full max-w-sm bg-white rounded-2xl p-8 space-y-6"
          style={{ boxShadow: '0 20px 60px rgba(0,0,0,0.08)' }}
        >

          <div className="space-y-1">
            <h1
              className="text-3xl font-bold text-gray-900 tracking-tight"
              style={{ fontFamily: 'Outfit, sans-serif' }}
            >
              Create account
            </h1>
            <p className="text-gray-400 text-sm">
              Join MandarinApp and start learning today
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

            {/* Camp nume complet */}
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
                <p className="text-xs text-red-500">{errors.fullName.message}</p>
              )}
            </div>

            {/* Camp email */}
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
                <p className="text-xs text-red-500">{errors.email.message}</p>
              )}
            </div>

            {/* Camp parola */}
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
                <p className="text-xs text-red-500">{errors.password.message}</p>
              )}
            </div>

            {/* Camp confirmare parola */}
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
                <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Selectare rol prin carduri clicabile */}
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
                      background: selectedRole === r.value ? '#fff7f0' : '#f9fafb',
                      color: selectedRole === r.value ? '#e85d04' : '#6b7280',
                    }}
                  >
                    <span className="text-sm font-semibold">{r.label}</span>
                    <span className="text-xs opacity-70 mt-0.5">{r.description}</span>
                  </button>
                ))}
              </div>
              {errors.role && (
                <p className="text-xs text-red-500">{errors.role.message}</p>
              )}
            </div>

            {serverError && (
              <div
                className="text-sm text-center py-2.5 px-4 rounded-xl"
                style={{ background: '#fff1f0', color: '#c1121f' }}
              >
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-11 rounded-xl text-white font-semibold text-sm hover:opacity-90 hover:shadow-lg active:scale-[0.98]"
              style={{ background: '#e85d04' }}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </Button>

          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-gray-400">or</span>
            </div>
          </div>

          <p className="text-center text-sm text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold hover:underline"
              style={{ color: '#e85d04' }}
            >
              Sign in
            </Link>
          </p>

        </div>
      </div>

    </div>
  );
};

export default RegisterPage;