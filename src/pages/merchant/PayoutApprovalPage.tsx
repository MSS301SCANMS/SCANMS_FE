import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useParams } from "react-router-dom";
import { Download, RefreshCw, ReceiptText, ShieldCheck, Landmark, ChevronRight, Plus, BarChart3, Clock, Hourglass, CheckCircle, FileText, AlertTriangle, X, Search } from "lucide-react";
import {
  payoutService,
  getPayoutErrorMessage,
} from "../../services/payout.service";
import type {
  MerchantPayout,
  MerchantPayoutBatch,
  MerchantPayoutHistory,
} from "../../services/payout.service";
import type { PayoutStatus } from "../../services/wallet.service";
import { storeService } from "../../services/store.service";
import { authService } from "../../services/auth.service";
import PayoutBillUpload from "../../components/payouts/PayoutBillUpload";
import { BankSelectorModal } from "../../components/bank/BankSelectorModal";
import { ConfirmModal } from "../../components/ui/ConfirmModal";
import { Select } from "../../components/ui/Select";
import { type VietQrBank, findBankByQuery } from "@/config/banks.config";
import { toast } from "../../utils/toast";
import "./payout-approval-layout.css";
import {
  maskBankAccount,
  MAX_PAYOUT_BILL_BYTES,
  validatePayoutBill,
} from "@/validations/payout-bill.validation";

const STATUS_LABELS: Record<PayoutStatus, string> = {
  PENDING: "Chờ xử lý",
  PROCESSING: "Chờ chuyển khoản",
  APPROVED: "Đã xác nhận chi trả",
  REJECTED: "Đã từ chối",
};
const money = (amount: string) =>
  `${new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 2 }).format(Number(amount))} ₫`;
const buttonClass =
  "rounded-xl border border-line px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50";

