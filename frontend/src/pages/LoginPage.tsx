import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import type { LoginFormData } from '@/hooks/useAuth';

const loginSchema = z.object({
  email:    z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const LoginPage = () => {
  const { login, loginError, isSubmitting } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2">

      <DecorativePanel />

      <div className="flex flex-col justify-center items-center p-8 bg-app-bg">
        <div className="w-full max-w-sm bg-white rounded-2xl p-8 space-y-7 shadow-form animate-fade-in-scale">

          <div className="space-y-1">
            <h1 className="font-display text-3xl font-bold text-gray-900 tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-gray-400">
              Sign in to continue your learning journey
            </p>
          </div>

          <form onSubmit={handleSubmit(login)} className="space-y-4">
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

            {loginError && (
              <div className="text-sm text-center py-2.5 px-4 rounded-xl bg-red-50 text-error">
                {loginError}
              </div>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 rounded-xl bg-brand text-white font-semibold text-sm hover:opacity-90 hover:shadow-lg active:scale-[0.98] transition-all"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>

          <Divider />

          <p className="text-center text-sm text-gray-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand hover:underline">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;

// ----------------------------------------------------------------
// Subcomponente locale — nu merita fisiere separate
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
    {/* Grila diagonala subtila */}
    <div
      className="absolute inset-0 opacity-5"
      style={{
        backgroundImage: `repeating-linear-gradient(
          45deg, #e85d04 0px, #e85d04 1px,
          transparent 1px, transparent 12px
        )`,
      }}
    />
    {/* Orbe decorative */}
    <div className="absolute top-[-150px] left-[-150px] w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_center,#3d1a00_0%,transparent_70%)]" />
    <div className="absolute top-[30%] right-[-100px] w-[300px] h-[300px] rounded-full border border-white/5" />
    <div className="absolute top-[30%] right-[-100px] w-[200px] h-[200px] rounded-full border border-white/10 translate-x-[50px] translate-y-[50px]" />
    <div className="absolute bottom-[15%] left-[10%] w-[120px] h-[120px] border border-white/5 rotate-[30deg]" />
    <div className="absolute bottom-[-200px] right-[-200px] w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle_at_center,#2a0f00_0%,transparent_70%)]" />
    {/* Puncte decorative */}
    <div className="absolute bottom-[35%] right-[25%] w-2 h-2 rounded-full bg-brand opacity-60" />
    <div className="absolute top-[25%] left-[30%] w-1 h-1 rounded-full bg-brand opacity-40" />
    <div className="absolute top-[60%] left-[20%] w-1.5 h-1.5 rounded-full bg-brand opacity-30" />

    {/* Logo */}
    <div className="relative z-10">
      <span className="font-display text-xl font-bold tracking-[0.25em] uppercase text-brand">
        MandarinApp
      </span>
    </div>

    {/* Text decorativ */}
    <div className="relative z-10 space-y-4">
      <div className="w-12 h-[2px] bg-brand" />
      <p className="font-display text-5xl font-thin leading-tight text-white/[0.08]">LEARN</p>
      <p className="font-display text-5xl font-thin leading-tight text-white/[0.08] pl-8">PRACTICE</p>
      <p className="font-display text-5xl font-thin leading-tight text-white/[0.08] pl-16">MASTER</p>
      <div className="w-12 h-[2px] bg-brand opacity-50 ml-16" />
    </div>

    {/* Tagline */}
    <div className="relative z-10">
      <p className="text-xs tracking-widest uppercase text-white/20">
        AI-powered language learning
      </p>
    </div>
  </div>
);