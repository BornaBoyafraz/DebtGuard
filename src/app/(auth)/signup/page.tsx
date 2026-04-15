'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthContext } from '@/contexts/auth-context';
import { isSupabaseConfigured } from '@/lib/supabase/client';

const signupSchema = z
  .object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val, 'You must accept the disclaimer'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: { terms: false },
  });

  const onSubmit = async (data: SignupFormData) => {
    setLoading(true);
    setAuthError(null);
    try {
      const { error } = await signup(data.name, data.email, data.password);
      if (error) {
        setAuthError(error);
      } else {
        router.push('/app/dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[40%] bg-surface h-screen flex-col justify-between p-10 relative overflow-hidden">
        <Link href="/" className="flex items-center gap-2.5 relative z-10">
          <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <Shield className="w-4.5 h-4.5 text-accent-foreground" />
          </div>
          <span className="text-lg font-semibold text-text-primary">DebtGuard</span>
        </Link>
        <div className="max-w-sm relative z-10">
          <blockquote className="text-xl font-light italic text-text-secondary leading-relaxed">
            &ldquo;Every financial decision is a fork in the road. The question is whether you can see where each path leads.&rdquo;
          </blockquote>
        </div>
        <div className="relative z-10" aria-hidden="true">
          <div className="flex gap-3 opacity-40">
            <div className="w-12 h-12 rounded-full border border-accent/20" />
            <div className="w-8 h-8 rounded-full border border-accent/15 mt-2" />
            <div className="w-16 h-16 rounded-full border border-accent/10 -mt-3" />
          </div>
        </div>
        <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-accent/[0.04]" aria-hidden="true" />
        <div className="absolute bottom-1/4 right-1/6 w-48 h-48 rounded-full bg-accent/[0.03]" aria-hidden="true" />
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md mx-auto py-12 px-6">
          <div className="lg:hidden mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <Shield className="w-4.5 h-4.5 text-accent-foreground" />
              </div>
              <span className="text-lg font-semibold text-text-primary">DebtGuard</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-text-primary">Create your workspace.</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Start simulating financial decisions in minutes.
          </p>

          {!isSupabaseConfigured && (
            <div className="mt-4 rounded-lg border border-accent/20 bg-accent/5 px-4 py-3">
              <p className="text-sm font-medium text-text-primary">Local mode</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Running without a database. Enter any name, email, and password to continue — your data will be saved locally in this browser.
              </p>
            </div>
          )}

          {authError && (
            <div className="mt-4 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3">
              <p className="text-sm text-danger">{authError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <Input
              label="Full Name"
              placeholder="Jane Doe"
              error={errors.name?.message}
              {...register('name')}
            />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <div className="flex items-start gap-2">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 rounded border-border bg-surface-elevated accent-accent cursor-pointer"
                {...register('terms')}
              />
              <label htmlFor="terms" className="text-xs text-text-muted cursor-pointer leading-relaxed">
                I understand DebtGuard is an educational tool, not financial advice.
              </label>
            </div>
            {errors.terms && (
              <p className="text-xs text-danger">{errors.terms.message}</p>
            )}

            <Button type="submit" size="lg" className="w-full" loading={loading}>
              Create Account
            </Button>
          </form>

          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-text-muted">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <p className="text-sm text-text-secondary text-center">
            Already have an account?{' '}
            <Link href="/login" className="text-accent hover:text-accent-hover transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
