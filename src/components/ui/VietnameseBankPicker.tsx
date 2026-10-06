import { useState, useEffect, useMemo, useRef } from 'react';
import { Landmark, Search, X, Check, ChevronDown } from 'lucide-react';

export interface VietBank {
  id: number;
  name: string;
  code: string;
  bin: string;
  shortName: string;
  logo: string;
}

// Comprehensive offline fallback of top Vietnamese banks
export const FALLBACK_VIET_BANKS: VietBank[] = [
  { id: 1, code: 'MB', bin: '970422', shortName: 'MB Bank', name: 'Ngân hàng TMCP Quân đội', logo: 'https://cdn.vietqr.io/img/MB.png' },
  { id: 2, code: 'VCB', bin: '970436', shortName: 'Vietcombank', name: 'Ngân hàng TMCP Ngoại Thương Việt Nam', logo: 'https://cdn.vietqr.io/img/VCB.png' },
  { id: 3, code: 'TCB', bin: '970407', shortName: 'Techcombank', name: 'Ngân hàng TMCP Kỹ thương Việt Nam', logo: 'https://cdn.vietqr.io/img/TCB.png' },
  { id: 4, code: 'ICB', bin: '970415', shortName: 'VietinBank', name: 'Ngân hàng TMCP Công thương Việt Nam', logo: 'https://cdn.vietqr.io/img/ICB.png' },
  { id: 5, code: 'BIDV', bin: '970418', shortName: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam', logo: 'https://cdn.vietqr.io/img/BIDV.png' },
  { id: 6, code: 'ACB', bin: '970416', shortName: 'ACB', name: 'Ngân hàng TMCP Á Châu', logo: 'https://cdn.vietqr.io/img/ACB.png' },
  { id: 7, code: 'VPB', bin: '970432', shortName: 'VPBank', name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng', logo: 'https://cdn.vietqr.io/img/VPB.png' },
  { id: 8, code: 'TPB', bin: '970423', shortName: 'TPBank', name: 'Ngân hàng TMCP Tiên Phong', logo: 'https://cdn.vietqr.io/img/TPB.png' },
  { id: 9, code: 'VBA', bin: '970405', shortName: 'Agribank', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam', logo: 'https://cdn.vietqr.io/img/VBA.png' },
  { id: 10, code: 'STB', bin: '970403', shortName: 'Sacombank', name: 'Ngân hàng TMCP Sài Gòn Thương Tín', logo: 'https://cdn.vietqr.io/img/STB.png' },
  { id: 11, code: 'HDB', bin: '970437', shortName: 'HDBank', name: 'Ngân hàng TMCP Phát triển TP.HCM', logo: 'https://cdn.vietqr.io/img/HDB.png' },
  { id: 12, code: 'VIB', bin: '970441', shortName: 'VIB', name: 'Ngân hàng TMCP Quốc tế Việt Nam', logo: 'https://cdn.vietqr.io/img/VIB.png' },
  { id: 13, code: 'SHB', bin: '970443', shortName: 'SHB', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội', logo: 'https://cdn.vietqr.io/img/SHB.png' },
  { id: 14, code: 'MSB', bin: '970426', shortName: 'MSB', name: 'Ngân hàng TMCP Hàng Hải Việt Nam', logo: 'https://cdn.vietqr.io/img/MSB.png' },
  { id: 15, code: 'OCB', bin: '970448', shortName: 'OCB', name: 'Ngân hàng TMCP Phương Đông', logo: 'https://cdn.vietqr.io/img/OCB.png' },
  { id: 16, code: 'SSB', bin: '970440', shortName: 'SeABank', name: 'Ngân hàng TMCP Đông Nam Á', logo: 'https://cdn.vietqr.io/img/SSB.png' },
  { id: 17, code: 'EIB', bin: '970431', shortName: 'Eximbank', name: 'Ngân hàng TMCP Xuất Nhập Khẩu Việt Nam', logo: 'https://cdn.vietqr.io/img/EIB.png' },
  { id: 18, code: 'LPB', bin: '970449', shortName: 'LPBank', name: 'Ngân hàng TMCP Lộc Phát Việt Nam', logo: 'https://cdn.vietqr.io/img/LPB.png' },
  { id: 19, code: 'TIMO', bin: '963388', shortName: 'Timo', name: 'Ngân hàng số Timo by BanVietBank', logo: 'https://cdn.vietqr.io/img/TIMO.png' },
  { id: 20, code: 'CAKE', bin: '546034', shortName: 'Cake', name: 'Ngân hàng số Cake by VPBank', logo: 'https://cdn.vietqr.io/img/CAKE.png' },
];

let globalBanksCache: VietBank[] | null = null;

interface VietnameseBankPickerProps {
  value: string; // The selected 6-digit BIN
  onChange: (bin: string, bank?: VietBank) => void;
  disabled?: boolean;
}

export function VietnameseBankPicker({ value, onChange, disabled }: VietnameseBankPickerProps) {
  const [banks, setBanks] = useState<VietBank[]>(globalBanksCache || FALLBACK_VIET_BANKS);
  const [loading, setLoading] = useState(!globalBanksCache);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [filterGroup, setFilterGroup] = useState<'ALL' | 'BIG4' | 'POPULAR'>('ALL');
  const [isManualBin, setIsManualBin] = useState(false);
  const [manualBinInput, setManualBinInput] = useState('');

  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch official VietQR bank list
  useEffect(() => {
    if (globalBanksCache) return;
    let isMounted = true;
    fetch('https://api.vietqr.io/v2/banks')
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.code === '00' && Array.isArray(data.data) && data.data.length > 0) {
          const list: VietBank[] = data.data.map((b: any) => ({
            id: b.id,
            name: b.name,
            code: b.code,
            bin: b.bin,
            shortName: b.shortName || b.short_name || b.code,
            logo: b.logo || `https://cdn.vietqr.io/img/${b.code}.png`,
          }));
          globalBanksCache = list;
          setBanks(list);
        }
      })
      .catch(() => {
        // Keep fallback
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Find currently selected bank
  const selectedBank = useMemo(() => {
    return banks.find((b) => b.bin === value);
  }, [banks, value]);

  // Filter banks based on search query
  const filteredBanks = useMemo(() => {
    const q = query.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return banks.filter((b) => {
      // Group filter
      if (filterGroup === 'BIG4') {
        const big4 = ['VCB', 'ICB', 'BIDV', 'VBA'];
        if (!big4.includes(b.code)) return false;
      } else if (filterGroup === 'POPULAR') {
        const pop = ['MB', 'VCB', 'TCB', 'ICB', 'BIDV', 'ACB', 'VPB', 'TPB', 'VBA', 'STB', 'HDB', 'VIB', 'SHB', 'TIMO', 'CAKE'];
        if (!pop.includes(b.code)) return false;
      }

      if (!q) return true;
      const normName = b.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const normShort = b.shortName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const code = b.code.toLowerCase();
      const bin = b.bin;

      return normName.includes(q) || normShort.includes(q) || code.includes(q) || bin.includes(q);
    });
  }, [banks, query, filterGroup]);

  const handleSelectBank = (bank: VietBank) => {
    setIsManualBin(false);
    onChange(bank.bin, bank);
    setIsOpen(false);
  };

  const handleApplyManualBin = () => {
    if (/^\d{6}$/.test(manualBinInput)) {
      onChange(manualBinInput);
      setIsOpen(false);
    }
  };

  return (
    <div className="space-y-1.5">
      {/* TRIGGER DISPLAY CARD */}
      {selectedBank ? (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => !disabled && setIsOpen(true)}
          className={`w-full p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 text-left ${
            disabled
              ? 'bg-stone-100 border-stone-200 cursor-not-allowed opacity-60'
              : 'bg-white border-[#EAE4D7] hover:border-[#C59B58] hover:bg-[#FAF8F5]/80 shadow-xs cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-white border border-[#EAE4D7] p-1.5 flex items-center justify-center shrink-0 shadow-2xs">
              <img
                src={selectedBank.logo}
                alt={selectedBank.shortName}
                className="max-h-8 max-w-[38px] object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-[#1A1612] text-sm truncate">
                  {selectedBank.shortName}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#FAF5EB] border border-[#EAE4D7] text-[#C59B58] text-[10px] font-mono font-bold">
                  BIN: {selectedBank.bin}
                </span>
              </div>
              <p className="text-xs text-[#7D715E] truncate mt-0.5" title={selectedBank.name}>
                {selectedBank.name}
              </p>
            </div>
          </div>

          <button
            type="button"
            className="px-3 py-1.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-bold text-[#7D715E] hover:text-[#1A1612] hover:bg-[#F3EFE6] shrink-0 transition"
          >
            Đổi ngân hàng
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(true)}
          className={`w-full px-3.5 py-3 rounded-2xl border border-dashed text-left flex items-center justify-between gap-3 transition cursor-pointer ${
            disabled
              ? 'bg-stone-100 border-stone-200 text-stone-400 cursor-not-allowed'
              : 'bg-white border-[#C59B58]/60 hover:border-[#C59B58] hover:bg-[#FAF8F5] text-[#1A1612]'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FAF5EB] border border-[#EFE3CF] text-[#C59B58] flex items-center justify-center shrink-0">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <span className="text-xs font-bold text-[#1A1612] block">
                {value ? `Ngân hàng mã BIN: ${value} (Chưa nhận diện)` : 'Bấm để chọn ngân hàng Việt Nam (VietQR)...'}
              </span>
              <span className="text-[11px] text-[#A69986] block">
                Hơn 65 ngân hàng sẵn có: MB Bank, Vietcombank, Techcombank, ACB...
              </span>
            </div>
          </div>

          <ChevronDown className="w-4 h-4 text-[#A69986] shrink-0" />
        </button>
      )}

      {/* POPUP / MODAL SELECTION (LIGHT-TONED) */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            ref={modalRef}
            className="w-full max-w-xl bg-white border border-[#EAE4D7] rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-150"
            style={{ colorScheme: 'light' }}
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-[#EAE4D7] bg-[#FAF8F5] flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white border border-[#EAE4D7] text-[#C59B58] flex items-center justify-center shadow-2xs">
                  <Landmark className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#1A1612] m-0">
                    Danh Sách Ngân Hàng Việt Nam
                  </h3>
                  <p className="text-[11px] text-[#7D715E] m-0">
                    Chọn ngân hàng để tự động gắn mã BIN 6 số chuẩn xác
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full border border-[#EAE4D7] bg-white text-[#7D715E] hover:text-[#1A1612] hover:bg-[#F4EFE6] flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="p-4 border-b border-[#EAE4D7] space-y-3 bg-white shrink-0">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#A69986] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Tìm kiếm theo tên (MB, VCB, ACB, Techcombank...) hoặc mã BIN..."
                  className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-semibold text-[#1A1612] placeholder-[#A69986] outline-none focus:border-[#C59B58] focus:bg-white focus:ring-2 focus:ring-[#C59B58]/20 transition"
                  autoFocus
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A69986] hover:text-[#1A1612]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setFilterGroup('ALL')}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    filterGroup === 'ALL'
                      ? 'bg-[#C59B58] text-white shadow-2xs'
                      : 'bg-[#FAF8F5] border border-[#EAE4D7] text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  Tất cả ({banks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterGroup('POPULAR')}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    filterGroup === 'POPULAR'
                      ? 'bg-[#C59B58] text-white shadow-2xs'
                      : 'bg-[#FAF8F5] border border-[#EAE4D7] text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  Phổ biến nhất
                </button>
                <button
                  type="button"
                  onClick={() => setFilterGroup('BIG4')}
                  className={`px-3 py-1 rounded-lg font-bold transition cursor-pointer ${
                    filterGroup === 'BIG4'
                      ? 'bg-[#C59B58] text-white shadow-2xs'
                      : 'bg-[#FAF8F5] border border-[#EAE4D7] text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  Big 4 Nhà Nước
                </button>
              </div>
            </div>

            {/* Banks List / Grid */}
            <div className="overflow-y-auto p-4 space-y-2 flex-1 bg-white min-h-[260px]">
              {loading && banks.length === 0 ? (
                <div className="py-12 text-center text-xs text-[#7D715E]">
                  Đang tải danh sách ngân hàng...
                </div>
              ) : filteredBanks.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <p className="text-xs text-[#7D715E]">
                    Không tìm thấy ngân hàng khớp với từ khóa &quot;<strong>{query}</strong>&quot;.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsManualBin(true)}
                    className="text-xs font-bold text-[#C59B58] hover:underline"
                  >
                    Bấm vào đây để nhập mã BIN thủ công
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {filteredBanks.map((bank) => {
                    const isSelected = bank.bin === value;
                    return (
                      <button
                        key={bank.bin + bank.code}
                        type="button"
                        onClick={() => handleSelectBank(bank)}
                        className={`p-2.5 rounded-2xl border text-left flex items-center justify-between gap-2.5 transition cursor-pointer ${
                          isSelected
                            ? 'bg-[#FAF5EB] border-[#C59B58] ring-1 ring-[#C59B58]'
                            : 'bg-white border-[#EAE4D7] hover:border-[#C59B58] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white border border-[#EAE4D7] p-1 flex items-center justify-center shrink-0">
                            <img
                              src={bank.logo}
                              alt={bank.shortName}
                              className="max-h-6 max-w-[34px] object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-[#1A1612] text-xs truncate">
                                {bank.shortName}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-[#C59B58]">
                                {bank.bin}
                              </span>
                            </div>
                            <p className="text-[11px] text-[#7D715E] truncate" title={bank.name}>
                              {bank.name}
                            </p>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-[#C59B58] text-white flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer: Manual BIN option */}
            <div className="p-3 border-t border-[#EAE4D7] bg-[#FAF8F5] flex items-center justify-between text-xs">
              {!isManualBin ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsManualBin(true);
                    setManualBinInput(value || '');
                  }}
                  className="text-xs font-bold text-[#7D715E] hover:text-[#1A1612] hover:underline cursor-pointer"
                >
                  ⚙️ Ngân hàng khác? Nhập mã BIN thủ công
                </button>
              ) : (
                <div className="flex items-center gap-2 w-full">
                  <input
                    type="text"
                    value={manualBinInput}
                    onChange={(e) => setManualBinInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="Nhập 6 số BIN..."
                    className="px-3 py-1.5 rounded-xl border border-[#EAE4D7] bg-white text-xs font-mono font-bold text-[#1A1612] outline-none w-36"
                  />
                  <button
                    type="button"
                    onClick={handleApplyManualBin}
                    disabled={!/^\d{6}$/.test(manualBinInput)}
                    className="px-3 py-1.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold transition disabled:opacity-40 cursor-pointer"
                  >
                    Áp dụng mã BIN
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsManualBin(false)}
                    className="text-xs text-[#7D715E] hover:underline ml-auto"
                  >
                    Hủy
                  </button>
                </div>
              )}

              <span className="text-[11px] text-[#A69986] ml-auto">
                Dữ liệu chính thức từ VietQR
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
