import { cn } from '@/lib/utils';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
  };

  return (
    <div
      className={cn(
        'border-2 border-[rgba(255,255,255,0.1)] border-t-[#6c63ff] rounded-full animate-spin',
        sizes[size],
        className
      )}
    />
  );
}

export function FullscreenSpinner() {
  return (
    <div className="fixed inset-0 bg-[#0a0a0f] flex items-center justify-center z-50">
      <div className="flex flex-col items-center gap-4">
        <Spinner size="lg" />
        <p className="text-[#a0a0b0] text-sm">Loading...</p>
      </div>
    </div>
  );
}
