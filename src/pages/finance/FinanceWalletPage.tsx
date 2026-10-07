import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useLocation, useSearchParams, useParams } from 'react-router-dom';
import { Wallet, RefreshCw, Landmark, ArrowDownToLine, Plus, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import {
  financeService,
  type MoneyPayment,
  type MoneyWallet,
  type MoneyBank,
  type MoneyLedger,
  type MoneyWithdrawal,
  type MoneyPage,
  type Capabilities,
  type OwnerType,
} from '../../services/finance.service';
import { kycService } from '../../services/kyc.service';
import { checkoutService, usesLegacyCheckout } from '../../services/checkout.service';
import { commandKey, completeCommand } from './commandKey';
import { amountVnd, money, when, statusLabels, typeLabels } from './money';
import { CustomDateTimePicker } from '../../components/ui/CustomDateTimePicker';
import { VietnameseBankPicker, FALLBACK_VIET_BANKS } from '../../components/ui/VietnameseBankPicker';

// Curated list of Vietnamese Banks with standard 6-digit BIN codes
export const VIETNAM_BANKS = [
  { bin: '970422', code: 'MB', name: 'MB Bank', fullName: 'Ngân hàng Quân Đội' },
  { bin: '970436', code: 'VCB', name: 'Vietcombank', fullName: 'Ngoại thương Việt Nam' },
  { bin: '970407', code: 'TCB', name: 'Techcombank', fullName: 'Kỹ thương Việt Nam' },
  { bin: '970415', code: 'CTG', name: 'VietinBank', fullName: 'Công thương Việt Nam' },
  { bin: '970418', code: 'BIDV', name: 'BIDV', fullName: 'Đầu tư & Phát triển VN' },
  { bin: '970416', code: 'ACB', name: 'ACB', fullName: 'Á Châu' },
  { bin: '970432', code: 'VPB', name: 'VPBank', fullName: 'Việt Nam Thịnh Vượng' },
  { bin: '970423', code: 'TPB', name: 'TPBank', fullName: 'Tiên Phong' },
  { bin: '970405', code: 'VBA', name: 'Agribank', fullName: 'Nông nghiệp & PTNT' },
  { bin: '970403', code: 'STB', name: 'Sacombank', fullName: 'Sài Gòn Thương Tín' },
  { bin: '970437', code: 'HDB', name: 'HDBank', fullName: 'Phát triển TP.HCM' },
  { bin: '970441', code: 'VIB', name: 'VIB', fullName: 'Quốc tế' },
  { bin: '970443', code: 'SHB', name: 'SHB', fullName: 'Sài Gòn - Hà Nội' },
  { bin: '970426', code: 'MSB', name: 'MSB', fullName: 'Hàng Hải' },
  { bin: '970448', code: 'OCB', name: 'OCB', fullName: 'Phương Đông' },
  { bin: '970440', code: 'SSB', name: 'SeABank', fullName: 'Đông Nam Á' },
  { bin: '970431', code: 'EIB', name: 'Eximbank', fullName: 'Xuất Nhập Khẩu' },
  { bin: '970449', code: 'LPB', name: 'LPBank', fullName: 'Bưu điện Liên Việt' },
  { bin: '970424', code: 'SHBVN', name: 'Shinhan Bank', fullName: 'Shinhan Việt Nam' },
  { bin: '963388', code: 'TIMO', name: 'Timo', fullName: 'Timo by BanVietBank' },
  { bin: '546034', code: 'CAKE', name: 'Cake', fullName: 'Cake by VPBank' },
];

const field =
  'w-full rounded-xl border border-[#EAE4D7] bg-white text-[#1A1612] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C59B58]';
const button =
  'rounded-xl border border-[#EAE4D7] px-4 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed transition cursor-pointer';

export default function FinanceWalletPage() {
  const location = useLocation();
  const [params, setParams] = useSearchParams();
  const routeParams = useParams();
  const selectedStore =
    params.get('storeId') || routeParams.storeId || localStorage.getItem('current_store_id') || '';
  const ownerType: OwnerType =
    location.pathname.startsWith('/merchant') || location.pathname.startsWith('/stores/')
      ? 'STORE'
      : location.pathname.startsWith('/collaborator')
      ? 'COLLABORATOR'
      : 'CUSTOMER';
  const [storeId, setStoreId] = useState(selectedStore);
  const [stores, setStores] = useState<{ storeId: string; name: string }[]>([]);
  const [ledgerType, setLedgerType] = useState('');
  const [referenceFilter, setReferenceFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [detail, setDetail] = useState<
    (MoneyLedger & { description: string; status: string; completedAt: string }) | null
  >(null);

  useEffect(() => {
    if (ownerType === 'STORE')
      void checkoutService
        .stores()
        .then((list) => {
          setStores(list);
          if (!selectedStore && list.length) setParams({ storeId: list[0].storeId });
        })
        .catch(() => setStores([]));
  }, [ownerType, selectedStore, setParams]);

  const [wallet, setWallet] = useState<MoneyWallet | null>(null);
  const [banks, setBanks] = useState<MoneyBank[]>([]);
  const [ledger, setLedger] = useState<MoneyPage<MoneyLedger> | null>(null);
  const [withdrawals, setWithdrawals] = useState<MoneyPage<MoneyWithdrawal> | null>(null);
  const [capabilities, setCapabilities] = useState<Capabilities | null>(null);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [amount, setAmount] = useState('');
  const [bankId, setBankId] = useState('');
  const [addingBank, setAddingBank] = useState(false);
  const [editingBank, setEditingBank] = useState('');
  const [kycReference, setKycReference] = useState('');
  const [bankCode, setBankCode] = useState('970422'); // default MB Bank
  const [holderName, setHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [orderId, setOrderId] = useState('');
  const [topupAmount, setTopupAmount] = useState('');
  const sequence = useRef(0);
  const inFlight = useRef(false);
  const scope = location.pathname;
  const keyFor = (payload: string) => commandKey(scope, payload);
  const [payments, setPayments] = useState<MoneyPage<MoneyPayment> | null>(null);

  useEffect(() => {
    setStoreId(selectedStore);
    setDetail(null);
    setEditingBank('');
    setKycReference('');
    setWallet(null);
    setBanks([]);
    setLedger(null);
    setWithdrawals(null);
    setPayments(null);
    setBankId('');
  }, [ownerType, selectedStore]);

  const load = useCallback(async () => {
    if (!localStorage.getItem('token') || (ownerType === 'STORE' && !selectedStore)) return;
    const current = ++sequence.current;
    setLoading(true);
    try {
      const [summary, caps] = await Promise.all([
        financeService.wallet(ownerType, selectedStore || undefined),
        financeService.capabilities(),
      ]);
      const [entries, accounts, requests, paymentRows] = await Promise.all([
        financeService.ledger(summary.walletId, page, {
          type: ledgerType || undefined,
          reference: referenceFilter || undefined,
          from: dateFrom ? new Date(dateFrom).toISOString() : undefined,
          to: dateTo ? new Date(dateTo).toISOString() : undefined,
        }),
        ownerType === 'CUSTOMER'
          ? Promise.resolve([])
          : financeService.banks(ownerType, summary.ownerRefId),
        ownerType === 'CUSTOMER' ? Promise.resolve(null) : financeService.withdrawals(summary.walletId, page),
        ownerType === 'CUSTOMER' ? financeService.payments(page) : Promise.resolve(null),
      ]);
      if (current !== sequence.current) return;
      setPayments(paymentRows);
      setWallet(summary);
      setCapabilities(caps);
      setLedger(entries);
      setBanks(accounts);
      setWithdrawals(requests);
      setError('');
      setBankId((currentId) =>
        accounts.some((b) => b.bankAccountId === currentId && b.active && b.verificationStatus === 'VERIFIED')
          ? currentId
          : accounts.find((b) => b.active && b.verificationStatus === 'VERIFIED')?.bankAccountId || ''
      );
    } catch (err) {
      if (current === sequence.current) setError(err instanceof Error ? err.message : 'Không tải được ví.');
    } finally {
      if (current === sequence.current) setLoading(false);
    }
  }, [ownerType, selectedStore, page, ledgerType, referenceFilter, dateFrom, dateTo]);

  const invalidateRequests = useCallback(() => {
    sequence.current++;
  }, []);

  useEffect(() => {
    void load();
    return invalidateRequests;
  }, [load, invalidateRequests]);

  async function run(action: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError('');
    setSuccess('');
    try {
      await action();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xử lý yêu cầu.');
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function withdraw(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      if (!wallet || !capabilities) return;
      const amountValue = amountVnd(amount);
      if (amountValue < capabilities.minimumWithdrawalVnd || amountValue > wallet.availableBalanceVnd)
        throw new Error('Số tiền phải đạt ngưỡng rút tối thiểu và không vượt số dư khả dụng.');
      const result = await financeService.withdraw({
        walletId: wallet.walletId,
        bankAccountId: bankId,
        amountVnd: amountValue,
        idempotencyKey: keyFor(`withdraw:${wallet.walletId}:${bankId}:${amountValue}`),
      });
      completeCommand(scope);
      setAmount('');
      setSuccess(`Đã tạo yêu cầu rút ${money(amountValue)} (Mã: ${result.withdrawalId}). Yêu cầu đang chờ duyệt; tiền chỉ được giữ sau khi quản trị viên phê duyệt.`);
    });
  }

  function register(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      if (!wallet) return;
      const input = {
        ownerType,
        ownerRefId: wallet.ownerRefId,
        bankCode,
        holderName: holderName.trim().toUpperCase(),
        accountNumber: accountNumber.trim(),
      };
      if (editingBank) await financeService.replaceBank(editingBank, input);
      else if (kycReference) await financeService.syncKycBank(input, kycReference);
      else await financeService.registerBank(input);
      setEditingBank('');
      setKycReference('');
      setAddingBank(false);
      setAccountNumber('');
      setSuccess('Đã lưu tài khoản ngân hàng thành công! Vui lòng bấm "Xác minh tài khoản" để kích hoạt rút tiền.');
    });
  }

  // Smart KYC import with auto-match and optional direct sync
  async function handleImportKyc() {
    await run(async () => {
      try {
        // Try direct backend KYC bank import
        await financeService.importCommerceKycBank();
        setSuccess('Đã nhập và xác minh tài khoản từ hồ sơ định danh KYC thành công!');
      } catch {
        // Fallback: Read KYC profile and prefill the form
        const profile = await kycService.getMyKyc();
        if (!profile.id || !profile.bankAccountName) {
          throw new Error('Hồ sơ KYC chưa có thông tin ngân hàng.');
        }
        setHolderName(profile.bankAccountName.toUpperCase());
        if (profile.bankAccountNumber) setAccountNumber(profile.bankAccountNumber);

        // Smart match bank name to BIN
        const rawBank = (profile.bankName || '')
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '');
        const matched = VIETNAM_BANKS.find(
          (b) =>
            rawBank.includes(b.code.toLowerCase()) ||
            rawBank.includes(b.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')) ||
            rawBank.includes(b.fullName.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
        );
        if (matched) {
          setBankCode(matched.bin);
        } else if (/^\d{6}$/.test(profile.bankName || '')) {
          setBankCode(profile.bankName!);
        } else {
          setBankCode('970422');
        }
        setKycReference(profile.id + ':' + String(profile.socialLinksJson?.submittedAt || 'profile'));
        setEditingBank('');
        setAddingBank(true);
        setSuccess(
          `Đã điền thông tin từ hồ sơ KYC (${matched ? matched.name : 'MB Bank'} · STK: ${
            profile.bankAccountNumber || '...'
          }). Vui lòng bấm "Đăng ký tài khoản" bên dưới.`
        );
      }
    });
  }

  return (
    <div className="space-y-6 text-[#1A1612] pb-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold text-[#7D715E]">TÀI CHÍNH SCANMS</p>
          <h1 className="mt-1 text-2xl font-bold flex items-center gap-2">
            <Wallet className="text-[#B88E4F]" />
            {ownerType === 'STORE'
              ? 'Ví doanh thu gian hàng'
              : ownerType === 'COLLABORATOR'
              ? 'Ví hoa hồng KOL'
              : 'Ví khách hàng'}
          </h1>
          <p className="mt-2 text-sm text-[#7D715E]">
            {ownerType === 'CUSTOMER'
              ? 'Nhận hoàn tiền, nạp ví và thanh toán đơn hàng.'
              : 'Theo dõi tiền đã vào ví, khoản đang giữ và yêu cầu rút ra ngân hàng.'}
          </p>
        </div>
        <button className={button} onClick={() => void load()} disabled={busy || loading}>
          <RefreshCw className="inline h-4 w-4 mr-2" />
          Tải lại
        </button>
      </header>

      {ownerType === 'STORE' && (
        <form
          className="flex gap-2 max-w-xl"
          onSubmit={(e) => {
            e.preventDefault();
            setParams({ storeId });
            void load();
          }}
        >
          <label className="flex-1 text-sm font-semibold">
            Mã gian hàng
            <select
              aria-label="Chọn gian hàng"
              className={field}
              value={storeId}
              onChange={(e) => {
                setStoreId(e.target.value);
                setParams({ storeId: e.target.value });
              }}
              required
            >
              <option value="">Chọn gian hàng</option>
              {stores.map((s) => (
                <option key={s.storeId} value={s.storeId}>
                  {s.name}
                </option>
              ))}
              {storeId && !stores.some((s) => s.storeId === storeId) && (
                <option value={storeId}>{storeId}</option>
              )}
            </select>
          </label>
          <button className={`${button} self-end bg-[#FAF8F5] hover:bg-[#F3EFE6]`} disabled={loading}>
            Xem ví
          </button>
          <Link
            className={`${button} self-end whitespace-nowrap bg-[#FAF8F5] hover:bg-[#F3EFE6]`}
            to={`/merchant/settlements?storeId=${encodeURIComponent(storeId)}`}
          >
            Đối soát
          </Link>
        </form>
      )}

      {!localStorage.getItem('token') && (
        <p className="rounded-xl bg-[#FBF5EB] p-4 text-sm">
          Vui lòng{' '}
          <Link
            className="underline font-semibold"
            to={`${usesLegacyCheckout ? '/login' : '/finance/login'}?redirect=${encodeURIComponent(
              location.pathname
            )}`}
          >
            đăng nhập
          </Link>{' '}
          để xem ví của bạn.
        </p>
      )}

      {error && (
        <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-red-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div role="status" className="flex items-start gap-2.5 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-green-600" />
          <span>{success}</span>
        </div>
      )}

      {/* KPI Cards */}
      <section aria-busy={loading} className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] p-6 flex flex-col justify-between">
          <div>
            <p className="text-sm font-bold text-[#7D715E]">Số dư khả dụng</p>
            <p className="mt-2 text-3xl font-black tabular-nums text-[#1A1612]">
              {wallet ? money(wallet.availableBalanceVnd) : '—'}
            </p>
            <p className="mt-2 text-xs text-[#7D715E]">
              {wallet ? statusLabels[wallet.status] : loading ? 'Đang tải…' : 'Chưa có dữ liệu'}
            </p>
          </div>
        </div>

        {ownerType !== 'CUSTOMER' && (
          <div className="rounded-2xl border border-[#EAE4D7] bg-white p-6">
            <p className="text-sm font-bold text-[#7D715E]">Tiền đang giữ để rút</p>
            <p className="mt-2 text-3xl font-black tabular-nums text-[#1A1612]">
              {wallet ? money(wallet.heldBalanceVnd) : '—'}
            </p>
            <p className="mt-2 text-xs text-[#7D715E]">
              Tiền được giữ sau khi yêu cầu rút được phê duyệt. Hoàn lại số dư khả dụng khi bị từ chối hoặc chuyển khoản thất bại; ghi nhận đã rút khi chuyển khoản thành công.
            </p>
          </div>
        )}
      </section>

      {ownerType === 'CUSTOMER' && (
        <p className="rounded-xl border border-[#EAE4D7] bg-white p-4 text-sm text-[#7D715E]">
          Ví khách hàng dùng để nạp tiền, nhận hoàn tiền và thanh toán đơn. Rút tiền về ngân hàng dành cho ví doanh thu Shop và ví hoa hồng KOL.
        </p>
      )}

      {ownerType === 'COLLABORATOR' && (
        <p className="text-xs sm:text-sm text-[#7D715E] bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE4D7]">
          💡 Hoa hồng đủ điều kiện sau thời hạn trả hàng 14 ngày tính từ lúc giao thành công sẽ được ghi có vào ví.
        </p>
      )}

      {ownerType === 'CUSTOMER' ? (
        <section className="grid gap-6 md:grid-cols-2">
          {/* Customer Topup form */}
          <form
            className="rounded-2xl border border-[#EAE4D7] bg-white p-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                if (!wallet) return;
                const value = amountVnd(topupAmount);
                const payment = await financeService.topup(wallet.walletId, value, keyFor(`topup:${wallet.walletId}:${value}`));
                completeCommand(scope);
                window.location.assign(`/payment/payos-return?payment=${payment.paymentId}`);
              });
            }}
          >
            <h2 className="font-bold">Nạp tiền vào ví</h2>
            <label className="block text-sm">
              Số tiền (VNĐ)
              <input className={field} inputMode="numeric" value={topupAmount} onChange={(e) => setTopupAmount(e.target.value)} required />
            </label>
            <button className={`${button} bg-[#EBD08C] hover:bg-[#E0C070] text-[#1A1612]`} disabled={busy || loading || !capabilities?.paymentAvailable}>
              Tạo thanh toán nạp ví
            </button>
            {!capabilities?.paymentAvailable && <p className="text-xs text-[#7D715E]">Cổng thanh toán chưa sẵn sàng.</p>}
          </form>

          {/* Customer Pay form */}
          <form
            className="rounded-2xl border border-[#EAE4D7] bg-white p-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void run(async () => {
                if (!wallet) return;
                const result = await financeService.payWallet(orderId, wallet.walletId, keyFor(`pay:${orderId}:${wallet.walletId}`));
                if (result.status !== 'SUCCESS') throw new Error('Giao dịch chưa thành công. Kiểm tra trạng thái trước khi thanh toán lại.');
                completeCommand(scope);
                setSuccess(`Đã trừ ví. ${result.orderSyncStatus === 'SYNCED' ? 'Đơn đã được cập nhật.' : 'Đang đồng bộ kết quả với đơn hàng.'} Mã giao dịch: ${result.paymentId}`);
              });
            }}
          >
            <h2 className="font-bold">Thanh toán đơn bằng ví</h2>
            <label className="block text-sm">
              Mã đơn hàng
              <input className={field} value={orderId} onChange={(e) => setOrderId(e.target.value)} required />
            </label>
            <p className="text-xs text-[#7D715E]">Số tiền thanh toán được kiểm tra theo đơn hàng trên hệ thống.</p>
            <button className={`${button} bg-[#EBD08C] hover:bg-[#E0C070] text-[#1A1612]`} disabled={busy || loading || wallet?.status !== 'ACTIVE'}>
              Thanh toán bằng ví
            </button>
            <button
              type="button"
              className={button}
              disabled={busy || loading || !capabilities?.paymentAvailable || !orderId.trim()}
              onClick={() =>
                void run(async () => {
                  const payment = await financeService.payment(orderId.trim(), keyFor(`order-payos:${orderId.trim()}`));
                  completeCommand(scope);
                  window.location.assign(`/payment/payos-return?payment=${payment.paymentId}`);
                })
              }
            >
              Thanh toán đơn qua payOS
            </button>
          </form>
        </section>
      ) : (
        <section className="grid gap-6 lg:grid-cols-2">
          {/* LEFT CARD: Bank Accounts Management */}
          <div className="rounded-2xl border border-[#EAE4D7] bg-white p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Landmark size={20} className="text-[#C59B58]" />
                Tài khoản nhận tiền
              </h2>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`${button} bg-[#FAF8F5] hover:bg-[#F3EFE6] text-xs py-2 px-3`}
                  disabled={busy}
                  onClick={() => {
                    setEditingBank('');
                    setKycReference('');
                    setAddingBank(!addingBank);
                  }}
                >
                  <Plus size={14} className="inline mr-1" />
                  {addingBank ? 'Đóng form' : 'Thêm ngân hàng'}
                </button>
                {ownerType === 'COLLABORATOR' && (
                  <button
                    type="button"
                    className={`${button} bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100 text-xs py-2 px-3`}
                    disabled={busy}
                    onClick={() => void handleImportKyc()}
                    title="Tự động đồng bộ số tài khoản và ngân hàng từ hồ sơ định danh KYC"
                  >
                    <ShieldCheck size={14} className="inline mr-1 text-amber-600" />
                    Nhập từ KYC
                  </button>
                )}
              </div>
            </div>

            {/* List of existing bank accounts */}
            {banks.length === 0 && !addingBank && (
              <div className="p-6 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] text-center space-y-2">
                <p className="text-sm font-semibold text-[#1A1612]">Chưa có tài khoản nhận tiền</p>
                <p className="text-xs text-[#7D715E]">
                  Bấm &quot;Thêm ngân hàng&quot; hoặc &quot;Nhập từ KYC&quot; để liên kết tài khoản ngân hàng và rút tiền về ví.
                </p>
              </div>
            )}

            {banks.map((b) => {
              const matchedInfo = FALLBACK_VIET_BANKS.find((item) => item.bin === b.bankCode);
              const logoUrl = matchedInfo?.logo || `https://cdn.vietqr.io/img/${matchedInfo?.code || 'BANK'}.png`;
              const isVerified = b.verificationStatus === 'VERIFIED';
              return (
                <div
                  key={b.bankAccountId}
                  className="rounded-2xl border border-[#EAE4D7] bg-white p-4 text-sm space-y-3 shadow-2xs"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-xl bg-white border border-[#EAE4D7] p-1 flex items-center justify-center shrink-0 shadow-2xs">
                        {matchedInfo?.logo ? (
                          <img
                            src={logoUrl}
                            alt={matchedInfo.shortName}
                            className="max-h-7 max-w-[34px] object-contain"
                            onError={(e) => {
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <Landmark className="w-5 h-5 text-[#C59B58]" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-extrabold text-[#1A1612] text-sm block truncate">
                          {matchedInfo ? `${matchedInfo.shortName} (${matchedInfo.name})` : `Ngân hàng BIN ${b.bankCode}`}
                        </span>
                        <span className="text-xs font-mono font-semibold text-[#7D715E] block">
                          Số TK: {b.maskedNumber} · Chủ TK: {b.holderName}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                        isVerified
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : b.verificationStatus === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}
                    >
                      {statusLabels[b.verificationStatus] || b.verificationStatus}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#EAE4D7]">
                    {/* Instant verification button */}
                    {!isVerified && b.active && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() =>
                          void run(async () => {
                            await financeService.verifyBank(b.bankAccountId, 'VERIFIED');
                            setSuccess('Đã xác minh tài khoản thành công! Bây giờ bạn có thể chọn tài khoản này để gửi lệnh rút tiền.');
                          })
                        }
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
                      >
                        <CheckCircle2 size={13} />
                        <span>Xác minh tài khoản ngay</span>
                      </button>
                    )}

                    <div className="flex items-center gap-3 text-xs ml-auto">
                      {b.active && (
                        <button
                          type="button"
                          className="underline text-[#7D715E] hover:text-[#1A1612] cursor-pointer font-semibold"
                          disabled={busy}
                          onClick={() => {
                            setEditingBank(b.bankAccountId);
                            setKycReference('');
                            setBankCode(b.bankCode);
                            setHolderName(b.holderName);
                            setAccountNumber('');
                            setAddingBank(true);
                          }}
                        >
                          Thay đổi
                        </button>
                      )}
                      {b.active && (
                        <button
                          type="button"
                          className="underline text-rose-600 hover:text-rose-800 cursor-pointer font-semibold"
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              await financeService.deactivateBank(b.bankAccountId);
                              setSuccess('Đã ngừng sử dụng tài khoản ngân hàng.');
                            })
                          }
                        >
                          Ngừng dùng
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Bank Form */}
            {(addingBank || banks.length === 0) && (
              <form
                className="mt-4 pt-4 border-t border-[#EAE4D7] space-y-3.5 bg-white rounded-2xl p-4 border"
                onSubmit={register}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[#1A1612]">
                    {editingBank ? 'Thay đổi thông tin tài khoản' : 'Thêm tài khoản ngân hàng nhận tiền'}
                  </h3>
                  {banks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setAddingBank(false)}
                      className="text-xs text-[#7D715E] hover:underline"
                    >
                      Hủy bỏ
                    </button>
                  )}
                </div>

                {/* 1. Ngân hàng (Vietnamese Bank Picker with VietQR API) */}
                <div>
                  <label className="block text-xs font-bold text-[#7D715E] mb-1.5">
                    Chọn Ngân Hàng Thụ Hưởng (Danh bạ VietQR 65+ ngân hàng)
                  </label>
                  <VietnameseBankPicker
                    value={bankCode}
                    onChange={(bin) => setBankCode(bin)}
                  />
                </div>

                {/* 2. Tên chủ tài khoản */}
                <div>
                  <label className="block text-xs font-bold text-[#7D715E] mb-1">
                    Tên chủ tài khoản (In hoa không dấu)
                  </label>
                  <input
                    className={field}
                    value={holderName}
                    onChange={(e) => setHolderName(e.target.value.toUpperCase())}
                    placeholder="VD: NGUYEN VAN A"
                    maxLength={100}
                    required
                  />
                </div>

                {/* 3. Số tài khoản */}
                <div>
                  <label className="block text-xs font-bold text-[#7D715E] mb-1">
                    Số tài khoản ngân hàng
                  </label>
                  <input
                    className={field}
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="VD: 0987654321..."
                    pattern="[0-9]{6,30}"
                    inputMode="numeric"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className={`${button} w-full bg-[#C59B58] hover:bg-[#B88E4F] text-white font-bold shadow-xs`}
                  disabled={busy}
                >
                  {busy ? 'Đang lưu…' : editingBank ? 'Lưu thay đổi' : 'Đăng ký tài khoản'}
                </button>
              </form>
            )}
          </div>

          {/* RIGHT CARD: Withdrawal Request */}
          <form
            onSubmit={withdraw}
            className="rounded-2xl border border-[#EAE4D7] bg-white p-6 space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <h2 className="font-bold text-base flex items-center gap-2">
                <ArrowDownToLine size={20} className="text-[#C59B58]" />
                Yêu cầu rút tiền
              </h2>
              <p className="text-xs text-[#7D715E]">
                Tiền được chuyển về tài khoản ngân hàng đã xác minh bạn chọn dưới đây.
              </p>

              {capabilities && !capabilities.payoutAvailable && (
                <div role="status" className="rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] p-3 text-xs text-[#7D715E]">
                  Dịch vụ chuyển tiền ra ngân hàng chưa sẵn sàng. Bạn có thể gửi yêu cầu chờ xử lý; yêu cầu chỉ được duyệt và giữ tiền khi dịch vụ được cấu hình đầy đủ.
                </div>
              )}

              {/* Insufficient balance warning */}
              {wallet && wallet.availableBalanceVnd < (capabilities?.minimumWithdrawalVnd || 200000) && (
                <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 space-y-2">
                  <div className="flex items-center gap-2 font-bold">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Số dư khả dụng hiện tại: {money(wallet.availableBalanceVnd)}</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Số tiền rút tối thiểu là {capabilities ? money(capabilities.minimumWithdrawalVnd) : '200.000 đ'}. Bạn cần tích lũy thêm số dư từ doanh thu đối soát hoặc hoa hồng đã được ghi có vào ví.
                  </p>
                </div>
              )}

              {/* Bank Account Selection for Withdrawal */}
              <div>
                <label className="block text-xs font-bold text-[#7D715E] mb-1">
                  Chọn tài khoản ngân hàng thụ hưởng
                </label>
                <select
                  className={field}
                  value={bankId}
                  onChange={(e) => setBankId(e.target.value)}
                  required
                >
                  <option value="">
                    {banks.filter((b) => b.active && b.verificationStatus === 'VERIFIED').length === 0
                      ? 'Chưa có tài khoản nào được xác minh (Hãy xác minh ở khung bên trái)'
                      : 'Chọn tài khoản đã xác minh'}
                  </option>
                  {banks
                    .filter((b) => b.active && b.verificationStatus === 'VERIFIED')
                    .map((b) => {
                      const matched = VIETNAM_BANKS.find((v) => v.bin === b.bankCode);
                      return (
                        <option key={b.bankAccountId} value={b.bankAccountId}>
                          {matched ? matched.name : `BIN ${b.bankCode}`} · {b.maskedNumber} · {b.holderName}
                        </option>
                      );
                    })}
                </select>
              </div>

              {/* Amount input */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="withdrawal-amount" className="block text-xs font-bold text-[#7D715E]">
                    Số tiền muốn rút (VNĐ)
                  </label>
                  {wallet && wallet.availableBalanceVnd > 0 && (
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setAmount(String(Math.min(wallet.availableBalanceVnd, 200000)))}
                        className="text-[#C59B58] hover:underline font-semibold"
                      >
                        200k
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => setAmount(String(Math.min(wallet.availableBalanceVnd, 500000)))}
                        className="text-[#C59B58] hover:underline font-semibold"
                      >
                        500k
                      </button>
                      <span>·</span>
                      <button
                        type="button"
                        onClick={() => setAmount(String(wallet.availableBalanceVnd))}
                        className="text-[#C59B58] hover:underline font-bold"
                      >
                        Tối đa ({money(wallet.availableBalanceVnd)})
                      </button>
                    </div>
                  )}
                </div>
                <input
                  id="withdrawal-amount"
                  className={field}
                  inputMode="numeric"
                  placeholder="Nhập số tiền..."
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
                <p className="text-[11px] text-[#A69986] mt-1">
                  Tối thiểu {capabilities ? money(capabilities.minimumWithdrawalVnd) : '200.000 đ'}. Tiền chỉ được giữ sau khi yêu cầu được phê duyệt. Nếu chuyển khoản thất bại, tiền giữ được hoàn lại số dư khả dụng.
                </p>
              </div>
            </div>

            <button
              type="submit"
              className={`${button} w-full bg-[#C59B58] hover:bg-[#B88E4F] text-white font-bold shadow-xs py-3 mt-4`}
              disabled={
                busy ||
                loading ||
                !bankId ||
                !amount ||
                Number(amount) < (capabilities?.minimumWithdrawalVnd || 200000) ||
                (wallet ? Number(amount) > wallet.availableBalanceVnd : true) ||
                wallet?.status !== 'ACTIVE'
              }
            >
              {busy ? 'Đang xử lý yêu cầu…' : 'Gửi yêu cầu rút tiền'}
            </button>
          </form>
        </section>
      )}

      {/* Withdrawals History */}
      {withdrawals && (
        <section className="rounded-2xl border border-[#EAE4D7] bg-white overflow-hidden shadow-2xs">
          <h2 className="p-5 font-bold text-base border-b border-[#EAE4D7]">Lịch sử rút tiền</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF8F5]">
                <tr>
                  {['Ngày yêu cầu', 'Số tiền', 'Phí', 'Thực nhận', 'Trạng thái', 'Thông tin & Thao tác'].map(
                    (label) => (
                      <th className="px-4 py-3 font-bold text-xs text-[#7D715E]" key={label}>
                        {label}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {withdrawals.items.map((w) => (
                  <tr className="border-t border-[#EAE4D7] hover:bg-[#FAF8F5]/50 transition" key={w.withdrawalId}>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-[#7D715E]">{when(w.requestedAt)}</td>
                    <td className="px-4 py-3 font-bold text-[#1A1612]">{money(w.amountVnd)}</td>
                    <td className="px-4 py-3 text-xs text-[#7D715E]">{money(w.feeVnd)}</td>
                    <td className="px-4 py-3 font-bold text-emerald-700">{money(w.netAmountVnd)}</td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#FAF5EB] border border-[#EAE4D7] text-[#B88E4F]">
                        {statusLabels[w.status] || w.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-mono text-[#7D715E] block">{w.withdrawalId}</span>
                      {w.failureReason && <p className="text-red-700 mt-1">{w.failureReason}</p>}
                      {w.scheduledFor && <p className="text-[#A69986] mt-1">Dự kiến: {when(w.scheduledFor)}</p>}
                      {w.status === 'REQUESTED' && (
                        <button
                          type="button"
                          className="text-xs text-rose-600 hover:underline font-semibold mt-1.5 block cursor-pointer"
                          disabled={busy}
                          onClick={() =>
                            void run(async () => {
                              await financeService.withdrawalAction(w.withdrawalId, 'cancel', 'Chủ ví hủy yêu cầu');
                              setSuccess('Đã hủy yêu cầu rút tiền thành công.');
                            })
                          }
                        >
                          Hủy yêu cầu này
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {withdrawals.items.length === 0 && (
            <p className="p-8 text-center text-sm text-[#7D715E]">Chưa có yêu cầu rút tiền nào.</p>
          )}
        </section>
      )}

      {/* Customer payment history */}
      {ownerType === 'CUSTOMER' && (
        <section className="rounded-2xl border border-[#EAE4D7] bg-white p-5 space-y-3">
          <h2 className="font-bold">Lịch sử thanh toán và nạp ví</h2>
          {payments?.items.map((row) => (
            <div key={row.paymentId} className="flex flex-wrap justify-between gap-3 border-t pt-3">
              <div>
                <strong>{money(row.amountVnd)}</strong>
                <p className="text-sm">
                  {row.purpose === 'TOP_UP' ? 'Nạp ví' : 'Thanh toán đơn'} · {statusLabels[row.status] || row.status}
                </p>
                <p className="text-xs break-all">{row.paymentId}</p>
              </div>
              <Link className={button} to={`/payment/payos-return?payment=${row.paymentId}`}>
                Xem / kiểm tra thanh toán
              </Link>
            </div>
          ))}
          {payments?.items.length === 0 && <p className="text-sm text-gray-500">Chưa có thanh toán.</p>}
        </section>
      )}

      {/* Filter and Ledger */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 items-end" aria-label="Lọc lịch sử">
        <div>
          <label className="block text-xs font-bold text-[#7D715E] mb-1">Loại giao dịch</label>
          <select
            className={field}
            value={ledgerType}
            onChange={(e) => {
              setLedgerType(e.target.value);
              setPage(0);
            }}
          >
            <option value="">Tất cả</option>
            {Object.entries(typeLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-[#7D715E] mb-1">Tham chiếu</label>
          <input
            className={field}
            value={referenceFilter}
            onChange={(e) => {
              setReferenceFilter(e.target.value);
              setPage(0);
            }}
            placeholder="Nhập mã tham chiếu..."
          />
        </div>
        <div>
          <CustomDateTimePicker
            label="Từ ngày"
            showTime
            value={dateFrom}
            onChange={(v: string) => {
              setDateFrom(v);
              setPage(0);
            }}
            placeholder="Chọn mốc bắt đầu..."
          />
        </div>
        <div>
          <CustomDateTimePicker
            label="Đến ngày"
            showTime
            value={dateTo}
            onChange={(v: string) => {
              setDateTo(v);
              setPage(0);
            }}
            placeholder="Chọn mốc kết thúc..."
          />
        </div>
      </section>

      {detail && (
        <section className="rounded-xl border bg-white p-5 space-y-2" aria-label="Chi tiết giao dịch">
          <h2 className="font-bold">Chi tiết giao dịch</h2>
          <p className="break-all">
            {detail.transactionId} · {statusLabels[detail.status] || detail.status}
          </p>
          <p>{detail.description}</p>
          <p>
            {money(detail.amountVnd)} · {when(detail.completedAt)}
          </p>
          <p className="break-all">
            {detail.referenceType} · {detail.referenceId}
          </p>
          <button className={button} onClick={() => setDetail(null)}>
            Đóng chi tiết
          </button>
        </section>
      )}

      {/* Ledger history table */}
      <section className="rounded-2xl border border-[#EAE4D7] bg-white overflow-hidden shadow-2xs">
        <h2 className="p-5 font-bold text-base border-b border-[#EAE4D7]">Lịch sử biến động số dư ví</h2>
        <div className="overflow-x-auto">
          <table aria-label="Lịch sử biến động ví" className="w-full text-left text-sm">
            <thead className="bg-[#FAF8F5]">
              <tr>
                {['Thời gian', 'Giao dịch', 'Số tiền', 'Khả dụng trước → sau', 'Đang giữ trước → sau', 'Tham chiếu'].map(
                  (label) => (
                    <th className="px-4 py-3 font-bold text-xs text-[#7D715E]" key={label}>
                      {label}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {ledger?.items.map((e) => (
                <tr key={e.transactionId} className="border-t border-[#EAE4D7] hover:bg-[#FAF8F5]/50 transition">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-[#7D715E]">{when(e.createdAt)}</td>
                  <td className="px-4 py-3 font-semibold">{typeLabels[e.type] || e.type}</td>
                  <td className="px-4 py-3 whitespace-nowrap font-bold">
                    <span className={e.direction === 'CREDIT' ? 'text-emerald-700' : 'text-rose-700'}>
                      {e.direction === 'CREDIT' ? '+' : '-'}
                      {money(e.amountVnd)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-[#7D715E]">
                    {money(e.balanceBeforeVnd)} → {money(e.balanceAfterVnd)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-[#7D715E]">
                    {money(e.heldBeforeVnd)} → {money(e.heldAfterVnd)}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-mono text-[#7D715E]">
                      {e.referenceType} · {e.referenceId}
                    </span>
                    <button
                      className="block mt-1 underline text-[#C59B58] hover:text-[#B88E4F] cursor-pointer"
                      disabled={busy}
                      onClick={() =>
                        void run(async () => {
                          if (wallet) setDetail(await financeService.transaction(wallet.walletId, e.transactionId));
                        })
                      }
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && !ledger?.items.length && (
          <p className="p-8 text-center text-sm text-[#7D715E]">
            Chưa có giao dịch biến động. Khoản credit hoa hồng hoặc nạp số dư sẽ xuất hiện tại đây.
          </p>
        )}
        <div className="p-4 flex justify-between items-center text-sm border-t border-[#EAE4D7]">
          <span className="text-xs text-[#7D715E]">
            Trang {page + 1} · {ledger?.total ?? 0} giao dịch
          </span>
          <div className="flex gap-2">
            <button className={button} disabled={page === 0 || busy || loading} onClick={() => setPage((p) => p - 1)}>
              Trước
            </button>
            <button
              className={button}
              disabled={
                busy ||
                loading ||
                (page + 1) * 20 >= Math.max(ledger?.total ?? 0, withdrawals?.total ?? 0, payments?.total ?? 0)
              }
              onClick={() => setPage((p) => p + 1)}
            >
              Sau
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
