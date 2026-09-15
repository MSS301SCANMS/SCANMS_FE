import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  icon?: ReactNode;
  clearable?: boolean;
  onClear?: () => void;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, icon, clearable, onClear, value, ...props }, ref) => {
    return (
      <div
        className={cn(
          'relative flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus-within:bg-white focus-within:border-amber-500 focus-within:ring-2 focus-within:ring-amber-500/20 transition-all',
          className
        )}
      >
        {icon && <span className="text-slate-400 text-base mr-2.5 shrink-0 flex items-center">{icon}</span>}
        <input
          ref={ref}
          value={value}
          className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-slate-800 placeholder-slate-400 font-normal p-0"
          {...props}
        />
        {clearable && value && (
          <button
            type="button"
            onClick={onClear}
            className="text-slate-400 hover:text-slate-600 p-0.5 ml-1 cursor-pointer shrink-0"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
