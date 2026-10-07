import React, { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Wallet,
  RefreshCw,
  CreditCard,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Coins,
  XCircle,
  QrCode,
  Info,
} from 'lucide-react';
import {
  financeService,
  type MoneyWallet,
  type MoneyLedger,
  type MoneyPayment,
  type MoneyPage,
  type Capabilities,
} from '../../services/finance.service';
import { commandKey, completeCommand } from '../../pages/finance/commandKey';
import { amountVnd, money, when, statusLabels, typeLabels } from '../../pages/finance/money';
import { toast } from '../../utils/toast';

interface CustomerWalletTabProps {
  onSelectOrder?: (orderId: string) => void;
}

export const CustomerWalletTab: React.FC<CustomerWalletTabProps> = () => {
  const [wallet, setWallet] = useState<MoneyWallet | null>(null);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [payments, setPayments] = useState<MoneyPage<MoneyPayment> | null>(null);
  const [ledger, setLedger] = useState<MoneyPage<MoneyLedger> | null>(null);

  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Top-up state
  const [topupAmount, setTopupAmount] = useState('100000');
  // Pay order state
  const [orderId, setOrderId] = useState('');

  // Pagination & filter
  const [ledgerPage, setLedgerPage] = useState(0);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'payments' | 'ledger'>('payments');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<'ALL' | 'SUCCESS' | 'PROCESSING' | 'CANCELLED'>('ALL');

  const sequence = useRef(0);
  const inFlight = useRef(false);
  const scope = '/customer/wallet';
  const keyFor = (payload: string) => commandKey(scope, payload);

  const load = useCallback(async () => {
    if (!localStorage.getItem('token')) return;
    const current = ++sequence.current;
    setLoading(true);
    try {
      const [summary, caps, paymentRows] = await Promise.all([
        financeService.wallet('CUSTOMER').catch(() => null),
        financeService.capabilities().catch(() => null),
        financeService.payments(0).catch(() => null),
      ]);

      let entries: MoneyPage<MoneyLedger> | null = null;
      if (summary?.walletId) {
        entries = await financeService.ledger(summary.walletId, ledgerPage).catch(() => null);
      }

      if (current !== sequence.current) return;
      setWallet(summary);
      setCapabilities(caps);
      setPayments(paymentRows);
      setLedger(entries);
      setError('');
    } catch (err: any) {
      if (current === sequence.current) {
        setError(err instanceof Error ? err.message : 'Không tải được ví khách hàng.');
      }
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }, [ledgerPage]);

  useEffect(() => {
    void load();
  }, [load]);

  async function run(action: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await action();
      await load();
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : 'Không thể xử lý yêu cầu.';
      setError(msg);
      toast.error(msg);
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  // Handle top-up submit
  const handleTopup = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      if (!wallet) throw new Error('Ví khách hàng chưa sẵn sàng.');
      const value = amountVnd(topupAmount);
      if (value < 10000) throw new Error('Số tiền nạp tối thiểu là 10.000 VNĐ.');
      const payment = await financeService.topup(
        wallet.walletId,
        value,
        keyFor(`topup:${wallet.walletId}:${value}`)
      );
      completeCommand(scope);
      if (payment?.checkoutUrl) {
        window.location.assign(payment.checkoutUrl);
      } else {
        window.location.assign(`/payment/payos-return?payment=${payment.paymentId}`);
      }
    });
  };

  // Handle pay order by wallet
  const handlePayWallet = (e: FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) {
      toast.error('Vui lòng nhập mã đơn hàng cần thanh toán.');
      return;
    }
    void run(async () => {
      if (!wallet) throw new Error('Ví khách hàng chưa sẵn sàng.');
      const cleanOrderId = orderId.trim();
      const result = await financeService.payWallet(
        cleanOrderId,
        wallet.walletId,
        keyFor(`pay:${cleanOrderId}:${wallet.walletId}`)
      );
      if (result.status !== 'SUCCESS') {
        throw new Error('Giao dịch chưa thành công. Kiểm tra trạng thái đơn trước khi thử lại.');
      }
      completeCommand(scope);
      setSuccess(`Đã thanh toán thành công bằng ví! Mã giao dịch: ${result.paymentId}`);
      toast.success('Thanh toán bằng ví thành công!');
      setOrderId('');
    });
  };

  // Handle pay order via PayOS
  const handlePayViaPayos = () => {
    if (!orderId.trim()) {
      toast.error('Vui lòng nhập mã đơn hàng cần thanh toán.');
      return;
    }
    void run(async () => {
      const cleanOrderId = orderId.trim();
      const payment = await financeService.payment(
        cleanOrderId,
        keyFor(`order-payos:${cleanOrderId}`)
      );
      completeCommand(scope);
      if (payment?.checkoutUrl) {
        window.location.assign(payment.checkoutUrl);
      } else {
        window.location.assign(`/payment/payos-return?payment=${payment.paymentId}`);
      }
    });
  };

  // Cancel an unpaid pending payment
  const handleCancelPayment = (paymentId: string) => {
    void run(async () => {
      await financeService.cancelPayment(paymentId);
      toast.success('Đã hủy yêu cầu thanh toán');
    });
  };

  const quickTopupAmounts = [50000, 100000, 200000, 500000, 1000000, 2000000];

  const filteredPayments = (payments?.items || []).filter((p) => {
    if (paymentStatusFilter === 'ALL') return true;
    if (paymentStatusFilter === 'SUCCESS') return p.status === 'SUCCESS';
    if (paymentStatusFilter === 'PROCESSING') return p.status === 'PROCESSING' || p.status === 'REQUESTED' || p.status === 'PENDING';
    if (paymentStatusFilter === 'CANCELLED') return p.status === 'CANCELLED' || p.status === 'FAILED' || p.status === 'EXPIRED';
    return true;
  });

  return (
    <div className="bg-white border border-[#EAE4D7] rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col gap-6 text-[#1A1612]">
      {/* ── Header & Refresh Button ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#EAE4D7]">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#FBF5EB] border border-[#EAE4D7] flex items-center justify-center text-[#B88E4F]">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-[#1A1612] m-0">
                Ví Khách Hàng · Nạp Tiền &amp; Thanh Toán
              </h1>
              <p className="text-xs text-[#7D715E] mt-0.5 m-0">
                Nhận hoàn tiền tự động, nạp ví qua VietQR PayOS và thanh toán đơn hàng ngay lập tức
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          disabled={busy || loading}
          className="self-start sm:self-auto px-4 py-2.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] hover:bg-[#F3EFE6] text-xs font-bold text-[#1A1612] flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Làm mới số dư</span>
        </button>
      </div>

      {/* ── Status Alerts ── */}
      {error && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* ── Balance Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Main Available Balance */}
        <div className="md:col-span-2 rounded-2xl border-2 border-[#EEDFC6] bg-gradient-to-br from-[#FBF5EB] to-[#F7EEDC] p-6 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7D715E] uppercase tracking-wider flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-[#B88E4F]" />
              Số dư khả dụng trong ví
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#EBD08C] text-[#231D15] shadow-2xs">
              {wallet ? statusLabels[wallet.status] || 'Đang hoạt động' : loading ? 'Đang tải...' : 'Hoạt động'}
            </span>
          </div>

          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-[#1A1612] tabular-nums tracking-tight">
              {wallet ? money(wallet.availableBalanceVnd) : loading ? '—' : '0 ₫'}
            </span>
            <span className="text-xs font-bold text-[#7D715E]">VNĐ</span>
          </div>

          <div className="mt-4 pt-3 border-t border-[#EBD08C]/40 flex flex-wrap items-center justify-between text-xs text-[#7D715E] gap-2">
            <span>Tiền trong ví dùng để thanh toán mọi đơn hàng trên sàn SCANMS</span>
            <span className="font-semibold text-[#B88E4F] flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Bảo hộ Escrow an toàn
            </span>
          </div>
        </div>

        {/* Held Balance & Policy Card */}
        <div className="rounded-2xl border border-[#EAE4D7] bg-[#FAF8F5] p-6 flex flex-col justify-between">
          <div>
            <span className="text-xs font-bold text-[#7D715E] uppercase tracking-wider block">
              Khoản tiền tạm giữ / chờ duyệt
            </span>
            <div className="mt-2 text-2xl font-black text-[#1A1612] tabular-nums">
              {wallet ? money(wallet.heldBalanceVnd) : '0 ₫'}
            </div>
            <p className="text-[11px] text-[#7D715E] mt-2 leading-relaxed">
              Các khoản hoàn tiền từ đơn đổi/trả hoặc khiếu nại đang được xử lý sẽ xuất hiện tại đây trước khi giải phóng vào số dư khả dụng.
            </p>
          </div>
          <div className="mt-3 text-[11px] text-[#B88E4F] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Cập nhật tự động 24/7
          </div>
        </div>
      </div>

      {/* ── Two Action Forms: Top-up & Pay Order ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
        {/* Form 1: Nạp tiền vào ví qua PayOS */}
        <form
          onSubmit={handleTopup}
          className="rounded-2xl border border-[#EAE4D7] bg-[#FAF8F5] p-5 sm:p-6 flex flex-col justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-[#1A1612] mb-1">
              <CreditCard className="w-4 h-4 text-[#B88E4F]" />
              <span>Nạp tiền vào ví qua VietQR PayOS</span>
            </div>
            <p className="text-xs text-[#7D715E] mb-3 leading-relaxed">
              Tạo mã QR thanh toán ngân hàng tự động. Tiền được cộng vào số dư ví ngay sau khi quét mã thành công.
            </p>

            <label className="block text-xs font-bold text-[#1A1612] mb-1.5">
              Số tiền muốn nạp (VNĐ)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={topupAmount}
              onChange={(e) => setTopupAmount(e.target.value.replace(/\D/g, ''))}
              placeholder="VD: 100000"
              className="w-full bg-white border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#1A1612] focus:border-[#C59B58] outline-none transition"
              required
            />

            {/* Quick chips */}
            <div className="grid grid-cols-3 gap-1.5 mt-2.5">
              {quickTopupAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setTopupAmount(String(amt))}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-bold border transition cursor-pointer text-center ${
                    topupAmount === String(amt)
                      ? 'bg-[#EBD08C] text-[#231D15] border-[#DEC07A]'
                      : 'bg-white text-[#7D715E] border-[#EAE4D7] hover:border-[#C59B58] hover:text-[#1A1612]'
                  }`}
                >
                  +{amt.toLocaleString('vi-VN')}đ
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={busy || loading || !capabilities?.paymentAvailable}
              className="w-full py-3 rounded-xl bg-[#EBD08C] hover:bg-[#DEC07A] text-[#231D15] text-xs font-black shadow-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>
                {busy ? 'Đang xử lý…' : `Tạo mã QR nạp ví ${topupAmount ? Number(topupAmount).toLocaleString('vi-VN') + 'đ' : ''}`}
              </span>
            </button>
            {!capabilities?.paymentAvailable && (
              <p className="text-[11px] text-[#7D715E] mt-1.5 text-center">
                Cổng thanh toán PayOS đang bảo trì hoặc chưa sẵn sàng.
              </p>
            )}
          </div>
        </form>

        {/* Form 2: Thanh toán đơn hàng bằng ví */}
        <form
          onSubmit={handlePayWallet}
          className="rounded-2xl border border-[#EAE4D7] bg-[#FAF8F5] p-5 sm:p-6 flex flex-col justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-2 text-sm font-black text-[#1A1612] mb-1">
              <ShieldCheck className="w-4 h-4 text-[#B88E4F]" />
              <span>Thanh toán đơn hàng bằng số dư ví</span>
            </div>
            <p className="text-xs text-[#7D715E] mb-3 leading-relaxed">
              Nhập mã đơn hàng chưa thanh toán để trừ trực tiếp từ số dư ví khách hàng hoặc thanh toán ngay qua cổng PayOS.
            </p>

            <label htmlFor="customer-wallet-order-id" className="block text-xs font-bold text-[#1A1612] mb-1.5">
              Mã đơn hàng (Order ID / Code)
            </label>
            <input
              id="customer-wallet-order-id"
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="VD: ord_12345678 hoặc mã đơn mua"
              className="w-full bg-white border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-sm font-bold text-[#1A1612] focus:border-[#C59B58] outline-none transition"
              required
            />
            <p className="text-[11px] text-[#7D715E] mt-1.5">
              💡 Bạn có thể sao chép mã đơn từ mục <strong>Đơn mua của tôi</strong> ở thanh menu bên trái.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              type="submit"
              disabled={busy || loading || !orderId.trim() || wallet?.status !== 'ACTIVE'}
              className="flex-1 py-3 rounded-xl bg-[#EBD08C] hover:bg-[#DEC07A] text-[#231D15] text-xs font-black shadow-xs transition cursor-pointer disabled:opacity-50 text-center"
            >
              Thanh toán bằng ví
            </button>
            <button
              type="button"
              onClick={handlePayViaPayos}
              disabled={busy || loading || !orderId.trim() || !capabilities?.paymentAvailable}
              className="flex-1 py-3 rounded-xl border border-[#EAE4D7] bg-white hover:bg-[#F3EFE6] text-[#1A1612] text-xs font-bold transition cursor-pointer disabled:opacity-50 text-center"
            >
              Thanh toán qua PayOS
            </button>
          </div>
        </form>
      </div>

      {/* ── Transaction & Payment History ── */}
      <div className="pt-4 border-t border-[#EAE4D7]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3.5">
          {/* Main Segmented Switcher */}
          <div className="inline-flex items-center bg-[#F4EFE6] p-1 rounded-xl border border-[#E5DEC9] shrink-0 self-start">
            <button
              type="button"
              onClick={() => setActiveHistoryTab('payments')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeHistoryTab === 'payments'
                  ? 'bg-white text-[#1A1612] shadow-xs'
                  : 'text-[#7D715E] hover:text-[#1A1612]'
              }`}
            >
              <span>💳 Nạp &amp; Thanh toán</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveHistoryTab('ledger')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeHistoryTab === 'ledger'
                  ? 'bg-white text-[#1A1612] shadow-xs'
                  : 'text-[#7D715E] hover:text-[#1A1612]'
              }`}
            >
              <span>📊 Biến động số dư</span>
              {ledger?.total ? (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-600 text-white font-extrabold leading-none">
                  {ledger.total}
                </span>
              ) : null}
            </button>
          </div>

          {/* Sub-filter for payment status */}
          {activeHistoryTab === 'payments' && (
            <div className="flex items-center gap-1 overflow-x-auto py-0.5">
              {(
                [
                  { id: 'ALL', label: 'Tất cả' },
                  { id: 'SUCCESS', label: 'Thành công' },
                  { id: 'PROCESSING', label: 'Chờ quét mã' },
                  { id: 'CANCELLED', label: 'Đã hủy' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setPaymentStatusFilter(tab.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer whitespace-nowrap ${
                    paymentStatusFilter === tab.id
                      ? 'bg-[#1A1612] text-white font-bold shadow-2xs'
                      : 'bg-[#FAF8F5] border border-[#EAE4D7] text-[#7D715E] hover:bg-[#F3EFE6] hover:text-[#1A1612]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tab 1: Payments list */}
        {activeHistoryTab === 'payments' && (
          <div className="space-y-3">
            {/* Informational clarification banner */}
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-50/90 border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Giải thích về các mục có nhãn [Đang xử lý]:</strong> Đây là các yêu cầu nạp tiền hoặc đơn hàng bạn đã bấm tạo (hệ thống sinh mã QR PayOS chờ bạn quét mã chuyển khoản).
                Ví của bạn <strong>hoàn toàn chưa bị trừ hay cộng tiền</strong> cho đến khi bạn hoàn tất chuyển tiền và trạng thái chuyển sang <strong>[Thành công]</strong>.
                Nếu không có nhu cầu thanh toán nữa, bạn có thể bấm <strong>Hủy yêu cầu</strong> bên dưới.
              </div>
            </div>

            {filteredPayments.length > 0 ? (
              <div className="divide-y divide-[#EAE4D7] border border-[#EAE4D7] rounded-2xl overflow-hidden bg-[#FAF8F5]">
                {filteredPayments.map((row) => {
                  const isProcessing =
                    row.status === 'PROCESSING' || row.status === 'REQUESTED' || row.status === 'PENDING';
                  const isSuccess = row.status === 'SUCCESS';

                  return (
                    <div
                      key={row.paymentId}
                      className="p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-[#FAF8F5] transition"
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-sm font-black text-[#1A1612]">
                            {money(row.amountVnd)}
                          </strong>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FBF5EB] border border-[#EAE4D7] text-[#B88E4F] font-bold">
                            {row.purpose === 'TOP_UP' ? 'Nạp tiền vào ví' : 'Thanh toán đơn'}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                              isSuccess
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : row.status === 'CANCELLED' || row.status === 'FAILED'
                                ? 'bg-gray-100 text-gray-500 border border-gray-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {statusLabels[row.status] || row.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#7D715E] mt-1 m-0 flex items-center gap-2">
                          <Clock className="w-3 h-3" />
                          <span>Mã giao dịch: {row.paymentId}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        {/* If pending/processing, allow user to resume pay or cancel */}
                        {isProcessing && (
                          <>
                            <a
                              href={row.checkoutUrl || `/payment/payos-return?payment=${row.paymentId}`}
                              className="px-3 py-1.5 rounded-lg bg-[#EBD08C] hover:bg-[#DEC07A] text-[11px] font-black text-[#231D15] flex items-center gap-1.5 transition shadow-2xs"
                            >
                              <QrCode className="w-3 h-3" />
                              <span>Quét mã QR</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => handleCancelPayment(row.paymentId)}
                              disabled={busy}
                              className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-[11px] font-bold text-rose-700 flex items-center gap-1 transition cursor-pointer"
                            >
                              <XCircle className="w-3 h-3" />
                              <span>Hủy</span>
                            </button>
                          </>
                        )}

                        <a
                          href={`/payment/payos-return?payment=${row.paymentId}`}
                          className="px-3 py-1.5 rounded-lg border border-[#EAE4D7] bg-white hover:bg-[#FAF8F5] text-[11px] font-bold text-[#7D715E] hover:text-[#1A1612] flex items-center gap-1.5 transition"
                        >
                          <span>Chi tiết</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-10 text-center rounded-2xl border border-[#EAE4D7] bg-[#FAF8F5]">
                <Clock className="w-8 h-8 text-[#7D715E]/50 mx-auto mb-2" />
                <p className="text-xs text-[#7D715E] font-medium m-0">
                  {paymentStatusFilter === 'SUCCESS'
                    ? 'Chưa có giao dịch nạp tiền hoặc thanh toán thành công nào.'
                    : 'Không có giao dịch nào phù hợp với bộ lọc.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Ledger entries */}
        {activeHistoryTab === 'ledger' && (
          <div className="border border-[#EAE4D7] rounded-2xl overflow-hidden bg-white">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-[#EAE4D7] text-[#7D715E] uppercase font-bold tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Thời gian</th>
                    <th className="px-4 py-3">Loại giao dịch</th>
                    <th className="px-4 py-3">Biến động</th>
                    <th className="px-4 py-3">Số dư sau GD</th>
                    <th className="px-4 py-3">Tham chiếu</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4D7]">
                  {ledger?.items && ledger.items.length > 0 ? (
                    ledger.items.map((entry) => (
                      <tr key={entry.transactionId} className="hover:bg-[#FAF8F5] transition">
                        <td className="px-4 py-3 whitespace-nowrap text-[#7D715E]">
                          {when(entry.createdAt)}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#1A1612]">
                          {typeLabels[entry.type] || entry.type}
                        </td>
                        <td className="px-4 py-3 font-bold whitespace-nowrap">
                          <span className={entry.direction === 'CREDIT' ? 'text-emerald-600' : 'text-rose-600'}>
                            {entry.direction === 'CREDIT' ? '+' : '-'} {money(entry.amountVnd)}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-[#1A1612]">
                          {money(entry.balanceAfterVnd)}
                        </td>
                        <td className="px-4 py-3 text-[11px] text-[#7D715E] break-all max-w-[200px]">
                          {entry.referenceType}: {entry.referenceId}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-[#7D715E]">
                        Chưa có biến động số dư ví nào (Số dư thực tế vẫn là 0 ₫).
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination controls */}
            {ledger && ledger.total > 20 && (
              <div className="p-3 border-t border-[#EAE4D7] flex items-center justify-between text-xs text-[#7D715E]">
                <span>Trang {ledgerPage + 1} / {Math.ceil(ledger.total / 20)}</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={ledgerPage === 0 || busy || loading}
                    onClick={() => setLedgerPage((p) => Math.max(0, p - 1))}
                    className="p-1.5 rounded-lg border border-[#EAE4D7] disabled:opacity-40"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={(ledgerPage + 1) * 20 >= ledger.total || busy || loading}
                    onClick={() => setLedgerPage((p) => p + 1)}
                    className="p-1.5 rounded-lg border border-[#EAE4D7] disabled:opacity-40"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
