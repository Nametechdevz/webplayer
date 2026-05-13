'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { Radio, KeyRound } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

const schema = z.object({
  code: z.string().min(4, 'Activation code is required'),
});

type FormData = z.infer<typeof schema>;

export default function ActivatePage() {
  const { activate, isActivatePending, activateError } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      await activate(data);
    } catch {
      // handled by error state
    }
  };

  const errorMessage =
    activateError instanceof Error
      ? activateError.message
      : activateError
      ? 'Invalid activation code.'
      : null;

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0a0a0f]">
      <div className="absolute inset-0">
        <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-[#6c63ff] rounded-full filter blur-[128px] opacity-15 animate-pulse" />
        <div className="absolute bottom-1/3 left-1/4 w-96 h-96 bg-[#ff6b6b] rounded-full filter blur-[128px] opacity-10 animate-pulse" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-md px-4"
      >
        <div className="glass rounded-3xl p-8 shadow-2xl">
          <div className="flex flex-col items-center gap-3 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#6c63ff] to-[#ff6b6b] flex items-center justify-center shadow-[0_0_30px_rgba(108,99,255,0.4)]">
              <Radio size={28} className="text-white" />
            </div>
            <div className="text-center">
              <h1 className="text-2xl font-bold text-white">
                Activate <span className="gradient-text">Account</span>
              </h1>
              <p className="text-[#a0a0b0] text-sm mt-1">Enter your activation code</p>
            </div>
          </div>

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
              label="Activation Code"
              placeholder="XXXX-XXXX-XXXX"
              error={errors.code?.message}
              leftIcon={<KeyRound size={16} />}
              className="text-center tracking-widest text-lg font-mono"
              {...register('code')}
            />

            <Button
              type="submit"
              size="lg"
              isLoading={isActivatePending}
              className="w-full mt-2"
              leftIcon={<KeyRound size={18} />}
            >
              Activate
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/login"
              className="text-[#6c63ff] hover:text-white text-sm font-medium transition-colors"
            >
              ← Back to login
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
