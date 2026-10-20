import { useCallback, useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { CheckCircle2, Clock3, ExternalLink, Loader2, QrCode, RefreshCw, ShieldCheck } from 'lucide-react';
import api from '../../services/api';
import { formatMoney } from '../../utils/marketplace.utils';

type PaymentLink = {
  qrCode?: string; checkoutUrl?: string; accountNumber?: string;
  accountName?: string; amount?: number; paymentStatus?: string;
};
const requests = new Map<string, Promise<PaymentLink>>();
const unwrap = (response: any) => response?.data?.data || response?.data || response;

// React StrictMode and repeated mounts share the same in-flight request.
function createLink(code: string) {
  const active = requests.get(code);
  if (active) return active;
  const request = api.post(`/orders/payos/${encodeURIComponent(code)}/link`, {}, { timeout: 30000 })
    .then(unwrap).finally(() => requests.delete(code));
  requests.set(code, request);
  return request;
}

export function PayosOrderPayment({ orderCode, storeName, onPaid, showOrderHeading = true }: {
  orderCode: string; storeName?: string; onPaid?: () => void; showOrderHeading?: boolean;
}) {
  const [link, setLink] = useState<PaymentLink | null>(null);
  const [qr, setQr] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('WAITING_PAYMENT');
  const [providerStatus, setProviderStatus] = useState('');
  const paidCallback = useRef(onPaid);
  paidCallback.current = onPaid;
  const mounted = useRef(false);

  const prepare = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const result = await createLink(orderCode);
      if (!mounted.current) return;
      if (result.paymentStatus === 'PAID') {
        setStatus('PAID'); paidCallback.current?.();
      } else if (!result.qrCode || !result.checkoutUrl) {
        throw new Error('Chưa nhận được mã QR PayOS. Vui lòng thử lại.');
      }
      setLink(result); setProviderStatus('');
    } catch (err: any) {
      if (err.status === 409) {
        try {
          const result = unwrap(await api.get(`/orders/payos/${encodeURIComponent(orderCode)}/status`, { headers: { 'x-skip-cache': 'true' }, timeout: 30000 }));
          if (mounted.current && result.paymentStatus === 'PAID') {
            setStatus('PAID'); paidCallback.current?.(); return;
          }
        } catch { /* Retain the original creation error for retry. */ }
      }
      if (mounted.current) setError(err.message || 'Không tạo được mã QR. Vui lòng thử lại.');
    } finally { if (mounted.current) setLoading(false); }
  }, [orderCode]);

  useEffect(() => {
    mounted.current = true;
    void prepare();
    return () => { mounted.current = false; };
  }, [prepare]);

  useEffect(() => {
    setQr('');
    if (!link?.qrCode) return;
    let active = true;
    QRCode.toDataURL(link.qrCode, { width: 320, margin: 2 })
      .then(image => { if (active) setQr(image); })
      .catch(() => { if (active) setError('Không hiển thị được QR. Bạn có thể mở trang thanh toán PayOS bên dưới.'); });
    return () => { active = false; };
  }, [link?.qrCode]);

  useEffect(() => {
    if (!link || status === 'PAID') return;
    let active = true;
    let timer: number;
    const check = async () => {
      let finished = false;
      try {
        const result = unwrap(await api.get(`/orders/payos/${encodeURIComponent(orderCode)}/status`, {
          headers: { 'x-skip-cache': 'true' }, timeout: 30000,
        }));
        if (!active) return;
        setError(''); setProviderStatus(result.providerStatus || '');
        if (result.paymentStatus === 'PAID') {
          setStatus('PAID'); paidCallback.current?.(); finished = true;
        } else if (result.orderStatus === 'CANCELLED') {
          setStatus('CANCELLED'); finished = true;
        } else if (['CANCELLED', 'EXPIRED'].includes(result.providerStatus)) {
          finished = true;
        }
      } catch {
        if (active) setError('Tạm thời chưa kiểm tra được thanh toán. Hệ thống sẽ kiểm tra lại tự động.');
      } finally {
        if (active && !finished) timer = window.setTimeout(check, 5000);
      }
    };
    void check();
    return () => { active = false; window.clearTimeout(timer); };
  }, [link, orderCode, status]);

  const expired = ['CANCELLED', 'EXPIRED'].includes(providerStatus);
  return (
    <section className="min-w-0 mb-3.5 last:mb-0 p-4 sm:p-4.5 border border-[#EAE4D7] rounded-xl bg-white text-[#1A1612] text-left" aria-label={`Thanh toán PayOS ${orderCode}`}>
      {(showOrderHeading || status === 'PAID') && (
        <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-[#EAE4D7]">
          <div>
            <h3 className="flex items-center gap-2 m-0 text-sm font-semibold">
              {status === 'PAID' ? <CheckCircle2 size={20} className="text-[#059669]" /> : <QrCode size={20} className="text-[#B88E4F]" />}
              {status === 'PAID' ? 'Đã xác nhận thanh toán' : 'Quét mã QR để thanh toán'}
            </h3>
            <p className="m-0 mt-1 text-[11px] text-[#7D715E] break-all">{storeName ? `${storeName} · ` : ''}{orderCode}</p>
          </div>
          {status !== 'PAID' && status !== 'CANCELLED' && (
            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-[#FBF5EB] text-[11px] text-[#7D715E]">
              <Clock3 size={12} className="text-[#B88E4F]" />
              {expired ? 'Mã hết hiệu lực' : 'Chờ thanh toán'}
            </span>
          )}
        </div>
      )}
      {loading && (
        <p className="flex items-center gap-2 pt-3.5 m-0 text-xs text-[#7D715E]" role="status">
          <Loader2 size={18} className="animate-spin text-[#B88E4F]" />
          Đang tạo mã thanh toán…
        </p>
      )}
      {status !== 'PAID' && status !== 'CANCELLED' && !loading && link && !expired && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-[234px_minmax(0,1fr)] gap-4 sm:gap-4.5 pt-3.5">
            <div className="flex flex-col items-center self-start bg-white">
              <span className="px-2.5 py-1 rounded-md bg-[#FBF5EB] text-[10px] tracking-wider font-semibold text-[#B88E4F]">VIETQR · PAYOS</span>
              <div className="grid place-items-center max-w-full my-2.5 p-2.5 border border-[#EAE4D7] rounded-xl bg-white">
                {qr ? <img src={qr} alt={`Mã VietQR cho đơn ${orderCode}`} className="w-52 h-52 max-w-full object-contain m-0 bg-white" /> : <p className="text-xs text-[#7D715E]">Đang chuẩn bị hình ảnh QR…</p>}
              </div>
              <p className="m-0 text-[11px] text-[#7D715E] text-center">Quét mã để chuyển khoản</p>
            </div>
            <div className="min-w-0">
              <div className="py-2.5 px-3.5 rounded-[10px] bg-[#FBF5EB]">
                <p className="m-0 text-xs text-[#7D715E]">Số tiền cần thanh toán</p>
                <strong className="block mt-0.5 text-2xl font-semibold tracking-tight leading-snug tabular-nums text-[#1A1612]">{formatMoney(link.amount ?? 0)}</strong>
              </div>
              <dl className="my-3 pb-3 border-b border-[#EAE4D7] grid gap-2">
                <div className="flex justify-between items-baseline gap-2.5 text-xs leading-relaxed"><dt className="text-[#7D715E] shrink-0">Chủ tài khoản</dt><dd className="m-0 text-right font-semibold break-all text-[#1A1612]">{link.accountName || 'Xem trên PayOS'}</dd></div>
                <div className="flex justify-between items-baseline gap-2.5 text-xs leading-relaxed"><dt className="text-[#7D715E] shrink-0">Số tài khoản</dt><dd className="m-0 text-right font-semibold break-all text-[#1A1612]">{link.accountNumber || 'Xem trên PayOS'}</dd></div>
              </dl>
              <ol className="p-0 m-0 mb-3 list-none grid gap-1.5">
                <li className="flex items-start gap-2 text-xs leading-relaxed text-[#7D715E]"><span className="grid place-items-center shrink-0 w-4.5 h-4.5 border border-[#EAE4D7] rounded-[5px] bg-white text-[10px] font-medium text-[#B88E4F]">1</span>Mở ứng dụng ngân hàng, quét QR.</li>
                <li className="flex items-start gap-2 text-xs leading-relaxed text-[#7D715E]"><span className="grid place-items-center shrink-0 w-4.5 h-4.5 border border-[#EAE4D7] rounded-[5px] bg-white text-[10px] font-medium text-[#B88E4F]">2</span>Kiểm tra thông tin và chuyển khoản.</li>
                <li className="flex items-start gap-2 text-xs leading-relaxed text-[#7D715E]"><span className="grid place-items-center shrink-0 w-4.5 h-4.5 border border-[#EAE4D7] rounded-[5px] bg-white text-[10px] font-medium text-[#B88E4F]">3</span>Chờ xác nhận thanh toán tự động.</li>
              </ol>
              <a
                href={link.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full min-h-[38px] inline-flex justify-center items-center gap-2 px-3.5 py-2 border border-[#EEDFC6] rounded-[10px] text-xs font-semibold bg-[#FBF5EB] text-[#1A1612] hover:bg-[#F3EFE6] hover:border-[#C59B58] transition-colors cursor-pointer text-center"
              >
                <ExternalLink size={15} className="text-[#B88E4F]" />Mở trang thanh toán PayOS
              </a>
            </div>
          </div>
          <p className="mt-3.5 p-2.5 rounded-lg bg-[#FAF8F5] flex items-start gap-2 text-xs leading-relaxed text-[#7D715E]">
            <ShieldCheck size={14} className="shrink-0 mt-0.5 text-[#B88E4F]" />
            Trạng thái tự động cập nhật khi PayOS xác nhận đã nhận đủ tiền.
          </p>
        </>
      )}
      {status === 'PAID' && <p className="pt-3 m-0 text-xs text-[#059669]">PayOS đã xác nhận nhận đủ tiền cho đơn hàng này.</p>}
      {status === 'CANCELLED' && <p className="pt-3 m-0 text-xs text-[#DC2626]">Đơn hàng đã hủy.</p>}
      {expired && status !== 'PAID' && status !== 'CANCELLED' && <p className="pt-3 m-0 text-xs text-[#7D715E]">Mã thanh toán đã hết hạn hoặc bị hủy. Bạn có thể tạo mã mới cho đơn này.</p>}
      {error && <p role="alert" className="p-2.5 mt-3 border border-[#EAE4D7] rounded-lg text-xs leading-relaxed text-[#DC2626]">{error}</p>}
      {!loading && status !== 'PAID' && status !== 'CANCELLED' && (!link || expired) && (
        <button
          type="button"
          onClick={() => void prepare()}
          className="mt-3 inline-flex items-center gap-2 px-3.5 py-2 border border-[#EEDFC6] rounded-[10px] text-xs font-semibold bg-[#FBF5EB] text-[#1A1612] hover:bg-[#F3EFE6] hover:border-[#C59B58] cursor-pointer"
        >
          <RefreshCw size={14} className="text-[#B88E4F]" />Tạo lại mã QR
        </button>
      )}
    </section>
  );
}
