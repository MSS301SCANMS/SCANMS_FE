import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AlertCircle, Loader2, X, XCircle } from 'lucide-react';
import './CustomerCancelOrderModal.css';

const reasons = [
  { id: 'ADDRESS', label: 'Tôi muốn thay đổi địa chỉ hoặc SĐT nhận hàng' },
  { id: 'VOUCHER', label: 'Tôi muốn thêm hoặc thay đổi mã giảm giá' },
  { id: 'PRODUCT', label: 'Tôi muốn thay đổi sản phẩm, phân loại hoặc số lượng' },
  { id: 'PAYMENT', label: 'Tôi muốn thay đổi phương thức thanh toán' },
  { id: 'BETTER_OFFER', label: 'Tôi tìm thấy nơi mua khác phù hợp hơn' },
  { id: 'NO_LONGER_NEEDED', label: 'Tôi không còn nhu cầu mua nữa' },
  { id: 'OTHER', label: 'Lý do khác — tự nhập nội dung' },
];

interface Props {
  busy: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
}

export function CustomerCancelOrderModal({ busy, onClose, onConfirm }: Props) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const dialog = useRef<HTMLFormElement>(null);
  const submitting = useRef(false);
  const closeRef = useRef(onClose);
  const busyRef = useRef(busy);
  closeRef.current = onClose;
  busyRef.current = busy;
  const reason = selectedReason === 'OTHER'
    ? customReason.trim()
    : reasons.find(item => item.id === selectedReason)?.label || '';

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.querySelector<HTMLButtonElement>('[data-cancel-keep]')?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        if (!busyRef.current && !submitting.current) closeRef.current();
      }
      if (event.key !== 'Tab') return;
      const controls = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled)') || [])]
        .filter(element => element.getClientRects().length > 0);
      const first = controls[0], last = controls.at(-1);
      if (!first) { event.preventDefault(); dialog.current?.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !dialog.current?.contains(document.activeElement))) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !dialog.current?.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, []);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!reason || busy || submitting.current) return;
    submitting.current = true;
    try { await onConfirm(reason); }
    finally { submitting.current = false; }
  };

  return <div className="customer-cancel-overlay" onMouseDown={event => {
    if (event.target === event.currentTarget && !busy && !submitting.current) onClose();
  }}>
    <form ref={dialog} role="dialog" aria-modal="true" aria-labelledby="customer-cancel-title" aria-describedby="customer-cancel-description"
      aria-busy={busy} tabIndex={-1} className="customer-cancel-dialog" onSubmit={event => void submit(event)}>
      <header className="customer-cancel-header">
        <span className="customer-cancel-icon"><XCircle size={21} aria-hidden="true" /></span>
        <div><h2 id="customer-cancel-title">Hủy đơn hàng</h2><p id="customer-cancel-description">Chọn lý do hủy hoặc nhập nội dung của bạn.</p></div>
        <button type="button" className="customer-cancel-close" aria-label="Đóng cửa sổ hủy đơn" disabled={busy} onClick={onClose}><X size={18} /></button>
      </header>
      <div className="customer-cancel-body">
        <p className="customer-cancel-notice"><AlertCircle size={16} aria-hidden="true" /><span>Yêu cầu áp dụng cho toàn bộ đơn chưa bàn giao vận chuyển. Đơn đã được shop xác nhận cần shop duyệt hủy. Khoản đã thanh toán sẽ được hoàn về ví SCANMS sau khi hủy được chấp nhận.</span></p>
        <fieldset disabled={busy} className="customer-cancel-reasons">
          <legend>Lý do hủy đơn</legend>
          {reasons.map(item => <label className="customer-cancel-choice" data-selected={selectedReason === item.id} key={item.id}>
            <input type="radio" name="customer-cancel-reason" value={item.id} checked={selectedReason === item.id}
              onChange={() => setSelectedReason(item.id)} />
            <span>{item.label}</span>
          </label>)}
          {selectedReason === 'OTHER' && <div className="customer-cancel-custom">
            <label htmlFor="customer-cancel-custom-reason">Nội dung lý do <span aria-hidden="true">*</span></label>
            <textarea id="customer-cancel-custom-reason" value={customReason} onChange={event => setCustomReason(event.target.value)}
              required maxLength={500} rows={3} placeholder="Nhập lý do bạn muốn hủy đơn…" aria-describedby="customer-cancel-custom-hint" />
            <p id="customer-cancel-custom-hint"><span>Vui lòng nhập nội dung trước khi xác nhận.</span><span>{customReason.length}/500</span></p>
          </div>}
        </fieldset>
      </div>
      <footer className="customer-cancel-footer">
        <button type="button" data-cancel-keep disabled={busy} onClick={onClose}>Giữ lại đơn</button>
        <button type="submit" disabled={busy || !reason} className="customer-cancel-confirm">{busy && <Loader2 size={15} className="animate-spin" />}<span>{busy ? 'Đang hủy đơn…' : 'Xác nhận hủy'}</span></button>
      </footer>
    </form>
  </div>;
}
