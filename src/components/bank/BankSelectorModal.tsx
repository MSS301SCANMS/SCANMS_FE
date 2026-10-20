import React, { useState, useEffect, useMemo, useRef, useId } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, Check, Landmark, Settings, ShieldCheck, RefreshCw, ChevronDown } from 'lucide-react';
import { type VietQrBank, findBankByQuery } from '@/config/banks.config';
import { VietQrBankService } from '@/services/vietqr-bank.service';

export interface BankSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBank: (bank: VietQrBank) => void;
  selectedBankBin?: string;
  selectedBankName?: string;
}

type TabType = 'ALL' | 'POPULAR' | 'BIG4';
const normalizeSearch = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLowerCase();

export const BankSelectorModal: React.FC<BankSelectorModalProps> = ({
  isOpen, onClose, onSelectBank, selectedBankBin, selectedBankName,
}) => {
  const [banks, setBanks] = useState<VietQrBank[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualName, setManualName] = useState('');
  const [manualBin, setManualBin] = useState('');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const manualNameRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const manualFormId = useId();

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setLoading(true);
    VietQrBankService.getBanks()
      .then((data) => { if (isMounted) setBanks(data); })
      .catch(() => {})
      .finally(() => { if (isMounted) setLoading(false); });
    return () => { isMounted = false; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const dialog = dialogRef.current;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (dialog && !dialog.open) dialog.showModal();
    return () => {
      dialog?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && showManualInput) manualNameRef.current?.focus();
  }, [isOpen, showManualInput]);

  const currentBank = useMemo(() => {
    if (selectedBankBin) return banks.find((bank) => bank.bin === selectedBankBin);
    if (selectedBankName) return findBankByQuery(selectedBankName);
    return undefined;
  }, [banks, selectedBankBin, selectedBankName]);

  const filteredBanks = useMemo(() => {
    const list = activeTab === 'POPULAR' ? banks.filter((bank) => bank.isPopular)
      : activeTab === 'BIG4' ? banks.filter((bank) => bank.isBig4) : banks;
    const query = normalizeSearch(searchQuery.trim());
    return query ? list.filter((bank) => normalizeSearch(`${bank.shortName} ${bank.name} ${bank.bin} ${bank.code}`).includes(query)) : list;
  }, [banks, activeTab, searchQuery]);

  const handleSelect = (bank: VietQrBank) => {
    onSelectBank(bank);
    onClose();
  };

  const handleManualSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!manualName.trim()) return;
    handleSelect({
      id: Date.now(), name: manualName.trim(), code: manualName.trim().toUpperCase().slice(0, 8),
      bin: manualBin.trim() || '970400', shortName: manualName.trim(), logo: 'https://cdn.vietqr.io/img/ICB.png',
    });
  };

  if (!isOpen) return null;

  return createPortal(
    <dialog
      ref={dialogRef}
      className="w-[min(520px,calc(100vw-32px))] max-w-none max-h-[calc(100dvh-32px)] m-auto p-0 overflow-hidden border border-[#EAE4D7] rounded-2xl bg-white text-[#1A1612] shadow-[0_18px_60px_rgba(35,29,21,0.16)] text-left backdrop:bg-[#231D15]/30 backdrop:backdrop-blur-xs flex flex-col outline-none"
      aria-labelledby={titleId}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onKeyDown={(event) => { if (event.key === 'Escape') event.stopPropagation(); }}
      onClick={(event) => {
        event.stopPropagation();
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose();
      }}
    >
      <div className="flex items-center gap-2.5 p-4 shrink-0">
        <span className="grid place-items-center w-[34px] h-[34px] rounded-[10px] bg-[#FBF5EB] text-[#B88E4F] shrink-0">
          <Landmark size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 id={titleId} className="m-0 text-lg font-semibold leading-snug tracking-tight text-[#1A1612]">Chọn ngân hàng</h2>
          <p className="m-0 mt-1 text-[11px] text-[#7D715E]">Ngân hàng nhận tiền · VietQR / Napas247</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="grid place-items-center w-7 h-7 shrink-0 border border-[#EAE4D7] rounded-lg bg-white text-[#7D715E] hover:bg-[#FAF8F5] transition-colors cursor-pointer"
          aria-label="Đóng danh sách ngân hàng"
        >
          <X size={17} />
        </button>
      </div>

      {currentBank && (
        <details className="mx-4 mb-3 p-2 px-2.5 rounded-lg bg-[#FBF5EB] text-[#7D715E] text-xs shrink-0 group">
          <summary className="flex items-center gap-1.5 cursor-pointer list-none select-none text-[#7D715E]">
            <Check size={13} className="text-[#B88E4F] shrink-0" />
            <span>Đang chọn <strong className="ml-1 text-[#1A1612] font-semibold">{currentBank.shortName}</strong></span>
            <ChevronDown size={13} className="ml-auto text-[#B88E4F] group-open:rotate-180 transition-transform" />
          </summary>
          <p className="m-0 mt-2 ml-5 leading-relaxed text-[11px] text-[#7D715E]">
            {currentBank.name}
            <span className="block mt-0.5">BIN {currentBank.bin}</span>
          </p>
        </details>
      )}

      <div className="px-4 pb-3 shrink-0">
        <div className="flex items-center gap-2 h-10 px-2.5 border border-[#EAE4D7] focus-within:border-[#C59B58] focus-within:ring-2 focus-within:ring-[#C59B58]/10 rounded-[9px] bg-white text-[#7D715E] transition-all">
          <Search size={16} className="shrink-0 text-[#7D715E]" />
          <input
            type="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Tìm tên ngân hàng hoặc mã BIN…"
            aria-label="Tìm ngân hàng theo tên hoặc mã BIN"
            className="w-full min-w-0 h-full p-0 border-0 bg-transparent outline-none text-[#1A1612] text-[13px] placeholder:text-[#7D715E]"
            autoFocus
          />
          {searchQuery && (
            <button type="button" onClick={() => setSearchQuery('')} aria-label="Xóa tìm kiếm" className="grid place-items-center p-0.5 text-[#7D715E] hover:text-[#1A1612]">
              <X size={15} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-2.5" role="group" aria-label="Nhóm ngân hàng">
          {([{ value: 'ALL', label: `Tất cả${banks.length ? ` (${banks.length})` : ''}` }, { value: 'POPULAR', label: 'Phổ biến' }, { value: 'BIG4', label: 'Big 4' }] as const).map((tab) => {
            const isTabActive = activeTab === tab.value;
            return (
              <button
                key={tab.value}
                type="button"
                aria-pressed={isTabActive}
                onClick={() => setActiveTab(tab.value)}
                className={`min-h-[30px] px-2.5 py-1 border rounded-[7px] text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isTabActive
                    ? 'bg-[#FBF5EB] border-[#EEDFC6] text-[#1A1612]'
                    : 'bg-[#FAF8F5] border-transparent text-[#7D715E] hover:bg-[#FBF5EB]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
          <span className="ml-auto text-[10px] text-[#7D715E] whitespace-nowrap hidden sm:inline">
            {loading ? 'Đang tải…' : `${filteredBanks.length} ngân hàng`}
          </span>
        </div>
      </div>

      <div className="max-h-[300px] min-h-0 overflow-y-auto overscroll-contain px-4 pb-3 [scrollbar-width:thin]" aria-busy={loading}>
        {showManualInput && (
          <form id={manualFormId} className="grid grid-cols-2 gap-2.5 p-3 border border-[#EEDFC6] rounded-[10px] mb-3 bg-[#FBF5EB]" onSubmit={handleManualSubmit}>
            <div className="col-span-2 flex items-center justify-between text-xs">
              <strong className="font-semibold text-[#1A1612]">Nhập ngân hàng khác</strong>
              <button type="button" onClick={() => setShowManualInput(false)} className="text-[11px] text-[#7D715E] hover:text-[#1A1612]">Hủy</button>
            </div>
            <label className="flex flex-col gap-1 min-w-0 text-[11px] text-[#7D715E]">
              Tên ngân hàng
              <input
                ref={manualNameRef}
                value={manualName}
                onChange={(event) => setManualName(event.target.value)}
                placeholder="Ví dụ: Woori Bank"
                className="w-full min-w-0 h-9 px-2.5 py-1.5 border border-[#EAE4D7] rounded-[7px] bg-white text-xs text-[#1A1612] outline-none focus:border-[#C59B58]"
                required
              />
            </label>
            <label className="flex flex-col gap-1 min-w-0 text-[11px] text-[#7D715E]">
              Mã BIN
              <input
                value={manualBin}
                onChange={(event) => setManualBin(event.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="Mã BIN 6 số"
                inputMode="numeric"
                maxLength={6}
                className="w-full min-w-0 h-9 px-2.5 py-1.5 border border-[#EAE4D7] rounded-[7px] bg-white text-xs text-[#1A1612] outline-none focus:border-[#C59B58]"
              />
            </label>
            <button type="submit" className="col-span-2 justify-self-end px-3 py-2 border border-[#EEDFC6] rounded-[7px] bg-[#F3E8D5] text-[#1A1612] text-xs font-semibold hover:bg-[#EEDFC6] cursor-pointer">
              Áp dụng ngân hàng
            </button>
          </form>
        )}

        {loading && banks.length === 0 ? (
          <div className="flex items-center justify-center flex-col gap-2 min-h-[150px] py-5 px-2 text-[#7D715E] text-center text-xs">
            <RefreshCw size={18} className="animate-spin text-[#B88E4F]" />
            <p className="m-0 text-[11px]">Đang tải danh sách ngân hàng…</p>
          </div>
        ) : filteredBanks.length === 0 ? (
          <div className="flex items-center justify-center flex-col gap-2 min-h-[150px] py-5 px-2 text-[#7D715E] text-center text-xs">
            <Search size={20} className="text-[#B88E4F]" />
            <strong className="text-[#1A1612] font-semibold">Không tìm thấy ngân hàng</strong>
            <p className="m-0 text-[11px]">Thử tên viết tắt, tên đầy đủ hoặc mã BIN.</p>
            <button type="button" onClick={() => setShowManualInput(true)} className="text-[#B88E4F] underline text-xs cursor-pointer">
              Nhập ngân hàng thủ công
            </button>
          </div>
        ) : (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 list-none p-0 m-0" aria-label="Danh sách ngân hàng">
            {filteredBanks.map((bank) => {
              const isSelected = Boolean(currentBank?.bin === bank.bin || selectedBankBin === bank.bin || (selectedBankName && (selectedBankName.toLowerCase().includes(bank.shortName.toLowerCase()) || selectedBankName.includes(bank.bin))));
              return (
                <li key={`${bank.code}-${bank.bin}`} className="min-w-0">
                  <button
                    type="button"
                    onClick={() => handleSelect(bank)}
                    aria-pressed={isSelected}
                    aria-label={`${bank.shortName}, ${bank.name}, BIN ${bank.bin}`}
                    title={`${bank.name} · BIN ${bank.bin}`}
                    className={`flex items-center gap-2.5 w-full min-h-[56px] p-2.5 border rounded-[9px] text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'border-[#C59B58] bg-[#FBF5EB]'
                        : 'border-[#EAE4D7] bg-white hover:border-[#EEDFC6] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <span className="relative grid place-items-center w-[34px] h-[30px] shrink-0 rounded-md bg-white text-[#B88E4F] overflow-hidden">
                      <Landmark size={17} />
                      <img src={bank.logo} alt="" loading="lazy" className="absolute inset-0 w-full h-full p-0.5 object-contain bg-white" onError={(event) => { event.currentTarget.style.display = 'none'; }} />
                    </span>
                    <span className="flex-1 min-w-0">
                      <strong className="block truncate text-[#1A1612] text-[13px] leading-snug font-semibold">{bank.shortName}</strong>
                      <span className="block mt-0.5 text-[10px] leading-snug text-[#7D715E]">BIN {bank.bin}</span>
                    </span>
                    {isSelected && (
                      <span className="grid place-items-center w-[18px] h-[18px] rounded-[5px] bg-[#EEDFC6] text-[#B88E4F] shrink-0">
                        <Check size={13} />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="flex items-center justify-between gap-2.5 py-3 px-4 border-t border-[#EAE4D7] shrink-0">
        <button
          type="button"
          onClick={() => setShowManualInput((current) => !current)}
          aria-expanded={showManualInput}
          aria-controls={manualFormId}
          className="flex items-center gap-1.5 p-0 border-0 bg-transparent text-[#B88E4F] text-xs font-medium cursor-pointer hover:underline"
        >
          <Settings size={14} /> Nhập BIN thủ công
        </button>
        <span className="flex items-center gap-1 text-[#7D715E] text-[10px]">
          <ShieldCheck size={13} className="text-[#B88E4F]" /> Danh sách VietQR
        </span>
      </div>
    </dialog>, document.body,
  );
};
