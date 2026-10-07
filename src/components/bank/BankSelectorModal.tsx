import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Check,
  Landmark,
  Settings,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { type VietQrBank, findBankByQuery } from '../../constants/vietnamBanks';
import { VietQrBankService } from '../../services/vietqrBank.service';

export interface BankSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBank: (bank: VietQrBank) => void;
  selectedBankBin?: string;
  selectedBankName?: string;
}

type TabType = 'ALL' | 'POPULAR' | 'BIG4';

export const BankSelectorModal: React.FC<BankSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectBank,
  selectedBankBin,
  selectedBankName,
}) => {
  const [banks, setBanks] = useState<VietQrBank[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [showManualInput, setShowManualInput] = useState(false);

  // Manual input state
  const [manualName, setManualName] = useState('');
  const [manualBin, setManualBin] = useState('');

  // Load banks list
  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);
    VietQrBankService.getBanks()
      .then((data) => {
        if (isMounted) {
          setBanks(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Determine current active selection
  const currentBank = useMemo(() => {
    if (selectedBankBin) {
      return banks.find((b) => b.bin === selectedBankBin);
    }
    if (selectedBankName) {
      return findBankByQuery(selectedBankName);
    }
    return undefined;
  }, [banks, selectedBankBin, selectedBankName]);

  // Filter banks by tab and search query
  const filteredBanks = useMemo(() => {
    let list = banks;
    if (activeTab === 'POPULAR') {
      list = list.filter((b) => b.isPopular);
    } else if (activeTab === 'BIG4') {
      list = list.filter((b) => b.isBig4);
    }

    const query = searchQuery.trim().toLowerCase();
    if (!query) return list;

    return list.filter(
      (b) =>
        b.shortName.toLowerCase().includes(query) ||
        b.name.toLowerCase().includes(query) ||
        b.bin.includes(query) ||
        b.code.toLowerCase().includes(query)
    );
  }, [banks, activeTab, searchQuery]);

  if (!isOpen) return null;

  const handleSelect = (bank: VietQrBank) => {
    onSelectBank(bank);
    onClose();
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName.trim()) return;
    const manualBank: VietQrBank = {
      id: Date.now(),
      name: manualName.trim(),
      code: manualName.trim().toUpperCase().slice(0, 8),
      bin: manualBin.trim() || '970400',
      shortName: manualName.trim(),
      logo: 'https://cdn.vietqr.io/img/ICB.png',
    };
    onSelectBank(manualBank);
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 overflow-y-auto p-2 sm:p-4 bg-black/40 backdrop-blur-xs flex items-center justify-center animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl max-h-[92vh] sm:max-h-[88vh] bg-white border border-[#EEDFC6] rounded-3xl shadow-2xl p-4 sm:p-6 flex flex-col text-left animate-in zoom-in-95 duration-200 my-auto"
        style={{ colorScheme: 'light' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header (Khớp chuẩn 100% Ảnh 2) - Cố định ở đầu không bị che */}
        <div className="flex items-start justify-between gap-3 shrink-0 pb-3 border-b border-[#EAE4D7]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7] flex items-center justify-center text-[#B88E4F] shrink-0 shadow-2xs">
              <Landmark className="w-5 h-5 text-[#B88E4F]" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#1A1612] m-0">
                Danh Sách Ngân Hàng Việt Nam
              </h3>
              <p className="text-xs text-[#7D715E] m-0 mt-0.5">
                Hỗ trợ 65+ ngân hàng chuyển tiền nhanh VietQR / Napas247
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full border border-[#EAE4D7] bg-[#FAF8F5] hover:bg-[#F3EFE6] text-[#7D715E] hover:text-[#1A1612] flex items-center justify-center transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thanh tìm kiếm & Tabs chọn nhóm ngân hàng - Cố định */}
        <div className="shrink-0 pt-3 pb-2 space-y-2.5">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-[#7D715E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên (MB, VCB, ACB, Techcombank...) hoặc mã BIN"
              className="w-full h-11 bg-white border border-[#EAE4D7] rounded-xl pl-10 pr-9 text-xs sm:text-sm text-[#1A1612] placeholder-[#7D715E] outline-none hover:border-[#C59B58]/60 focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 transition shadow-2xs"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7D715E] hover:text-[#1A1612]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills (Tất cả, Phổ biến nhất, Big 4) */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 select-none ${
                activeTab === 'ALL'
                  ? 'bg-[#C59B58] text-white shadow-xs'
                  : 'bg-white text-[#7D715E] border border-[#EAE4D7] hover:bg-[#FAF8F5] hover:text-[#1A1612]'
              }`}
            >
              Tất cả ({banks.length || 65})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('POPULAR')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 select-none ${
                activeTab === 'POPULAR'
                  ? 'bg-[#C59B58] text-white shadow-xs'
                  : 'bg-white text-[#7D715E] border border-[#EAE4D7] hover:bg-[#FAF8F5] hover:text-[#1A1612]'
              }`}
            >
              Phổ biến nhất
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('BIG4')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 select-none ${
                activeTab === 'BIG4'
                  ? 'bg-[#C59B58] text-white shadow-xs'
                  : 'bg-white text-[#7D715E] border border-[#EAE4D7] hover:bg-[#FAF8F5] hover:text-[#1A1612]'
              }`}
            >
              Big 4 Nhà Nước
            </button>
          </div>
        </div>

        {/* Khung cuộn nội dung chính (Bao gồm Nhập thủ công + Lưới 65 ngân hàng) */}
        <div className="flex-1 min-h-0 overflow-y-auto pr-1 space-y-3 overscroll-contain">
          {/* Manual BIN Fallback Form */}
          {showManualInput && (
            <form
              onSubmit={handleManualSubmit}
              className="p-3.5 bg-[#FAF8F5] border border-[#EEDFC6] rounded-2xl flex flex-col gap-2.5 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1A1612]">
                  Nhập ngân hàng &amp; mã BIN thủ công
                </span>
                <button
                  type="button"
                  onClick={() => setShowManualInput(false)}
                  className="text-[11px] text-[#7D715E] hover:text-[#1A1612]"
                >
                  Hủy
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Tên ngân hàng (VD: Woori Bank, Kookmin...)"
                  required
                  className="h-9 px-3 bg-white border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] outline-none focus:border-[#C59B58]"
                />
                <input
                  type="text"
                  value={manualBin}
                  onChange={(e) => setManualBin(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="Mã BIN 6 số (VD: 970457)"
                  className="h-9 px-3 bg-white border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] outline-none focus:border-[#C59B58]"
                />
              </div>
              <button
                type="submit"
                className="self-end px-4 py-1.5 bg-[#C59B58] hover:bg-[#B88E4F] text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Áp dụng ngân hàng này
              </button>
            </form>
          )}

          {/* 2-Column Grid of Banks (Khớp chuẩn 100% Ảnh 2) */}
          <div>
            {loading && banks.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#7D715E] flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#B88E4F]" />
                <span>Đang tải danh sách ngân hàng Việt Nam từ VietQR...</span>
              </div>
            ) : filteredBanks.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#7D715E]">
                Không tìm thấy ngân hàng khớp với &quot;{searchQuery}&quot;.
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowManualInput(true)}
                    className="text-xs font-bold text-[#B88E4F] underline cursor-pointer"
                  >
                    Bấm vào đây để nhập thủ công
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredBanks.map((b) => {
                const isSelected =
                  (currentBank && currentBank.bin === b.bin) ||
                  selectedBankBin === b.bin ||
                  (selectedBankName &&
                    (selectedBankName.toLowerCase().includes(b.shortName.toLowerCase()) ||
                      selectedBankName.includes(b.bin)));

                return (
                  <button
                    key={`${b.code}-${b.bin}`}
                    type="button"
                    onClick={() => handleSelect(b)}
                    className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 text-left cursor-pointer group ${
                      isSelected
                        ? 'bg-[#FBF5EB] border-2 border-[#C59B58] shadow-2xs'
                        : 'bg-white border-[#EAE4D7] hover:border-[#C59B58]/70 hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Logo Container */}
                      <div className="w-12 h-10 rounded-xl bg-white border border-[#EAE4D7] p-1 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-102 transition">
                        <img
                          src={b.logo}
                          alt={b.shortName}
                          loading="lazy"
                          onError={(e) => {
                            // Fallback nếu logo CDN gặp sự cố
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>

                      {/* Info: ShortName & FullName */}
                      <div className="min-w-0 flex-1">
                        <strong className="text-xs sm:text-[13px] font-black text-[#1A1612] block truncate">
                          {b.shortName}
                        </strong>
                        <p className="text-[11px] text-[#7D715E] line-clamp-1 leading-snug mt-0.5" title={b.name}>
                          {b.name}
                        </p>
                      </div>
                    </div>

                    {/* Selected Checkmark (Khớp tròn vàng ở Ảnh 2) */}
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#B88E4F] text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal Footer (Khớp chuẩn Ảnh 2) */}
      <div className="pt-2 border-t border-[#EAE4D7] flex items-center justify-between text-xs text-[#7D715E]">
          <button
            type="button"
            onClick={() => setShowManualInput(!showManualInput)}
            className="flex items-center gap-1.5 font-semibold hover:text-[#B88E4F] transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-[#B88E4F]" />
            <span>Ngân hàng khác? Nhập mã BIN thủ công</span>
          </button>

          <div className="flex items-center gap-1 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-[#059669]" />
            <span>Dữ liệu chính thức từ VietQR</span>
          </div>
        </div>
      </div>
    </div>
  );
};
