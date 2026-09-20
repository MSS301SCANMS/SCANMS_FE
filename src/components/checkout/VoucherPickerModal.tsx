import { useMemo } from 'react';
import { Gift, Ticket, X } from 'lucide-react';
import {
  buyerVoucherService,
  type BuyerVoucher,
} from '../../services/buyer-voucher.service';

interface VoucherPickerModalProps {
  isOpen: boolean;
  storeId?: string;
  productId: string;
  subtotal: number;
  selectedCode?: string;
  onSelect: (voucher: BuyerVoucher) => void;
  onClose: () => void;
}

const SCOPE_LABELS: Record<BuyerVoucher['scope'], string> = {
  PLATFORM: 'Toàn sàn',
  STORE: 'Gian hàng',
  PRODUCT: 'Sản phẩm',
  CREATOR: 'Creator',
};

export function VoucherPickerModal({
  isOpen,
  storeId,
  productId,
  subtotal,
  selectedCode,
  onSelect,
  onClose,
}: VoucherPickerModalProps) {
  const vouchers = useMemo(
    () => buyerVoucherService.list(),
    // Modal is recreated whenever it opens, which refreshes local voucher data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isOpen],
  );
  const eligibleCodes = new Set(
    buyerVoucherService
      .eligibleFor({ storeId, productId, subtotal })
      .map((voucher) => voucher.code),
  );

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voucher-picker-title"
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="max-h-[82vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#EEDFC6] bg-white p-5 shadow-2xl sm:p-7"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4 border-b border-[#EAE4D7] pb-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
              <Gift className="h-5 w-5" />
            </span>
            <div>
              <h3 id="voucher-picker-title" className="m-0 text-lg font-black text-[#1A1612]">
                Chọn voucher đã săn
              </h3>
              <p className="m-0 mt-0.5 text-xs text-[#7D715E]">
                Mã được kiểm tra lại với hệ thống trước khi giảm tiền.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng ví voucher" className="rounded-full p-2 text-[#7D715E] hover:bg-[#F3EFE6]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {vouchers.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#D7C39F] bg-[#FAF8F5] px-5 py-10 text-center">
            <Ticket className="mx-auto mb-2 h-9 w-9 text-[#B88E4F]" />
            <strong className="block text-sm text-[#1A1612]">Ví chưa có voucher</strong>
            <p className="mt-1 text-xs text-[#7D715E]">Hãy săn và lưu voucher ở trang mua sắm trước.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vouchers.map((voucher) => {
              const eligible = eligibleCodes.has(voucher.code);
              const selected = selectedCode === voucher.code;
              return (
                <article
                  key={voucher.id}
                  className={`flex gap-3 rounded-2xl border p-4 ${
                    selected ? 'border-[#C59B58] bg-[#FBF5EB]' : 'border-[#EAE4D7] bg-white'
                  } ${eligible ? '' : 'opacity-55'}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-md bg-[#B88E4F] px-2 py-0.5 text-[10px] font-black uppercase text-white">
                        {SCOPE_LABELS[voucher.scope]}
                      </span>
                      <strong className="font-mono text-sm text-[#1A1612]">{voucher.code}</strong>
                    </div>
                    <p className="m-0 text-xs font-bold text-[#1A1612]">{voucher.title}</p>
                    <p className="m-0 mt-1 text-[11px] text-[#7D715E]">{voucher.description}</p>
                    {!eligible && (
                      <p className="m-0 mt-1 text-[10px] font-semibold text-[#B45309]">
                        Chưa đủ điều kiện hoặc không áp dụng cho sản phẩm này.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={!eligible}
                    onClick={() => onSelect(voucher)}
                    className="self-center rounded-xl border border-[#C59B58] px-3 py-2 text-xs font-black text-[#8C6226] hover:bg-[#FBF5EB] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {selected ? 'Đang chọn' : 'Dùng mã'}
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

