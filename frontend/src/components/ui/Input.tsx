'use client';

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, leftIcon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-[#a0a0b0]">{label}</label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 text-[#a0a0b0] pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.1)] rounded-xl px-4 py-3 text-white placeholder-[#a0a0b0] text-sm',
              'focus:outline-none focus:border-[#6c63ff] focus:ring-1 focus:ring-[#6c63ff] transition-all duration-200',
              'backdrop-blur-[20px]',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error && 'border-[#ff6b6b] focus:border-[#ff6b6b] focus:ring-[#ff6b6b]',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 text-[#a0a0b0]">{rightIcon}</span>
          )}
        </div>
        {error && (
          <p className="text-xs text-[#ff6b6b] mt-0.5">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
export default Input;
