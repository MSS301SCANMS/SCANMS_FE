import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  ArrowDownToLine,
  Clock3,
  RefreshCw,
  ShieldCheck,
  Wallet,
  Share2,
} from "lucide-react";
import KycSubmissionPage from "./KycSubmissionPage";
import SocialChannelsPage from "./SocialChannelsPage";
import { walletService } from "../../services/wallet.service";
import type {
  PayoutStatus,
  WalletSummary,
  WithdrawalHistory,
  LedgerHistory,
  LedgerEntry,
} from "../../services/wallet.service";

const STATUS_LABELS: Record<PayoutStatus, string> = {
  PENDING: "Chờ xử lý",
  PROCESSING: "Đang thanh toán theo lô",
  APPROVED: "Đã duyệt",
  REJECTED: "Đã từ chối",
};

const formatMoney = (amount: string) =>
  `${new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 2,
  }).format(Number(amount))} ₫`;

const TRANSACTION_LABELS: Record<LedgerEntry["transactionType"], string> = {
  COMMISSION_PENDING: "Ghi nhận hoa hồng chờ",
  COMMISSION_APPROVED: "Duyệt hoa hồng / cộng thưởng",
  PAYOUT_WITHDRAW: "Yêu cầu rút tiền",
  REVERSAL: "Thu hồi hoa hồng",
  PAYOUT_REJECT_REFUND: "Hoàn tiền yêu cầu rút",
};

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Có lỗi xảy ra, vui lòng thử lại.";


