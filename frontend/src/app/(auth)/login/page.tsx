'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Radio, LogIn } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const schema = z.object({
  username: z.string().min(2, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { login, isLoginPending, loginError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await login(data);
    } catch {
      // handled by mutation error state
    }
  };

  const errorMessage =
    loginError instanceof Error
      ? loginError.message
      : loginError
      ? 'Login failed. Check your credentials.'
      : null;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0f]">
      {/* Animated background */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#6c63ff] rounded-full filter blur-[128px] opacity-15 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#ff6b6b] rounded-full filter blur-[128px] opacity-10 animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="glass rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6c63ff] to-[#ff6b6b] flex items-center justify-center shadow-[0_0_30px_rgba(108,99,255,0.4)]">
              <Radio size={28} className="text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">
                Stream<span className="gradient-text">Vault</span>
              </h1>
              <p className="text-[#a0a0b0] text-sm mt-1">Sign in to your account</p>
            </div>
          </div>

          {/* Error */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-4 px-4 py-3 rounded-xl bg-[rgba(255,107,107,0.1)] border border-[rgba(255,107,107,0.3)] text-[#ff6b6b] text-sm"
            >
              {errorMessage}
            </motion.div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
            <Input
              label="Username"
              placeholder="Enter your username"
              error={errors.username?.message}
              {...register('username')}
            />

            <div className="flex flex-col gap-1.5">
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                error={errors.password?.message}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[#a0a0b0] hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
                {...register('password')}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-[#6c63ff]"
                  {...register('rememberMe')}
                />
                <span className="text-[#a0a0b0] text-sm">Remember me</span>
              </label>
            </div>

            <Button
              type="submit"
              size="lg"
              isLoading={isLoginPending}
              className="w-full mt-2"
              leftIcon={<LogIn size={18} />}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 flex items-center gap-3">
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
            <span className="text-[#a0a0b0] text-xs">or</span>
            <div className="flex-1 h-px bg-[rgba(255,255,255,0.08)]" />
          </div>

          <div className="mt-4 text-center">
            <Link
              href="/activate"
              className="text-[#6c63ff] hover:text-white text-sm font-medium transition-colors"
            >
              Activate with a code →
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
