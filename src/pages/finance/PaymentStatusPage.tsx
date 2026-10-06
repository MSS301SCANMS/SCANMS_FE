import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import QRCode from 'qrcode';
import { financeService, type MoneyPayment } from '../../services/finance.service';
import { money, when, statusLabels } from './money';
import LegacyPayosReturnPage from './LegacyPayosReturnPage';

export default function PaymentStatusPage() {
  const [params] = useSearchParams();
  return params.get('order') ? <LegacyPayosReturnPage /> : <SpringPaymentStatusPage />;
}

function SpringPaymentStatusPage() {
  const [params] = useSearchParams(); const id = params.get('payment');
  const [payment, setPayment] = useState<MoneyPayment | null>(null);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [qr, setQr] = useState('');
  const active = useRef(false);
  const refresh = useCallback(async (cancel = false) => {
    if (!id || active.current) return; active.current = true; setBusy(true);
    try { setPayment(await (cancel ? financeService.cancelPayment(id) : financeService.paymentStatus(id))); setError(''); }
    catch (e) { setError(e instanceof Error ? e.message : 'Không thể xác minh thanh toán'); }
    finally { active.current = false; setBusy(false); }
  }, [id]);
  useEffect(() => { void refresh(); const interval = window.setInterval(() => { void refresh(); }, 15000); return () => window.clearInterval(interval); }, [refresh]);
  useEffect(() => { let live = true; setQr(''); if (payment?.qrCode) void QRCode.toDataURL(payment.qrCode, { width: 280, margin: 2 }).then(value => { if (live) setQr(value); }); return () => { live = false; }; }, [payment?.qrCode]);
  const pending = payment && ['PENDING', 'PROCESSING'].includes(payment.status);
  const safeLink = payment?.checkoutUrl && /^https:\/\/(?:pay\.payos\.vn|payos\.vn)\//.test(payment.checkoutUrl) ? payment.checkoutUrl : null;
  return <main className="min-h-screen bg-[#FAF8F5] px-5 py-12"><section className="mx-auto max-w-lg space-y-5 rounded-2xl border border-[#EAE4D7] bg-white p-7">
    <h1 className="text-2xl font-bold">Thanh toán SCANMS</h1>
    {!id && <p role="alert">Thiếu mã thanh toán. Mở lại giao dịch từ ví hoặc đơn hàng.</p>}
    {error && <p role="alert" className="rounded-xl bg-red-50 p-3 text-red-700">{error}</p>}
    {payment && <><p className="text-3xl font-bold text-[#A77C37]">{money(payment.amountVnd)}</p>
      <p>{statusLabels[payment.status] || payment.status}</p>
      <p className="text-sm text-gray-500">Mã giao dịch: {payment.paymentId}<br />Hết hạn: {when(payment.expiresAt)}</p>
      {payment.status === 'SUCCESS' && <p role="status" className="rounded-xl bg-green-50 p-4 text-green-800">Dịch vụ thanh toán đã xác minh thành công.{payment.purpose === 'TOP_UP' ? ' Tiền đã được cộng vào ví.' : payment.orderSyncStatus === 'REFUNDED' ? ' Khoản tiền không áp vào đơn đã được hoàn về ví khách.' : payment.orderSyncStatus === 'RECONCILIATION_REQUIRED' ? ' Đơn chưa nhận được thanh toán. Khoản tiền đang chờ đối soát; liên hệ hỗ trợ với mã giao dịch.' : payment.orderSyncStatus === 'SYNCED' ? ' Đơn hàng đã được cập nhật.' : ' Đang đồng bộ kết quả sang đơn hàng.'}</p>}
      {pending && qr && <img src={qr} alt="Mã QR thanh toán payOS" className="mx-auto" />}
      {pending && safeLink && <a href={safeLink} className="block rounded-xl bg-[#C59B58] p-3 text-center font-semibold text-white">Mở trang thanh toán payOS</a>}
      {pending && !safeLink && <button className="rounded-xl border px-4 py-2" disabled={busy} onClick={() => { if (!id || active.current) return; active.current = true; setBusy(true); void financeService.resumePayment(id).then(setPayment).catch(e => setError(e.message)).finally(() => { active.current = false; setBusy(false); }); }}>Khôi phục liên kết thanh toán</button>}
      {payment.failureReason && <p className="text-amber-800">{payment.failureReason}</p>}
      {!!payment.receivedAmountVnd && payment.receivedAmountVnd > payment.amountVnd && <p className="rounded-xl bg-amber-50 p-4 text-amber-900">Đã nhận xác minh: {money(payment.receivedAmountVnd)}. Khoản chuyển dư: {money(payment.receivedAmountVnd - payment.amountVnd)}. Đã hoàn về ví: {money((payment.surplusRefundedAmountVnd || 0) + (payment.resolutionAmountVnd || 0))}. Liên hệ hỗ trợ với mã giao dịch nếu còn khoản chờ đối soát.</p>}
    </>}
    <div className="flex gap-3"><button disabled={busy || !id} onClick={() => void refresh()} className="rounded-xl border px-4 py-2 disabled:opacity-50">{busy ? 'Đang xác minh…' : 'Kiểm tra lại'}</button>
      {pending && <button disabled={busy} onClick={() => void refresh(true)} className="rounded-xl border px-4 py-2 disabled:opacity-50">Hủy thanh toán</button>}</div>
    <p className="text-sm text-gray-500">Trạng thái được lấy từ máy chủ. Quay về trang này chưa đồng nghĩa giao dịch đã thành công.</p>
    <Link to="/customer/wallet" className="block text-[#A77C37] underline">Về ví khách hàng</Link>
  </section></main>;
}
