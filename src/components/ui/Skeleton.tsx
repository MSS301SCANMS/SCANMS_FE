import type { CSSProperties } from 'react';
import { cn } from '../../utils/cn';

interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * Skeleton – animated shimmer placeholder for loading states.
 * Usage: <Skeleton className="h-4 w-32 rounded" />
 */
export function Skeleton({ className, style }: SkeletonProps) {
  return (
    <div
      style={style}
      className={cn(
        'skeleton-shimmer rounded-lg',
        className
      )}
    />
  );
}

/** A convenience wrapper to render multiple Skeletons in a flex-col gap */
export function SkeletonList({ count = 3, itemClassName }: { count?: number; itemClassName?: string }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={itemClassName ?? 'h-14 w-full rounded-xl'} />
      ))}
    </div>
  );
}

/** Card-shaped skeleton for metric stat blocks */
export function SkeletonStatCard() {
  return (
    <div className="p-4 bg-white border border-[#EAE4D7] rounded-2xl shadow-xs flex flex-col justify-between gap-3">
      <div className="flex justify-between items-center">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="w-8 h-8 rounded-xl" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  );
}

/** Table row skeleton */
export function SkeletonTableRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="py-3 px-4">
          <Skeleton className={`h-4 ${i === 0 ? 'w-40' : 'w-20'}`} />
        </td>
      ))}
    </tr>
  );
}

/** Full chart area skeleton */
export function SkeletonChart({ height = 'h-44' }: { height?: string }) {
  return (
    <div className={`${height} flex items-end gap-2 border-b border-[#EAE4D7] pb-2`}>
      {[60, 80, 45, 90, 70, 55, 85].map((h, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-2">
          <Skeleton className="w-full rounded-t-sm" style={{ height: `${h}%` } as React.CSSProperties} />
          <Skeleton className="h-2 w-8" />
        </div>
      ))}
    </div>
  );
}
