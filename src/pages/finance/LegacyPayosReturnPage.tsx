import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { checkoutService } from '../../services/checkout.service';
import { money } from './money';

export default function LegacyPayosReturnPage() {
  const [params] = useSearchParams();
  const code = params.get('order');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const active = useRef(false);
  const refresh = useCallback(async () => {
    if (!code || active.current) return;
    active.current = true; setBusy(true);
    try { setResult(await checkoutService.legacyPaymentStatus(code)); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không kiểm tra được thanh toán.'); }
    finally { active.current = false; setBusy(false); }
  }, [code]);
  useEffect(() => {
    void refresh();
    if (result?.paymentStatus === 'PAID' || result?.status === 'CANCELLED') return;
    const timer = window.setInterval(() => { void refresh(); }, 5000);
    return () => window.clearInterval(timer);
  }, [refresh, result?.paymentStatus, result?.status]);
  const link = /^https:\/\/pay\.payos\.vn\//.test(result?.payos?.checkoutUrl || '') ? result.payos.checkoutUrl : null;
  const reconciliation = ['RECONCILIATION_REQUIRED', 'REFUNDED'].includes(result?.paymentStatus);
  return <main className="min-h-screen bg-[#FAF8F5] px-5 py-12"><section className="mx-auto max-w-lg space-y-5 rounded-2xl border bg-white p-7">
    <h1 className="text-2xl font-bold">Thanh toán PayOS</h1>
    <p className="break-all">Đơn hàng: {code || 'Thiếu mã đơn'}</p>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {result && <><p>Số tiền: {money(Number(result.payos?.amount || 0))}</p>
      <p role="status">{result.paymentStatus === 'PAID' ? 'PayOS đã xác minh thanh toán thành công.' : result.paymentStatus === 'REFUNDED' ? 'Khoản tiền không áp được vào đơn đã được hoàn về ví khách.' : reconciliation ? 'Đã nhận tiền nhưng đơn chưa áp được thanh toán. Giao dịch đang chờ đối soát.' : result.status === 'CANCELLED' || result.paymentStatus === 'CANCELLED' ? 'Thanh toán đã hủy.' : 'Đang chờ xác nhận từ PayOS. Quay về trang này chưa có nghĩa là đã thanh toán.'}</p>
      {link && !reconciliation && result.paymentStatus !== 'PAID' && result.paymentStatus !== 'CANCELLED' && result.status !== 'CANCELLED' && <a className="block rounded-xl border p-3 text-center" href={link}>Mở lại trang thanh toán PayOS</a>}
      {!link && !reconciliation && result.paymentStatus !== 'PAID' && result.paymentStatus !== 'CANCELLED' && result.status !== 'CANCELLED' && <button disabled={busy || !code} className="rounded-xl border px-4 py-2" onClick={() => {
        if (!code || active.current) return;
        active.current = true; setBusy(true);
        void checkoutService.legacyPaymentLink(code).then(payos => { setResult((current: any) => ({ ...current, payos, paymentStatus: payos.paymentStatus || current.paymentStatus })); setError(''); })
          .catch(e => setError(e instanceof Error ? e.message : 'Chưa tạo được link PayOS.'))
          .finally(() => { active.current = false; setBusy(false); });
      }}>Tạo lại liên kết PayOS</button>}
    </>}
    <button disabled={busy || !code} className="rounded-xl border px-4 py-2" onClick={() => void refresh()}>{busy ? 'Đang kiểm tra…' : 'Kiểm tra lại thanh toán'}</button>
    <Link className="block underline" to={`/tracking?sn=${encodeURIComponent(code || '')}`}>Xem đơn hàng</Link>
  </section></main>;
}