function toMinorUnits(amount: string): bigint {
  const negative = amount.startsWith("-");
  const [whole, fraction = ""] = (negative ? amount.slice(1) : amount).split(
    ".",
  );
  return (
    (negative ? -1n : 1n) *
    (BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0")))
  );
}

export default function WalletPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'wallet';

  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [storeId, setStoreId] = useState("");
  const [history, setHistory] = useState<WithdrawalHistory | null>(null);
  const [ledger, setLedger] = useState<LedgerHistory | null>(null);
  const [page, setPage] = useState(1);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const submissionInFlight = useRef(false);
  const loadSequence = useRef(0);

  const loadWallet = useCallback(async () => {
    const sequence = ++loadSequence.current;
    setLoading(true);
    try {
      const [summary, withdrawals, ledgerHistory] = await Promise.all([
        walletService.getMyWallet(),
        walletService.getMyWithdrawals(page),
        walletService.getMyLedger(),
      ]);
      if (sequence !== loadSequence.current) return;
      setWallet(summary);
      setStoreId((current) =>
        summary.stores.some(
          (store) => store.storeId === current && store.isActive,
        )
          ? current
          : (summary.stores.find(
              (store) =>
                store.isActive &&
                toMinorUnits(store.availableBalance) >=
                  toMinorUnits(summary.minimumWithdrawalAmount),
            )?.storeId ??
            summary.stores.find((store) => store.isActive)?.storeId ??
            ""),
      );
      setHistory(withdrawals);
      setLedger(ledgerHistory);
      setError("");
    } catch (err: unknown) {
      if (sequence === loadSequence.current) setError(getErrorMessage(err));
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const sequenceRef = loadSequence;
    void loadWallet();
    return () => {
      sequenceRef.current++;
    };
  }, [loadWallet]);

  const validPreviewAmount = /^\d{1,13}(\.\d{1,2})?$/.test(amount.trim());
  const selectedStore = wallet?.stores.find(
    (store) => store.storeId === storeId,
  );
  const grossMinor = validPreviewAmount ? toMinorUnits(amount.trim()) : 0n;
  const taxMinor =
    wallet && grossMinor >= toMinorUnits(wallet.withdrawalTaxPolicy.threshold)
      ? (grossMinor * toMinorUnits(wallet.withdrawalTaxPolicy.rate) + 50n) /
        100n
      : 0n;
  const previewMoney = (minorUnits: bigint) =>
    formatMoney(
      `${minorUnits / 100n}.${(minorUnits % 100n).toString().padStart(2, "0")}`,
    );

  async function handleWithdrawal(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!wallet || submissionInFlight.current || loading) return;
    setError("");
    setSuccess("");
    if (!selectedStore?.isActive) {
      setError("Chọn shop có số dư khả dụng để rút tiền.");
      return;
    }
    const normalizedAmount = amount.trim();
    if (!/^\d{1,13}(\.\d{1,2})?$/.test(normalizedAmount)) {
      setError(
        "Nhập số tiền hợp lệ, không có dấu phân cách hàng nghìn, tối đa 2 chữ số lẻ.",
      );
      return;
    }
    const minorUnits = toMinorUnits(normalizedAmount);
    if (
      minorUnits <= 0n ||
      minorUnits < toMinorUnits(wallet.minimumWithdrawalAmount)
    ) {
      setError(
        `Số tiền rút tối thiểu là ${formatMoney(wallet.minimumWithdrawalAmount)}.`,
      );
      return;
    }
    if (minorUnits > toMinorUnits(wallet.availableBalance)) {
      setError("Số dư khả dụng không đủ để thực hiện rút tiền.");
      return;
    }
    if (minorUnits > toMinorUnits(selectedStore.availableBalance)) {
      setError("Số dư khả dụng tại shop đã chọn không đủ.");
      return;
    }

    submissionInFlight.current = true;
    setSubmitting(true);
    try {
      const result = await walletService.createWithdrawal(
        normalizedAmount,
        selectedStore.storeId,
      );
      setSuccess(`${result.message}. Mã yêu cầu: ${result.request.id}`);
      setAmount("");
      setWallet((current) =>
        current
          ? { ...current, availableBalance: result.availableBalance }
          : current,
      );
      if (page === 1) await loadWallet();
      else setPage(1);
    } catch (err: unknown) {

      setError(
        `${getErrorMessage(err)} Nếu kết nối bị gián đoạn, hãy tải lại lịch sử trước khi gửi lại.`,
      );
    } finally {
      submissionInFlight.current = false;
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 text-ink pb-12">
      {/* Top Unified Hub Navigation Bar */}
      <div className="bg-white rounded-2xl border border-line p-3 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 pl-2">
          <div className="w-8 h-8 rounded-xl bg-brand-soft border border-brand-border flex items-center justify-center text-brand-strong">
            <Wallet className="w-4 h-4" />
          </div>
          <div>
            <div className="text-xs font-black text-ink uppercase tracking-wider">VÍ HOA HỒNG & HỒ SƠ CÁ NHÂN</div>
            <div className="text-[11px] text-muted">Quản lý dòng tiền, rút doanh thu, định danh KYC & mạng xã hội</div>
          </div>
        </div>

        <div className="flex items-center bg-surface-sand p-1.5 rounded-xl border border-line w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => setSearchParams({ tab: 'wallet' })}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'wallet'
                ? 'bg-white text-ink shadow-xs border border-line'
                : 'text-muted hover:text-ink hover:bg-white/50'
            }`}
            id="tab-btn-wallet"
          >
            <Wallet className="w-3.5 h-3.5 text-brand-strong" />
            <span>Ví & Rút Tiền</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'kyc' })}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'kyc'
                ? 'bg-white text-ink shadow-xs border border-line'
                : 'text-muted hover:text-ink hover:bg-white/50'
            }`}
            id="tab-btn-kyc"
          >
            <ShieldCheck className="w-3.5 h-3.5 text-brand-strong" />
            <span>Hồ Sơ KYC</span>
          </button>

          <button
            onClick={() => setSearchParams({ tab: 'social' })}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'social'
                ? 'bg-white text-ink shadow-xs border border-line'
                : 'text-muted hover:text-ink hover:bg-white/50'
            }`}
            id="tab-btn-social"
          >
            <Share2 className="w-3.5 h-3.5 text-brand-strong" />
            <span>Kênh Mạng Xã Hội</span>
          </button>
        </div>
      </div>

      {activeTab === 'kyc' && <KycSubmissionPage />}
      {activeTab === 'social' && <SocialChannelsPage />}
      {activeTab === 'wallet' && (
        <>
          <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">
            Ví tiền & rút tiền
          </h1>
          <p className="mt-1 text-sm text-muted">
            Quản lý số dư hoa hồng và yêu cầu rút tiền của bạn trên SCANMS.
          </p>
        </div>
        <button
          type="button"
          aria-label="Tải lại ví"
          onClick={() => void loadWallet()}
          disabled={loading || submitting}
          className="inline-flex items-center gap-2 rounded-xl border border-line bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Tải
          lại
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}
      {success && (
        <div
          role="status"
          className="rounded-xl border border-brand-border bg-brand-soft p-4 text-sm text-ink"
        >
          {success}
        </div>
      )}

      <section className="grid gap-4 sm:grid-cols-2" aria-busy={loading}>
        <div className="rounded-2xl border border-brand-border bg-brand-soft p-6">
          <p className="flex items-center gap-2 text-sm text-muted">
            <Wallet size={18} /> Số dư khả dụng
          </p>
          <p className="mt-3 text-3xl font-bold tabular-nums">
            {wallet ? formatMoney(wallet.availableBalance) : "—"}
          </p>
          <p className="mt-2 text-xs text-muted">
            Chỉ số dư khả dụng được dùng để yêu cầu rút tiền.
          </p>
        </div>
        <div className="rounded-2xl border border-line bg-white p-6">
          <p className="flex items-center gap-2 text-sm text-muted">
            <Clock3 size={18} /> Số dư chờ duyệt
          </p>
          <p className="mt-3 text-3xl font-bold tabular-nums">
            {wallet ? formatMoney(wallet.pendingBalance) : "—"}
          </p>
          <p className="mt-2 text-xs text-muted">
            Hoa hồng được mở khóa sau thời gian giữ 14 ngày.
          </p>
        </div>
      </section>

      <section className="grid gap-6 rounded-2xl border border-line bg-white p-6 lg:grid-cols-2">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold">
            <ShieldCheck size={20} className="text-brand-strong" /> Tài khoản
            nhận tiền
          </h2>
          {wallet?.bankAccount ? (
            <dl className="mt-4 space-y-2 text-sm">
              <div>
                <dt className="text-muted">Ngân hàng</dt>
                <dd className="font-semibold">{wallet.bankAccount.bankName}</dd>
              </div>
              <div>
                <dt className="text-muted">Số tài khoản</dt>
                <dd>{wallet.bankAccount.maskedAccountNumber}</dd>
              </div>
              <div>
                <dt className="text-muted">Chủ tài khoản</dt>
                <dd>{wallet.bankAccount.accountName}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-sm text-muted">
              Chưa có tài khoản ngân hàng.
            </p>
          )}
          <p className="mt-4 text-sm text-muted">
            KYC:{" "}
            {wallet?.kycStatus === "VERIFIED"
              ? "Đã xác minh"
              : "Chưa được xác minh"}
          </p>
          <Link
            to="/collaborator/kyc"
            className="mt-2 inline-block text-sm font-semibold text-brand-strong underline"
          >
            Xem / cập nhật hồ sơ KYC
          </Link>
        </div>
        <form
          onSubmit={(event) => void handleWithdrawal(event)}
          className="space-y-4"
        >
          <h2 className="text-lg font-bold">Yêu cầu rút tiền</h2>
          <div>
            <label
              htmlFor="withdrawal-store"
              className="mb-2 block text-sm font-medium"
            >
              Shop phụ trách chi trả
            </label>
            <select
              id="withdrawal-store"
              value={storeId}
              onChange={(event) => setStoreId(event.target.value)}
              required
              disabled={loading || submitting}
              className="w-full rounded-xl border border-line bg-white px-4 py-3 focus:border-brand"
            >
              <option value="">Chọn shop</option>
              {wallet?.stores.map((store) => (
                <option
                  key={store.storeId}
                  value={store.storeId}
                  disabled={!store.isActive}
                >
                  {store.storeName} — khả dụng{" "}
                  {formatMoney(store.availableBalance)}
                </option>
              ))}
            </select>
            {selectedStore && (
              <p className="mt-2 text-xs text-muted">
                Ví Chờ tại shop: {formatMoney(selectedStore.pendingBalance)}
              </p>
            )}
          </div>
          {wallet &&
            (toMinorUnits(wallet.unallocatedAvailableBalance) !== 0n ||
              toMinorUnits(wallet.unallocatedPendingBalance) !== 0n) && (
              <p className="rounded-xl border border-brand-border bg-brand-soft p-3 text-sm">
                Số dư lịch sử chưa phân bổ shop: khả dụng{" "}
                {formatMoney(wallet.unallocatedAvailableBalance)}, chờ{" "}
                {formatMoney(wallet.unallocatedPendingBalance)}. Cần đối soát
                trước khi rút phần này.
              </p>
            )}
          <div>
            <label
              htmlFor="withdrawal-amount"
              className="mb-2 block text-sm font-medium"
            >
              Số tiền (VNĐ)
            </label>
            <input
              id="withdrawal-amount"
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="Ví dụ: 500000.00"
              required
              maxLength={16}
              disabled={submitting || loading || !wallet?.canWithdraw}
              className="w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-brand disabled:bg-surface-sand"
            />
            <p className="mt-2 text-xs text-muted">
              Tối thiểu:{" "}
              {wallet ? formatMoney(wallet.minimumWithdrawalAmount) : "—"}
            </p>
          </div>
          <p className="text-sm text-muted">
            Tiền được trừ khỏi số dư khả dụng khi gửi yêu cầu. Đây chưa phải
            giao dịch ngân hàng đã hoàn tất.
          </p>
          {wallet && (
            <div className="rounded-xl border border-brand-border bg-brand-soft p-4 text-sm">
              <p className="text-xs text-muted">
                Theo quy tắc đồ án: rút từ{" "}
                {formatMoney(wallet.withdrawalTaxPolicy.threshold)} khấu trừ 10%
                thuế TNCN.
              </p>
              {validPreviewAmount && (
                <dl className="mt-3 space-y-2">
                  <div className="flex justify-between gap-3">
                    <dt>Tiền yêu cầu rút</dt>
                    <dd>{previewMoney(grossMinor)}</dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt>Thuế khấu trừ</dt>
                    <dd data-testid="withdrawal-tax-preview">
                      {previewMoney(taxMinor)}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3 font-bold">
                    <dt>Thực nhận dự kiến</dt>
                    <dd data-testid="withdrawal-net-preview">
                      {previewMoney(grossMinor - taxMinor)}
                    </dd>
                  </div>
                </dl>
              )}
              <p className="mt-2 text-xs text-muted">
                Số tiền chính thức được backend tính và lưu trong yêu cầu rút.
              </p>
            </div>
          )}
          <button
            type="submit"
            disabled={submitting || loading || !wallet?.canWithdraw}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-semibold text-white hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ArrowDownToLine size={18} />{" "}
            {submitting ? "Đang gửi yêu cầu…" : "Yêu cầu rút tiền"}
          </button>
          {wallet && !wallet.canWithdraw && (
            <p className="text-xs text-muted">
              Cần KYC đã xác minh, tài khoản ngân hàng đầy đủ và đủ số dư tối
              thiểu để rút tiền.
            </p>
          )}
        </form>
      </section>

      <section className="overflow-hidden rounded-2xl border border-line bg-white">
        <h2 className="p-6 text-lg font-bold">Lịch sử yêu cầu rút tiền</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-sand text-muted">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Mã yêu cầu
                </th>
                <th scope="col" className="px-6 py-3">
                  Shop
                </th>
                <th scope="col" className="px-6 py-3">
                  Thời gian
                </th>
                <th scope="col" className="px-6 py-3">
                  Số tiền
                </th>
                <th scope="col" className="px-6 py-3">
                  Trạng thái
                </th>
                <th scope="col" className="px-6 py-3">
                  Thuế
                </th>
                <th scope="col" className="px-6 py-3">
                  Thực nhận
                </th>
              </tr>
            </thead>
            <tbody>
              {history?.requests.map((request) => (
                <tr key={request.id} className="border-t border-line">
                  <td className="px-6 py-4 font-mono text-xs">{request.id}</td>
                  <td className="px-6 py-4">
                    {request.store?.name ?? "Chờ đối soát shop"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {new Date(request.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-semibold tabular-nums">
                    {formatMoney(request.amount)}
                  </td>
                  <td className="px-6 py-4">
                    <span className="whitespace-nowrap rounded-full border border-brand-border bg-brand-soft px-3 py-1 text-xs">
                      {STATUS_LABELS[request.status]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    {request.taxCalculated
                      ? formatMoney(request.taxAmount)
                      : "Chưa tính thuế"}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 font-semibold">
                    {request.taxCalculated
                      ? formatMoney(request.netAmount)
                      : "Chưa xác định"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!loading && history?.total === 0 && (
          <p className="p-6 text-sm text-muted">
            Bạn chưa có yêu cầu rút tiền.
          </p>
        )}
        <div className="flex items-center justify-between gap-3 border-t border-line p-4 text-sm">
          <span className="text-muted">
            Trang {page} · {history?.total ?? 0} yêu cầu
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page === 1 || loading || submitting}
              onClick={() => setPage((current) => current - 1)}
              className="rounded-lg border border-line px-3 py-2 disabled:opacity-40"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={
                !history ||
                page * history.limit >= history.total ||
                loading ||
                submitting
              }
              onClick={() => setPage((current) => current + 1)}
              className="rounded-lg border border-line px-3 py-2 disabled:opacity-40"
            >
              Sau
            </button>
          </div>
        </div>
      </section>
      <section className="overflow-hidden rounded-2xl border border-line bg-white">
        <h2 className="p-6 text-lg font-bold">Biến động tài chính gần nhất</h2>
        <div className="overflow-x-auto">
          <table
            className="w-full text-left text-sm"
            aria-label="Sổ cái tài chính"
          >
            <thead className="bg-surface-sand text-muted">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Thời gian
                </th>
                <th scope="col" className="px-4 py-3">
                  Giao dịch
                </th>
                <th scope="col" className="px-4 py-3">
                  Ngăn ví
                </th>
                <th scope="col" className="px-4 py-3">
                  Biến động
                </th>
                <th scope="col" className="px-4 py-3">
                  Số dư trước
                </th>
                <th scope="col" className="px-4 py-3">
                  Số dư sau
                </th>
                <th scope="col" className="px-4 py-3">
                  Tham chiếu
                </th>
              </tr>
            </thead>
            <tbody>
              {ledger?.entries.map((entry) => (
                <tr key={entry.id} className="border-t border-line">
                  <td className="whitespace-nowrap px-4 py-4">
                    {new Date(entry.createdAt).toLocaleString("vi-VN")}
                  </td>
                  <td className="px-4 py-4">
                    {TRANSACTION_LABELS[entry.transactionType]}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {entry.balanceBucket === "PENDING"
                      ? "Ví Chờ"
                      : "Ví Khả Dụng"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4 font-semibold">
                    {Number(entry.amount) > 0 ? "+" : ""}
                    {formatMoney(entry.amount)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {formatMoney(entry.balanceBefore)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-4">
                    {formatMoney(entry.balanceAfter)}
                  </td>
                  <td className="px-4 py-4 font-mono text-xs">
                    {entry.referenceType ?? "Dữ liệu cũ"}
                    <br />
                    {entry.referenceId ?? "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="p-4 text-xs text-muted">
          Hiển thị {ledger?.entries.length ?? 0} / {ledger?.total ?? 0} bản ghi.
          Sổ cái chỉ ghi thêm, không sửa hoặc xóa lịch sử.
        </p>
      </section>
        </>
      )}
    </div>
  );
}
