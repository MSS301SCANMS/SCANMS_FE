import React, { useState } from 'react';
import { Landmark, ChevronDown } from 'lucide-react';
import { type VietQrBank, findBankByQuery } from '../../constants/vietnamBanks';
import { BankSelectorModal } from './BankSelectorModal';

export interface BankSelectTriggerProps {
  value: string; // Tên ngân hàng hoặc mã BIN
  onChange: (bankName: string, bank?: VietQrBank) => void;
  disabled?: boolean;
  required?: boolean;
  label?: string;
  placeholder?: string;
  className?: string;
}

export const BankSelectTrigger: React.FC<BankSelectTriggerProps> = ({
  value,
  onChange,
  disabled = false,
  required = false,
  label,
  placeholder = '-- Chọn ngân hàng từ danh sách VietQR --',
  className,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentBank = findBankByQuery(value);

  const handleSelectBank = (bank: VietQrBank) => {
    // Lưu định dạng chuẩn: "MBBank (970422) - Ngân hàng TMCP Quân đội" hoặc "MBBank"
    onChange(`${bank.shortName} (${bank.name})`, bank);
  };

  return (
    <div className={`text-left ${className || 'w-full'}`}>
      {label && (
        <label className="text-xs font-bold text-[#1A1612] block mb-1.5">
          {label} {required && <strong className="text-rose-600">*</strong>}
        </label>
      )}

      {/* Hidden input for HTML5 form validation */}
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

      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsModalOpen(true)}
        className={`w-full min-h-[44px] p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 text-left cursor-pointer ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-[#FAF8F5] border-[#EAE4D7]'
            : currentBank
            ? 'bg-[#FAF8F5] hover:bg-white border-[#C59B58] ring-1 ring-[#C59B58]/20 shadow-2xs'
            : 'bg-[#FAF8F5] hover:bg-white border-[#EAE4D7] hover:border-[#C59B58]/60 shadow-2xs'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {currentBank ? (
            <>
              <div className="w-10 h-8 rounded-lg bg-white border border-[#EAE4D7] p-1 flex items-center justify-center shrink-0 shadow-2xs">
                <img
                  src={currentBank.logo}
                  alt={currentBank.shortName}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <strong className="text-xs font-black text-[#1A1612]">
                    {currentBank.shortName}
                  </strong>
                  <span className="text-[10px] font-mono font-bold bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] px-1.5 py-0.2 rounded-md">
                    BIN {currentBank.bin}
                  </span>
                </div>
                <p className="text-[11px] text-[#7D715E] truncate leading-tight mt-0.5">
                  {currentBank.name}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="w-8 h-8 rounded-lg bg-white border border-[#EAE4D7] flex items-center justify-center text-[#B88E4F] shrink-0">
                <Landmark className="w-4 h-4 text-[#B88E4F]" />
              </div>
              <span className="text-xs text-[#7D715E] font-medium truncate">
                {value || placeholder}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0 text-[#B88E4F]">
          <span className="text-[11px] font-bold hidden sm:inline">
            {currentBank ? 'Đổi ngân hàng' : 'Chọn'}
          </span>
          <ChevronDown className="w-4 h-4" />
        </div>
      </button>

      {/* Modal Danh sách Ngân Hàng Việt Nam */}
      <BankSelectorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelectBank={handleSelectBank}
        selectedBankBin={currentBank?.bin}
        selectedBankName={value}
      />
    </div>
  );
};
