import React, {
  forwardRef,
  useState,
  useRef,
  useEffect,
  useMemo,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (event: { target: { value: string; name?: string; id?: string } }) => void;
  options?: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  style?: CSSProperties;
  'aria-label'?: string;
  children?: ReactNode;
  searchable?: boolean;
  placement?: 'bottom' | 'top' | 'auto';
  align?: 'left' | 'right';
}

function getLabelFromNode(node: ReactNode): string {
  if (node === null || node === undefined) return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getLabelFromNode).join('');
  if (React.isValidElement(node) && (node.props as { children?: ReactNode })?.children) {
    return getLabelFromNode((node.props as { children?: ReactNode }).children);
  }
  return '';
}

function extractOptions(children: ReactNode): SelectOption[] {
  const result: SelectOption[] = [];

  const traverse = (nodes: ReactNode) => {
    React.Children.forEach(nodes, (child) => {
      if (!child) return;
      if (React.isValidElement(child)) {
        if (child.type === React.Fragment) {
          traverse((child.props as { children?: ReactNode }).children);
        } else if (child.type === 'option' || 'value' in (child.props as Record<string, unknown>)) {
          const props = child.props as { value?: unknown; label?: string; disabled?: boolean; children?: ReactNode };
          const val = props.value !== undefined ? String(props.value) : '';
          const label = getLabelFromNode(props.children) || props.label || val;
          result.push({
            value: val,
            label: label || val,
            disabled: Boolean(props.disabled),
          });
        } else if ((child.props as { children?: ReactNode })?.children) {
          traverse((child.props as { children?: ReactNode }).children);
        }
      }
    });
  };

  traverse(children);
  return result;
}

