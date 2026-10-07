import { useState } from 'react';
import type { MoneyPage, MoneyPayment } from '../../services/finance.service';
import { money, statusLabels } from './money';

export function AdminPayments({ payments, busy, onVerify, onRefundUnapplied, onRefundSurplus }: {
  payments: MoneyPage<MoneyPayment> | null;
  busy: boolean;
  onVerify: (id: string) => void;
  onRefundUnapplied: (id: string, reason: string) => void;
  onRefundSurplus: (id: string, reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  return <section className="space-y-4">
    <h2 className="text-lg font-bold">Giao dịch thanh toán và đối soát payOS</h2>
    <p className="text-sm text-[#7D715E]">Chỉ hoàn tiền đã được máy chủ xác minh. Khoản hoàn được ghi có vào ví khách hàng và có mã giao dịch để tra cứu.</p>
    <label className="block text-sm">Lý do đối soát thanh toán
      <input aria-label="Lý do đối soát thanh toán" value={reason} onChange={event => setReason(event.target.value)} maxLength={500} className="mt-2 block w-full rounded-xl border p-3" placeholder="Nhập lý do trước khi hoàn tiền" />
    </label>
    {payments?.items.length === 0 && <p>Chưa có giao dịch thanh toán.</p>}
    {payments?.items.map(payment => {
      const applied = payment.orderSyncStatus === 'REFUNDED' ? payment.resolutionAmountVnd ?? payment.amountVnd : payment.amountVnd;
      const remainingSurplus = Math.max(0, (payment.receivedAmountVnd ?? payment.amountVnd) - applied - (payment.surplusRefundedAmountVnd || 0));
      return <article key={payment.paymentId} className="space-y-3 rounded-xl border border-[#EAE4D7] bg-white p-5">
        <div className="flex flex-wrap justify-between gap-2"><strong>{money(payment.amountVnd)}</strong><span>{statusLabels[payment.status] || payment.status} ({payment.status})</span></div>
        <p className="break-all text-sm">Mã giao dịch: {payment.paymentId}<br />{payment.orderId ? `Đơn hàng: ${payment.orderId}` : 'Nạp ví khách hàng'}</p>
        {payment.orderSyncStatus && <p className="text-sm">Trạng thái đồng bộ đơn: {payment.orderSyncStatus}</p>}
        {payment.receivedAmountVnd != null && <p className="text-sm">Đã nhận xác minh: {money(payment.receivedAmountVnd)} · Đã hoàn: {money((payment.surplusRefundedAmountVnd || 0) + (payment.resolutionAmountVnd || 0))}</p>}
        {payment.resolutionReference && <p className="break-all text-sm">Mã hoàn về ví: {payment.resolutionReference}</p>}
        {payment.surplusReference && <p className="break-all text-sm">Mã hoàn tiền dư: {payment.surplusReference}</p>}
        {payment.failureReason && <p className="text-sm text-amber-800">{payment.failureReason}</p>}
        <div className="flex flex-wrap gap-3">
          <button type="button" disabled={busy} onClick={() => onVerify(payment.paymentId)} className="rounded-lg border px-4 py-2 text-sm disabled:opacity-50">Kiểm tra khoản đã nhận</button>
          {payment.status === 'SUCCESS' && payment.orderSyncStatus === 'RECONCILIATION_REQUIRED' && <button type="button" disabled={busy || !reason.trim()} onClick={() => onRefundUnapplied(payment.paymentId, reason.trim())} className="rounded-lg bg-[#C59B58] px-4 py-2 text-sm text-white disabled:opacity-50">Hoàn về ví khách</button>}
          {payment.status === 'SUCCESS' && remainingSurplus > 0 && <button type="button" disabled={busy || !reason.trim()} onClick={() => onRefundSurplus(payment.paymentId, reason.trim())} className="rounded-lg bg-[#C59B58] px-4 py-2 text-sm text-white disabled:opacity-50">Hoàn tiền chuyển dư</button>}
        </div>
      </article>;
    })}
  </section>;
}
