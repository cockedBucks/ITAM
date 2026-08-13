'use client';

import { AssetStatus, ASSET_STATUS_AR } from '@/types/database';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: AssetStatus;
  size?: 'sm' | 'md';
}

const badgeClasses: Record<AssetStatus, string> = {
  Assigned: 'badge-assigned',
  Available: 'badge-available',
  Maintenance: 'badge-maintenance',
  Missing: 'badge-missing',
};

const dotColors: Record<AssetStatus, string> = {
  Assigned: 'bg-blue-400',
  Available: 'bg-emerald-400',
  Maintenance: 'bg-amber-400',
  Missing: 'bg-red-400',
};

export default function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        badgeClasses[status],
        size === 'sm' && 'text-[10px] px-2 py-0.5'
      )}
    >
      <span
        className={cn(
          'w-1.5 h-1.5 rounded-full animate-glow-pulse',
          dotColors[status]
        )}
      />
      {ASSET_STATUS_AR[status]}
    </span>
  );
}
