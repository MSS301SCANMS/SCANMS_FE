import React from 'react';
import { cn } from '../../utils/cn';
import { Card } from './Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  trend?: string;
  trendType?: 'positive' | 'negative' | 'neutral';
  subText?: string;
  icon?: React.ReactNode;
  iconBg?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  trend,
  trendType = 'positive',
  subText,
  icon,
  iconBg = 'bg-slate-100 text-slate-600',
  className,
}: StatCardProps) {
  const trendColors = {
    positive: 'text-emerald-600',
    negative: 'text-rose-600',
    neutral: 'text-slate-500',
  };

  return (
    <Card className={cn('p-5 flex flex-col justify-between hover:border-slate-300', className)}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{title}</span>
        {icon && (
          <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center text-base shrink-0', iconBg)}>
            {icon}
          </div>
        )}
      </div>

      <div className="mt-3">
        <strong className="text-2xl font-extrabold text-slate-900 tracking-tight block">
          {value}
        </strong>
        <div className="flex items-center gap-2 mt-0.5">
          {trend && (
            <span className={cn('text-xs font-semibold', trendColors[trendType])}>
              {trend}
            </span>
          )}
          {subText && (
            <span className="text-xs text-slate-500">
              {subText}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
}
