'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  color: 'cyan' | 'teal' | 'blue' | 'emerald' | 'amber' | 'red';
  delay?: number;
}

const colorMap = {
  cyan: {
    bg: 'from-cyan-glow/10 to-cyan-glow/5',
    border: 'border-cyan-glow/20',
    icon: 'text-cyan-glow bg-cyan-glow/10',
    text: 'text-cyan-glow',
    glow: 'shadow-cyan-glow/10',
  },
  teal: {
    bg: 'from-teal-glow/10 to-teal-glow/5',
    border: 'border-teal-glow/20',
    icon: 'text-teal-glow bg-teal-glow/10',
    text: 'text-teal-glow',
    glow: 'shadow-teal-glow/10',
  },
  blue: {
    bg: 'from-blue-500/10 to-blue-500/5',
    border: 'border-blue-500/20',
    icon: 'text-blue-400 bg-blue-500/10',
    text: 'text-blue-400',
    glow: 'shadow-blue-500/10',
  },
  emerald: {
    bg: 'from-emerald-500/10 to-emerald-500/5',
    border: 'border-emerald-500/20',
    icon: 'text-emerald-400 bg-emerald-500/10',
    text: 'text-emerald-400',
    glow: 'shadow-emerald-500/10',
  },
  amber: {
    bg: 'from-amber-500/10 to-amber-500/5',
    border: 'border-amber-500/20',
    icon: 'text-amber-400 bg-amber-500/10',
    text: 'text-amber-400',
    glow: 'shadow-amber-500/10',
  },
  red: {
    bg: 'from-red-500/10 to-red-500/5',
    border: 'border-red-500/20',
    icon: 'text-red-400 bg-red-500/10',
    text: 'text-red-400',
    glow: 'shadow-red-500/10',
  },
};

export default function KPICard({ title, value, icon: Icon, color, delay = 0 }: KPICardProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const c = colorMap[color];

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  useEffect(() => {
    if (!isVisible) return;
    const duration = 1200;
    const start = Date.now();
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, isVisible]);

  return (
    <div
      className={cn(
        'relative rounded-2xl border bg-gradient-to-bl p-5 transition-all duration-500 hover:shadow-lg',
        c.bg,
        c.border,
        c.glow,
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-oasis-400 mb-2">{title}</p>
          <p className={cn('text-4xl font-bold tabular-nums', c.text)}>
            {displayValue.toLocaleString('ar-SA')}
          </p>
        </div>
        <div className={cn('p-2.5 rounded-xl', c.icon)}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}
