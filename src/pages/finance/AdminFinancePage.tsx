import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import {
  Wallet,
  ArrowDownToLine,
  RefreshCw,
  Calendar,
  RotateCcw,
  AlertCircle,
  CheckCircle2,
  Coins,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  CreditCard,
  Scale,
  Zap,
  Info,
  Sparkles,
  Landmark,
} from 'lucide-react';
import {
  financeService,
  type MoneyBank,
  type MoneyFee,
  type MoneyPage,
  type MoneySettlement,
  type MoneyWithdrawal,
  type PendingFinanceEvents,
  type MoneyWallet,
  type MoneyPayment,
  type OwnerType,
  type FinanceSourceOrder,
} from '../../services/finance.service';
import { money, when, statusLabels, amountVnd } from './money';
import { SettlementDetail } from './SettlementPage';
import { usesLegacyCheckout } from '../../services/checkout.service';
import { CustomDateTimePicker } from '../../components/ui/CustomDateTimePicker';

type Tab =
  | 'withdrawals'
  | 'banks'
  | 'settlements'
  | 'fees'
  | 'operations'
  | 'events'
  | 'wallets'
  | 'payments'
  | 'calendar';

export default function AdminFinancePage() {
  const [tab, setTab] = useState<Tab>('withdrawals');
  const [page, setPage] = useState(0);
  const [sourceOrders, setSourceOrders] = useState<FinanceSourceOrder[]>([]);
  const [closedDays, setClosedDays] = useState<{ date: string; reason: string }[]>([]);
  const [closedDate, setClosedDate] = useState('');
  const [closureReason, setClosureReason] = useState('');
  const [withdrawals, setWithdrawals] = useState<MoneyPage<MoneyWithdrawal> | null>(null);
  const [banks, setBanks] = useState<MoneyBank[]>([]);
  const [settlements, setSettlements] = useState<MoneyPage<MoneySettlement> | null>(null);
  const [fees, setFees] = useState<MoneyFee[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);

  // Operations & Forms
  const [reference, setReference] = useState('');
  const [operation, setOperation] = useState('refund');
  const [reason, setReason] = useState('');
  const [showManualForm, setShowManualForm] = useState(false);
  const [withdrawalFilter, setWithdrawalFilter] = useState<string>('ALL');

  // Fee configuration
  const [feeType, setFeeType] = useState('PLATFORM_FEE');
  const [calculation, setCalculation] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [rate, setRate] = useState('');
  const [minimum, setMinimum] = useState('');
  const [maximum, setMaximum] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [editingFee, setEditingFee] = useState('');

  // Events & Wallets
  const [events, setEvents] = useState<PendingFinanceEvents | null>(null);
  const [payments, setPayments] = useState<MoneyPage<MoneyPayment> | null>(null);
  const [walletRows, setWalletRows] = useState<MoneyPage<MoneyWallet> | null>(null);
  const [platformWallet, setPlatformWallet] = useState<MoneyWallet | null>(null);
  const [ownerFilter, setOwnerFilter] = useState<OwnerType | ''>('');
  const [ownerReference, setOwnerReference] = useState('');
  const [inspectedWallet, setInspectedWallet] = useState<MoneyWallet | null>(null);

  const load = useCallback(async () => {
    setError('');
    try {
      // Always load platform wallet for top banner
      financeService.wallet('PLATFORM').then(setPlatformWallet).catch(() => null);

      if (tab === 'withdrawals') {
        const res = await financeService.withdrawals(undefined, page);
        setWithdrawals(res);
      }
      if (tab === 'banks') {
        const res = await financeService.banks();
        setBanks(res);
      }
      if (tab === 'settlements') {
        const res = await financeService.settlements(undefined, page);
        setSettlements(res);
      }
      if (tab === 'fees') {
        const res = await financeService.fees();
        setFees(res);
      }
      if (tab === 'calendar') {
        const res = await financeService.bankCalendar();
        setClosedDays(res);
      }
      if (usesLegacyCheckout) {
        financeService.sourceOrders().then(setSourceOrders).catch(() => []);
      }
      if (tab === 'events') {
        const res = await financeService.events(page);
        setEvents(res);
      }
      if (tab === 'payments') {
        const res = await financeService.payments(page);
        setPayments(res);
      }
      if (tab === 'wallets') {
        const [rows, platform] = await Promise.all([
          financeService.wallets(page, ownerFilter || undefined, ownerReference || undefined),
          financeService.wallet('PLATFORM'),
        ]);
        setWalletRows(rows);
        setPlatformWallet(platform);
      }
    } catch (e: any) {
      setError(e instanceof Error ? e.message : 'Không thể tải dữ liệu tài chính');
    }
  }, [tab, page, ownerFilter, ownerReference]);

  useEffect(() => {
    void load();
  }, [load]);

  const run = async (work: () => Promise<unknown>, message: string) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await work();
      setSuccess(message);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Không thể thực hiện thao tác');
    } finally {
      setBusy(false);
      inFlight.current = false;
    }
  };

  const submitFee = (e: FormEvent) => {
    e.preventDefault();
    void run(async () => {
      const percent = calculation === 'PERCENTAGE' ? Number(rate) : null;
      if (
        percent !== null &&
        (!Number.isFinite(percent) || percent < 0 || percent > 100 || !rate.trim())
      ) {
        throw new Error('Tỷ lệ phí phải từ 0 đến 100%.');
      }
      const optionalAmount = (value: string) =>
        value.trim() ? (value.trim() === '0' ? 0 : amountVnd(value)) : null;
      const input: Omit<MoneyFee, 'feeConfigId'> = {
        feeType,
        calculationType: calculation,
        ratePercent: percent,
        fixedAmountVnd: calculation === 'FIXED' ? optionalAmount(rate) : null,
        minFeeVnd: optionalAmount(minimum),
        maxFeeVnd: optionalAmount(maximum),
        validFrom: new Date(from).toISOString(),
        validTo: to ? new Date(to).toISOString() : null,
        status: 'DRAFT',
      };
      const result = await (editingFee
        ? financeService.updateFee(editingFee, input)
        : financeService.createFee(input));
      setEditingFee('');
      return result;
    }, 'Đã lưu cấu hình phí thành công. Kích hoạt để áp dụng ngay vào sàn.');
  };

  const pendingRefundOrders = sourceOrders.filter(
    (o) =>
      o.returnRequestId &&
      (o.returnStatus === 'SHOP_APPROVED' || o.returnStatus === 'REQUESTED')
  );

  const filteredWithdrawals = (withdrawals?.items || []).filter((w) => {
    if (withdrawalFilter === 'ALL') return true;
    return w.status === withdrawalFilter;
  });

  return (
    <div className="space-y-6 text-[#1A1612] max-w-[1480px] mx-auto pb-12">
      {/* 1. TOP HEADER & SYSTEM BANNER */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 bg-white border border-[#EAE4D7] rounded-3xl p-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5EB] border border-[#EAE4D7] text-xs font-bold text-[#B88E4F]">
              <Sparkles className="w-3.5 h-3.5 text-[#C59B58]" />
              Trung Tâm Quản Trị Tài Chính SCANMS Core
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[11px] font-semibold text-emerald-700">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Dịch vụ tài chính hoạt động tốt
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1A1612] tracking-tight m-0">
            Quản Lý Tài Chính & Quyết Toán Toàn Sàn
          </h1>
          <p className="text-xs sm:text-sm text-[#7D715E] mt-1 m-0 max-w-3xl">
            Giám sát ví tiền sàn, duyệt lệnh rút tiền cho Shop & KOL, đối chiếu tài khoản ngân hàng, cấu hình biểu phí và quyết toán doanh thu tự động.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            disabled={busy}
            onClick={() => void run(load, 'Đã cập nhật toàn bộ số liệu tài chính mới nhất')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-bold text-[#1A1612] hover:bg-[#F3EFE6] hover:border-[#C59B58] transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#B88E4F] ${busy ? 'animate-spin' : ''}`} />
            <span>{busy ? 'Đang tải...' : 'Làm mới dữ liệu'}</span>
          </button>
        </div>
      </div>

      {/* 2. STATS SUMMARY KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Platform Available Balance */}
        <div className="p-5 bg-white border border-[#EAE4D7] rounded-2xl shadow-2xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7D715E]">Ví Nền Tảng (Khả dụng)</span>
            <div className="w-9 h-9 rounded-xl bg-[#FAF5EB] border border-[#EAE4D7] text-[#C59B58] grid place-items-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-[#1A1612] tracking-tight block">
              {platformWallet ? money(platformWallet.availableBalanceVnd) : '0 ₫'}
            </span>
            <span className="text-[11px] text-[#7D715E] mt-1 block font-medium">
              Đang giữ ký quỹ:{' '}
              <strong className="text-[#B88E4F]">
                {platformWallet ? money(platformWallet.heldBalanceVnd) : '0 ₫'}
              </strong>
            </span>
          </div>
        </div>

        {/* Card 2: Withdrawals Queue */}
        <div className="p-5 bg-white border border-[#EAE4D7] rounded-2xl shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7D715E]">Yêu Cầu Rút Tiền</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200 text-amber-600 grid place-items-center">
              <ArrowDownToLine className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-700 tracking-tight block">
              {withdrawals?.total || withdrawals?.items?.length || 0}
            </span>
            <span className="text-[11px] text-[#7D715E] mt-1 block">
              Lệnh rút từ Shop & CTV đang trong hệ thống
            </span>
          </div>
        </div>

        {/* Card 3: Bank Accounts */}
        <div className="p-5 bg-white border border-[#EAE4D7] rounded-2xl shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7D715E]">Tài Khoản Ngân Hàng</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 grid place-items-center">
              <Landmark className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-[#1A1612] tracking-tight block">
              {banks.length}
            </span>
            <span className="text-[11px] text-[#7D715E] mt-1 block">
              Số tài khoản ngân hàng liên kết trong hệ thống
            </span>
          </div>
        </div>

        {/* Card 4: Sync & Pending Events */}
        <div className="p-5 bg-white border border-[#EAE4D7] rounded-2xl shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7D715E]">Sự Kiện Đồng Bộ</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 border border-purple-200 text-purple-600 grid place-items-center">
              <RotateCcw className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-purple-700 tracking-tight block">
              {events?.total ?? 0}
            </span>
            <span className="text-[11px] text-[#7D715E] mt-1 block">
              Sự kiện thanh toán / hoàn tiền đang hàng đợi
            </span>
          </div>
        </div>
      </div>

      {/* 3. ALERTS & NOTICES */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-semibold">{error}</div>
          <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-semibold">{success}</div>
          <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. MODERN NAVIGATION TABS */}
      <div className="bg-white border border-[#EAE4D7] rounded-2xl p-2 shadow-2xs overflow-x-auto">
        <div className="flex items-center gap-1.5 min-w-max">
          {[
            { id: 'withdrawals', label: 'Duyệt Rút Tiền', icon: ArrowDownToLine },
            { id: 'banks', label: 'Xác Minh Ngân Hàng', icon: Landmark },
            { id: 'settlements', label: 'Đối Soát Shop', icon: Scale },
            { id: 'fees', label: 'Cấu Hình Biểu Phí', icon: SlidersHorizontal },
            {
              id: 'operations',
              label: 'Hoàn Tiền & Hoa Hồng',
              icon: RefreshCw,
              badge: pendingRefundOrders.length > 0 ? pendingRefundOrders.length : undefined,
            },
            { id: 'wallets', label: 'Quản Lý Số Dư Ví', icon: Coins },
            { id: 'payments', label: 'Giao Dịch PayOS', icon: CreditCard },
            { id: 'events', label: 'Hàng Đợi Dịch Vụ', icon: Zap },
            { id: 'calendar', label: 'Lịch Nghỉ Ngân Hàng', icon: Calendar },
          ].map((item) => {
            const active = tab === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setTab(item.id as Tab);
                  setPage(0);
                  setSuccess('');
                  setError('');
                }}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  active
                    ? 'bg-[#C59B58] text-white shadow-2xs font-extrabold'
                    : 'text-[#7D715E] hover:text-[#1A1612] hover:bg-[#FAF8F5]'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-[#7D715E]'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. TAB MAIN PANELS */}

      {/* TAB 1: RÚT TIỀN (WITHDRAWALS) */}
      {tab === 'withdrawals' && (
        <div className="space-y-4">
          {/* Notice Banner to distinguish Withdrawals from Refunds */}
          <div className="bg-[#FAF5EB] border border-[#EAE4D7] rounded-2xl p-4 text-xs text-[#7D715E] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-2xs">
            <div className="flex items-center gap-2.5">
              <Info className="w-5 h-5 text-[#C59B58] shrink-0" />
              <div>
                <strong className="text-[#1A1612]">Lưu ý quan trọng:</strong>
                <span className="block sm:inline sm:ml-1">
                  Tab <strong>Duyệt Rút Tiền</strong> dùng để xử lý yêu cầu rút số dư từ ví về tài khoản ngân hàng của Shop & KOL. Nếu bạn cần xử lý <strong>Đơn hàng yêu cầu hoàn tiền / đổi trả</strong> (Shop đã duyệt), vui lòng chuyển sang tab <strong>Hoàn Tiền & Hoa Hồng</strong>.
                </span>
              </div>
            </div>
            <button
              onClick={() => setTab('operations')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white font-bold transition shadow-xs shrink-0 cursor-pointer text-xs"
            >
              <span>Xem Đơn Chờ Hoàn Tiền</span>
              {pendingRefundOrders.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-white text-[#B88E4F] text-[10px] font-black">
                  {pendingRefundOrders.length}
                </span>
              )}
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
          {/* Action & Filter Toolbar */}
          <div className="bg-white border border-[#EAE4D7] rounded-2xl p-4 shadow-2xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'REQUESTED', label: 'Chờ duyệt' },
                { id: 'APPROVED', label: 'Đã duyệt' },
                { id: 'PROCESSING', label: 'Đang chuyển' },
                { id: 'SUCCESS', label: 'Thành công' },
                { id: 'REJECTED', label: 'Từ chối' },
              ].map((filter) => {
                const isSelected = withdrawalFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => setWithdrawalFilter(filter.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      isSelected
                        ? 'bg-[#EBD08C] text-white shadow-2xs'
                        : 'bg-[#FAF8F5] text-[#7D715E] hover:text-[#1A1612] hover:bg-[#F3EFE6]'
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 flex-1 max-w-md">
              <input
                type="text"
                placeholder="Nhập lý do (bắt buộc khi bấm Từ chối lệnh rút)..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                maxLength={250}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-[#1A1612] outline-none focus:border-[#C59B58] focus:bg-white transition placeholder:text-[#A69986]"
              />
            </div>
          </div>

          {/* Withdrawals List or Rich Empty State */}
          {filteredWithdrawals.length === 0 ? (
            <div className="bg-white border border-[#EAE4D7] rounded-3xl p-12 text-center flex flex-col items-center justify-center shadow-xs">
              <div className="w-16 h-16 rounded-2xl bg-[#FAF5EB] border border-[#EAE4D7] text-[#C59B58] grid place-items-center mb-4 shadow-2xs">
                <ArrowDownToLine className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-[#1A1612] tracking-tight">
                Chưa Có Yêu Cầu Rút Tiền Nào
              </h3>
              <p className="text-xs sm:text-sm text-[#7D715E] mt-1 max-w-md">
                Hiện tại tất cả các yêu cầu rút tiền từ Chủ Gian Hàng và Đối Tác KOL đã được giải quyết xong, hoặc chưa có yêu cầu mới nào phát sinh.
              </p>
              <div className="flex items-center gap-3 mt-6">
                <button
                  disabled={busy}
                  onClick={() => void run(load, 'Đã làm mới dữ liệu')}
                  className="px-4 py-2 rounded-xl bg-[#C59B58] text-white text-xs font-bold hover:bg-[#B88E4F] transition shadow-xs cursor-pointer"
                >
                  Kiểm tra lại
                </button>
                <button
                  onClick={() => setTab('wallets')}
                  className="px-4 py-2 rounded-xl border border-[#EAE4D7] bg-white text-xs font-bold text-[#1A1612] hover:bg-[#FAF8F5] transition cursor-pointer"
                >
                  Tra cứu số dư ví
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredWithdrawals.map((row) => (
                <div
                  key={row.withdrawalId}
                  className="bg-white border border-[#EAE4D7] rounded-2xl p-5 shadow-2xs hover:border-[#C59B58]/50 transition space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#EAE4D7] pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 grid place-items-center">
                        <ArrowDownToLine className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="text-xs font-mono font-bold text-[#7D715E]">
                          Mã lệnh: #{row.withdrawalId}
                        </div>
                        <div className="text-lg font-black text-[#1A1612]">
                          {money(row.amountVnd)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FAF5EB] border border-[#EAE4D7] text-[#B88E4F]">
                        {statusLabels[row.status] || row.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#7D715E]">
                    <div>
                      <span className="block font-medium text-[#A69986]">Phí dịch vụ</span>
                      <strong className="text-[#1A1612] font-semibold">{money(row.feeVnd)}</strong>
                    </div>
                    <div>
                      <span className="block font-medium text-[#A69986]">Thực nhận về bank</span>
                      <strong className="text-emerald-700 font-bold">{money(row.netAmountVnd)}</strong>
                    </div>
                    <div>
                      <span className="block font-medium text-[#A69986]">Ngày tạo lệnh</span>
                      <span className="text-[#1A1612]">{when(row.requestedAt)}</span>
                    </div>
                    <div>
                      <span className="block font-medium text-[#A69986]">Lịch hẹn chuyển</span>
                      <span className="text-[#1A1612]">{when(row.scheduledFor)}</span>
                    </div>
                  </div>

                  {row.failureReason && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
                      <strong>Lỗi xử lý trước:</strong> {row.failureReason}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-[#EAE4D7]">
                    {row.status === 'REQUESTED' && (
                      <button
                        disabled={busy}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                        onClick={() =>
                          void run(
                            () => financeService.withdrawalAction(row.withdrawalId, 'approve'),
                            'Đã duyệt lệnh rút và giữ tiền trong ví an toàn'
                          )
                        }
                      >
                        Duyệt và giữ tiền
                      </button>
                    )}

                    {['REQUESTED', 'APPROVED'].includes(row.status) && (
                      <button
                        disabled={busy || !reason.trim()}
                        className="px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition cursor-pointer disabled:opacity-40"
                        title={!reason.trim() ? 'Hãy nhập lý do từ chối ở ô phía trên' : ''}
                        onClick={() =>
                          void run(
                            () => financeService.withdrawalAction(row.withdrawalId, 'reject', reason),
                            'Đã từ chối lệnh rút tiền và hoàn trả số dư giữ lại ví'
                          )
                        }
                      >
                        Từ chối lệnh
                      </button>
                    )}

                    {row.status === 'APPROVED' && (
                      <button
                        disabled={busy}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                        onClick={() =>
                          void run(
                            () => financeService.withdrawalAction(row.withdrawalId, 'execute'),
                            'Đã gửi lệnh chuyển khoản ngân hàng'
                          )
                        }
                      >
                        Chuyển ngân hàng
                      </button>
                    )}

                    {row.status === 'PROCESSING' && (
                      <button
                        disabled={busy}
                        className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                        onClick={() =>
                          void run(
                            () => financeService.withdrawalAction(row.withdrawalId, 'reconcile'),
                            'Đã đối soát kết quả nhà cung cấp'
                          )
                        }
                      >
                        Đối soát / Retry
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: NGÂN HÀNG (BANK ACCOUNTS) */}
      {tab === 'banks' && (
        <div className="space-y-4">
          <div className="bg-[#FAF5EB] border border-[#EAE4D7] rounded-2xl p-4 text-xs text-[#7D715E] flex items-center gap-3">
            <Info className="w-5 h-5 text-[#C59B58] shrink-0" />
            <span>
              Lưu ý: Chỉ duyệt xác minh tài khoản sau khi đã đối chiếu kỹ thông tin chủ sở hữu CMND/CCCD và thông tin thụ hưởng trên sao kê ngân hàng.
            </span>
          </div>

          {banks.length === 0 ? (
            <div className="bg-white border border-[#EAE4D7] rounded-3xl p-12 text-center flex flex-col items-center justify-center">
              <Landmark className="w-12 h-12 text-[#C59B58] mb-3" />
              <h3 className="text-base font-bold">Chưa Có Tài Khoản Ngân Hàng Nào</h3>
              <p className="text-xs text-[#7D715E] mt-1">
                Các tài khoản ngân hàng liên kết từ Shop và KOL sẽ xuất hiện ở đây khi họ đăng ký rút tiền.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {banks.map((row) => (
                <div
                  key={row.bankAccountId}
                  className="bg-white border border-[#EAE4D7] rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#EAE4D7] text-[#7D715E]">
                        BIN: {row.bankCode}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          row.verificationStatus === 'VERIFIED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : row.verificationStatus === 'REJECTED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {statusLabels[row.verificationStatus] || row.verificationStatus}
                      </span>
                    </div>

                    <div className="mt-3">
                      <h4 className="text-base font-extrabold text-[#1A1612] m-0">
                        {row.holderName}
                      </h4>
                      <p className="text-sm font-mono font-bold text-[#B88E4F] mt-1 m-0">
                        {row.maskedNumber}
                      </p>
                    </div>

                    <div className="text-[11px] text-[#7D715E] mt-2 space-y-0.5">
                      <div>Chủ tài khoản: {row.storeId ? `Shop: ${row.storeId}` : `KOL: ${row.collaboratorId}`}</div>
                      <div>Trạng thái: {row.active ? 'Đang hoạt động' : 'Tạm dừng'}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-3 border-t border-[#EAE4D7]">
                    <button
                      disabled={busy || !row.active || row.verificationStatus === 'VERIFIED'}
                      onClick={() =>
                        void run(
                          () => financeService.verifyBank(row.bankAccountId, 'VERIFIED'),
                          'Đã xác minh tài khoản ngân hàng thành công'
                        )
                      }
                      className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition disabled:opacity-40 cursor-pointer"
                    >
                      Xác minh
                    </button>
                    <button
                      disabled={busy || row.verificationStatus === 'REJECTED'}
                      onClick={() =>
                        void run(
                          () => financeService.verifyBank(row.bankAccountId, 'REJECTED'),
                          'Đã từ chối tài khoản ngân hàng'
                        )
                      }
                      className="flex-1 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition disabled:opacity-40 cursor-pointer"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: ĐỐI SOÁT SHOP (SETTLEMENTS) */}
      {tab === 'settlements' && (
        <div className="space-y-5">
          {/* Compute Settlement Form */}
          <div className="bg-white border border-[#EAE4D7] rounded-2xl p-5 shadow-2xs space-y-3">
            <h3 className="text-base font-black text-[#1A1612] m-0">
              Tính Đối Soát Doanh Thu Đơn Hàng Shop
            </h3>
            <p className="text-xs text-[#7D715E] m-0">
              Đơn hàng chỉ được tính đối soát sau khi trạng thái hoàn tất và đã đóng thời hạn đổi trả hàng hợp lệ.
            </p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void run(
                  () => financeService.computeSettlement(reference.trim()),
                  'Đã tính toán đối soát từ doanh thu đơn hàng và hoa hồng'
                );
              }}
              className="flex flex-col sm:flex-row gap-3 pt-2"
            >
              <input
                aria-label="Mã đơn shop"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Nhập mã đơn shop (SellerOrderId)..."
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-medium text-[#1A1612] outline-none focus:border-[#C59B58] focus:bg-white"
              />
              <button
                disabled={busy}
                className="px-5 py-2.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
              >
                Tính đối soát
              </button>
            </form>
          </div>

          {/* Legacy source orders if available */}
          {usesLegacyCheckout && sourceOrders.length > 0 && (
            <div className="bg-white border border-[#EAE4D7] rounded-2xl p-5 shadow-2xs space-y-3">
              <h4 className="text-sm font-bold text-[#1A1612]">
                Đơn Hàng Sẵn Sàng Đối Soát ({sourceOrders.length})
              </h4>
              <div className="divide-y divide-[#EAE4D7] max-h-60 overflow-y-auto">
                {sourceOrders.map((order) => (
                  <div key={order.orderId} className="py-2.5 flex items-center justify-between text-xs">
                    <div>
                      <strong>#{order.publicOrderCode}</strong> · {order.storeName} · {money(order.amountVnd)}
                      <div className="text-[11px] text-[#7D715E]">
                        Đóng đổi trả: {when(order.returnWindowClosesAt)}
                      </div>
                    </div>
                    <button
                      onClick={() => setReference(order.orderId)}
                      className="px-3 py-1.5 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-bold hover:bg-[#EBD08C] hover:text-white transition"
                    >
                      Chọn đơn này
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Settlements List */}
          {settlements?.items.length === 0 ? (
            <div className="bg-white border border-[#EAE4D7] rounded-3xl p-12 text-center text-xs text-[#7D715E]">
              Chưa có kỳ đối soát nào trong danh sách.
            </div>
          ) : (
            <div className="space-y-4">
              {settlements?.items.map((row) => (
                <div key={row.settlementId} className="space-y-2">
                  <SettlementDetail row={row} />
                  <div className="flex gap-2 justify-end">
                    {row.status !== 'PAID' && (
                      <button
                        disabled={busy}
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition cursor-pointer"
                        onClick={() =>
                          void run(
                            () => financeService.creditSettlement(row.settlementId),
                            'Đã ghi có tiền đối soát vào ví Shop'
                          )
                        }
                      >
                        Ghi có vào ví shop
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CẤU HÌNH PHÍ (FEE RULES) */}
      {tab === 'fees' && (
        <div className="space-y-6">
          <form
            onSubmit={submitFee}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-[#EAE4D7] rounded-3xl p-6 shadow-xs"
          >
            <div className="md:col-span-2">
              <h3 className="text-base font-black text-[#1A1612] m-0">
                {editingFee ? 'Chỉnh Sửa Bản Nháp Biểu Phí' : 'Tạo Cấu Hình Biểu Phí Mới'}
              </h3>
              <p className="text-xs text-[#7D715E] mt-0.5 m-0">
                Phí nền tảng, phí dịch vụ hoặc phí rút tiền được hệ thống tự động trích xuất khi phát sinh giao dịch.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7D715E] mb-1">Loại phí</label>
              <select
                value={feeType}
                onChange={(e) => setFeeType(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-bold text-[#1A1612] outline-none"
              >
                <option value="PLATFORM_FEE">Phí nền tảng sàn (Platform Fee)</option>
                <option value="SERVICE_FEE">Phí dịch vụ xử lý (Service Fee)</option>
                <option value="WITHDRAWAL_FEE">Phí rút tiền ngân hàng (Withdrawal Fee)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7D715E] mb-1">Cách tính</label>
              <select
                value={calculation}
                onChange={(e) => setCalculation(e.target.value as typeof calculation)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-bold text-[#1A1612] outline-none"
              >
                <option value="PERCENTAGE">Theo tỷ lệ phần trăm (%)</option>
                <option value="FIXED">Số tiền cố định (VNĐ)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7D715E] mb-1">
                {calculation === 'PERCENTAGE' ? 'Tỷ lệ phí (%)' : 'Số tiền phí (VNĐ)'}
              </label>
              <input
                required
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder={calculation === 'PERCENTAGE' ? 'Ví dụ: 5' : 'Ví dụ: 10000'}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-medium text-[#1A1612] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-[#7D715E] mb-1">Phí tối thiểu</label>
                <input
                  value={minimum}
                  onChange={(e) => setMinimum(e.target.value)}
                  placeholder="VNĐ (tùy chọn)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-medium text-[#1A1612] outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#7D715E] mb-1">Phí tối đa</label>
                <input
                  value={maximum}
                  onChange={(e) => setMaximum(e.target.value)}
                  placeholder="VNĐ (tùy chọn)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-medium text-[#1A1612] outline-none"
                />
              </div>
            </div>

            <div>
              <CustomDateTimePicker
                label="Hiệu lực từ ngày"
                required
                showTime
                value={from}
                onChange={setFrom}
                placeholder="Chọn ngày & giờ bắt đầu..."
              />
            </div>

            <div>
              <CustomDateTimePicker
                label="Hiệu lực đến ngày"
                showTime
                value={to}
                onChange={setTo}
                placeholder="Chọn ngày & giờ kết thúc (tùy chọn)..."
              />
            </div>

            <div className="md:col-span-2 flex justify-end gap-2 pt-2">
              {editingFee && (
                <button
                  type="button"
                  onClick={() => setEditingFee('')}
                  className="px-4 py-2.5 rounded-xl border border-[#EAE4D7] bg-white text-xs font-bold text-[#7D715E] hover:bg-[#FAF8F5]"
                >
                  Hủy sửa
                </button>
              )}
              <button
                disabled={busy}
                className="px-6 py-2.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Lưu cấu hình phí
              </button>
            </div>
          </form>

          {/* Current Fees List */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-[#1A1612]">Danh Sách Biểu Phí Hệ Thống ({fees.length})</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fees.map((row) => (
                <div
                  key={row.feeConfigId}
                  className="bg-white border border-[#EAE4D7] rounded-2xl p-5 shadow-2xs space-y-3 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-[#B88E4F]">
                      {row.feeType}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                        row.status === 'ACTIVE'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}
                    >
                      {row.status === 'ACTIVE' ? 'Đang áp dụng' : row.status}
                    </span>
                  </div>

                  <div>
                    <strong className="text-lg font-black text-[#1A1612]">
                      {row.calculationType === 'PERCENTAGE'
                        ? `${row.ratePercent}%`
                        : money(row.fixedAmountVnd || 0)}
                    </strong>
                    <div className="text-[11px] text-[#7D715E] mt-1 space-y-0.5">
                      <div>Thời gian: {when(row.validFrom)} → {row.validTo ? when(row.validTo) : 'Vô thời hạn'}</div>
                      <div>Giới hạn: Min {row.minFeeVnd ? money(row.minFeeVnd) : '0 ₫'} · Max {row.maxFeeVnd ? money(row.maxFeeVnd) : 'Không giới hạn'}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE4D7]">
                    <button
                      disabled={busy}
                      onClick={() =>
                        void run(
                          () =>
                            financeService.feeStatus(
                              row.feeConfigId,
                              row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'
                            ),
                          'Đã cập nhật trạng thái biểu phí'
                        )
                      }
                      className="px-3.5 py-1.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-bold hover:bg-[#F3EFE6] transition"
                    >
                      {row.status === 'ACTIVE' ? 'Ngừng áp dụng' : 'Kích hoạt'}
                    </button>
                    {row.status === 'DRAFT' && (
                      <button
                        onClick={() => {
                          setEditingFee(row.feeConfigId);
                          setFeeType(row.feeType);
                          setCalculation(row.calculationType);
                          setRate(String(row.ratePercent ?? row.fixedAmountVnd ?? ''));
                          setMinimum(row.minFeeVnd === null ? '' : String(row.minFeeVnd));
                          setMaximum(row.maxFeeVnd === null ? '' : String(row.maxFeeVnd));
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-[#C59B58] text-white text-xs font-bold hover:bg-[#B88E4F] transition"
                      >
                        Sửa
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: HOÀN TIỀN & HOA HỒNG (OPERATIONS) */}
      {tab === 'operations' && (
        <div className="space-y-6">
          {/* Danh Sách Đơn Hàng Chờ Hoàn Tiền */}
          <div className="bg-white border border-[#EAE4D7] rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#EAE4D7] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-[#1A1612] tracking-tight m-0">
                    Đơn Hàng Chờ Hoàn Tiền Về Ví Khách ({pendingRefundOrders.length})
                  </h3>
                  {pendingRefundOrders.length > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-pulse">
                      Cần xử lý
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#7D715E] mt-1 m-0">
                  Các đơn hàng khách yêu cầu trả hàng và Shop đã duyệt (HOÀN TIỀN LẠI). Quản trị viên chỉ cần bấm nút để hệ thống tự động hoàn tiền vào ví khách.
                </p>
              </div>
            </div>

            {pendingRefundOrders.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#7D715E]">
                Hiện tại không có đơn hàng nào đang chờ hoàn tiền.
              </div>
            ) : (
              <div className="divide-y divide-[#EAE4D7]">
                {pendingRefundOrders.map((order) => (
                  <div
                    key={order.orderId}
                    className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <strong className="text-base font-black text-[#1A1612]">
                          #{order.publicOrderCode}
                        </strong>
                        <span className="px-2.5 py-0.5 rounded-md bg-[#FAF8F5] border border-[#EAE4D7] text-xs font-bold text-[#7D715E]">
                          🏪 {order.storeName}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                          Shop đã duyệt: {order.returnStatus || 'HOÀN TIỀN LẠI'}
                        </span>
                      </div>
                      <div className="text-xs text-[#7D715E]">
                        Số tiền cần hoàn trả: <strong className="text-base font-black text-rose-600">{money(order.amountVnd)}</strong>
                      </div>
                      <div className="text-[11px] font-mono text-[#A69986] flex items-center gap-2 flex-wrap pt-1">
                        <span>Mã kỹ thuật: <code className="text-[#7D715E] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#EAE4D7] font-semibold">{order.returnRequestId}</code></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        disabled={busy}
                        onClick={() =>
                          void run(
                            () => financeService.refund(order.returnRequestId!),
                            `Đã hoàn tiền ${money(order.amountVnd)} thành công vào ví của khách hàng!`
                          )
                        }
                        className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        Hoàn Tiền {money(order.amountVnd)} Vào Ví Khách
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Manual Tech Form (Collapsed by default so Admin doesn't get confused) */}
          <div className="border border-dashed border-[#EAE4D7] rounded-2xl p-4 max-w-2xl mx-auto bg-[#FAF8F5]/60">
            <button
              type="button"
              onClick={() => setShowManualForm(!showManualForm)}
              className="w-full flex items-center justify-between text-xs font-bold text-[#7D715E] hover:text-[#1A1612] cursor-pointer"
            >
              <span>⚙️ Công cụ xử lý ngoại lệ bằng mã kỹ thuật (Dự phòng cho IT)</span>
              <span className="text-[11px] font-bold text-[#C59B58]">{showManualForm ? '▲ Thu gọn' : '▼ Mở rộng'}</span>
            </button>

            {showManualForm && (
              <div className="pt-4 mt-3 border-t border-[#EAE4D7] space-y-4">
                <div>
                  <h3 className="text-sm font-black text-[#1A1612] m-0">
                    Xử Lý Thủ Công & Ghi Có Hoa Hồng
                  </h3>
                  <p className="text-[11px] text-[#7D715E] mt-1 m-0">
                    Chỉ sử dụng khi kỹ thuật viên cần ghi có hoặc hoàn tiền cho một mã ngoại lệ ngoài danh sách tự động trên.
                  </p>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    void run(
                      () =>
                        operation === 'refund'
                          ? financeService.refund(reference.trim())
                          : financeService.creditCommission(reference.trim()),
                      'Đã ghi nhận số dư vào ví thành công'
                    );
                  }}
                  className="space-y-4 pt-2"
                >
                  <div>
                    <label className="block text-xs font-bold text-[#7D715E] mb-1">Nghiệp vụ</label>
                    <select
                      value={operation}
                      onChange={(e) => setOperation(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EAE4D7] bg-white text-xs font-bold text-[#1A1612] outline-none"
                    >
                      <option value="refund">Hoàn tiền khách hàng (Refund to Customer)</option>
                      <option value="commission">Ghi có hoa hồng KOL (Credit Commission)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#7D715E] mb-1">
                      {operation === 'refund' ? 'Mã yêu cầu hoàn tiền (ReturnRequestId)' : 'Mã hoa hồng (CommissionId)'}
                    </label>
                    <input
                      required
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder="Nhập mã tham chiếu từ hệ thống..."
                      className="w-full px-4 py-2.5 rounded-xl border border-[#EAE4D7] bg-white text-xs font-medium text-[#1A1612] outline-none focus:border-[#C59B58]"
                    />
                  </div>

                  <button
                    disabled={busy}
                    className="w-full py-3 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                  >
                    Kiểm tra & Ghi có vào ví
                  </button>
                </form>
              </div>
            )}
          </div>
      </div>
    )}

      {/* TAB 6: QUẢN LÝ VÍ (WALLETS) */}
      {tab === 'wallets' && (
        <div className="space-y-5">
          {/* Search by owner */}
          <div className="bg-white border border-[#EAE4D7] rounded-2xl p-4 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-[#7D715E] mb-1">Loại chủ ví</label>
              <select
                className="w-full px-3 py-2 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-bold text-[#1A1612]"
                value={ownerFilter}
                onChange={(e) => {
                  setOwnerFilter(e.target.value as OwnerType | '');
                  setPage(0);
                }}
              >
                <option value="">Tất cả loại chủ ví</option>
                {(['CUSTOMER', 'STORE', 'COLLABORATOR', 'PLATFORM'] as OwnerType[]).map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#7D715E] mb-1">Mã tham chiếu chủ ví</label>
              <input
                placeholder="OwnerRefId..."
                value={ownerReference}
                onChange={(e) => {
                  setOwnerReference(e.target.value);
                  setPage(0);
                }}
                className="w-full px-3 py-2 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs text-[#1A1612]"
              />
            </div>

            <div className="flex items-end">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void run(async () => {
                    setInspectedWallet(await financeService.walletById(reference.trim()));
                  }, 'Đã tải thông tin ví');
                }}
                className="flex gap-2 w-full"
              >
                <input
                  required
                  placeholder="Tra cứu theo Wallet ID..."
                  value={reference}
                  onChange={(e) => setReference(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs text-[#1A1612]"
                />
                <button className="px-4 py-2 rounded-xl bg-[#C59B58] text-white text-xs font-bold shrink-0">
                  Tìm
                </button>
              </form>
            </div>
          </div>

          {/* Inspected Wallet Card */}
          {inspectedWallet && (
            <div className="bg-white border-2 border-[#C59B58] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-[#B88E4F]">
                    {inspectedWallet.ownerType} · {inspectedWallet.ownerRefId}
                  </span>
                  <h4 className="text-lg font-black text-[#1A1612] m-0">
                    {money(inspectedWallet.availableBalanceVnd)}
                  </h4>
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#FAF5EB] text-[#B88E4F] border border-[#EAE4D7]">
                  {statusLabels[inspectedWallet.status]}
                </span>
              </div>
              <div className="flex gap-2">
                {(['ACTIVE', 'FROZEN', 'CLOSED'] as const).map((status) => (
                  <button
                    key={status}
                    disabled={busy || inspectedWallet.status === status}
                    className="px-3 py-1.5 rounded-xl border border-[#EAE4D7] text-xs font-bold hover:bg-[#FAF8F5] disabled:opacity-40"
                    onClick={() =>
                      void run(async () => {
                        setInspectedWallet(
                          await financeService.walletStatus(inspectedWallet.walletId, status)
                        );
                      }, 'Đã cập nhật trạng thái ví')
                    }
                  >
                    Chuyển sang: {statusLabels[status]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Wallets Table */}
          <div className="bg-white border border-[#EAE4D7] rounded-2xl overflow-hidden shadow-2xs">
            <div className="p-4 border-b border-[#EAE4D7] font-bold text-xs text-[#7D715E]">
              Danh sách Ví Hệ Thống ({walletRows?.total ?? 0})
            </div>
            <div className="divide-y divide-[#EAE4D7]">
              {walletRows?.items.map((row) => (
                <div
                  key={row.walletId}
                  className="p-4 flex items-center justify-between hover:bg-[#FAF8F5] transition text-xs"
                >
                  <div>
                    <strong>{row.ownerType}</strong> · <span className="font-mono text-[#7D715E]">{row.ownerRefId}</span>
                    <div className="text-[11px] text-[#A69986] font-mono mt-0.5">ID: {row.walletId}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm text-[#1A1612]">
                      {money(row.availableBalanceVnd)}
                    </span>
                    <button
                      onClick={() => setInspectedWallet(row)}
                      className="px-3 py-1.5 rounded-xl border border-[#EAE4D7] bg-white text-xs font-bold hover:bg-[#F3EFE6]"
                    >
                      Chi tiết
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: THANH TOÁN (PAYMENTS) */}
      {tab === 'payments' && (
        <div className="space-y-4">
          <div className="divide-y divide-[#EAE4D7] bg-white border border-[#EAE4D7] rounded-2xl shadow-2xs overflow-hidden">
            {payments?.items.map((row) => (
              <div key={row.paymentId} className="p-5 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <div>
                    <strong className="text-base font-black text-[#1A1612]">
                      {money(row.amountVnd)}
                    </strong>
                    <span className="text-[#7D715E] ml-2">Đơn: #{row.orderId || 'Nạp ví'}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FAF5EB] border border-[#EAE4D7] text-[#B88E4F]">
                    {statusLabels[row.status] || row.status}
                  </span>
                </div>
                <div className="text-[#7D715E] font-mono text-[11px]">
                  Mã giao dịch: {row.paymentId} · Đã nhận: {money(row.receivedAmountVnd ?? row.amountVnd)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: SỰ KIỆN HÀNG ĐỢI (EVENTS) */}
      {tab === 'events' && (
        <div className="space-y-4">
          {events && !events.configured && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
              Chưa cấu hình tài khoản dịch vụ. Các sự kiện đang chờ sẽ chưa cập nhật được đơn hàng và hoa hồng.
            </div>
          )}

          <div className="bg-white border border-[#EAE4D7] rounded-2xl p-5 shadow-2xs divide-y divide-[#EAE4D7]">
            {events?.items.map((row) => (
              <div key={row.eventId} className="py-3 flex items-center justify-between text-xs">
                <div>
                  <strong className="font-mono">{row.eventKey}</strong>
                  <div className="text-[#7D715E] mt-0.5">
                    Số lần thử: {row.attempts} · Thử lại: {when(row.nextAttemptAt)}
                  </div>
                </div>
                <button
                  disabled={busy}
                  onClick={() =>
                    void run(() => financeService.retryEvent(row.eventId), 'Đã lên lịch gửi lại sự kiện')
                  }
                  className="px-3 py-1.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-bold hover:bg-[#EBD08C] hover:text-white transition"
                >
                  Thử lại
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 9: LỊCH NGHỈ NGÂN HÀNG (CALENDAR) */}
      {tab === 'calendar' && (
        <div className="space-y-5">
          <div className="bg-white border border-[#EAE4D7] rounded-2xl p-6 shadow-2xs space-y-4">
            <h3 className="text-base font-black text-[#1A1612] m-0">Lịch Nghỉ Ngân Hàng Toàn Quốc</h3>
            <p className="text-xs text-[#7D715E] m-0">
              Thứ Bảy và Chủ Nhật hệ thống tự động hoãn chuyển khoản liên ngân hàng. Thêm các ngày nghỉ lễ, Tết hoặc thông báo đóng cửa giao dịch của ngân hàng Nhà nước để tạm hoãn lệnh rút tiền tự động.
            </p>

            <form
              className="flex flex-col sm:flex-row gap-3 pt-2 items-start sm:items-center"
              onSubmit={(e) => {
                e.preventDefault();
                void run(
                  () => financeService.closeBankDay(closedDate, closureReason),
                  'Đã lưu ngày ngân hàng nghỉ vào lịch hệ thống'
                );
              }}
            >
              <div className="w-full sm:w-56 shrink-0">
                <CustomDateTimePicker
                  ariaLabel="Ngày ngân hàng nghỉ"
                  required
                  showTime={false}
                  value={closedDate}
                  onChange={setClosedDate}
                  placeholder="Chọn ngày nghỉ..."
                />
              </div>
              <input
                aria-label="Lý do ngân hàng nghỉ"
                required
                maxLength={500}
                placeholder="Lý do / Tên kỳ nghỉ lễ (Ví dụ: Tết Nguyên Đán)..."
                value={closureReason}
                onChange={(e) => setClosureReason(e.target.value)}
                className="flex-1 w-full px-3.5 py-2.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-medium text-[#1A1612] outline-none focus:border-[#C59B58]"
              />
              <button
                disabled={busy}
                className="px-5 py-2.5 rounded-xl bg-[#C59B58] text-white text-xs font-bold hover:bg-[#B88E4F] transition shrink-0 cursor-pointer shadow-xs"
              >
                Lưu ngày nghỉ
              </button>
            </form>
          </div>

          <div className="bg-white border border-[#EAE4D7] rounded-2xl p-5 shadow-2xs space-y-2">
            <h4 className="text-sm font-bold text-[#1A1612]">Các Ngày Nghỉ Đã Thiết Lập ({closedDays.length})</h4>
            <div className="divide-y divide-[#EAE4D7]">
              {closedDays.map((day) => (
                <div key={day.date} className="py-2.5 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-[#B88E4F]">{day.date}</span>
                  <span className="text-[#1A1612] font-medium">{day.reason}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. PAGINATION FOOTER */}
      {['withdrawals', 'settlements', 'events', 'payments', 'wallets'].includes(tab) && (
        <div className="flex items-center justify-between p-4 bg-white border border-[#EAE4D7] rounded-2xl shadow-2xs">
          <button
            disabled={!page || busy}
            onClick={() => setPage(page - 1)}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-[#EAE4D7] text-xs font-bold text-[#1A1612] hover:bg-[#FAF8F5] disabled:opacity-40 transition cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Trang trước</span>
          </button>

          <span className="text-xs font-bold text-[#7D715E]">Trang {page + 1}</span>

          <button
            disabled={busy}
            onClick={() => setPage(page + 1)}
            className="inline-flex items-center gap-1 px-4 py-2 rounded-xl border border-[#EAE4D7] text-xs font-bold text-[#1A1612] hover:bg-[#FAF8F5] disabled:opacity-40 transition cursor-pointer"
          >
            <span>Trang sau</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
