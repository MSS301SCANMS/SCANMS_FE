import React from 'react';
import { cn } from '../../utils/cn';

export interface PageHeaderBreadcrumb {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  title: string;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  breadcrumbs?: PageHeaderBreadcrumb[];
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon,
  badge,
  breadcrumbs,
  actions,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1 text-left',
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0">
        {icon && (
          <div className="w-10 h-10 rounded-xl bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] flex items-center justify-center shrink-0 shadow-2xs mt-0.5">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1.5 text-xs text-[#7D715E] mb-1 overflow-x-auto whitespace-nowrap" aria-label="Breadcrumb">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={idx}>
                  {idx > 0 && <span className="text-[#A79B89]">/</span>}
                  {crumb.href ? (
                    <a href={crumb.href} className="hover:text-[#B88E4F] transition-colors">
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-[#1A1612] font-medium">{crumb.label}</span>
                  )}
                </React.Fragment>
              ))}
            </nav>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-[#1A1612] tracking-tight leading-snug">
              {title}
            </h1>
            {badge && <div className="shrink-0">{badge}</div>}
          </div>

          {description && (
            <p className="text-xs sm:text-sm text-[#7D715E] mt-0.5 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 shrink-0 sm:self-center">
          {actions}
        </div>
      )}
    </div>
  );
}
