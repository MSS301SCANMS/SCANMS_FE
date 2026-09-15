import { forwardRef, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options?: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, children, ...props }, ref) => {
    return (
      <div className="relative inline-flex items-center">
        <select
          ref={ref}
          className={cn(
            'appearance-none px-3.5 py-2 pr-9 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-700 font-medium hover:bg-white focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition cursor-pointer',
            className
          )}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
        <ChevronDown className="w-4 h-4 absolute right-3 text-slate-400 pointer-events-none" />
      </div>
    );
  }
);
Select.displayName = 'Select';
