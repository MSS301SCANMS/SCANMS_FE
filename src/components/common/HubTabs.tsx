import React from 'react';
import type { LucideIcon } from 'lucide-react';

export interface HubTabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  badgeVariant?: 'amber' | 'neutral' | 'success' | 'danger';
}

export interface HubTabsProps {
  tabs: HubTabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  className?: string;
}

export function HubTabs({
  tabs,
  activeTab,
  onChange,
  title,
  subtitle,
  actions,
  className = '',
}: HubTabsProps) {
  return (
    <div className={`flex flex-col gap-4 mb-6 ${className}`}>
      {(title || subtitle || actions) && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            {title && (
              <h1 className="text-xl sm:text-2xl font-extrabold text-[#1A1612] tracking-tight">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-xs sm:text-sm text-[#7D715E] mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
        </div>
      )}

      {/* Tab bar container */}
      <div className="w-full bg-[#F3EFE6] p-1.5 rounded-2xl border border-[#EAE4D7] shadow-2xs">
        <div
          className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth"
          role="tablist"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;

            return (
              <button
                key={tab.id}
                id={`hub-tab-${tab.id}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(tab.id)}
                className={`group relative flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 cursor-pointer shrink-0 select-none ${
                  isActive
                    ? 'bg-white text-[#1A1612] shadow-[0_2px_8px_rgba(91,65,28,0.08)] border border-[#EEDFC6]'
                    : 'text-[#7D715E] hover:text-[#1A1612] hover:bg-white/60 border border-transparent'
                }`}
              >
                <span
                  className={`grid h-6 w-6 place-items-center rounded-lg transition-colors ${
                    isActive
                      ? 'bg-[#FBF5EB] text-[#B88E4F]'
                      : 'text-[#9C8F7C] group-hover:text-[#B88E4F]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </span>

                <span>{tab.label}</span>

                {tab.badge !== undefined && tab.badge !== null && (
                  <span
                    className={`ml-0.5 px-2 py-0.5 rounded-full text-[10px] font-extrabold transition-colors ${
                      isActive
                        ? 'bg-[#B88E4F] text-white shadow-2xs'
                        : 'bg-[#EAE4D7] text-[#7D715E] group-hover:bg-[#E4D3B7] group-hover:text-[#6F4E1D]'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default HubTabs;
