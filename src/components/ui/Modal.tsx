import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  stickyHeader?: boolean;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
}

export function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  className,
  stickyHeader = false,
  maxWidth = 'md',
}: ModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
    full: 'max-w-[96vw] w-[96vw]',
  };

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className={cn(
          'bg-white rounded-2xl w-full shadow-2xl border border-slate-200 flex flex-col text-left transition-all',
          stickyHeader ? 'max-h-[90dvh] overflow-hidden' : 'p-6 sm:p-7 gap-4',
          maxWidthStyles[maxWidth],
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {(title || icon) && (
          <div className={cn(
            'flex shrink-0 justify-between items-center gap-3 border-b border-slate-100',
            stickyHeader ? 'bg-white px-6 py-4 sm:px-7 sm:py-5' : 'pb-2'
          )}>
            <div className="flex min-w-0 items-center gap-2.5">
              {icon && (
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-lg shrink-0">
                  {icon}
                </div>
              )}
              <div>
                {title && <h3 className="text-lg font-bold text-slate-900 m-0">{title}</h3>}
                {subtitle && <p className="text-xs text-slate-500 mt-0.5 m-0">{subtitle}</p>}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Đóng cửa sổ"
              className="shrink-0 text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        {stickyHeader ? (
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6 sm:p-7">
            {children}
          </div>
        ) : children}
        {footer && <div className="shrink-0 border-t border-[#EAE4D7] px-6 py-3 sm:px-7">{footer}</div>}
      </div>
    </div>
  );
}
