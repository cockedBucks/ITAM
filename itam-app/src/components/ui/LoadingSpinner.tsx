'use client';

import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: 16,
  md: 24,
  lg: 36,
};

export default function LoadingSpinner({
  text = 'جارِ التحميل...',
  size = 'md',
}: LoadingSpinnerProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <Loader2 size={sizeMap[size]} className="animate-spin text-cyan-glow" />
      <p className="text-sm text-oasis-400">{text}</p>
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-2 border-oasis-700 border-t-cyan-glow animate-spin" />
          <div className="absolute inset-0 w-12 h-12 rounded-full border-2 border-transparent border-b-teal-glow animate-spin-slow" />
        </div>
        <p className="text-sm text-oasis-400">جارِ التحميل...</p>
      </div>
    </div>
  );
}
