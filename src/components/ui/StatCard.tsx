import React from 'react';
import { cn } from '../../utils/cn';
import { TrendingUp } from 'lucide-react';

export interface StatCardProps {
  title: string;
  value: string | number;
  growth?: number;
  trendText?: string;
  note?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function StatCard({
  title,
  value,
  growth,
  trendText,
  note,
  icon,
  className,
  onClick,
}: StatCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'p-4 bg-white border border-[#EAE4D7] rounded-2xl shadow-2xs flex flex-col justify-between gap-3 text-left transition hover:border-[#C59B58]/50',
        onClick && 'cursor-pointer hover:shadow-xs',
        className
      )}
    >
      <div className="flex justify-between items-center gap-2">
        <span className="text-xs font-bold text-[#7D715E] truncate" title={title}>
          {title}
        </span>
        {icon && (
          <div className="w-8 h-8 rounded-xl bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] flex items-center justify-center shrink-0">
            {icon}
          </div>
        )}
      </div>

      <div>
        <strong className="text-xl sm:text-2xl font-black text-[#1A1612] tracking-tight block tabular-nums">
          {value}
        </strong>

        <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
          {growth !== undefined && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 font-bold',
                growth > 0
                  ? 'text-[#059669]'
                  : growth < 0
                  ? 'text-[#DC2626]'
                  : 'text-[#7D715E]'
              )}
            >
              {growth !== 0 && (
                <TrendingUp
                  size={12}
                  className={growth < 0 ? 'rotate-180' : ''}
                  aria-hidden="true"
                />
              )}
              {growth > 0 ? '+' : ''}
              {growth.toFixed(1)}%
            </span>
          )}

          {trendText && (
            <span className="font-semibold text-[#7D715E]">
              {trendText}
            </span>
          )}

          {note && (
            <span className="text-[11px] text-[#7D715E] leading-tight block">
              {note}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