export const Select = forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      id,
      name,
      value,
      defaultValue,
      onChange,
      options: optionsProp,
      placeholder,
      disabled = false,
      required = false,
      className,
      style,
      'aria-label': ariaLabel,
      searchable,
      placement = 'auto',
      align = 'left',
      children,
    },
    ref
  ) => {
    const options = optionsProp || (children ? extractOptions(children) : []);

    const [isOpen, setIsOpen] = useState(false);
    const [openDirection, setOpenDirection] = useState<'down' | 'up'>(
      placement === 'top' ? 'up' : 'down'
    );
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);

    const [internalValue, setInternalValue] = useState<string>(() => {
      if (value !== undefined) return String(value);
      if (defaultValue !== undefined) return String(defaultValue);
      return options.length > 0 ? options[0].value : '';
    });

    const currentValue = value !== undefined ? String(value) : internalValue;

    const containerRef = useRef<HTMLDivElement>(null);
    const listRef = useRef<HTMLDivElement>(null);

    // Detect open direction (upwards or downwards)
    useEffect(() => {
      if (!isOpen || !containerRef.current) return;
      if (placement === 'top') {
        setOpenDirection('up');
        return;
      }
      if (placement === 'bottom') {
        setOpenDirection('down');
        return;
      }
      try {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        if (spaceBelow < 260 && spaceAbove > spaceBelow) {
          setOpenDirection('up');
        } else {
          setOpenDirection('down');
        }
      } catch {
        setOpenDirection('down');
      }
    }, [isOpen, placement]);

    // Filter options based on search query
    const filteredOptions = useMemo(() => {
      if (!searchQuery.trim()) return options;
      const q = searchQuery.toLowerCase().trim();
      return options.filter((opt) => opt.label.toLowerCase().includes(q));
    }, [options, searchQuery]);

    useEffect(() => {
      if (isOpen) {
        setSearchQuery('');
        if (searchable || options.length > 7) {
          setTimeout(() => searchInputRef.current?.focus(), 50);
        }
      }
    }, [isOpen, searchable, options.length]);

    // Sync external value when controlled
    useEffect(() => {
      if (value !== undefined) {
        setInternalValue(String(value));
      }
    }, [value]);

    // Handle outside clicks
    useEffect(() => {
      if (!isOpen) return;

      const handleClickOutside = (e: MouseEvent | TouchEvent) => {
        if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
          setIsOpen(false);
        }
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('touchstart', handleClickOutside);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isOpen]);

    const selectedOption = options.find((opt) => opt.value === currentValue);
    const displayLabel = selectedOption
      ? selectedOption.label
      : placeholder || (options.length > 0 ? options[0].label : 'Chọn...');

    const handleSelect = (opt: SelectOption) => {
      if (opt.disabled || disabled) return;
      if (value === undefined) {
        setInternalValue(opt.value);
      }
      setIsOpen(false);
      if (onChange) {
        onChange({
          target: {
            value: opt.value,
            name,
            id,
          },
        });
      }
    };

    const isFullWidth = !className || className.includes('w-full') || className.includes('flex-1');

    return (
      <div
        ref={(node) => {
          (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
          }
        }}
        className={cn('relative', isFullWidth ? 'w-full' : 'inline-block')}
        style={style}
      >
        {/* Hidden input for standard forms */}
        <input
          type="hidden"
          id={id}
          name={name}
          value={currentValue}
          required={required}
          disabled={disabled}
        />

        {/* Trigger Button - Tone Sáng Vàng Be Chuẩn SCANMS */}
        <button
          type="button"
          id={id ? `${id}-trigger` : undefined}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-label={ariaLabel}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={cn(
            'w-full flex items-center justify-between gap-2 rounded-xl border border-[#EAE4D7] bg-white px-3.5 py-2.5 text-xs sm:text-sm text-[#1A1612] font-medium transition cursor-pointer text-left outline-none shadow-2xs',
            'hover:border-[#C59B58] focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20',
            isOpen && 'border-[#C59B58] ring-2 ring-[#C59B58]/20',
            disabled && 'opacity-50 cursor-not-allowed bg-[#FAF8F5]',
            className
          )}
        >
          <span className="truncate block font-medium">
            {displayLabel}
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 text-[#7D715E] shrink-0 transition-transform duration-200',
              isOpen && (openDirection === 'up' ? '-rotate-180 text-[#B88E4F]' : 'rotate-180 text-[#B88E4F]')
            )}
          />
        </button>

        {/* Custom Dropdown List - Hoàn Toàn Không Dùng OS Popup, Tone Sáng 100% */}
        {isOpen && (
          <div
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            className={cn(
              'absolute z-50 min-w-[200px] w-full bg-white border border-[#EEDFC6] rounded-2xl shadow-xl py-1.5 max-h-60 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150',
              align === 'right' ? 'right-0' : 'left-0',
              openDirection === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
            )}
            style={{ colorScheme: 'light' }}
          >
            {(searchable || options.length > 7) && (
              <div className="p-2 border-b border-[#EAE4D7] bg-[#FAF8F5]/90 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-[#B88E4F] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm nhanh..."
                    className="w-full pl-8 pr-6 py-1.5 text-xs bg-white border border-[#EAE4D7] rounded-xl text-[#1A1612] placeholder:text-[#A99D8A] focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 outline-none transition"
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setSearchQuery(''); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-[#7D715E] hover:text-[#1A1612] cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            )}
            <div className="overflow-y-auto overscroll-contain flex-1 max-h-52 [scrollbar-width:thin] [scrollbar-color:#EEDFC6_transparent]">
              {filteredOptions.length === 0 ? (
                <div className="px-4 py-3 text-xs text-[#7D715E] text-center">
                  Không tìm thấy kết quả phù hợp
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = opt.value === currentValue;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={opt.disabled}
                      onClick={() => handleSelect(opt)}
                      className={cn(
                        'w-full text-left px-3.5 py-2.5 text-xs sm:text-sm transition flex items-center justify-between cursor-pointer select-none',
                        isSelected
                          ? 'bg-[#FBF5EB] text-[#B88E4F] font-bold hover:bg-[#F3EFE6]'
                          : 'text-[#1A1612] hover:bg-[#F3EFE6] hover:text-[#B88E4F] font-normal',
                        opt.disabled && 'opacity-40 cursor-not-allowed bg-transparent text-[#7D715E]'
                      )}
                    >
                      <span className="truncate pr-2">{opt.label}</span>
                      {isSelected && (
                        <Check className="w-4 h-4 text-[#C59B58] shrink-0 ml-auto" />
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
