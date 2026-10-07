import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Clock3,
  RefreshCw,
  ShieldCheck,
  Wallet,
  Share2,
  Landmark,
  Loader2,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Copy,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Store,
  Sparkles,
  Receipt,
  ReceiptText,
  Plus,
} from "lucide-react";
import KycSubmissionPage from "./KycSubmissionPage";
import SocialChannelsPage from "./SocialChannelsPage";
import { walletService } from "../../services/wallet.service";
import { kycService } from "../../services/kyc.service";
import { toast } from "../../utils/toast";
import { cn } from "../../utils/cn";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { BankSelectorModal } from "../../components/bank/BankSelectorModal";
import { Select } from "../../components/ui/Select";
import { type VietQrBank, findBankByQuery, VIETNAM_BANKS } from "../../constants/vietnamBanks";
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
  const [isWithdrawHistoryCollapsed, setIsWithdrawHistoryCollapsed] = useState(false);
  const [isLedgerCollapsed, setIsLedgerCollapsed] = useState(false);
  const [page, setPage] = useState(1);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const submissionInFlight = useRef(false);
  const loadSequence = useRef(0);

  const defaultBank = VIETNAM_BANKS.find((b) => b.shortName === "MBBank") || VIETNAM_BANKS[0];
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [showAddBankForm, setShowAddBankForm] = useState(false);
  const [selectedBank, setSelectedBank] = useState<VietQrBank>(defaultBank);
  const [accountNumberInput, setAccountNumberInput] = useState("");
  const [accountNameInput, setAccountNameInput] = useState("");
  const [savingBank, setSavingBank] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDisconnectConfirmOpen, setIsDisconnectConfirmOpen] = useState(false);

  const handleCopyId = (id: string, label: string = 'mã') => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    toast.success(`Đã sao chép ${label}: ${id.slice(0, 12)}...`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDisconnectBank = () => {
    setIsDisconnectConfirmOpen(true);
  };

  const handleConfirmDisconnectBank = async () => {
    setSavingBank(true);
    try {
      await walletService.disconnectBankAccount();
      toast.success("Đã ngừng sử dụng tài khoản nhận tiền.");
      setAccountNumberInput("");
      await loadWallet();
      setIsDisconnectConfirmOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Lỗi cập nhật tài khoản");
    } finally {
      setSavingBank(false);
    }
  };

  const handleBankChosen = (bank: VietQrBank) => {
    setSelectedBank(bank);
    setShowAddBankForm(true);
    setIsBankModalOpen(false);
    toast.info(`Đã chọn ${bank.shortName}. Vui lòng nhập số tài khoản bên dưới để hoàn tất.`);
  };

  const handleSaveBankInfo = async (e: FormEvent) => {
    e.preventDefault();
    const bankToSave = selectedBank || defaultBank;
    if (!accountNumberInput.trim() || !accountNameInput.trim()) {
      toast.error("Vui lòng nhập đầy đủ số tài khoản và họ tên chủ tài khoản");
      return;
    }
    setSavingBank(true);
    try {
      const p = await kycService.getMyKyc().catch(() => null);
      await kycService.submitKyc({
        idCardNumber: p?.idCardNumber || "001200000000",
        taxCode: p?.taxCode || "",
        bankName: `${bankToSave.shortName} (${bankToSave.name})`,
        bankAccountNumber: accountNumberInput.trim(),
        bankAccountName: accountNameInput.trim().toUpperCase(),
        bio: p?.bio,
        platform: (p?.socialLinksJson?.platform as any) || "TIKTOK",
        channelName: p?.socialLinksJson?.channelName,
        channelUrl: p?.socialLinksJson?.channelUrl,
        followerCount: p?.socialLinksJson?.followerCount,
      });
      toast.success("Đăng ký tài khoản nhận tiền thành công!");
      await loadWallet();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || "Lỗi lưu tài khoản");
    } finally {
      setSavingBank(false);
    }
  };

  const handleCancelAddBank = () => {
    setAccountNumberInput("");
    setShowAddBankForm(false);
  };

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
      toast.error("Vui lòng chọn gian hàng phụ trách chi trả.");
      setError("Chọn shop có số dư khả dụng để rút tiền.");
      return;
    }
    if (!wallet.bankAccount) {
      toast.error("Vui lòng liên kết tài khoản ngân hàng thụ hưởng trước khi tạo yêu cầu rút.");
      setError("Vui lòng liên kết tài khoản ngân hàng thụ hưởng trước khi tạo yêu cầu rút.");
      return;
    }
    if (wallet.kycStatus !== 'VERIFIED') {
      toast.error("Hồ sơ KYC cần được phê duyệt trước khi tạo yêu cầu rút tiền.");
      setError("Hồ sơ KYC cần được phê duyệt trước khi tạo yêu cầu rút tiền.");
      return;
    }
    const normalizedAmount = amount.trim();
    if (!/^\d{1,13}(\.\d{1,2})?$/.test(normalizedAmount)) {
      toast.error("Nhập số tiền hợp lệ, không có dấu phân cách hàng nghìn.");
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
      toast.error(`Số tiền rút tối thiểu là ${formatMoney(wallet.minimumWithdrawalAmount)}.`);
      setError(
        `Số tiền rút tối thiểu là ${formatMoney(wallet.minimumWithdrawalAmount)}.`,
      );
      return;
    }
    if (minorUnits > toMinorUnits(wallet.availableBalance)) {
      toast.error("Số dư khả dụng trên ví không đủ để thực hiện rút tiền.");
      setError("Số dư khả dụng không đủ để thực hiện rút tiền.");
      return;
    }
    if (minorUnits > toMinorUnits(selectedStore.availableBalance)) {
      toast.error(`Số dư khả dụng tại ${selectedStore.storeName} không đủ (${formatMoney(selectedStore.availableBalance)}).`);
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
          <div className="text-xs font-bold text-ink">Ví hoa hồng & Rút tiền</div>
        </div>

        <div className="flex items-center gap-4 sm:gap-5 w-full sm:w-auto justify-end flex-wrap">
          <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto">
            <button
              onClick={() => setSearchParams({ tab: 'wallet' })}
              className={`flex items-center gap-1.5 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap select-none ${
                activeTab === 'wallet'
                  ? 'text-[#B88E4F] border-b-2 border-[#B88E4F]'
                  : 'text-[#7D715E] hover:text-[#1A1612] border-b-2 border-transparent'
              }`}
              id="tab-btn-wallet"
            >
              <Wallet className="w-3.5 h-3.5 text-[#B88E4F]" />
              <span>Ví & Rút Tiền</span>
            </button>

            <button
              onClick={() => setSearchParams({ tab: 'kyc' })}
              className={`flex items-center gap-1.5 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap select-none ${
                activeTab === 'kyc'
                  ? 'text-[#B88E4F] border-b-2 border-[#B88E4F]'
                  : 'text-[#7D715E] hover:text-[#1A1612] border-b-2 border-transparent'
              }`}
              id="tab-btn-kyc"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#B88E4F]" />
              <span>Hồ Sơ KYC</span>
            </button>

            <button
              onClick={() => setSearchParams({ tab: 'social' })}
              className={`flex items-center gap-1.5 py-1 text-xs font-bold transition-all cursor-pointer whitespace-nowrap select-none ${
                activeTab === 'social'
                  ? 'text-[#B88E4F] border-b-2 border-[#B88E4F]'
                  : 'text-[#7D715E] hover:text-[#1A1612] border-b-2 border-transparent'
              }`}
              id="tab-btn-social"
            >
              <Share2 className="w-3.5 h-3.5 text-[#B88E4F]" />
              <span>Kênh Mạng Xã Hội</span>
            </button>
          </div>

          {activeTab === 'wallet' && (
            <button
              type="button"
              aria-label="Tải lại ví"
              onClick={() => void loadWallet()}
              disabled={loading || submitting}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7D715E] hover:text-[#1A1612] transition cursor-pointer disabled:opacity-50 shrink-0 select-none"
              title="Tải lại số dư ví và giao dịch"
            >
              <RefreshCw size={13} className={`text-brand-strong ${loading ? 'animate-spin' : ''}`} />
              <span>Tải lại</span>
            </button>
          )}
        </div>
      </div>

      {activeTab === 'kyc' && <KycSubmissionPage />}
      {activeTab === 'social' && <SocialChannelsPage />}
      {activeTab === 'wallet' && (
        <>

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

      <section className="grid gap-3 sm:grid-cols-2" aria-busy={loading}>
        {/* Card 1: Số dư khả dụng */}
        <div className="relative overflow-hidden rounded-2xl border border-[#EEDFC6] bg-white p-3.5 sm:p-4 shadow-2xs hover:border-[#C59B58] transition-all group">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center text-[#B88E4F] shrink-0 group-hover:scale-105 transition-transform">
                <Wallet className="w-4 h-4 text-[#B88E4F]" />
              </div>
              <span className="text-xs font-bold text-[#7D715E] truncate">Số dư khả dụng</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] shrink-0">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              <span>Sẵn sàng rút</span>
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <div className="text-xl sm:text-2xl font-extrabold text-[#1A1612] font-mono tracking-tight tabular-nums">
              {wallet ? formatMoney(wallet.availableBalance) : "—"}
            </div>
          </div>

          <p className="mt-1 text-[11px] text-[#7D715E] line-clamp-1">
            Có thể tạo yêu cầu rút về ngân hàng ngay lập tức.
          </p>
        </div>

        {/* Card 2: Số dư chờ duyệt */}
        <div className="relative overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white p-3.5 sm:p-4 shadow-2xs hover:border-[#C59B58]/60 transition-all group">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] flex items-center justify-center text-[#B88E4F] shrink-0 group-hover:scale-105 transition-transform">
                <Clock3 className="w-4 h-4 text-[#B88E4F]" />
              </div>
              <span className="text-xs font-bold text-[#7D715E] truncate">Số dư chờ duyệt</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] shrink-0">
              <Clock className="w-2.5 h-2.5" />
              <span>Đang đối soát</span>
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline justify-between gap-2">
            <div className="text-xl sm:text-2xl font-extrabold text-[#1A1612] font-mono tracking-tight tabular-nums">
              {wallet ? formatMoney(wallet.pendingBalance) : "—"}
            </div>
          </div>

          <p className="mt-1 text-[11px] text-[#7D715E] line-clamp-1">
            Tự động mở khóa sau chu kỳ đối soát đơn hàng an toàn.
          </p>
        </div>
      </section>

      {/* SECTION TÀI KHOẢN NHẬN TIỀN & YÊU CẦU RÚT TIỀN (TIKTOK SHOP & SHOPEE CREATOR COMPACT STYLE) */}
      <section className="grid gap-5 lg:grid-cols-2">
        {/* Cột 1: Quản lý tài khoản ngân hàng thụ hưởng (VietQR) */}
        <div className="rounded-2xl border border-[#EEDFC6] bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between">
          <div>
            {/* Header: Tiêu đề + Badge bảo mật */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EAE4D7]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FAF8F5] border border-[#EEDFC6] flex items-center justify-center text-[#B88E4F] shrink-0">
                  <Landmark className="w-3.5 h-3.5 text-[#B88E4F]" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-[#1A1612] m-0">
                  Tài khoản nhận tiền
                </h2>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7D715E] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#EAE4D7]">
                <ShieldCheck className="w-3 h-3 text-[#B88E4F]" />
                <span>VietQR 65+</span>
              </span>
            </div>

            {/* Khi ĐÃ có tài khoản ngân hàng */}
            {wallet?.bankAccount && !showAddBankForm && (
              <div className="mt-3.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5]/50 p-3.5 sm:p-4 hover:border-[#C59B58]/50 transition">
                {(() => {
                  const bankMatch = findBankByQuery(wallet.bankAccount.bankName);
                  return (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Logo ngân hàng */}
                          <div className="w-10 h-10 rounded-xl bg-white border border-[#EAE4D7] flex items-center justify-center p-1.5 shrink-0 shadow-2xs">
                            {bankMatch?.logo ? (
                              <img
                                src={bankMatch.logo}
                                alt={bankMatch.shortName}
                                className="max-w-full max-h-full object-contain"
                              />
                            ) : (
                              <Landmark className="w-5 h-5 text-[#B88E4F]" />
                            )}
                          </div>

                          {/* Thông tin số tài khoản & tên chủ sở hữu */}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-xs sm:text-sm text-[#1A1612]">
                                {bankMatch ? bankMatch.shortName : wallet.bankAccount.bankName}
                              </span>
                              {bankMatch?.bin && (
                                <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F]">
                                  BIN: {bankMatch.bin}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="font-mono text-xs sm:text-sm font-extrabold text-[#1A1612] tracking-wider">
                                {wallet.bankAccount.maskedAccountNumber}
                              </span>
                              <span className="text-[#A89E90]">·</span>
                              <span className="text-xs uppercase font-medium text-[#7D715E] truncate">
                                {wallet.bankAccount.accountName}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Badge Trạng thái KYC / Xác minh */}
                        <div className="shrink-0">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold",
                              wallet.kycStatus === 'VERIFIED'
                                ? "bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]"
                                : "bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]"
                            )}
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full", wallet.kycStatus === 'VERIFIED' ? "bg-[#10B981]" : "bg-[#D97706]")} />
                            <span>{wallet.kycStatus === 'VERIFIED' ? 'Đã xác minh' : 'Chờ xác minh'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Phân cách & Nút Thao tác */}
                      <div className="border-t border-[#EAE4D7] mt-3 pt-2.5 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-[#7D715E]">
                          Nhận chuyển khoản tự động 24/7
                        </span>
                        <div className="flex items-center gap-3 font-semibold">
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddBankForm(true);
                              setIsBankModalOpen(true);
                            }}
                            className="text-[#7D715E] hover:text-[#B88E4F] transition cursor-pointer"
                          >
                            Đổi tài khoản
                          </button>
                          <span className="text-[#EAE4D7]">|</span>
                          <button
                            type="button"
                            onClick={() => void handleDisconnectBank()}
                            disabled={savingBank}
                            className="text-[#DC2626] hover:text-red-700 transition cursor-pointer disabled:opacity-50"
                          >
                            {savingBank ? "Đang xử lý..." : "Ngừng dùng"}
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Khi CHƯA có tài khoản hoặc đang thu gọn: Nút Thêm mới chuẩn TikTok Shop */}
            {!wallet?.bankAccount && !showAddBankForm && (
              <button
                type="button"
                onClick={() => setShowAddBankForm(true)}
                className="mt-3.5 w-full p-3.5 sm:p-4 rounded-xl border border-dashed border-[#EEDFC6] hover:border-[#C59B58] bg-[#FAF8F5]/80 hover:bg-[#F3EFE6]/60 transition-all flex items-center justify-between gap-3 text-left group cursor-pointer shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-white border border-[#EEDFC6] flex items-center justify-center text-[#B88E4F] group-hover:scale-105 transition-transform shrink-0 shadow-2xs">
                    <Landmark className="w-5 h-5 text-[#B88E4F]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-[#1A1612] group-hover:text-[#B88E4F] transition-colors">
                      Liên kết tài khoản ngân hàng nhận tiền
                    </div>
                    <p className="text-[11px] text-[#7D715E] mt-0.5 truncate m-0">
                      Tự động đối soát chi trả hoa hồng qua hệ thống VietQR 65+ ngân hàng
                    </p>
                  </div>
                </div>
                <div className="shrink-0 px-2.5 py-1 rounded-lg bg-[#C59B58] group-hover:bg-[#B88E4F] text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs">
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Thêm ngay</span>
                </div>
              </button>
            )}

            {/* Form Thêm/Đổi tài khoản ngân hàng (Thiết kế tinh gọn, chuẩn e-commerce) */}
            {showAddBankForm && (
              <div className="mt-3.5 rounded-xl border border-[#EEDFC6] bg-[#FAF8F5]/40 p-3.5 sm:p-4">
                <div className="flex items-center justify-between pb-2.5 border-b border-[#EAE4D7]">
                  <h3 className="text-xs sm:text-sm font-bold text-[#1A1612] m-0">
                    {wallet?.bankAccount ? "Cập nhật tài khoản thụ hưởng" : "Thêm tài khoản ngân hàng nhận tiền"}
                  </h3>
                  <button
                    type="button"
                    onClick={handleCancelAddBank}
                    className="text-xs font-medium text-[#7D715E] hover:text-[#DC2626] transition cursor-pointer"
                  >
                    Hủy bỏ
                  </button>
                </div>

                <form onSubmit={handleSaveBankInfo} className="mt-3 space-y-3">
                  {/* Ngân hàng đã chọn */}
                  <div>
                    <label className="text-[11px] font-bold text-[#7D715E] uppercase tracking-wider block mb-1">
                      Ngân hàng thụ hưởng
                    </label>
                    <div className="rounded-xl border border-[#EAE4D7] bg-white p-2.5 sm:p-3 flex items-center justify-between gap-2.5 shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#EAE4D7] flex items-center justify-center p-1 shrink-0">
                          {selectedBank?.logo ? (
                            <img
                              src={selectedBank.logo}
                              alt={selectedBank.shortName}
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : (
                            <Landmark className="w-4 h-4 text-[#B88E4F]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs sm:text-sm text-[#1A1612]">
                              {selectedBank?.shortName || "MBBank"}
                            </span>
                            <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F]">
                              BIN: {selectedBank?.bin || "970422"}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#7D715E] truncate m-0">
                            {selectedBank?.name || "Ngân hàng TMCP Quân đội"}
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsBankModalOpen(true)}
                        className="px-2.5 py-1 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] hover:bg-[#F3EFE6] text-xs font-semibold text-[#1A1612] transition shadow-2xs shrink-0 cursor-pointer flex items-center gap-1"
                      >
                        <span>Đổi</span>
                        <ChevronRight className="w-3 h-3 text-[#7D715E]" />
                      </button>
                    </div>
                  </div>

                  {/* 2 Trường nhập liệu nhỏ gọn song song trên tablet/desktop */}
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    <div>
                      <label className="text-[11px] font-bold text-[#7D715E] uppercase tracking-wider block mb-1">
                        Tên chủ tài khoản
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: NGUYEN VAN A"
                        value={accountNameInput}
                        onChange={(e) => setAccountNameInput(e.target.value.toUpperCase())}
                        className="w-full h-9 sm:h-9.5 px-3 bg-white border border-[#EAE4D7] rounded-xl text-xs sm:text-sm font-bold uppercase text-[#1A1612] placeholder:text-[#A89E90] placeholder:font-normal placeholder:normal-case outline-none focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58]/20 transition"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-[#7D715E] uppercase tracking-wider block mb-1">
                        Số tài khoản
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="VD: 0987654321..."
                        value={accountNumberInput}
                        onChange={(e) => setAccountNumberInput(e.target.value.trim())}
                        className="w-full h-9 sm:h-9.5 px-3 bg-white border border-[#EAE4D7] rounded-xl text-xs sm:text-sm font-mono font-bold text-[#1A1612] placeholder:text-[#A89E90] placeholder:font-normal outline-none focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58]/20 transition"
                      />
                    </div>
                  </div>

                  {/* Nút Đăng ký tài khoản */}
                  <button
                    type="submit"
                    disabled={savingBank}
                    className="w-full h-9.5 sm:h-10 bg-[#C59B58] hover:bg-[#B88E4F] text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {savingBank ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <span>Lưu thông tin tài khoản</span>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        {/* Cột 2: Form Tạo yêu cầu rút tiền (Shopee / TikTok Creator Studio Standard) */}
        <form
          onSubmit={(event) => void handleWithdrawal(event)}
          className="rounded-2xl border border-[#EEDFC6] bg-white p-4 sm:p-5 shadow-2xs flex flex-col justify-between"
        >
          <div className="space-y-3">
            {/* Header: Tiêu đề + Giới hạn rút tối thiểu */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EAE4D7]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#FAF8F5] border border-[#EEDFC6] flex items-center justify-center text-[#B88E4F] shrink-0">
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#B88E4F]" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-[#1A1612] m-0">
                  Yêu cầu rút tiền
                </h2>
              </div>
              <span className="text-[11px] font-semibold text-[#7D715E] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#EAE4D7]">
                Tối thiểu: <strong className="text-[#1A1612] font-mono">{wallet ? formatMoney(wallet.minimumWithdrawalAmount) : "200.000 ₫"}</strong>
              </span>
            </div>

            {/* Shop phụ trách chi trả */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="withdrawal-store"
                  className="text-[11px] font-bold text-[#7D715E] uppercase tracking-wider"
                >
                  Gian hàng phụ trách chi trả
                </label>
                {selectedStore && (
                  <span className="text-[11px] font-semibold text-[#B88E4F] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Ví chờ: {formatMoney(selectedStore.pendingBalance)}</span>
                  </span>
                )}
              </div>
              <Select
                id="withdrawal-store"
                value={storeId}
                onChange={(event) => setStoreId(event.target.value)}
                required
                disabled={loading || submitting}
                className="w-full h-9.5 sm:h-10 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5]/40 hover:bg-white focus:bg-white px-3 text-xs sm:text-sm text-[#1A1612] focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58]/20 outline-none transition"
              >
                <option value="">
                  -- Chọn gian hàng muốn rút hoa hồng --
                </option>
                {wallet?.stores.map((store) => (
                  <option
                    key={store.storeId}
                    value={store.storeId}
                    disabled={!store.isActive}
                  >
                    {store.storeName} — Khả dụng: {formatMoney(store.availableBalance)}
                  </option>
                ))}
              </Select>
            </div>

            {/* Số tiền rút + Nút rút toàn bộ */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="withdrawal-amount"
                  className="text-[11px] font-bold text-[#7D715E] uppercase tracking-wider"
                >
                  Số tiền muốn rút (VNĐ)
                </label>
                {selectedStore && Number(selectedStore.availableBalance) > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      // Điền toàn bộ số dư khả dụng
                      const raw = selectedStore.availableBalance.replace(/[^0-9.]/g, '');
                      setAmount(raw);
                    }}
                    className="text-[11px] font-bold text-[#B88E4F] hover:text-[#1A1612] transition cursor-pointer select-none"
                  >
                    Rút toàn bộ ({formatMoney(selectedStore.availableBalance)})
                  </button>
                )}
              </div>

              <div className="relative">
                <input
                  id="withdrawal-amount"
                  type="text"
                  inputMode="decimal"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  placeholder="VD: 500000"
                  required
                  maxLength={16}
                  disabled={submitting || loading}
                  className="w-full h-10 px-3.5 pr-14 bg-white rounded-xl border border-[#EAE4D7] font-mono text-sm font-bold text-[#1A1612] placeholder:text-[#A89E90] placeholder:font-normal outline-none focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58]/20 transition disabled:bg-[#FAF8F5]"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-mono font-bold text-[#7D715E] pointer-events-none select-none">
                  VNĐ
                </span>
              </div>

              {/* Quick shortcut pills (Shopee / TikTok Style) */}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10.5px] text-[#7D715E] font-medium mr-0.5">Gợi ý nhanh:</span>
                {[200000, 500000, 1000000].map((quickVal) => (
                  <button
                    key={quickVal}
                    type="button"
                    onClick={() => setAmount(quickVal.toString())}
                    disabled={submitting || loading}
                    className="px-2 py-0.5 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] hover:bg-[#F3EFE6] text-[10.5px] font-mono font-semibold text-[#1A1612] transition cursor-pointer disabled:opacity-40"
                  >
                    {new Intl.NumberFormat("vi-VN").format(quickVal)} ₫
                  </button>
                ))}
              </div>
            </div>

            {/* Bảng tính thực nhận dự kiến & thuế khấu trừ TNCN */}
            {wallet && validPreviewAmount && (
              <div className="rounded-xl border border-[#EEDFC6] bg-[#FAF8F5] p-3 text-xs space-y-1.5">
                <div className="flex justify-between gap-3 text-xs text-[#7D715E]">
                  <span>Yêu cầu rút</span>
                  <span className="font-semibold font-mono text-[#1A1612]">{previewMoney(grossMinor)}</span>
                </div>
                {taxMinor > 0n && (
                  <div className="flex justify-between gap-3 text-xs text-[#7D715E]">
                    <span className="flex items-center gap-1">
                      <span>Thuế TNCN khấu trừ (10%)</span>
                      <span className="text-[10px] text-[#A89E90]">(từ {formatMoney(wallet.withdrawalTaxPolicy.threshold)})</span>
                    </span>
                    <span className="font-semibold font-mono text-[#DC2626]" data-testid="withdrawal-tax-preview">
                      -{previewMoney(taxMinor)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center gap-3 text-xs sm:text-sm font-bold border-t border-[#EEDFC6] pt-1.5">
                  <span className="text-[#1A1612]">Thực nhận về ngân hàng</span>
                  <span className="font-mono text-sm sm:text-base font-extrabold text-[#B88E4F]" data-testid="withdrawal-net-preview">
                    {previewMoney(grossMinor - taxMinor)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Nút gửi yêu cầu & Chú thích */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={submitting || loading}
              className="w-full h-10 sm:h-11 rounded-xl bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#A77D3E] text-white font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUpRight className="w-4 h-4" />
              )}
              <span>{submitting ? "Đang gửi yêu cầu..." : "Gửi yêu cầu rút tiền"}</span>
            </button>
            {wallet && !wallet.canWithdraw && (
              <div className="mt-2 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EEDFC6] text-[11px] text-[#7D715E] space-y-1">
                {!wallet.bankAccount && (
                  <p className="m-0 text-[#D97706] font-semibold flex items-center gap-1">
                    <span>⚠️</span>
                    <span>Chưa liên kết tài khoản ngân hàng nhận tiền.</span>
                  </p>
                )}
                {wallet.kycStatus !== 'VERIFIED' && (
                  <p className="m-0 text-[#D97706] font-semibold flex items-center gap-1">
                    <span>⚠️</span>
                    <span>Hồ sơ định danh KYC cần được thẩm định trước khi rút tiền.</span>
                  </p>
                )}
                {selectedStore && Number(selectedStore.availableBalance) < Number(wallet.minimumWithdrawalAmount) && (
                  <p className="m-0 text-[#7D715E]">
                    ℹ️ Số dư khả dụng tại shop này hiện là <strong className="font-mono text-[#1A1612]">{formatMoney(selectedStore.availableBalance)}</strong> (Cần tối thiểu {formatMoney(wallet.minimumWithdrawalAmount)} để thực hiện lệnh rút).
                  </p>
                )}
              </div>
            )}
          </div>
        </form>
      </section>


              {/* 1. LỊCH SỬ YÊU CẦU RÚT TIỀN (FINTECH & TIKTOK/SHOPEE COMPACT E-COMMERCE STYLE) */}
      <section className="overflow-hidden rounded-2xl border border-[#EEDFC6] bg-white shadow-2xs">
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5 border-b border-[#EAE4D7] bg-[#FAF8F5]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#EEDFC6] flex items-center justify-center text-[#B88E4F] shrink-0 shadow-2xs">
              <Receipt className="w-4 h-4 text-[#B88E4F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-[#1A1612] m-0">
                  Lịch sử yêu cầu rút tiền
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F]">
                  {history?.total ?? 0} yêu cầu
                </span>
              </div>
              <p className="text-[11px] text-[#7D715E] m-0">
                Theo dõi tiến trình xét duyệt và đối soát chi trả tiền về tài khoản ngân hàng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadWallet()}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[#EAE4D7] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#7D715E] hover:text-[#1A1612] transition shadow-2xs cursor-pointer select-none"
            >
              <RefreshCw className={cn("w-3 h-3 text-[#B88E4F]", loading && "animate-spin")} />
              <span>Làm mới</span>
            </button>

            <button
              type="button"
              onClick={() => setIsWithdrawHistoryCollapsed((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#EAE4D7] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#7D715E] hover:text-[#1A1612] transition shadow-2xs cursor-pointer select-none"
              title={isWithdrawHistoryCollapsed ? "Mở rộng bảng lịch sử rút tiền" : "Thu gọn bảng lịch sử rút tiền"}
            >
              {isWithdrawHistoryCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span>Mở rộng</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span>Thu gọn</span>
                </>
              )}
            </button>
          </div>
        </div>

        {!isWithdrawHistoryCollapsed && (
          <>
            {/* Table Container */}
            <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#FAF8F5]/90 border-b border-[#EAE4D7] text-[10.5px] font-bold uppercase tracking-wider text-[#7D715E]">
              <tr>
                <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                  Mã yêu cầu
                </th>
                <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                  Gian hàng phụ trách
                </th>
                <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                  Thời gian
                </th>
                <th scope="col" className="px-4 py-2.5 text-right whitespace-nowrap">
                  Số tiền rút
                </th>
                <th scope="col" className="px-4 py-2.5 text-right whitespace-nowrap">
                  Thuế TNCN (10%)
                </th>
                <th scope="col" className="px-4 py-2.5 text-right whitespace-nowrap">
                  Thực nhận
                </th>
                <th scope="col" className="px-4 py-2.5 text-center whitespace-nowrap">
                  Trạng thái
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE4D7]">
              {history?.requests.map((request) => {
                const reqDate = new Date(request.createdAt);
                const isApproved = request.status === 'APPROVED';
                const isPending = request.status === 'PENDING';
                const isProcessing = request.status === 'PROCESSING';
                const isRejected = request.status === 'REJECTED';

                return (
                  <tr
                    key={request.id}
                    className="hover:bg-[#FAF8F5]/80 transition-colors group"
                  >
                    {/* Mã yêu cầu với nút copy */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-xs font-bold text-[#1A1612] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#EAE4D7]">
                          #{request.id.slice(0, 8)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyId(request.id, 'mã yêu cầu')}
                          className="w-5 h-5 rounded flex items-center justify-center text-[#7D715E] hover:text-[#B88E4F] hover:bg-white transition cursor-pointer"
                          title="Sao chép toàn bộ mã yêu cầu"
                        >
                          {copiedId === request.id ? (
                            <Check className="w-3 h-3 text-[#059669]" />
                          ) : (
                            <Copy className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Shop */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 max-w-[200px]">
                        <div className="w-6 h-6 rounded-md bg-[#FAF8F5] border border-[#EAE4D7] flex items-center justify-center shrink-0 text-[#B88E4F]">
                          <Store className="w-3 h-3" />
                        </div>
                        <span className="font-semibold text-xs text-[#1A1612] truncate">
                          {request.store?.name ?? "Chờ đối soát shop"}
                        </span>
                      </div>
                    </td>

                    {/* Thời gian */}
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <div className="text-xs leading-tight">
                        <span className="font-semibold text-[#1A1612] block">
                          {reqDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        </span>
                        <span className="text-[10.5px] text-[#7D715E] font-mono inline-flex items-center gap-0.5 mt-0.5">
                          <Clock className="w-2.5 h-2.5 text-[#B88E4F]" />
                          {reqDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </td>

                    {/* Số tiền rút */}
                    <td className="whitespace-nowrap px-4 py-2.5 text-right">
                      <span className="font-mono text-xs sm:text-[13px] font-bold text-[#1A1612] tabular-nums">
                        {formatMoney(request.amount)}
                      </span>
                    </td>

                    {/* Thuế */}
                    <td className="whitespace-nowrap px-4 py-2.5 text-right">
                      {request.taxCalculated ? (
                        <div className="text-xs font-mono tabular-nums leading-tight text-[#DC2626]">
                          <span>-{formatMoney(request.taxAmount)}</span>
                          <span className="text-[9.5px] text-[#7D715E] block font-sans">Khấu trừ 10%</span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-[#7D715E] italic">Chưa tính thuế</span>
                      )}
                    </td>

                    {/* Thực nhận */}
                    <td className="whitespace-nowrap px-4 py-2.5 text-right">
                      {request.taxCalculated ? (
                        <span className="font-mono text-xs sm:text-[13px] font-extrabold text-[#059669] tabular-nums bg-[#ECFDF5] px-2 py-0.5 rounded-md border border-[#A7F3D0]">
                          {formatMoney(request.netAmount)}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#7D715E]">Chưa xác định</span>
                      )}
                    </td>

                    {/* Trạng thái */}
                    <td className="whitespace-nowrap px-4 py-2.5 text-center">
                      {isPending && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] shadow-2xs">
                          <Clock className="w-2.5 h-2.5 text-[#B88E4F]" />
                          <span>{STATUS_LABELS.PENDING}</span>
                        </span>
                      )}
                      {isProcessing && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] shadow-2xs">
                          <RefreshCw className="w-2.5 h-2.5 text-[#2563EB] animate-spin" />
                          <span>{STATUS_LABELS.PROCESSING}</span>
                        </span>
                      )}
                      {isApproved && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0] shadow-2xs">
                          <CheckCircle2 className="w-2.5 h-2.5 text-[#059669]" />
                          <span>{STATUS_LABELS.APPROVED}</span>
                        </span>
                      )}
                      {isRejected && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] shadow-2xs">
                          <AlertCircle className="w-2.5 h-2.5 text-[#DC2626]" />
                          <span>{STATUS_LABELS.REJECTED}</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {!loading && history?.total === 0 && (
          <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7] flex items-center justify-center text-[#B88E4F] mb-2 shadow-2xs">
              <ReceiptText className="w-5 h-5 text-[#B88E4F]" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-[#1A1612] m-0">Chưa có yêu cầu rút tiền nào</h4>
            <p className="text-[11px] text-[#7D715E] mt-0.5 max-w-sm">
              Khi bạn gửi yêu cầu rút tiền từ ví hoa hồng, tiến trình xét duyệt sẽ hiển thị tại đây.
            </p>
          </div>
        )}

        {/* Pagination bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EAE4D7] bg-[#FAF8F5]/50 px-4 py-2 text-xs">
          <span className="text-[#7D715E] font-medium text-[11px]">
            Trang <strong className="text-[#1A1612]">{page}</strong> · Tổng <strong className="text-[#1A1612]">{history?.total ?? 0}</strong> yêu cầu
          </span>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              disabled={page <= 1 || loading || submitting}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-[#EAE4D7] bg-white px-2.5 py-1 text-xs font-semibold text-[#1A1612] hover:bg-[#FAF8F5] transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>Trước</span>
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
              className="inline-flex items-center gap-1 rounded-lg border border-[#EAE4D7] bg-white px-2.5 py-1 text-xs font-semibold text-[#1A1612] hover:bg-[#FAF8F5] transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <span>Sau</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
          </>
        )}
      </section>

      {/* 2. BIẾN ĐỘNG TÀI CHÍNH GẦN NHẤT (SỔ CÁI MINH BẠCH - APPEND-ONLY LEDGER) */}
      <section className="overflow-hidden rounded-2xl border border-[#EEDFC6] bg-white shadow-2xs mt-4">
        {/* Card Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5 border-b border-[#EAE4D7] bg-[#FAF8F5]/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white border border-[#EEDFC6] flex items-center justify-center text-[#B88E4F] shrink-0 shadow-2xs">
              <Sparkles className="w-4 h-4 text-[#B88E4F]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-extrabold text-[#1A1612] m-0">
                  Biến động tài chính gần nhất
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F]">
                  {ledger?.total ?? 0} giao dịch
                </span>
              </div>
              <p className="text-[11px] text-[#7D715E] m-0">
                Sổ cái thời gian thực ghi nhận biến động số dư Ví Chờ và Ví Khả Dụng
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#FBF5EB] border border-[#EEDFC6] text-[10.5px] font-bold text-[#B88E4F]">
              <ShieldCheck className="w-3 h-3 text-[#B88E4F]" />
              <span>Sổ cái bất biến (Ledger)</span>
            </span>

            <button
              type="button"
              onClick={() => setIsLedgerCollapsed((prev) => !prev)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#EAE4D7] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#7D715E] hover:text-[#1A1612] transition shadow-2xs cursor-pointer select-none"
              title={isLedgerCollapsed ? "Mở rộng bảng biến động tài chính" : "Thu gọn bảng biến động tài chính"}
            >
              {isLedgerCollapsed ? (
                <>
                  <ChevronDown className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span>Mở rộng</span>
                </>
              ) : (
                <>
                  <ChevronUp className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span>Thu gọn</span>
                </>
              )}
            </button>
          </div>
        </div>

        {!isLedgerCollapsed && (
          <>
            {/* Table Container */}
            <div className="overflow-x-auto">
          <table
            className="w-full text-left text-xs border-collapse"
            aria-label="Sổ cái tài chính"
          >
            <thead className="bg-[#FAF8F5]/90 border-b border-[#EAE4D7] text-[10.5px] font-bold uppercase tracking-wider text-[#7D715E]">
              <tr>
                <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                  Thời gian
                </th>
                <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                  Loại giao dịch
                </th>
                <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                  Ngăn ví
                </th>
                <th scope="col" className="px-4 py-2.5 text-right whitespace-nowrap">
                  Biến động số dư
                </th>
                <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                  Dòng tiền (Trước ➔ Sau)
                </th>
                <th scope="col" className="px-4 py-2.5 whitespace-nowrap">
                  Tham chiếu gốc
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE4D7]">
              {ledger?.entries.map((entry) => {
                const entryDate = new Date(entry.createdAt);
                const amt = Number(entry.amount);
                const isPositive = amt > 0;
                const isNegative = amt < 0;

                return (
                  <tr
                    key={entry.id}
                    className="hover:bg-[#FAF8F5]/80 transition-colors group"
                  >
                    {/* Thời gian */}
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <div className="text-xs leading-tight">
                        <span className="font-semibold text-[#1A1612] block">
                          {entryDate.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                        </span>
                        <span className="text-[10.5px] text-[#7D715E] font-mono inline-flex items-center gap-0.5 mt-0.5">
                          <Clock className="w-2.5 h-2.5 text-[#B88E4F]" />
                          {entryDate.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </td>

                    {/* Loại giao dịch */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      {entry.transactionType === "COMMISSION_PENDING" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6]">
                          <Clock3 className="w-3 h-3 text-[#B88E4F] shrink-0" />
                          <span>Ghi nhận hoa hồng chờ</span>
                        </span>
                      )}
                      {entry.transactionType === "COMMISSION_APPROVED" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
                          <CheckCircle2 className="w-3 h-3 text-[#059669] shrink-0" />
                          <span>Duyệt hoa hồng / Thưởng</span>
                        </span>
                      )}
                      {entry.transactionType === "PAYOUT_WITHDRAW" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FAF8F5] text-[#1A1612] border border-[#EAE4D7]">
                          <ArrowUpRight className="w-3 h-3 text-[#B88E4F] shrink-0" />
                          <span>Yêu cầu rút tiền</span>
                        </span>
                      )}
                      {entry.transactionType === "REVERSAL" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]">
                          <AlertCircle className="w-3 h-3 text-[#DC2626] shrink-0" />
                          <span>Thu hồi hoa hồng</span>
                        </span>
                      )}
                      {entry.transactionType === "PAYOUT_REJECT_REFUND" && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]">
                          <RefreshCw className="w-3 h-3 text-[#2563EB] shrink-0" />
                          <span>Hoàn tiền yêu cầu rút</span>
                        </span>
                      )}
                      {!["COMMISSION_PENDING", "COMMISSION_APPROVED", "PAYOUT_WITHDRAW", "REVERSAL", "PAYOUT_REJECT_REFUND"].includes(entry.transactionType) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FAF8F5] text-[#7D715E] border border-[#EAE4D7]">
                          <span>{TRANSACTION_LABELS[entry.transactionType] || entry.transactionType}</span>
                        </span>
                      )}
                    </td>

                    {/* Ngăn ví */}
                    <td className="whitespace-nowrap px-4 py-2.5">
                      {entry.balanceBucket === "PENDING" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#F3EFE6] text-[#7D715E] border border-[#EAE4D7]">
                          <Clock3 className="w-2.5 h-2.5 text-[#B88E4F]" />
                          <span>Ví Chờ</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6]">
                          <Wallet className="w-2.5 h-2.5 text-[#B88E4F]" />
                          <span>Ví Khả Dụng</span>
                        </span>
                      )}
                    </td>

                    {/* Biến động số dư */}
                    <td className="whitespace-nowrap px-4 py-2.5 text-right">
                      <span
                        className={cn(
                          "font-mono text-xs sm:text-[13px] font-extrabold tabular-nums inline-flex items-center gap-0.5",
                          isPositive && "text-[#059669]",
                          isNegative && "text-[#DC2626]",
                          !isPositive && !isNegative && "text-[#7D715E]"
                        )}
                      >
                        {isPositive && <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-[#059669]" />}
                        {isNegative && <ArrowDownLeft className="w-3.5 h-3.5 shrink-0 text-[#DC2626]" />}
                        <span>{isPositive ? "+" : ""}{formatMoney(entry.amount)}</span>
                      </span>
                    </td>

                    {/* Dòng tiền (Trước ➔ Sau) */}
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] tabular-nums text-[#7D715E]">
                        <span className="bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#EAE4D7]">
                          {formatMoney(entry.balanceBefore)}
                        </span>
                        <ArrowRight className="w-3 h-3 text-[#B88E4F] shrink-0" />
                        <span className="font-bold text-[#1A1612] bg-[#FAF8F5] px-1.5 py-0.5 rounded border border-[#EEDFC6]">
                          {formatMoney(entry.balanceAfter)}
                        </span>
                      </div>
                    </td>

                    {/* Tham chiếu gốc */}
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span className="px-1.5 py-0.5 rounded text-[9.5px] font-extrabold bg-[#FAF8F5] border border-[#EAE4D7] text-[#7D715E] tracking-wider uppercase">
                          {entry.referenceType ?? "Hệ thống"}
                        </span>
                        {entry.referenceId && (
                          <div className="flex items-center gap-0.5">
                            <span className="font-mono text-xs font-medium text-[#1A1612]">
                              #{entry.referenceId.slice(0, 8)}...
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyId(entry.referenceId!, 'mã tham chiếu')}
                              className="w-5 h-5 rounded flex items-center justify-center text-[#7D715E] hover:text-[#B88E4F] hover:bg-[#FAF8F5] transition cursor-pointer"
                              title="Sao chép toàn bộ mã tham chiếu"
                            >
                              {copiedId === entry.referenceId ? (
                                <Check className="w-3 h-3 text-[#059669]" />
                              ) : (
                                <Copy className="w-3 h-3 opacity-50 group-hover:opacity-100" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Empty state */}
        {(!ledger?.entries || ledger.entries.length === 0) && (
          <div className="py-8 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7] flex items-center justify-center text-[#B88E4F] mb-2 shadow-2xs">
              <Sparkles className="w-5 h-5 text-[#B88E4F]" />
            </div>
            <h4 className="text-xs sm:text-sm font-bold text-[#1A1612] m-0">Chưa ghi nhận biến động số dư</h4>
            <p className="text-[11px] text-[#7D715E] mt-0.5 max-w-sm">
              Mọi giao dịch phát sinh hoa hồng từ đơn hàng hoặc các lệnh rút tiền sẽ tự động được ghi nhận tại đây.
            </p>
          </div>
        )}

        {/* Audit footer notice */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#EAE4D7] bg-[#FAF8F5]/50 px-4 py-2 text-[11px] text-[#7D715E]">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#B88E4F] shrink-0" />
            <span>
              Sổ cái tài chính chuẩn mực (Append-only Ledger) — Dữ liệu bảo toàn vĩnh viễn, không thể chỉnh sửa.
            </span>
          </div>
          <span className="font-medium shrink-0">
            Hiển thị <strong className="text-[#1A1612]">{ledger?.entries.length ?? 0}</strong> / <strong className="text-[#1A1612]">{ledger?.total ?? 0}</strong> bản ghi
          </span>
        </div>
          </>
        )}
      </section>
        </>
      )}

      {/* Modal Chọn Danh Sách Ngân Hàng Việt Nam (Ảnh 2) */}
      <BankSelectorModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        onSelectBank={handleBankChosen}
        selectedBankName={wallet?.bankAccount?.bankName}
      />

      {/* Modal Xác nhận Ngừng sử dụng tài khoản ngân hàng chuẩn thương hiệu */}
      <ConfirmModal
        isOpen={isDisconnectConfirmOpen}
        onClose={() => !savingBank && setIsDisconnectConfirmOpen(false)}
        onConfirm={handleConfirmDisconnectBank}
        isLoading={savingBank}
        title="Ngừng sử dụng tài khoản ngân hàng"
        message="Bạn có chắc chắn muốn ngừng sử dụng tài khoản nhận tiền này? Sau khi gỡ, bạn có thể liên kết tài khoản ngân hàng mới bất kỳ lúc nào."
        confirmText="Ngừng sử dụng"
        variant="danger"
      />
    </div>
  );
}
