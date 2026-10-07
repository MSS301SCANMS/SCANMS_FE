import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check, Search, X } from 'lucide-react';

export interface CustomSelectOption {
  value: string;
  label: string;
}

export interface CustomSelectProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  searchable?: boolean;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  id,
  value,
  onChange,
  options,
  placeholder = '-- Chọn --',
  disabled = false,
  required = false,
  className = '',
  searchable,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  // Auto-enable search if there are more than 7 options
  const isSearchable = searchable ?? options.length > 7;

  // Find currently selected option
  const selectedOption = options.find((opt) => String(opt.value) === String(value));

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && isSearchable && searchInputRef.current) {
      searchInputRef.current.focus();
    }
    if (!isOpen) {
      setSearchQuery('');
    }
  }, [isOpen, isSearchable]);

  // Filter options by search query
  const filteredOptions = isSearchable && searchQuery.trim()
    ? options.filter((opt) =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : options;

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Hidden input for HTML form validation */}
      {required && (
        <input
          tabIndex={-1}
          autoComplete="off"
          value={value}
          onChange={() => {}}
          required={required}
          className="sr-only"
        />
      )}

      {/* Trigger Button */}
      <button
        id={selectId}
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full h-10 bg-[#FAF8F5] border rounded-xl px-3.5 py-2 text-xs font-semibold text-left flex items-center justify-between gap-2 transition-all duration-200 cursor-pointer shadow-2xs outline-none ${
          disabled
            ? 'opacity-50 cursor-not-allowed border-[#EAE4D7] text-[#7D715E]'
            : isOpen
            ? 'bg-white border-[#C59B58] ring-2 ring-[#C59B58]/20 text-[#1A1612]'
            : 'border-[#EAE4D7] text-[#1A1612] hover:border-[#C59B58]/60 hover:bg-white'
        }`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={`truncate ${!selectedOption ? 'text-[#7D715E] font-normal' : 'text-[#1A1612]'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#B88E4F] transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Floating Dropdown Menu */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-[#EEDFC6] rounded-2xl shadow-xl p-1.5 flex flex-col gap-1 max-h-64 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Quick Search Header if options > 7 */}
          {isSearchable && (
            <div className="relative px-2 py-1.5 border-b border-[#EAE4D7] pb-2">
              <div className="flex items-center gap-1.5 bg-[#FAF8F5] border border-[#EAE4D7] focus-within:border-[#C59B58] focus-within:bg-white rounded-lg px-2 py-1 transition">
                <Search className="w-3 h-3 text-[#B88E4F] shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm nhanh..."
                  className="w-full bg-transparent text-[11px] text-[#1A1612] outline-none placeholder-[#7D715E]"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-[#7D715E] hover:text-[#1A1612]"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options Scrollable Container */}
          <div className="overflow-y-auto max-h-48 space-y-0.5 pr-0.5">
            {/* Default Placeholder Option (e.g. unselect or default) */}
            <button
              type="button"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 rounded-xl text-xs text-left transition flex items-center justify-between cursor-pointer ${
                value === ''
                  ? 'bg-[#FBF5EB] text-[#B88E4F] font-bold border border-[#EEDFC6]'
                  : 'text-[#7D715E] hover:bg-[#FAF8F5] hover:text-[#1A1612]'
              }`}
            >
              <span>{placeholder}</span>
              {value === '' && <Check className="w-3.5 h-3.5 text-[#B88E4F]" />}
            </button>

            {filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-[#7D715E]">
                Không tìm thấy kết quả phù hợp
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <button
                    key={opt.value}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-xs text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? 'bg-[#FBF5EB] text-[#B88E4F] font-black border border-[#EEDFC6] shadow-2xs'
                        : 'text-[#1A1612] hover:bg-[#FAF8F5] hover:text-[#B88E4F]'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#B88E4F] shrink-0" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
