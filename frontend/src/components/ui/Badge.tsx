import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
  size?: 'sm' | 'md';
  children: React.ReactNode;
  className?: string;
}

export default function Badge({
  variant = 'default',
  size = 'sm',
  children,
  className,
}: BadgeProps) {
  const variants = {
    default: 'bg-[rgba(255,255,255,0.1)] text-[#a0a0b0]',
    success: 'bg-[rgba(34,197,94,0.15)] text-[#4ade80] border border-[rgba(34,197,94,0.2)]',
    warning: 'bg-[rgba(234,179,8,0.15)] text-[#facc15] border border-[rgba(234,179,8,0.2)]',
    danger: 'bg-[rgba(255,107,107,0.15)] text-[#ff6b6b] border border-[rgba(255,107,107,0.2)]',
    info: 'bg-[rgba(56,189,248,0.15)] text-[#38bdf8] border border-[rgba(56,189,248,0.2)]',
    purple: 'bg-[rgba(108,99,255,0.15)] text-[#6c63ff] border border-[rgba(108,99,255,0.2)]',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </span>
  );
}