function saveWorkbook(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Dữ liệu mẫu chuẩn Figma 13 (24 chờ duyệt ~48.2tr, 9 đã duyệt ~17.65tr, thuế ~4.82tr, 3 cần bổ sung KYC)
const FIGMA13_PAYOUT_SEEDS: MerchantPayout[] = [
  {
    id: "PAY-20261003-8801",
    collaboratorId: "kol-1",
    collaboratorName: "Trần Văn Nhật",
    collaboratorEmail: "nhat.tran@gmail.com",
    collaboratorPhone: "0988776655",
    collaboratorAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
    collaboratorTaxCode: "8472910394",
    kycStatus: "VERIFIED",
    storeId: "store-sora",
    amount: "2500000",
    taxAmount: "250000",
    netAmount: "2250000",
    status: "PENDING",
    bankName: "MBBank (Quân đội)",
    bankAccountNumber: "0988776655",
    bankAccountName: "TRAN VAN NHAT",
    bankRefCode: null,
    batchId: null,
    hasBill: false,
    rejectedReason: null,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    processedAt: null,
  },
  {
    id: "PAY-20261003-8802",
    collaboratorId: "kol-2",
    collaboratorName: "Lê Mai Anh",
    collaboratorEmail: "maianh.le@gmail.com",
    collaboratorPhone: "0912345678",
    collaboratorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    collaboratorTaxCode: "8592019481",
    kycStatus: "VERIFIED",
    storeId: "store-sora",
    amount: "1800000",
    taxAmount: "0",
    netAmount: "1800000",
    status: "PENDING",
    bankName: "Vietcombank",
    bankAccountNumber: "1012345678",
    bankAccountName: "LE MAI ANH",
    bankRefCode: null,
    batchId: null,
    hasBill: false,
    rejectedReason: null,
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    processedAt: null,
  },
  {
    id: "PAY-20261003-8803",
    collaboratorId: "kol-3",
    collaboratorName: "Phạm Khánh Linh",
    collaboratorEmail: "khanhlinh.pham@gmail.com",
    collaboratorPhone: "0933445566",
    collaboratorAvatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&auto=format&fit=crop&q=80",
    collaboratorTaxCode: null,
    kycStatus: "PENDING",
    storeId: "store-sora",
    amount: "3200000",
    taxAmount: "320000",
    netAmount: "2880000",
    status: "PENDING",
    bankName: "Techcombank",
    bankAccountNumber: "19033445566",
    bankAccountName: "PHAM KHANH LINH",
    bankRefCode: null,
    batchId: null,
    hasBill: false,
    rejectedReason: null,
    createdAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    processedAt: null,
  },
  {
    id: "PAY-20261003-8804",
    collaboratorId: "kol-4",
    collaboratorName: "Đặng Thu Thảo",
    collaboratorEmail: "thuthao.dang@gmail.com",
    collaboratorPhone: "0977889900",
    collaboratorAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
    collaboratorTaxCode: "8201948271",
    kycStatus: "VERIFIED",
    storeId: "store-sora",
    amount: "5600000",
    taxAmount: "560000",
    netAmount: "5040000",
    status: "APPROVED",
    bankName: "ACB",
    bankAccountNumber: "23456789",
    bankAccountName: "DANG THU THAO",
    bankRefCode: "MBB202610038821",
    batchId: "BATCH-20261003-01",
    hasBill: true,
    rejectedReason: null,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    processedAt: new Date(Date.now() - 3600000 * 7).toISOString(),
  },
  {
    id: "PAY-20261003-8805",
    collaboratorId: "kol-5",
    collaboratorName: "Vũ Đức Huy",
    collaboratorEmail: "duchuy.vu@gmail.com",
    collaboratorPhone: "0966554433",
    collaboratorAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80",
    collaboratorTaxCode: null,
    kycStatus: "REJECTED",
    storeId: "store-sora",
    amount: "1200000",
    taxAmount: "0",
    netAmount: "1200000",
    status: "PENDING",
    bankName: "VPBank",
    bankAccountNumber: "9876543210",
    bankAccountName: "VU DUC HUY",
    bankRefCode: null,
    batchId: null,
    hasBill: false,
    rejectedReason: null,
    createdAt: new Date(Date.now() - 3600000 * 10).toISOString(),
    processedAt: null,
  },
  {
    id: "PAY-20261003-8806",
    collaboratorId: "kol-6",
    collaboratorName: "Hoàng Bảo Ngọc",
    collaboratorEmail: "baongoc.hoang@gmail.com",
    collaboratorPhone: "0944332211",
    collaboratorAvatar: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&auto=format&fit=crop&q=80",
    collaboratorTaxCode: "8192847193",
    kycStatus: "VERIFIED",
    storeId: "store-sora",
    amount: "4500000",
    taxAmount: "450000",
    netAmount: "4050000",
    status: "APPROVED",
    bankName: "BIDV",
    bankAccountNumber: "58110000123456",
    bankAccountName: "HOANG BAO NGOC",
    bankRefCode: "BIDV77218392",
    batchId: "BATCH-20261003-01",
    hasBill: true,
    rejectedReason: null,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    processedAt: new Date(Date.now() - 3600000 * 11).toISOString(),
  },
  {
    id: "PAY-20261003-8807",
    collaboratorId: "kol-7",
    collaboratorName: "Nguyễn Minh Triết",
    collaboratorEmail: "minhtriet.nguyen@gmail.com",
    collaboratorPhone: "0922110099",
    collaboratorAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80",
    collaboratorTaxCode: "8391827401",
    kycStatus: "VERIFIED",
    storeId: "store-sora",
    amount: "8900000",
    taxAmount: "890000",
    netAmount: "8010000",
    status: "PENDING",
    bankName: "TPBank",
    bankAccountNumber: "03982182001",
    bankAccountName: "NGUYEN MINH TRIET",
    bankRefCode: null,
    batchId: null,
    hasBill: false,
    rejectedReason: null,
    createdAt: new Date(Date.now() - 3600000 * 14).toISOString(),
    processedAt: null,
  },
  {
    id: "PAY-20261003-8808",
    collaboratorId: "kol-8",
    collaboratorName: "Chu Thị Bích Vân",
    collaboratorEmail: "bichvan.chu@gmail.com",
    collaboratorPhone: "0911223344",
    collaboratorAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80",
    collaboratorTaxCode: null,
    kycStatus: "PENDING",
    storeId: "store-sora",
    amount: "2100000",
    taxAmount: "210000",
    netAmount: "1890000",
    status: "PENDING",
    bankName: "Agribank",
    bankAccountNumber: "1500205839201",
    bankAccountName: "CHU THI BICH VAN",
    bankRefCode: null,
    batchId: null,
    hasBill: false,
    rejectedReason: null,
    createdAt: new Date(Date.now() - 3600000 * 16).toISOString(),
    processedAt: null,
  }
];

const FIGMA13_BATCH_SEEDS: MerchantPayoutBatch[] = [
  {
    id: "BATCH-20261003-01",
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    payoutCount: 9,
  },
  {
    id: "BATCH-20261002-02",
    createdAt: new Date(Date.now() - 3600000 * 28).toISOString(),
    payoutCount: 15,
  },
];

export default function PayoutApprovalPage() {
  const fixtureMode = import.meta.env.DEV && import.meta.env.VITE_PAYOUT_FIXTURES_ENABLED === 'true';
  const { storeId: routeStoreId } = useParams<{ storeId: string }>();
  const [storeId, setStoreId] = useState(routeStoreId ?? "");
  const [history, setHistory] = useState<MerchantPayoutHistory | null>(null);
  const [localRequests, setLocalRequests] = useState<MerchantPayout[]>(fixtureMode ? FIGMA13_PAYOUT_SEEDS : []);
  const [batches, setBatches] = useState<MerchantPayoutBatch[]>(fixtureMode ? FIGMA13_BATCH_SEEDS : []);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<PayoutStatus | "">("");
  const [activeKpiFilter, setActiveKpiFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'TAX' | 'KYC'>('ALL');
  const [selected, setSelected] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewingBill, setViewingBill] = useState<MerchantPayout | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [dialog, setDialog] = useState<{
    request: MerchantPayout;
    action: "approve" | "reject";
  } | null>(null);
  const [bankRefCode, setBankRefCode] = useState("");
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const [bill, setBill] = useState<File | null>(null);
  const [billLink, setBillLink] = useState("");
  const inFlight = useRef(false);
  const loadSequence = useRef(0);
  const modalRef = useRef<HTMLDialogElement>(null);

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [showAddBankForm, setShowAddBankForm] = useState(false);
  const [isDisconnectConfirmOpen, setIsDisconnectConfirmOpen] = useState(false);
  const currentUser = authService.getCurrentUser();
  const [shopBankName, setShopBankName] = useState('');
  const [shopBankAccountNumber, setShopBankAccountNumber] = useState('');
  const [shopBankAccountName, setShopBankAccountName] = useState('');
  const [hasBankAccount, setHasBankAccount] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [canManagePayoutBank, setCanManagePayoutBank] = useState(currentUser?.role === 'SHOP_MANAGER');
  const [selectedBank, setSelectedBank] = useState<VietQrBank | null>(null);
  const [accountNumberInput, setAccountNumberInput] = useState(shopBankAccountNumber);
  const [accountNameInput, setAccountNameInput] = useState(shopBankAccountName);

  const handleStartEditBank = () => {
    const match = findBankByQuery(shopBankName) || null;
    setSelectedBank(match);
    setAccountNumberInput(shopBankAccountNumber);
    setAccountNameInput(shopBankAccountName);
    setShowAddBankForm(true);
  };

  const handleCancelAddBank = () => {
    setAccountNumberInput(shopBankAccountNumber);
    setAccountNameInput(shopBankAccountName);
    setShowAddBankForm(false);
  };

  const handleBankChosen = (bank: VietQrBank) => {
    setSelectedBank(bank);
    setIsBankModalOpen(false);
    toast.info(`Đã chọn ${bank.shortName}. Vui lòng nhập số tài khoản bên dưới để hoàn tất.`);
  };

  const handleSaveBankInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBank || !accountNumberInput.trim() || !accountNameInput.trim()) {
      toast.error("Vui lòng chọn ngân hàng và nhập đủ số tài khoản, tên chủ tài khoản.");
      return;
    }
    const bankToSave = selectedBank;
    const newName = `${bankToSave.shortName} (${bankToSave.name})`;
    const accNum = accountNumberInput.trim();
    const accName = accountNameInput.trim().toUpperCase();

    setIsSavingBank(true);
    try {
      await storeService.updateMyStore({
        payoutBankName: newName,
        payoutBankAccountNumber: accNum,
        payoutBankAccountName: accName,
      });
      if (storeId) localStorage.setItem(`scanms_payout_bank_migrated_${storeId}`, 'true');
      setShopBankName(newName);
      setShopBankAccountNumber(accNum);
      setShopBankAccountName(accName);
      setHasBankAccount(true);
      setShowAddBankForm(false);
      toast.success("Đã lưu tài khoản chi trả KOL.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể lưu tài khoản chi trả KOL.");
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleDisconnectBank = () => {
    setIsDisconnectConfirmOpen(true);
  };

  const handleConfirmDisconnectBank = async () => {
    try {
      await storeService.updateMyStore({
        payoutBankName: null,
        payoutBankAccountNumber: null,
        payoutBankAccountName: null,
      });
      if (storeId) localStorage.setItem(`scanms_payout_bank_migrated_${storeId}`, 'true');
      setShopBankName("");
      setShopBankAccountNumber("");
      setShopBankAccountName("");
      setHasBankAccount(false);
      setIsDisconnectConfirmOpen(false);
      toast.success("Đã ngừng sử dụng tài khoản chi trả.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể ngừng sử dụng tài khoản.");
    }
  };
  useEffect(() => {
    if (!dialog) return;
    const previous = document.activeElement as HTMLElement | null;
    modalRef.current?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      previous?.focus();
    };
  }, [dialog]);

  useEffect(() => {
    let active = true;
    if (routeStoreId) {
      setStoreId(routeStoreId);
      if (currentUser?.role !== 'SHOP_MANAGER') {
        setCanManagePayoutBank(false);
        return () => {
          active = false;
        };
      }
    }
    void storeService
      .getMyStore()
      .then((store) => {
        if (!active) return;
        if (!routeStoreId) {
          setStoreId(store.id);
        }
        const canEditThisStore = currentUser?.role === 'SHOP_MANAGER' &&
          (!routeStoreId || routeStoreId === store.id);
        setCanManagePayoutBank(canEditThisStore);
        if (!canEditThisStore) return;

        const payoutBank = store.onboardingData || {};
        const hasSavedPayoutBank = Boolean(
          payoutBank.payoutBankName || payoutBank.payoutBankAccountNumber || payoutBank.payoutBankAccountName,
        );
        const canUseLegacyBank = !hasSavedPayoutBank &&
          localStorage.getItem(`scanms_payout_bank_migrated_${store.id}`) !== 'true';
        const bankName = payoutBank.payoutBankName || (canUseLegacyBank ? localStorage.getItem('scanms_shop_bank_name') : '') || '';
        const accountNumber = payoutBank.payoutBankAccountNumber || (canUseLegacyBank ? localStorage.getItem('scanms_shop_bank_account') : '') || '';
        const accountName = payoutBank.payoutBankAccountName || (canUseLegacyBank ? localStorage.getItem('scanms_shop_bank_holder') : '') || '';
        setShopBankName(bankName);
        setShopBankAccountNumber(accountNumber);
        setShopBankAccountName(accountName);
        setSelectedBank(findBankByQuery(bankName) || null);
        setAccountNumberInput(accountNumber);
        setAccountNameInput(accountName);
        setHasBankAccount(Boolean(bankName && accountNumber && accountName));
      })
      .catch((err: unknown) => {
        if (active && !routeStoreId)
          setError(err instanceof Error ? err.message : "Không tải được shop");
        if (active) setCanManagePayoutBank(false);
      });
    return () => {
      active = false;
    };
  }, [routeStoreId, currentUser?.role]);

  const load = useCallback(async () => {
    if (!storeId) return;
    const sequence = ++loadSequence.current;
    setLoading(true);
    try {
      const [requests, batchHistory] = await Promise.all([
        payoutService.list(storeId, page, status),
        payoutService.batches(storeId),
      ]);
      if (sequence !== loadSequence.current) return;
      setHistory(requests);
      setBatches(batchHistory.batches);
      setSelected([]);
      setError("");
    } catch (err: unknown) {
      if (sequence === loadSequence.current)
        setError(await getPayoutErrorMessage(err));
    } finally {
      if (sequence === loadSequence.current) setLoading(false);
    }
  }, [storeId, page, status]);
  useEffect(() => {
    const sequenceRef = loadSequence;
    void load();
    return () => {
      sequenceRef.current++;
    };
  }, [load]);

  async function runAction(action: () => Promise<void>) {
    if (inFlight.current) return;
    inFlight.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (err: unknown) {
      setError(
        `${await getPayoutErrorMessage(err)} Nếu kết nối gián đoạn, tải lại trạng thái trước khi gửi lại.`,
      );
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function openDialog(request: MerchantPayout, action: "approve" | "reject") {
    setDialog({ request, action });
    setBankRefCode("");
    setNote("");
    setReason("");
    setBill(null);
    setError("");
  }

  async function openBill(request: MerchantPayout) {
    setBillLink('');
    setViewingBill(request);
    await runAction(async () => {
      if (!storeId) throw new Error('Chưa xác định được gian hàng chi trả.');
      const result = await payoutService.bill(storeId, request.id);
      if (!result.url || new URL(result.url).protocol !== 'https:') throw new Error('Chưa có liên kết chứng từ an toàn từ máy chủ.');
      setBillLink(result.url);
    });
  }

  async function submitDialog(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!dialog || busy) return;
    if (
      dialog.action === "approve" &&
      (!bill ||
        validatePayoutBill(bill, history?.maxBillBytes) ||
        (bankRefCode.trim() &&
          !/^[A-Z0-9][A-Z0-9._/ -]{0,99}$/i.test(bankRefCode.trim())))
    ) {
      setError(
          "Cần chứng từ JPG, PNG hoặc PDF hợp lệ; mã giao dịch nếu nhập phải đúng định dạng.",
      );
      return;
    }
    if (dialog.action === "reject" && !reason.trim()) {
      setError("Nhập lý do từ chối");
      return;
    }
    await runAction(async () => {
      const isSeedRequest = fixtureMode && FIGMA13_PAYOUT_SEEDS.some((s) => s.id === dialog.request.id);
      if (!isSeedRequest && !storeId) throw new Error('Chưa xác định được gian hàng chi trả. Vui lòng tải lại.');

      // Nếu là yêu cầu chi trả thực tế trong Database (không phải dữ liệu seed tĩnh)
      if (!isSeedRequest && storeId) {
        try {
          if (dialog.action === "approve") {
            if (!bill) {
              setError("Vui lòng tải lên hóa đơn hoặc chứng từ ủy nhiệm chi hợp lệ.");
              return;
            }
            await payoutService.approve(dialog.request.id, bill, {
              bankRefCode: bankRefCode.trim(),
              note: note.trim(),
            });
            toast.success(`Duyệt chi trả thành công cho ${dialog.request.collaboratorName}!`);
          } else {
            await payoutService.reject(storeId, dialog.request.id, reason.trim());
            toast.success("Đã từ chối và hoàn tiền về ví shop.");
          }
          setDialog(null);
          await load();
          return;
        } catch (err: unknown) {
          const errMsg = await getPayoutErrorMessage(err);
          setError(`Thao tác chi trả thất bại: ${errMsg}`);
          toast.error(`Chi trả thất bại: ${errMsg}`);
          return; // Dừng lại ngay, TUYỆT ĐỐI KHÔNG cập nhật trạng thái giả mạo
        }
      }

      // Trường hợp dữ liệu kiểm thử (Seed demo)
      if (dialog.action === "approve") {
        const approvedCode = bankRefCode.trim() || `MBB${Date.now().toString().slice(-8)}`;
        if (bill) {
          setBillLink(URL.createObjectURL(bill));
        }
        setLocalRequests((prev) =>
          prev.map((item) =>
            item.id === dialog.request.id
              ? {
                  ...item,
                  status: "APPROVED" as PayoutStatus,
                  bankRefCode: approvedCode,
                  hasBill: true,
                  processedAt: new Date().toISOString(),
                }
              : item
          )
        );
        toast.success(`Duyệt chi trả thành công cho ${dialog.request.collaboratorName}!`);
      } else {
        setLocalRequests((prev) =>
          prev.map((item) =>
            item.id === dialog.request.id
              ? {
                  ...item,
                  status: "REJECTED" as PayoutStatus,
                  rejectedReason: reason.trim(),
                }
              : item
          )
        );
        toast.success("Đã từ chối và hoàn tiền về ví shop.");
      }

      setDialog(null);
    });
  }

  // An empty/failed API response is not consent to display fabricated financial activity.
  const baseRequests = useMemo(() =>
    history && history.requests.length > 0 ? history.requests : fixtureMode ? localRequests : [],
  [history, fixtureMode, localRequests]);

  // Thống kê KPIs chi trả (Chuẩn Figma 13 - tính toán chính xác trên dữ liệu hiện tại)
  const pendingRequests = baseRequests.filter((r) => r.status === "PENDING");
  const approvedRequests = baseRequests.filter((r) => r.status === "APPROVED");
  const pendingAmountSum = pendingRequests.reduce(
    (acc, r) => acc + Number(r.netAmount || r.amount || 0),
    0
  );
  const approvedAmountSum = approvedRequests.reduce(
    (acc, r) => acc + Number(r.netAmount || r.amount || 0),
    0
  );
  const totalTaxSum = baseRequests.reduce(
    (acc, r) => acc + Number(r.taxAmount || 0),
    0
  );
  const taxRequests = baseRequests.filter((r) => Number(r.taxAmount || 0) > 0);
  const pendingKycCount = baseRequests.filter(
    (r) => r.kycStatus && r.kycStatus !== "VERIFIED"
  ).length;

  const displayPendingCount = pendingRequests.length;
  const displayPendingAmount = pendingAmountSum;
  const displayApprovedCount = approvedRequests.length;
  const displayApprovedAmount = approvedAmountSum;
  const displayTaxCount = taxRequests.length;
  const displayTaxAmount = totalTaxSum;
  const displayKycPendingCount = pendingKycCount;

  // Bộ lọc dữ liệu bảng tương tác: kết hợp Dropdown Trạng thái + Thẻ KPI đang bấm + Tìm kiếm
  const displayedRequests = useMemo(() => {
    return baseRequests.filter((request) => {
      if (status && request.status !== status) return false;
      if (activeKpiFilter === "PENDING") return request.status === "PENDING";
      if (activeKpiFilter === "APPROVED") return request.status === "APPROVED";
      if (activeKpiFilter === "TAX") return Number(request.taxAmount) > 0;
      if (activeKpiFilter === "KYC") return request.kycStatus !== "VERIFIED";
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = request.collaboratorName?.toLowerCase().includes(q);
        const matchId = request.id?.toLowerCase().includes(q);
        const matchBank = request.bankName?.toLowerCase().includes(q);
        const matchAcc = request.bankAccountNumber?.includes(q);
        const matchAccName = request.bankAccountName?.toLowerCase().includes(q);
        return Boolean(matchName || matchId || matchBank || matchAcc || matchAccName);
      }
      return true;
    });
  }, [baseRequests, status, activeKpiFilter, searchQuery]);

  const eligible = displayedRequests.filter(
    (request) => request.status === "PENDING" && !request.batchId
  );

  const handleExportExcel = async () => {
    const targetIds =
      selected.length > 0
        ? selected
        : eligible.length > 0
        ? eligible.map((r) => r.id)
        : displayedRequests.map((r) => r.id);

    if (targetIds.length === 0) {
        toast.info("Không có lệnh chi trả nào để xuất tệp đối soát.");
      return;
    }

    await runAction(async () => {
      try {
        if (!fixtureMode || (history && history.requests.length > 0 && selected.length > 0)) {
          if (!storeId) throw new Error('Chưa xác định được gian hàng đối soát.');
          const blob = await payoutService.exportBatch(storeId, targetIds);
          saveWorkbook(blob, `SCANMS-VietQR-${Date.now()}.xlsx`);
        } else {
          // Tạo file CSV đối soát chuyển khoản VietQR Napas247 tương thích hoàn toàn Excel
          const rows = [
            [
              "STT",
          "Mã chi trả",
              "KOL Nhận Tiền",
              "Số Điện Thoại",
              "Ngân Hàng",
              "Số Tài Khoản",
              "Tên Chủ Thụ Hưởng",
              "Số Tiền Gốc (VND)",
              "Thuế TNCN 10%",
              "Thực Nhận (VND)",
              "Nội Dung Chuyển Khoản",
            ],
            ...targetIds.map((id, index) => {
              const req = baseRequests.find((r) => r.id === id);
              return [
                index + 1,
                req?.id || id,
                req?.collaboratorName || "",
                req?.collaboratorPhone || "",
                req?.bankName || "",
                req?.bankAccountNumber || "",
                req?.bankAccountName || "",
                req?.amount || 0,
                req?.taxAmount || 0,
                req?.netAmount || req?.amount || 0,
                `SCANMS ${req?.id || id}`,
              ];
            }),
          ];
          const csvContent =
            "\uFEFF" +
            rows.map((e) => e.map((val) => `"${val}"`).join(",")).join("\n");
          const blob = new Blob([csvContent], {
            type: "text/csv;charset=utf-8;",
          });
          saveWorkbook(blob, `SCANMS-VietQR-Batch-${Date.now()}.csv`);

          const newBatchId = `BATCH-${new Date()
            .toISOString()
            .slice(0, 10)
            .replace(/-/g, "")}-${Math.floor(Math.random() * 89 + 10)}`;
          setLocalRequests((prev) =>
            prev.map((item) =>
              targetIds.includes(item.id)
                ? {
                    ...item,
                    batchId: newBatchId,
                    status: "PROCESSING" as PayoutStatus,
                  }
                : item
            )
          );
          setBatches((prev) => [
            {
              id: newBatchId,
              createdAt: new Date().toISOString(),
              payoutCount: targetIds.length,
            },
            ...prev,
          ]);
        }
        toast.success(
        `Đã xuất tệp đối soát VietQR cho ${targetIds.length} lệnh chi trả!`
        );
        setSelected([]);
        if (!fixtureMode) await load();
      } catch (err: any) {
      toast.error(err?.message || "Lỗi xuất tệp VietQR");
        throw err;
      }
    });
  };

  return (
    <div className="merchant-payout-page mx-auto w-full min-w-0 max-w-[1480px] space-y-4 pb-8 pt-4 text-ink sm:pt-6">
      {fixtureMode && <p role="status" className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-xs text-[#7D715E]">
        Đang bật dữ liệu giao diện chi trả thử nghiệm. Những bản ghi này không chứng minh chuyển tiền thật.
      </p>}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-danger bg-white p-4 text-sm text-danger"
        >
          {error}
        </p>
      )}
      {billLink && (
        <p className="text-sm">
          <a
            href={billLink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-brand-strong underline"
          >
            Mở ảnh chứng từ riêng tư (liên kết hết hạn sau 2 phút)
          </a>
        </p>
      )}
      {/* SECTION TÀI KHOẢN CHI TRẢ & ĐỐI SOÁT CỦA GIAN HÀNG & QUY TRÌNH (CHUẨN ẢNH 1 & ẢNH 2) */}
      <section className={`payout-overview grid items-stretch gap-4 ${canManagePayoutBank ? 'lg:grid-cols-2' : ''}`}>
        {/* Cột 1: Quản lý tài khoản chi trả & đối soát gian hàng */}
        {canManagePayoutBank && (
        <div className="payout-bank-panel flex flex-col justify-between rounded-2xl border border-[#EAE4D7] bg-white p-4.5 sm:p-5 shadow-[0_2px_12px_rgba(35,29,21,0.03)]">
          <div>
            {/* Header: Tiêu đề + Badge bảo mật */}
            <div className="flex items-center justify-between gap-3 border-b border-[#EAE4D7] pb-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
                  <Landmark className="h-4 w-4" />
                </div>
                <h2 className="m-0 text-sm font-bold text-[#1A1612] sm:text-base">
                  Tài khoản chi trả
                </h2>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-2.5 py-1 text-[11px] font-semibold text-[#8A642C]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#B88E4F]" />
                <span>VietQR 65+</span>
              </span>
            </div>

            {/* Khi ĐÃ có tài khoản ngân hàng & không ở chế độ sửa */}
            {hasBankAccount && !showAddBankForm && (
              <div className="mt-3.5 flex flex-col justify-between rounded-xl border border-[#EAE4D7] bg-gradient-to-b from-[#FAF8F5]/80 to-white p-4 transition hover:border-[#C59B58]/50 sm:p-4.5">
                {(() => {
                  const bankMatch = findBankByQuery(shopBankName);
                  const maskedNumber = shopBankAccountNumber
                    ? `•••• ${shopBankAccountNumber.slice(-4)}`
                    : '••••';
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
                                {bankMatch ? bankMatch.shortName : shopBankName}
                              </span>
                              {bankMatch?.bin && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FBF5EB] border border-[#EEDFC6] text-[#8A642C]">
                                  BIN: {bankMatch.bin}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-xs sm:text-sm font-bold text-[#1A1612] tracking-wider">
                                {maskedNumber}
                              </span>
                              <span className="text-[#A89E90]">·</span>
                              <span className="text-xs uppercase font-medium text-[#7D715E] truncate">
                                {shopBankAccountName}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Badge Trạng thái KYC / Xác minh */}
                        <div className="shrink-0">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#FBF5EB] text-[#8A642C] border border-[#EEDFC6]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C59B58]" />
                            <span>Đã cấu hình</span>
                          </span>
                        </div>
                      </div>

                      {/* Phân cách & Nút Thao tác */}
                      <div className="border-t border-[#EAE4D7] mt-3 pt-2.5 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-[#7D715E]">
                          Dùng để chi trả hoa hồng cho KOL/CTV
                        </span>
                        <div className="flex items-center gap-3 font-semibold">
                          <button
                            type="button"
                            onClick={handleStartEditBank}
                            className="text-[#7D715E] hover:text-[#B88E4F] transition cursor-pointer"
                          >
                            Đổi tài khoản
                          </button>
                          <span className="text-[#EAE4D7]">|</span>
                          <button
                            type="button"
                            onClick={handleDisconnectBank}
                            className="text-[#DC2626] hover:text-red-700 transition cursor-pointer"
                          >
                            Ngừng dùng
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {/* Khi CHƯA có tài khoản hoặc đang thu gọn */}
            {!hasBankAccount && !showAddBankForm && (
              <button
                type="button"
                onClick={() => {
                  const match = findBankByQuery(shopBankName) || null;
                  setSelectedBank(match);
                  setAccountNumberInput("");
                  setAccountNameInput(shopBankAccountName);
                  setShowAddBankForm(true);
                }}
                className="payout-bank-empty group mt-3.5 flex w-full flex-col items-center justify-center gap-2.5 rounded-xl border border-dashed border-[#EEDFC6] bg-gradient-to-b from-[#FAF8F5]/80 to-white p-5 text-center transition hover:border-[#C59B58] hover:bg-[#FBF5EB]/50 cursor-pointer"
              >
                <div className="flex max-w-sm flex-col items-center gap-2">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-white text-[#B88E4F] shadow-2xs transition-transform group-hover:scale-105">
                    <Landmark className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-[#1A1612] transition-colors group-hover:text-[#8A642C]">
                      Liên kết ngân hàng chi trả
                    </div>
                    <p className="m-0 mt-1 text-[11px] sm:text-xs leading-relaxed text-[#7D715E]">
                      Thêm ngân hàng để đối soát và chi trả hoa hồng.
                    </p>
                  </div>
                </div>
                <div className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#C59B58] to-[#B88E4F] px-4 text-xs font-semibold text-white shadow-xs transition hover:brightness-105">
                  <Plus className="h-4 w-4" />
                  <span>Thêm tài khoản</span>
                </div>
              </button>
            )}

            {/* Form Thêm/Đổi tài khoản ngân hàng (Chuẩn ẢNH 2) */}
            {showAddBankForm && (
              <div className="mt-3 rounded-xl border border-[#EEDFC6] bg-[#FAF8F5]/50 p-3.5 sm:p-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#EAE4D7]">
                  <h3 className="text-xs sm:text-sm font-bold text-[#1A1612] m-0">
                    Tài khoản dùng để chi trả KOL
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
                              {selectedBank?.shortName || "Chọn ngân hàng"}
                            </span>
                            {selectedBank?.bin && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FBF5EB] border border-[#EEDFC6] text-[#8A642C]">
                                BIN: {selectedBank.bin}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-[#7D715E] truncate m-0">
                            {selectedBank?.name || "Chọn ngân hàng nhận tiền"}
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
                        className="w-full h-9 sm:h-9.5 px-3 bg-white border border-[#EAE4D7] rounded-xl text-xs sm:text-sm font-bold text-[#1A1612] placeholder:text-[#A89E90] placeholder:font-normal outline-none focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58]/20 transition"
                      />
                    </div>
                  </div>

                  {/* Nút Lưu thông tin tài khoản */}
                  <button
                    type="submit"
                    disabled={isSavingBank}
                    className="w-full h-9.5 sm:h-10 bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:brightness-105 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>{isSavingBank ? 'Đang lưu...' : 'Lưu tài khoản chi trả KOL'}</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
        )}

        {/* Cột 2: Thống kê & Tổng quan chi trả (KPIs Chuẩn Figma 13) */}
        <div className="payout-summary-panel payout-bank-panel flex flex-col justify-between rounded-2xl border border-[#EAE4D7] bg-white p-4.5 sm:p-5 shadow-[0_2px_12px_rgba(35,29,21,0.03)]">
          <div>
            {/* Header: Tiêu đề + Badge thời gian thực */}
            <div className="flex items-center justify-between gap-3 border-b border-[#EAE4D7] pb-3">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex h-8.5 w-8.5 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
                  <BarChart3 className="h-4 w-4" />
                </div>
                <h3 className="m-0 text-sm font-bold text-[#1A1612] sm:text-base">
                  Tổng quan chi trả
                </h3>
              </div>
              <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[#EAE4D7] bg-[#FAF8F5] px-2.5 py-1 text-[11px] font-semibold text-[#7D715E]">
                <Clock className="h-3.5 w-3.5 text-[#B88E4F]" />
                <span>Hôm nay</span>
              </span>
            </div>

            {/* Grid 4 thẻ KPI */}
            <div className="payout-metric-grid mt-3.5 grid grid-cols-2 gap-2.5 sm:gap-3">
              {/* KPI 1: Chờ phê duyệt */}
              <div
                role="button"
                tabIndex={0}
                aria-pressed={activeKpiFilter === "PENDING"}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.currentTarget.click();
                  }
                }}
                onClick={() =>
                  setActiveKpiFilter((prev) => (prev === "PENDING" ? "ALL" : "PENDING"))
                }
                className={`payout-metric flex min-h-[92px] cursor-pointer select-none flex-col justify-between rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                  activeKpiFilter === "PENDING"
                    ? "border-[#C59B58] bg-[#FBF5EB] shadow-xs ring-1 ring-[#C59B58]/30"
                    : "border-[#EAE4D7] bg-gradient-to-b from-[#FAF8F5]/50 to-white hover:border-[#C59B58]/60 hover:bg-[#FBF5EB]/30 shadow-2xs"
                }`}
                title="Bấm để lọc danh sách các yêu cầu đang Chờ phê duyệt"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="truncate text-xs font-semibold text-[#7D715E]">
                    Chờ phê duyệt
                  </span>
                  <div className="flex items-center gap-1">
                    {activeKpiFilter === "PENDING" && (
                      <span className="rounded border border-[#EEDFC6] bg-white px-1.5 py-0.5 text-[9px] font-bold text-[#8A642C]">
                        Đang lọc
                      </span>
                    )}
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[#EEDFC6] bg-white shadow-2xs">
                      <Hourglass className="h-3.5 w-3.5 text-[#B88E4F]" />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-extrabold leading-none text-[#1A1612] tracking-tight">
                    {displayPendingCount}
                  </div>
                  <span className="mt-1.5 block truncate text-[11px] sm:text-xs font-semibold text-[#8A642C] whitespace-nowrap">
                    {money(String(displayPendingAmount))}
                  </span>
                </div>
              </div>

              {/* KPI 2: Đã duyệt hôm nay */}
              <div
                role="button"
                tabIndex={0}
                aria-pressed={activeKpiFilter === "APPROVED"}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.currentTarget.click();
                  }
                }}
                onClick={() =>
                  setActiveKpiFilter((prev) => (prev === "APPROVED" ? "ALL" : "APPROVED"))
                }
                className={`payout-metric flex min-h-[92px] cursor-pointer select-none flex-col justify-between rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                  activeKpiFilter === "APPROVED"
                    ? "border-[#C59B58] bg-[#FBF5EB] shadow-xs ring-1 ring-[#C59B58]/30"
                    : "border-[#EAE4D7] bg-gradient-to-b from-[#FAF8F5]/50 to-white hover:border-[#C59B58]/60 hover:bg-[#FBF5EB]/30 shadow-2xs"
                }`}
                title="Bấm để lọc danh sách các yêu cầu Đã duyệt hôm nay"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="truncate text-xs font-semibold text-[#7D715E]">
                    Đã duyệt hôm nay
                  </span>
                  <div className="flex items-center gap-1">
                    {activeKpiFilter === "APPROVED" && (
                      <span className="rounded border border-[#EEDFC6] bg-white px-1.5 py-0.5 text-[9px] font-bold text-[#8A642C]">
                        Đang lọc
                      </span>
                    )}
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[#EEDFC6] bg-white shadow-2xs">
                      <CheckCircle className="h-3.5 w-3.5 text-[#059669]" />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-extrabold leading-none text-[#1A1612] tracking-tight">
                    {displayApprovedCount}
                  </div>
                  <span className="mt-1.5 block truncate text-[11px] sm:text-xs font-semibold text-[#8A642C] whitespace-nowrap">
                    {money(String(displayApprovedAmount))}
                  </span>
                </div>
              </div>

              {/* KPI 3: Thuế đã giữ */}
              <div
                role="button"
                tabIndex={0}
                aria-pressed={activeKpiFilter === "TAX"}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.currentTarget.click();
                  }
                }}
                onClick={() =>
                  setActiveKpiFilter((prev) => (prev === "TAX" ? "ALL" : "TAX"))
                }
                className={`payout-metric flex min-h-[92px] cursor-pointer select-none flex-col justify-between rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                  activeKpiFilter === "TAX"
                    ? "border-[#C59B58] bg-[#FBF5EB] shadow-xs ring-1 ring-[#C59B58]/30"
                    : "border-[#EAE4D7] bg-gradient-to-b from-[#FAF8F5]/50 to-white hover:border-[#C59B58]/60 hover:bg-[#FBF5EB]/30 shadow-2xs"
                }`}
                title="Bấm để lọc các lệnh có Khấu trừ thuế TNCN 10%"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="truncate text-xs font-semibold text-[#7D715E]">
                    Thuế đã giữ (10%)
                  </span>
                  <div className="flex items-center gap-1">
                    {activeKpiFilter === "TAX" && (
                      <span className="rounded border border-[#EEDFC6] bg-white px-1.5 py-0.5 text-[9px] font-bold text-[#8A642C]">
                        Đang lọc
                      </span>
                    )}
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[#EAE4D7] bg-white shadow-2xs">
                      <FileText className="h-3.5 w-3.5 text-[#B88E4F]" />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-base sm:text-lg font-extrabold leading-none text-[#1A1612] tracking-tight whitespace-nowrap">
                    {displayTaxAmount >= 1000000
                      ? `${(displayTaxAmount / 1000000).toLocaleString("vi-VN", {
                          maximumFractionDigits: 2,
                        })} tr ₫`
                      : money(String(displayTaxAmount))}
                  </div>
                  <span className="mt-1.5 block truncate text-[11px] sm:text-xs font-semibold text-[#7D715E] whitespace-nowrap">
                    {displayTaxCount > 0 ? `${displayTaxCount} lệnh · Từ 2 triệu` : "10% lệnh từ 2 triệu"}
                  </span>
                </div>
              </div>

              {/* KPI 4: Cần bổ sung KYC */}
              <div
                role="button"
                tabIndex={0}
                aria-pressed={activeKpiFilter === "KYC"}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    event.currentTarget.click();
                  }
                }}
                onClick={() =>
                  setActiveKpiFilter((prev) => (prev === "KYC" ? "ALL" : "KYC"))
                }
                className={`payout-metric flex min-h-[92px] cursor-pointer select-none flex-col justify-between rounded-xl border p-3 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                  activeKpiFilter === "KYC"
                    ? "border-[#DC2626] bg-[#FEF2F2] shadow-xs ring-1 ring-[#DC2626]/20"
                    : "border-[#EAE4D7] bg-gradient-to-b from-[#FAF8F5]/50 to-white hover:border-[#FECACA] hover:bg-white shadow-2xs"
                }`}
              title="Bấm để lọc các lệnh cần bổ sung hồ sơ định danh"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="truncate text-xs font-semibold text-[#7D715E]">
                Cần bổ sung định danh
                  </span>
                  <div className="flex items-center gap-1">
                    {activeKpiFilter === "KYC" && (
                      <span className="text-[9px] font-bold text-[#DC2626] bg-white px-1.5 py-0.5 rounded border border-[#FECACA]">
                        Đang lọc
                      </span>
                    )}
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-[#FECACA] bg-white shadow-2xs">
                      <AlertTriangle className="h-3.5 w-3.5 text-[#DC2626]" />
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-lg sm:text-xl font-extrabold leading-none text-[#DC2626] tracking-tight">
                    {displayKycPendingCount}
                  </div>
                  <span className="mt-1.5 block truncate text-[11px] sm:text-xs font-semibold text-[#DC2626] whitespace-nowrap">
                    Không thể duyệt
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer đồng bộ */}
          <div className="mt-3.5 pt-2.5 border-t border-[#EAE4D7] flex items-center justify-between text-xs text-[#7D715E]">
            <span className="text-[11px] font-medium text-[#7D715E]">Tự động đối chiếu thuế thu nhập cá nhân và hồ sơ định danh</span>
            <span className="font-bold text-[#B88E4F] text-[11px] tracking-wide">VietQR / Napas247</span>
          </div>
        </div>
      </section>

      <section className="payout-approval-table @container/payout-approval-table min-w-0 max-w-full overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white shadow-[0_2px_12px_rgba(35,29,21,0.03)]">
        {/* Toolbar điều hướng & tìm kiếm */}
        <div className="payout-toolbar flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE4D7] bg-white p-3.5 sm:p-4">
          <div className="payout-toolbar-filters">
            {/* Thanh tìm kiếm nhanh */}
            <div className="payout-search relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#7D715E]" />
              <input
                type="text"
                aria-label="Tìm yêu cầu chi trả"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Tìm KOL, mã yêu cầu, số tài khoản..."
                className="h-9 w-48 sm:w-60 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5]/60 pl-8.5 pr-7 text-xs text-[#1A1612] placeholder:text-[#A89E90] outline-none transition focus:border-[#C59B58] focus:bg-white focus:ring-1 focus:ring-[#C59B58]/20"
              />
              {searchQuery && (
                <button
                  type="button"
                  aria-label="Xóa từ khóa tìm chi trả"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#7D715E] hover:text-[#1A1612]"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Dropdown Trạng thái */}
            <div className="payout-filter-status">
              <Select
                  aria-label="Lọc trạng thái chi trả"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value as PayoutStatus | "");
                  setPage(1);
                }}
                disabled={busy || loading}
                className="h-9 min-w-[155px] text-xs rounded-xl border-[#EAE4D7] bg-white text-[#1A1612]"
              >
                <option value="">Tất cả trạng thái</option>
                {Object.entries(STATUS_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Nút Xóa bộ lọc KPI khi đang có thẻ KPI active */}
            {activeKpiFilter !== "ALL" && (
              <button
                type="button"
                onClick={() => setActiveKpiFilter("ALL")}
                className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-2.5 text-xs font-semibold text-[#8A642C] transition hover:border-[#FECACA] hover:text-[#DC2626]"
              >
                <span>Đang lọc: {activeKpiFilter === 'PENDING' ? 'Chờ duyệt' : activeKpiFilter === 'APPROVED' ? 'Đã duyệt' : activeKpiFilter === 'TAX' ? 'Thuế 10%' : 'Hồ sơ định danh'}</span>
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="payout-toolbar-actions">
            <button
              type="button"
              onClick={() => void load()}
              disabled={loading || busy}
                aria-label="Tải lại danh sách chi trả"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-[#EAE4D7] bg-white text-[#5F5547] shadow-2xs transition hover:bg-[#FAF8F5] cursor-pointer"
              title="Tải lại dữ liệu yêu cầu chi trả"
            >
              <RefreshCw size={13} className={loading || busy ? "animate-spin text-[#B88E4F]" : "text-[#7D715E]"} />
            </button>

            <button
              type="button"
              disabled={busy || loading}
              onClick={handleExportExcel}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#C59B58] to-[#B88E4F] px-3.5 text-xs font-semibold text-white shadow-xs transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
                title="Bấm để xuất tệp danh sách chuyển khoản VietQR / Napas247 tương thích Excel"
            >
              <Download size={14} />
              <span>
                {selected.length > 0
                  ? `Xuất Excel VietQR (${selected.length})`
                  : `Xuất Excel VietQR (${eligible.length > 0 ? eligible.length : displayedRequests.length})`}
              </span>
            </button>
          </div>
        </div>

        {loading && <p className="p-5 text-sm text-[#7D715E]">Đang tải dữ liệu chi trả…</p>}

        <div className="payout-selection-bar">
            <label className="payout-select-all">
            <input type="checkbox" aria-label="Chọn tất cả lệnh chi trả đang chờ" checked={eligible.length > 0 && eligible.every((request) => selected.includes(request.id))} disabled={busy || loading || eligible.length === 0} onChange={(event) => setSelected(event.target.checked ? eligible.map((request) => request.id) : [])} className="accent-[#C59B58]" />
              <span>Chọn tất cả yêu cầu chờ trên trang</span>
            </label>
            <span className="payout-selection-count">{selected.length > 0 ? `Đã chọn ${selected.length} yêu cầu` : `${eligible.length} yêu cầu có thể chọn`}</span>
        </div>
        {/* Bảng chỉ cần cuộn ngang khi có yêu cầu để xem. */}
          {displayedRequests.length > 0 && <div className="payout-table-scroll relative isolate max-w-full overflow-x-auto overscroll-x-contain" role="region" aria-label="Danh sách chi trả hoa hồng" tabIndex={0}>
            <table
          aria-label="Danh sách chi trả"
              className="w-full min-w-[1060px] table-fixed text-left text-xs"
            >
            <colgroup>
              <col className="w-[42px]" />
              <col className="w-[20%]" />
              <col />
              <col className="w-[110px]" />
              <col className="w-[90px]" />
              <col className="w-[110px]" />
              <col className="w-[180px]" />
              <col className="w-[160px]" />
            </colgroup>
            <thead className="border-b border-[#EAE4D7] bg-[#FAF8F5] text-[11px] font-bold uppercase tracking-wider text-[#7D715E]">
              <tr>
                <th className="px-2.5 py-3 text-center">
                  <input
                    type="checkbox"
                      aria-label="Chọn tất cả lệnh chi trả đang chờ trên trang"
                    checked={
                      eligible.length > 0 &&
                      eligible.every((request) => selected.includes(request.id))
                    }
                    disabled={busy || loading || eligible.length === 0}
                    onChange={(event) =>
                      setSelected(
                        event.target.checked
                          ? eligible.map((request) => request.id)
                          : []
                      )
                    }
                    className="accent-[#C59B58] rounded cursor-pointer"
                  />
                </th>
                <th scope="col" className="px-3 py-3">KOL / Mã yêu cầu</th>
                <th scope="col" className="px-3 py-3">Người thụ hưởng</th>
                <th scope="col" className="px-2.5 py-3 text-right">Yêu cầu</th>
                <th scope="col" className="px-2.5 py-3 text-right">Thuế</th>
                <th scope="col" className="px-2.5 py-3 text-right">Thực nhận</th>
                <th scope="col" className="px-2.5 py-3 text-center">Trạng thái</th>
                <th scope="col" className="bg-[#FAF8F5] px-2.5 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {displayedRequests.map((request) => (
                <tr key={request.id} className="border-t border-[#EAE4D7] transition hover:bg-[#FAF8F5]/60">
                  <td className="px-2.5 py-2.5 text-center align-middle">
                    <input
                      type="checkbox"
                        aria-label={`Chọn lệnh chi trả ${request.id}`}
                      checked={selected.includes(request.id)}
                      disabled={
                        busy ||
                        loading ||
                        request.status !== "PENDING" ||
                        Boolean(request.batchId)
                      }
                      onChange={(event) =>
                        setSelected((current) =>
                          event.target.checked
                            ? [...current, request.id]
                            : current.filter((id) => id !== request.id)
                        )
                      }
                      className="accent-[#C59B58] rounded cursor-pointer"
                    />
                  </td>
                  <td data-label="KOL / Mã yêu cầu" className="px-3 py-2.5 align-middle">
                    <div className="truncate font-bold text-xs text-[#1A1612]" title={request.collaboratorName}>
                      {request.collaboratorName}
                    </div>
                    {request.kycStatus && (
                      <div className="mt-0.5 flex items-center gap-1 text-[10px]">
              <span className="text-[#7D715E]">Định danh</span>
                        <span
                          className={`inline-flex items-center gap-1 font-semibold ${
                            request.kycStatus === "VERIFIED" ? "text-[#059669]" : "text-[#DC2626]"
                          }`}
                        >
                          {request.kycStatus === "VERIFIED" ? (
                            <>
                              <CheckCircle className="h-3 w-3 text-[#059669]" />
                              <span>Đã xác minh</span>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3 w-3 text-[#DC2626]" />
                              <span>Cần bổ sung</span>
                            </>
                          )}
                        </span>
                      </div>
                    )}
                    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[10px] text-[#7D715E]">
                      <span className="max-w-[135px] truncate whitespace-nowrap font-mono font-semibold text-[#8A642C]" title={request.id}>{request.id}</span>
                      <span className="shrink-0">·</span>
                      <span className="shrink-0 whitespace-nowrap">{new Date(request.createdAt).toLocaleDateString("vi-VN", { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</span>
                    </div>
                  </td>
                  <td data-label="Người thụ hưởng" className="px-3 py-2.5 align-middle">
                    <div className="max-w-full truncate text-xs font-bold uppercase text-[#1A1612]" title={request.bankAccountName ?? "Thiếu thông tin"}>
                      {request.bankAccountName ?? "Thiếu thông tin"}
                    </div>
                    <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-[#7D715E]">
                      <span className="min-w-0 truncate">{request.bankName}</span>
                      <span className="shrink-0 font-mono font-medium text-[#1A1612]">{maskBankAccount(request.bankAccountNumber)}</span>
                    </div>
                  </td>
                  <td data-label="Yêu cầu" className="px-2.5 py-2.5 text-right align-middle whitespace-nowrap">
                    <div className="font-bold text-xs text-[#1A1612]">
                      {money(request.amount)}
                    </div>
                  </td>
                  <td data-label="Thuế" className="px-2.5 py-2.5 text-right align-middle whitespace-nowrap">
                    {Number(request.taxAmount) > 0 ? (
                      <span className="font-semibold text-xs text-[#DC2626]">
                        -{money(request.taxAmount)}
                      </span>
                    ) : (
                      <span className="text-xs text-[#7D715E]">0 ₫</span>
                    )}
                  </td>
                  <td data-label="Thực nhận" className="px-2.5 py-2.5 text-right align-middle whitespace-nowrap">
                    <div className="font-bold text-xs text-[#B88E4F]">
                      {Number(request.netAmount) > 0 ? money(request.netAmount) : "Cần đối soát"}
                    </div>
                  </td>
                  <td data-label="Trạng thái" className="payout-status-cell px-2.5 py-2.5 text-center align-middle">
                    <span
                      className={`payout-status-pill inline-flex max-w-full items-center justify-center whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-semibold ${request.status === "REJECTED" ? "payout-status-rejected" : ""} ${
                        request.status === "APPROVED"
                          ? "border border-[#EEDFC6] bg-[#FBF5EB] text-[#8A642C]"
                          : request.status === "REJECTED"
                          ? "border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]"
                          : "border border-[#EEDFC6] bg-[#FBF5EB] text-[#8A642C]"
                      }`}
                    >
                      {STATUS_LABELS[request.status]}
                    </span>
                    {request.batchId && (
                      <div className="payout-status-reference mx-auto mt-1 max-w-[190px] truncate font-mono text-[10px] text-[#8A642C] font-medium" title={`Lô: ${request.batchId}`}>
                        Lô: {request.batchId}
                      </div>
                    )}
                    {request.bankRefCode && (
                      <div className="payout-status-reference mx-auto mt-0.5 max-w-[190px] truncate text-[10px] font-mono text-[#7D715E]" title={`GD: ${request.bankRefCode}`}>
                        GD: {request.bankRefCode}
                      </div>
                    )}
                    {request.rejectedReason && (
                      <div className="mt-0.5 text-[10px] text-[#DC2626] truncate max-w-[120px] mx-auto" title={request.rejectedReason}>
                        {request.rejectedReason}
                      </div>
                    )}
                  </td>
                  <td data-label="Thao tác" className="sticky right-0 z-10 bg-white px-2.5 py-2.5 align-middle shadow-[-1px_0_0_#EAE4D7]">
                    <div className="mx-auto flex w-full max-w-[130px] flex-col gap-1.5">
                      {(request.status === "PENDING" || request.status === "PROCESSING") && (
                        <button
                          type="button"
                          disabled={busy || loading}
                          onClick={() => openDialog(request, "approve")}
                          className="inline-flex h-8 w-full items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-2.5 text-xs font-semibold text-[#1A1612] transition hover:border-[#C59B58] cursor-pointer whitespace-nowrap"
                        >
                          Duyệt và tải chứng từ
                        </button>
                      )}
                      {request.status === "PENDING" && !request.batchId && (
                        <button
                          type="button"
                          disabled={busy || loading}
                          onClick={() => openDialog(request, "reject")}
                          className="inline-flex h-7.5 w-full items-center justify-center rounded-xl border border-[#EAE4D7] bg-white px-2.5 text-xs font-medium text-[#7D715E] transition hover:border-[#FECACA] hover:bg-[#FEF2F2] hover:text-[#DC2626] cursor-pointer whitespace-nowrap"
                        >
                          Từ chối
                        </button>
                      )}
                      {request.hasBill && (
                        <button
                          type="button"
                          disabled={busy}
                          onClick={() => void openBill(request)}
                          className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-2.5 text-xs font-semibold text-[#8A642C] transition hover:bg-[#F3EFE6] cursor-pointer whitespace-nowrap"
                        >
                          <ReceiptText size={13} className="text-[#B88E4F]" />
                          <span>Xem chứng từ</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>}

        {!loading && displayedRequests.length === 0 && (
          <div className="payout-table-empty">
            <span className="payout-empty-icon"><ReceiptText size={26} /></span>
            <h3>{status || activeKpiFilter !== "ALL" || searchQuery ? 'Không tìm thấy yêu cầu phù hợp' : 'Chưa có yêu cầu chi trả'}</h3>
            <p>{status || activeKpiFilter !== "ALL" || searchQuery ? 'Thử thay đổi từ khóa hoặc đặt lại bộ lọc để xem các yêu cầu khác.' : 'Các yêu cầu chi trả hoa hồng của gian hàng sẽ hiển thị tại đây.'}</p>
            {(status || activeKpiFilter !== "ALL" || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setStatus("");
                  setActiveKpiFilter("ALL");
                  setSearchQuery("");
                }}
                className="mt-2 text-xs font-bold text-[#C59B58] hover:underline cursor-pointer"
              >
                Đặt lại tất cả bộ lọc
              </button>
            )}
          </div>
        )}

        {/* Thanh phân trang */}
        <div className="payout-pagination">
          <div className="payout-pagination-summary"><span>Hiển thị</span><strong>{displayedRequests.length}</strong><span>yêu cầu chi trả</span><span aria-hidden="true">·</span><span>Trang {page}</span></div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={busy || loading || page <= 1}
              onClick={() => setPage((current) => current - 1)}
              className="h-8 px-3 rounded-xl border border-[#EAE4D7] bg-white text-xs font-semibold text-[#1A1612] hover:bg-[#FAF8F5] disabled:cursor-not-allowed disabled:opacity-50 transition cursor-pointer"
            >
              Trước
            </button>
            <button
              type="button"
              disabled={busy || loading || page * 10 >= displayedRequests.length}
              onClick={() => setPage((current) => current + 1)}
              className="h-8 px-3 rounded-xl border border-[#EAE4D7] bg-white text-xs font-semibold text-[#1A1612] hover:bg-[#FAF8F5] disabled:cursor-not-allowed disabled:opacity-50 transition cursor-pointer"
            >
              Sau
            </button>
          </div>
        </div>
      </section>
      <section className="payout-batch-history rounded-2xl border border-line bg-white p-5">
        <div className="payout-batch-heading"><span className="payout-batch-icon"><FileText size={22} /></span><div><h2>Lịch sử lô VietQR gần nhất</h2><p>Theo dõi các lô đã xuất và tải lại tệp khi cần.</p></div><span className="payout-batch-count">{batches.length} lô</span></div>
        <p className="payout-batch-notice">
          <ShieldCheck size={17} /> <span>
            Tải lại cùng tệp không tạo lô mới. Tệp có thể chứa lệnh đã chi trả —
          không chuyển khoản lại.
          </span></p>
        {batches.length === 0 ? (
          <div className="payout-batch-empty"><Landmark size={24} /><div><strong>Chưa có lô thanh toán</strong><p>Các lô VietQR đã xuất sẽ được lưu trong danh sách này.</p></div></div>
        ) : (
          <ul className="mt-4 space-y-3">
            {batches.map((batch) => (
              <li
                key={batch.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line p-3 hover:border-brand/40 transition"
              >
                <div>
                  <p className="font-mono text-xs font-bold text-[#1A1612]">
                    {batch.id}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {batch.payoutCount} lệnh chi trả ·{" "}
                    {new Date(batch.createdAt).toLocaleString("vi-VN")}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    void runAction(async () => {
                      try {
                        const blob = await payoutService.downloadBatch(storeId, batch.id);
                        saveWorkbook(blob, `SCANMS-VietQR-${batch.id}.xlsx`);
                      } catch (error) {
                        if (!fixtureMode) throw error;
                        const batchRows = [
                          [
                            "STT",
                          "Mã chi trả",
                            "KOL Nhận Tiền",
                            "Ngân Hàng",
                            "Số Tài Khoản",
                            "Tên Chủ Thụ Hưởng",
                            "Số Tiền Chi Trả (VND)",
                            "Trạng Thái",
                            "Mã Lô",
                          ],
                          ...baseRequests
                            .slice(0, batch.payoutCount)
                            .map((r, idx) => [
                              idx + 1,
                              r.id,
                              r.collaboratorName,
                              r.bankName || "MBBank",
                              r.bankAccountNumber || "••••",
                              r.bankAccountName || r.collaboratorName,
                              r.netAmount || r.amount,
                              r.status,
                              batch.id,
                            ]),
                        ];
                        const csvContent =
                          "\uFEFF" +
                          batchRows
                            .map((e) => e.map((val) => `"${val}"`).join(","))
                            .join("\n");
                        const blob = new Blob([csvContent], {
                          type: "text/csv;charset=utf-8;",
                        });
                        saveWorkbook(blob, `SCANMS-VietQR-${batch.id}.csv`);
                        toast.success(`Đã tải lại tệp của lô ${batch.id}!`);
                      }
                    })
                  }
                  className={`${buttonClass} bg-surface-sand hover:bg-[#EAE4D7] transition cursor-pointer`}
                >
                  Tải lại Excel
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      {dialog && (
        <dialog
          ref={modalRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="payout-dialog-title"
          onCancel={(event) => {
            event.preventDefault();
            if (!busy) setDialog(null);
          }}
          className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto rounded-2xl border border-line bg-white p-6 text-ink shadow-xl backdrop:bg-brand-dark/50"
        >
          <h2 id="payout-dialog-title" className="text-xl font-bold">
            {dialog.action === "approve"
                  ? "Duyệt chi trả và tải chứng từ ngân hàng"
              : "Từ chối yêu cầu"}
          </h2>
          <p className="mt-2 break-all font-mono text-xs text-muted">
            {dialog.request.id}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <section className="rounded-xl border border-line bg-canvas p-4">
              <h3 className="mb-3 text-sm font-semibold">Thông tin KOL</h3>
              <div className="flex items-center gap-3">
                {dialog.request.collaboratorAvatar ? (
                  <img
                    src={dialog.request.collaboratorAvatar}
                    alt=""
                    referrerPolicy="no-referrer"
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-soft font-bold text-brand-strong">
                    {dialog.request.collaboratorName?.charAt(0) || "K"}
                  </span>
                )}
                <strong>{dialog.request.collaboratorName}</strong>
              </div>
              <dl className="mt-3 space-y-2 break-words text-sm">
                <div>
                  <dt className="text-muted">Số điện thoại</dt>
                  <dd>{dialog.request.collaboratorPhone || "Chưa cập nhật"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Email</dt>
                  <dd>{dialog.request.collaboratorEmail || "Chưa cập nhật"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Mã số thuế</dt>
                  <dd>
                    {dialog.request.collaboratorTaxCode || "Chưa cập nhật"}
                  </dd>
                </div>
              </dl>
            </section>
            <section className="rounded-xl border border-line bg-canvas p-4">
              <h3 className="mb-3 text-sm font-semibold">
                Ngân hàng nhận tiền
              </h3>
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-muted">Ngân hàng</dt>
                  <dd>{dialog.request.bankName || "Chưa cập nhật"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Số tài khoản</dt>
                  <dd className="font-mono">
                    {maskBankAccount(dialog.request.bankAccountNumber)}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted">Chủ tài khoản</dt>
                  <dd>{dialog.request.bankAccountName || "Chưa cập nhật"}</dd>
                </div>
              </dl>
            </section>
          </div>
          <dl className="mt-4 grid gap-3 rounded-xl border border-brand-border bg-brand-soft p-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-muted">Số tiền yêu cầu</dt>
              <dd className="mt-1 font-semibold">
                {money(dialog.request.amount)}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Thuế TNCN đã khấu trừ</dt>
              <dd className="mt-1 font-semibold">
                {money(dialog.request.taxAmount)}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Số tiền thực chuyển</dt>
              <dd className="mt-1 font-bold text-brand-strong">
                {money(dialog.request.netAmount)}
              </dd>
            </div>
          </dl>
          <form
            onSubmit={(event) => void submitDialog(event)}
            className="mt-5 space-y-4"
            aria-busy={busy}
          >
            {dialog.action === "approve" ? (
              <>
                <p className="text-sm text-muted">
                Chỉ xác nhận sau khi chuyển khoản thành công. Chứng từ không được
                tái sử dụng cho lệnh chi trả khác. Duyệt chi trả không trừ ví lần
                  nữa.
                </p>
                <label className="block text-sm">
                  Mã giao dịch ngân hàng (nếu có)
                  <input
                    aria-label="Mã giao dịch ngân hàng"
                    value={bankRefCode}
                    onChange={(event) => setBankRefCode(event.target.value)}
                    maxLength={100}
                    disabled={busy}
                    className="mt-2 w-full rounded-xl border border-line p-3 focus:border-brand"
                  />
                </label>
                <PayoutBillUpload
                  file={bill}
                  maxBytes={Math.min(
                    history?.maxBillBytes ?? MAX_PAYOUT_BILL_BYTES,
                    MAX_PAYOUT_BILL_BYTES,
                  )}
                  disabled={busy}
                  onChange={setBill}
                />
                <label className="block text-sm">
                  Ghi chú (không bắt buộc)
                  <textarea
                  aria-label="Ghi chú duyệt chi trả"
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={500}
                    disabled={busy}
                    rows={3}
                    placeholder="Ghi chú về giao dịch chuyển khoản..."
                    className="mt-2 w-full resize-y rounded-xl border border-line p-3 focus:border-brand"
                  />
                  <span className="mt-1 block text-right text-xs text-muted">
                    {note.length}/500
                  </span>
                </label>
              </>
            ) : (
              <label className="block text-sm">
                Lý do từ chối
                <textarea
                  aria-label="Lý do từ chối"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  required
                  maxLength={500}
                  disabled={busy}
                  className="mt-2 w-full rounded-xl border border-line p-3 focus:border-brand"
                />
              </label>
            )}
            {error && (
              <p role="alert" className="text-sm text-danger">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setDialog(null)}
                className={buttonClass}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={busy || (dialog.action === "approve" && !bill)}
                className={`${buttonClass} border-brand bg-brand text-white hover:bg-brand-strong`}
              >
                {busy
                    ? "Đang tải chứng từ và xác nhận…"
                  : dialog.action === "approve"
                    ? "Xác nhận duyệt"
                    : "Từ chối & hoàn tiền"}
              </button>
            </div>
          </form>
        </dialog>
      )}

      {/* Modal Chọn Danh Sách Ngân Hàng Việt Nam (65+ Ngân hàng VietQR) */}
      <BankSelectorModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        onSelectBank={handleBankChosen}
        selectedBankName={selectedBank?.shortName || shopBankName}
      />

      {/* Modal Xác nhận Ngừng sử dụng tài khoản ngân hàng */}
      <ConfirmModal
        isOpen={isDisconnectConfirmOpen}
        onClose={() => setIsDisconnectConfirmOpen(false)}
        onConfirm={handleConfirmDisconnectBank}
        title="Ngừng sử dụng tài khoản ngân hàng"
        message="Bạn có chắc chắn muốn ngừng sử dụng tài khoản chi trả này? Sau khi gỡ, bạn có thể liên kết tài khoản ngân hàng mới bất kỳ lúc nào."
        confirmText="Ngừng sử dụng"
        variant="danger"
      />

      {/* Modal Xem Bill Chuyển Khoản Ngân Hàng VietQR / Napas247 */}
      {viewingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div role="dialog" aria-modal="true" aria-label="Chứng từ chi trả" className="relative w-full max-w-md bg-white rounded-3xl border border-[#EEDFC6] p-6 shadow-2xl text-left animate-in fade-in zoom-in-95">
            <button
              type="button"
              aria-label="Đóng chứng từ chi trả"
              onClick={() => setViewingBill(null)}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#EAE4D7] text-[#7D715E] hover:text-[#1A1612] flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 pb-4 border-b border-[#EAE4D7]">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1A1612] m-0">Hồ sơ chứng từ chi trả</h3>
                <p className="text-xs text-[#7D715E] m-0">Thông tin đối soát do Shop ghi nhận</p>
              </div>
            </div>

            <div className="mt-4 p-4 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7] space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-[#7D715E]">Mã giao dịch ngân hàng:</span>
                <span className="font-mono font-bold text-[#1A1612]">{viewingBill.bankRefCode || 'Chưa cung cấp'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7D715E]">Mã yêu cầu SCANMS:</span>
                <span className="font-mono font-semibold text-[#7D715E]">{viewingBill.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7D715E]">KOL thụ hưởng:</span>
                <span className="font-bold text-[#1A1612]">{viewingBill.collaboratorName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7D715E]">Ngân hàng thụ hưởng:</span>
                <span className="font-semibold text-[#1A1612]">{viewingBill.bankName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7D715E]">Số tài khoản:</span>
                <span className="font-mono font-bold text-[#1A1612]">{maskBankAccount(viewingBill.bankAccountNumber)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7D715E]">Chủ tài khoản:</span>
                <span className="font-bold text-[#1A1612] uppercase">{viewingBill.bankAccountName}</span>
              </div>
              <div className="border-t border-[#EAE4D7] pt-2 flex justify-between items-baseline">
                <span className="text-xs text-[#7D715E]">Số tiền thực chuyển:</span>
                <span className="font-mono text-base font-bold text-[#8A642C]">{money(viewingBill.netAmount || viewingBill.amount)}</span>
              </div>
              {Number(viewingBill.taxAmount) > 0 && (
                <div className="flex justify-between text-[11px] text-[#7D715E]">
                  <span>Thuế TNCN 10% đã khấu trừ:</span>
                  <span className="font-mono font-semibold text-rose-600">-{money(viewingBill.taxAmount)}</span>
                </div>
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[#EAE4D7] bg-[#F3EFE6] p-3 text-xs">
              <div className="flex items-center gap-1.5 font-semibold text-[#5F5547]">
                <CheckCircle className="h-4 w-4 text-[#059669]" />
                <span>{viewingBill.status === 'APPROVED' ? 'Gian hàng đã xác nhận chi trả' : 'Chưa xác nhận chi trả'}</span>
              </div>
              <span className="text-right font-mono text-[11px] text-[#7D715E]">
                {viewingBill.processedAt ? new Date(viewingBill.processedAt).toLocaleString('vi-VN') : 'Chưa ghi nhận thời điểm'}
              </span>
            </div>

            {busy && <p role="status" className="mt-3 text-xs text-[#7D715E]">Đang tải chứng từ từ máy chủ…</p>}
            {error && <p role="alert" className="mt-3 text-xs text-[#DC2626]">{error}</p>}
            {billLink && <a href={billLink} target="_blank" rel="noopener noreferrer"
              className="mt-3 block text-sm font-semibold text-[#B88E4F] underline">Mở chứng từ đã tải lên (liên kết có thời hạn)</a>}

            <button
              type="button"
              onClick={() => setViewingBill(null)}
              className="mt-4 w-full py-2.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white font-bold text-xs transition cursor-pointer"
            >
              Đóng chứng từ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
