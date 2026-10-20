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
  Store,
  Sparkles,
  Receipt,
  ReceiptText,
  Plus,
} from "lucide-react";
import KycSubmissionPage from "./KycSubmissionPage";
import SocialChannelsPage from "./SocialChannelsPage";
import { walletService } from "../../services/wallet.service";
import { kycService, type KycProfile } from "../../services/kyc.service";
import { socialService, type SocialChannel } from "../../services/social.service";
import { toast } from "../../utils/toast";
import { cn } from "../../utils/cn";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { BankSelectorModal } from "../../components/bank/BankSelectorModal";
import './WalletPage.css';
import { WalletCooperationStores } from '../../components/wallet/WalletCooperationStores';
import { WalletSectionHeader } from '../../components/ui/WalletSectionHeader';

import { Select } from "../../components/ui/Select";
import { type VietQrBank, findBankByQuery, VIETNAM_BANKS } from "@/config/banks.config";
import type {
  PayoutStatus,
  WalletSummary,
  WithdrawalHistory,
  LedgerHistory,
  LedgerEntry,
} from "../../services/wallet.service";

const STATUS_LABELS: Record<PayoutStatus, string> = {
  PENDING: "Chờ xử lý",
  PROCESSING: "Chờ chuyển khoản",
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
  const [kycData, setKycData] = useState<{ profile: KycProfile; channels: SocialChannel[] } | null>(null);
  const [socialData, setSocialData] = useState<SocialChannel[] | null>(null);

  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [storeId, setStoreId] = useState("");
  const [history, setHistory] = useState<WithdrawalHistory | null>(null);
  const [ledger, setLedger] = useState<LedgerHistory | null>(null);
  const [isWithdrawHistoryCollapsed, setIsWithdrawHistoryCollapsed] = useState(true);
  const [isLedgerCollapsed, setIsLedgerCollapsed] = useState(true);
  const [page, setPage] = useState(1);
  const [ledgerPage, setLedgerPage] = useState(1);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const submissionInFlight = useRef(false);
  const reloadInFlight = useRef(false);
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

  const handleCopyId = async (id: string, label: string = 'mã') => {
    try {
      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      toast.success(`Đã sao chép ${label}: ${id.slice(0, 12)}...`);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      toast.error('Không thể sao chép. Vui lòng thử lại.');
    }
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
      const p = await kycService.getMyKyc();
      if (!p?.idCardNumber || !p.socialLinksJson?.frontCardUrl || !p.socialLinksJson?.backCardUrl) {
        toast.error('Vui lòng hoàn thiện CCCD và ảnh hai mặt trong Hồ sơ KYC trước khi liên kết ngân hàng.');
        setSearchParams({ tab: 'kyc' });
        return;
      }
      await walletService.updateBankAccount({
        bankName: `${bankToSave.shortName} (${bankToSave.name})`,
        bankAccountNumber: accountNumberInput.trim(),
        bankAccountName: accountNameInput.trim().toUpperCase(),
      });
      toast.success("Đăng ký tài khoản nhận tiền thành công!");
      setShowAddBankForm(false);
      setAccountNumberInput("");
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
        walletService.getMyLedger(ledgerPage),
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
  }, [page, ledgerPage]);

  const loadCurrentTab = useCallback(async () => {
    if (activeTab === 'wallet') {
      await loadWallet();
      return;
    }
    const sequence = ++loadSequence.current;
    setLoading(true);
    try {
      if (activeTab === 'kyc') {
        const [profile, channels] = await Promise.all([
          kycService.getMyKyc({ forceRefresh: true }),
          socialService.getMyChannels({ forceRefresh: true }),
        ]);
        if (sequence !== loadSequence.current) return;
        if (!profile || !Array.isArray(channels)) throw new Error('Dữ liệu hồ sơ KYC không hợp lệ.');
        setKycData({ profile, channels });
      } else if (activeTab === 'social') {
        const channels = await socialService.getMyChannels({ forceRefresh: true });
        if (sequence !== loadSequence.current) return;
        if (!Array.isArray(channels)) throw new Error('Dữ liệu danh sách kênh không hợp lệ.');
        setSocialData(channels);
      }
      setError('');
    } catch (err: unknown) {
      if (sequence === loadSequence.current) setError(getErrorMessage(err));
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [activeTab, loadWallet]);

  useEffect(() => {
    const sequenceRef = loadSequence;
    void loadCurrentTab();
    return () => { sequenceRef.current++; };
  }, [loadCurrentTab]);

  const isReloading = loading;
  const handleReload = async () => {
    if (isReloading || submitting || reloadInFlight.current) return;
    reloadInFlight.current = true;
    try {
      await loadCurrentTab();
    } finally {
      reloadInFlight.current = false;
    }
  };

  const validPreviewAmount = /^\d{1,13}(\.\d{1,2})?$/.test(amount.trim());
  const selectedStore = wallet?.stores.find(
    (store) => store.storeId === storeId,
  );
  const grossMinor = validPreviewAmount ? toMinorUnits(amount.trim()) : 0n;
  const selectedStoreCanWithdraw = Boolean(
    wallet?.canWithdraw && selectedStore?.isActive &&
    toMinorUnits(selectedStore.availableBalance) >= toMinorUnits(wallet.minimumWithdrawalAmount),
  );
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
      setIsWithdrawHistoryCollapsed(false);
      setIsLedgerCollapsed(false);
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
    <div id="kol-wallet-page" data-active-tab={activeTab} className="flex flex-col gap-4 w-full min-w-0 pb-12 text-[#1A1612] text-left">
      {/* Top Unified Hub Navigation Bar */}
      <div className="p-1.5 sm:p-2 rounded-xl border border-[#EAE4D7] bg-white shadow-xs">
        <nav className="grid grid-cols-2 lg:grid-cols-4 items-stretch gap-2 w-full" aria-label="Ví và hồ sơ">
            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'wallet' })}
              className={`flex min-h-[44px] items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer select-none ${
                activeTab === 'wallet'
                  ? 'bg-[#FBF5EB] border border-[#EEDFC6] text-[#1A1612]'
                  : 'text-[#7D715E] hover:bg-[#FAF8F5] hover:text-[#1A1612] border border-[#EAE4D7]'
              }`}
              id="tab-btn-wallet"
              aria-pressed={activeTab === 'wallet'}
            >
              <Wallet className="w-3.5 h-3.5 text-[#B88E4F]" />
              <span>Ví & rút tiền</span>
            </button>

            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'kyc' })}
              className={`flex min-h-[44px] items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer select-none ${
                activeTab === 'kyc'
                  ? 'bg-[#FBF5EB] border border-[#EEDFC6] text-[#1A1612]'
                  : 'text-[#7D715E] hover:bg-[#FAF8F5] hover:text-[#1A1612] border border-[#EAE4D7]'
              }`}
              id="tab-btn-kyc"
              aria-pressed={activeTab === 'kyc'}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#B88E4F]" />
              <span>Hồ sơ KYC</span>
            </button>

            <button
              type="button"
              onClick={() => setSearchParams({ tab: 'social' })}
              className={`flex min-h-[44px] items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer select-none ${
                activeTab === 'social'
                  ? 'bg-[#FBF5EB] border border-[#EEDFC6] text-[#1A1612]'
                  : 'text-[#7D715E] hover:bg-[#FAF8F5] hover:text-[#1A1612] border border-[#EAE4D7]'
              }`}
              id="tab-btn-social"
              aria-pressed={activeTab === 'social'}
            >
              <Share2 className="w-3.5 h-3.5 text-[#B88E4F]" />
              <span>Kênh xã hội</span>
            </button>
            {activeTab === 'wallet' && (
              <button type="button" onClick={() => void loadWallet()} disabled={loading}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 px-3 py-2 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-xs font-semibold text-[#795A2D] hover:bg-[#F3EFE6] transition-colors cursor-pointer disabled:opacity-60">
                <RefreshCw className={`w-3.5 h-3.5 text-[#B88E4F] ${loading ? 'animate-spin' : ''}`} />
                <span>Làm mới ví</span>
              </button>
            )}
            {activeTab !== 'wallet' && (
              <button
                type="button"
                aria-label="Tải lại tab hiện tại"
                aria-busy={isReloading}
                onClick={() => void handleReload()}
                disabled={isReloading || submitting}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 px-3 py-2 rounded-xl border border-[#EAE4D7] bg-white text-xs font-semibold text-[#7D715E] hover:text-[#1A1612] hover:bg-[#FAF8F5] transition cursor-pointer disabled:opacity-50 select-none"
                title={activeTab === 'kyc' ? 'Tải lại hồ sơ KYC' : 'Tải lại các kênh xã hội'}
              >
                <RefreshCw size={13} className={`text-[#B88E4F] ${isReloading ? 'animate-spin' : ''}`} />
                <span>{isReloading ? 'Đang tải…' : 'Tải lại'}</span>
              </button>
            )}
        </nav>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
        >
          {error}
        </div>
      )}
      {activeTab === 'kyc' && kycData && (
        <KycSubmissionPage loadedData={kycData} isRefreshing={loading} />
      )}
      {activeTab === 'social' && socialData && (
        <SocialChannelsPage loadedData={socialData} isRefreshing={loading} />
      )}
      {loading && ((activeTab === 'kyc' && !kycData) || (activeTab === 'social' && !socialData)) && (
        <section className="kol-profile-loading" role="status" aria-busy="true">
          <Loader2 size={16} className="animate-spin" aria-hidden="true" />
          <span>{activeTab === 'kyc' ? 'Đang tải dữ liệu hồ sơ KYC…' : 'Đang tải dữ liệu kênh xã hội…'}</span>
        </section>
      )}
      {activeTab === 'wallet' && (
        <>
      {success && (
        <div
          role="status"
          className="rounded-xl border border-brand-border bg-brand-soft p-4 text-sm text-ink"
        >
          {success}
        </div>
      )}

      <section className="kol-wallet-balances grid grid-cols-1 sm:grid-cols-2 gap-0 border border-[#EAE4D7] rounded-xl bg-white overflow-hidden shadow-xs" aria-label="Tổng quan số dư" aria-busy={loading}>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 sm:gap-2.5 p-3.5 sm:p-4">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#7D715E]"><Wallet size={15} className="text-[#B88E4F]" /> Số dư khả dụng</div>
          <strong className="col-span-full text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1612] tabular-nums mt-1">{wallet ? formatMoney(wallet.availableBalance) : "—"}</strong>
          <div className="col-span-full flex items-center justify-between gap-2 mt-1">
            <span className="text-[11px] text-[#7D715E]">Khoản rút phụ thuộc số dư từng Shop.</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#EAE4D7] bg-[#FAF8F5] text-[10px] font-medium text-[#7D715E]">
              {wallet?.canWithdraw ? <CheckCircle2 size={12} className="text-[#059669]" /> : <Clock3 size={12} />}
              {loading ? 'Đang tải' : wallet?.canWithdraw ? 'Đủ điều kiện rút' : 'Chưa đủ điều kiện'}
            </span>
          </div>
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 sm:gap-2.5 p-3.5 sm:p-4 border-t sm:border-t-0 sm:border-l border-[#EAE4D7]">
          <div className="flex items-center gap-1.5 text-xs font-medium text-[#7D715E]"><Clock3 size={15} className="text-[#B88E4F]" /> Số dư chờ duyệt</div>
          <strong className="col-span-full text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1612] tabular-nums mt-1">{wallet ? formatMoney(wallet.pendingBalance) : "—"}</strong>
          <div className="col-span-full flex items-center justify-between gap-2 mt-1">
            <span className="text-[11px] text-[#7D715E]">Mở khóa sau chu kỳ đối soát đơn hàng.</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#EAE4D7] bg-[#FAF8F5] text-[10px] font-medium text-[#7D715E]">
              <Clock size={12} /> Đang đối soát
            </span>
          </div>
        </div>
      </section>


      {/* SECTION TÀI KHOẢN NHẬN TIỀN & YÊU CẦU RÚT TIỀN (TIKTOK SHOP & SHOPEE CREATOR COMPACT STYLE) */}
      <section className="wallet-payout-stack">
        {/* Cột 1: Quản lý tài khoản ngân hàng thụ hưởng (VietQR) */}
        <div className="wallet-bank-row">
          <div>
            {/* Header: Tiêu đề + Badge bảo mật */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#EAE4D7]">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-white border border-[#EEDFC6] flex items-center justify-center text-[#B88E4F] shrink-0">
                  <Landmark className="w-3.5 h-3.5 text-[#B88E4F]" />
                </div>
                <h2 className="text-sm sm:text-base font-bold text-[#1A1612] m-0">
                  Tài khoản nhận tiền
                </h2>
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#7D715E] bg-white px-2 py-0.5 rounded-full border border-[#EAE4D7]">
                <ShieldCheck className="w-3 h-3 text-[#B88E4F]" />
                <span>VietQR 65+</span>
              </span>
            </div>

            {/* Khi ĐÃ có tài khoản ngân hàng */}
            {wallet?.bankAccount && !showAddBankForm && (
              <div className="wallet-bank-summary">
                {(() => {
                  const bankMatch = findBankByQuery(wallet.bankAccount.bankName);
                  return (
                    <>
                      <div className="flex flex-wrap items-start justify-between gap-3">
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
                            </div>
                            <div className="flex flex-col sm:flex-row sm:items-center gap-1 mt-0.5">
                              <span className="font-mono text-xs sm:text-sm font-extrabold text-[#1A1612] tracking-wider">
                                {wallet.bankAccount.maskedAccountNumber}
                              </span>
                              <span className="text-xs uppercase font-medium text-[#7D715E] truncate">
                                {wallet.bankAccount.accountName}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Badge Trạng thái KYC / Xác minh */}
                        <div className="shrink-0">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#EAE4D7] bg-white text-[10px] font-medium text-[#7D715E]"
                          >
                            {wallet.kycStatus === 'VERIFIED' ? <CheckCircle2 size={12} className="text-[#059669]" /> : <Clock size={12} />}
                            <span>{wallet.kycStatus === 'VERIFIED' ? 'Đã xác minh' : 'Chờ xác minh'}</span>
                          </span>
                        </div>
                      </div>

                      {/* Phân cách & Nút Thao tác */}
                      <p className="wallet-bank-caption">Nhận tiền sau khi yêu cầu rút được xử lý.</p>
                      <details className="wallet-bank-manage">
                        <summary className="flex items-center justify-between gap-2 py-1 font-medium text-[#7D715E] cursor-pointer hover:text-[#1A1612]">Quản lý tài khoản <ChevronDown size={14} /></summary>
                        <p className="my-2 text-[11px] break-all">{wallet.bankAccount.bankName}{bankMatch?.bin ? ` · BIN ${bankMatch.bin}` : ''}</p>
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
                      </details>
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
                      Chọn ngân hàng và nhập thông tin tài khoản thụ hưởng
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
              <div className="mt-3">
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
                    className="w-full h-9.5 sm:h-10 rounded-xl text-xs sm:text-sm font-bold border border-[#EEDFC6] bg-[#FBF5EB] hover:bg-[#F3EFE6] hover:border-[#C59B58] text-[#1A1612] transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
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
          aria-label="Yêu cầu rút tiền"
          onSubmit={(event) => void handleWithdrawal(event)}
          className="kol-wallet-transfer wallet-withdraw-row rounded-xl border border-[#EAE4D7] bg-white p-3.5 sm:p-4 shadow-xs flex flex-col justify-between"
        >
          <div className="wallet-withdraw-fields">
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

            <div className="wallet-withdraw-inputs">
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
                onChange={(event: { target: { value: string } }) => setStoreId(event.target.value)}
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
                    aria-pressed={amount === quickVal.toString()}
                    className="px-2 py-0.5 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] hover:bg-[#F3EFE6] text-[10.5px] font-mono font-semibold text-[#1A1612] transition cursor-pointer disabled:opacity-40"
                  >
                    {new Intl.NumberFormat("vi-VN").format(quickVal)} ₫
                  </button>
                ))}
              </div>
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
                      <span>Thuế khấu trừ ({Number(wallet.withdrawalTaxPolicy.rate) * 100}%)</span>
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
          <div className="wallet-withdraw-actions">
            <button
              type="submit"
              disabled={submitting || loading || !selectedStoreCanWithdraw}
              className="scanms-brand-action w-full h-10 sm:h-11 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] hover:bg-[#F3EFE6] hover:border-[#C59B58] text-[#1A1612] font-bold text-xs sm:text-sm transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUpRight className="w-4 h-4" />
              )}
              <span>{submitting ? "Đang gửi yêu cầu..." : "Gửi yêu cầu rút tiền"}</span>
            </button>
            {wallet && !selectedStoreCanWithdraw && (
              <div className="kol-wallet-notice mt-2 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EEDFC6] text-[11px] text-[#7D715E] space-y-1">
                <p className="font-semibold">Bạn chưa thể rút tiền khi chưa đủ các điều kiện sau:</p>
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
                    <button type="button" onClick={() => setSearchParams({ tab: 'kyc' })} className="underline text-[#B88E4F]">Mở hồ sơ KYC</button>
                  </p>
                )}
                {!selectedStore && <p className="m-0">Chưa có gian hàng có số dư được phân bổ để rút tiền.</p>}
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
      <WalletCooperationStores stores={wallet?.cooperationStores} />

      <section className="overflow-hidden rounded-xl border border-[#EAE4D7] bg-white shadow-xs">
        <WalletSectionHeader
          id="wallet-withdrawal-details"
          title="Lịch sử yêu cầu rút tiền"
          description="Theo dõi tiến trình xét duyệt và đối soát chi trả tiền về tài khoản ngân hàng"
          count={`${history?.total ?? 0} yêu cầu`}
          icon={Receipt}
          expanded={!isWithdrawHistoryCollapsed}
          onToggle={() => setIsWithdrawHistoryCollapsed((value) => !value)}
          onRefresh={() => void loadWallet()}
          refreshing={loading}
        />

        {!isWithdrawHistoryCollapsed && (
          <div id="wallet-withdrawal-details">
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
          </div>
        )}
      </section>

      {/* 2. BIẾN ĐỘNG TÀI CHÍNH GẦN NHẤT (SỔ CÁI MINH BẠCH - APPEND-ONLY LEDGER) */}
      <section className="overflow-hidden rounded-xl border border-[#EAE4D7] bg-white shadow-xs mt-4">
        <WalletSectionHeader id="wallet-ledger-details" title="Biến động tài chính gần nhất" description="Sổ cái thời gian thực ghi nhận biến động số dư Ví Chờ và Ví Khả Dụng" count={`${ledger?.total ?? 0} giao dịch`} icon={Sparkles} expanded={!isLedgerCollapsed} onToggle={() => setIsLedgerCollapsed(value => !value)} />

        {!isLedgerCollapsed && (
          <div id="wallet-ledger-details">
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
              Lịch sử ghi nhận hoa hồng, rút tiền và thay đổi số dư.
            </span>
          </div>
          <span className="font-medium shrink-0">
            Hiển thị <strong className="text-[#1A1612]">{ledger?.entries.length ?? 0}</strong> / <strong className="text-[#1A1612]">{ledger?.total ?? 0}</strong> bản ghi
          </span>
          <div className="flex items-center gap-2">
            <button type="button" aria-label="Trang giao dịch trước" disabled={ledgerPage <= 1 || loading || submitting} onClick={() => setLedgerPage(current => current - 1)} className="inline-flex items-center gap-1 rounded-lg border border-[#EAE4D7] bg-white px-2.5 py-1 text-xs font-semibold text-[#1A1612] hover:bg-[#FAF8F5] transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"><ChevronLeft size={14} />Trước</button>
            <span>Trang {ledgerPage} / {Math.max(1, Math.ceil((ledger?.total ?? 0) / (ledger?.limit ?? 10)))}</span>
            <button type="button" aria-label="Trang giao dịch sau" disabled={!ledger || ledgerPage * ledger.limit >= ledger.total || loading || submitting} onClick={() => setLedgerPage(current => current + 1)} className="inline-flex items-center gap-1 rounded-lg border border-[#EAE4D7] bg-white px-2.5 py-1 text-xs font-semibold text-[#1A1612] hover:bg-[#FAF8F5] transition shadow-2xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer">Sau<ChevronRight size={14} /></button>
          </div>
        </div>
          </div>
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
