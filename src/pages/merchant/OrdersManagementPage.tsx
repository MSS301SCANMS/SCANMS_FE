import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { createPortal } from "react-dom";
import {
  Download,
  FileSpreadsheet,
  PackagePlus,
  Plus,
  Trash2,
  Upload,
  X,
  Search,
  Truck,
  CheckCircle2,
  Eye,
  RefreshCw,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Clock,
  Phone,
  Users,
  Printer,
  ChevronDown,
  MoreHorizontal,
  Info,
  Copy,
  Check,
  Package,
} from "lucide-react";
import { toast } from "../../utils/toast";
import { Select } from "../../components/ui/Select";
import { productService, type Product } from "../../services/product.service";
import {
  orderService,
  type ExcelImportResult,
  type StoreOrderRecord,
} from "../../services/order.service";
import { storeService } from "../../services/store.service";
import {
  loadShippingAddresses,
  type ShippingProvince,
} from "../../services/order-address.service";
import {
  moneyInCents,
  validateExcelFile,
  validateManualItems,
  type ManualItemForm,
} from "@/validations/manual-order.validation";
import {
  ShippingLabel,
  printShippingLabel,
} from "../../components/orders/ShippingLabel";
import { shippingService, type GhnTrackingDetail } from "../../services/shipping.service";
import { GhnTrackingTimeline } from '../../components/shipping/GhnTrackingTimeline';
import { ShippingSimulationControls } from '../../components/shipping/ShippingSimulationControls';
import { CustomSelect } from "../../components/ui/CustomSelect";
import { returnStatusLabel } from '../../utils/return-status.utils';
import { isGeneratedGhnTestTrackingCode } from '../../utils/ghn-tracking-code';
import { StatCard } from '../../components/ui/StatCard';
import ShopSampleManagementTab from './ShopSampleManagementTab';
import './ShippingDispatchModal.css';

export type OrderSearchField = "ALL" | "ORDER_SN" | "CUSTOMER_NAME" | "PHONE" | "TRACKING" | "PRODUCT";

type OrderAction = "manual" | "excel";
interface Props {
  initialAction?: OrderAction;
  onClose?: () => void;
  onCompleted?: (message: string) => void;
}
const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-ink outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:bg-surface-sand disabled:opacity-60";
const buttonClass =
  "rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-ink hover:bg-brand-soft disabled:opacity-50";
const newItem = (): ManualItemForm => ({
  id: crypto.randomUUID(),
  productId: "",
  quantity: "1",
  unitPrice: "",
});
const currency = (cents: number) =>
  (cents / 100).toLocaleString("vi-VN", { maximumFractionDigits: 2 }) + " ₫";
const messageOf = (error: unknown) =>
  error instanceof Error
    ? error.message
    : "Không thể xử lý yêu cầu. Vui lòng thử lại";

function ProductThumbnail({
  src,
  alt,
  quantity,
}: {
  src?: string | null;
  alt: string;
  quantity?: number;
}) {
  const [imgErr, setImgErr] = useState(false);
  return (
    <div className="relative w-10 h-10 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] overflow-hidden shrink-0 flex items-center justify-center shadow-2xs group-hover:border-[#C59B58]/40 transition-colors">
      {src && !imgErr ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImgErr(true)}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-[#FBF5EB] text-[#B88E4F]">
          <ShoppingBag className="w-3.5 h-3.5" />
        </div>
      )}
      {typeof quantity === "number" && (
        <span className="absolute bottom-0 right-0 bg-[#231D15]/85 text-white text-[8px] font-bold px-1 py-0.2 rounded-tl-md leading-none">
          x{quantity}
        </span>
      )}
    </div>
  );
}

export default function OrdersManagementPage({
  initialAction,
  onClose,
  onCompleted,
}: Props = {}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedView = searchParams.get('tab') ?? searchParams.get('view');
  const activeOrderView = requestedView === 'samples' ? 'SAMPLES' : 'COMMERCIAL';
  const setActiveOrderView = (view: 'COMMERCIAL' | 'SAMPLES') => {
    setSearchParams(current => {
      const next = new URLSearchParams(current);
      next.delete('view');
      next.set('tab', view === 'SAMPLES' ? 'samples' : 'commercial');
      return next;
    }, { replace: true });
  };
  const deepLinkHandledRef = useRef<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const inFlight = useRef(false);
  const requestId = useRef(crypto.randomUUID());
  const [action, setAction] = useState<OrderAction | null>(
    initialAction ?? null,
  );
  const [storeId, setStoreId] = useState<string>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [productError, setProductError] = useState("");
  const [reload, setReload] = useState(0);
  const [addresses, setAddresses] = useState<ShippingProvince[]>([]);
  const [addressError, setAddressError] = useState("");
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addressReload, setAddressReload] = useState(0);
  const [busy, setBusy] = useState(false);
  const [applying, setApplying] = useState(false);
  const [notice, setNotice] = useState<{
    error: boolean;
    message: string;
  } | null>(null);
  const [orderCode, setOrderCode] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [provinceCode, setProvinceCode] = useState("");
  const [districtCode, setDistrictCode] = useState("");
  const [wardCode, setWardCode] = useState("");
  const [payment, setPayment] = useState<"COD" | "BANK_TRANSFER" | "E_WALLET">(
    "COD",
  );
  const [shippingFee, setShippingFee] = useState("0");
  const [discountCode, setDiscountCode] = useState("");
  const [discount, setDiscount] = useState<{
    code: string;
    amount: number;
    fingerprint: string;
  } | null>(null);
  const [note, setNote] = useState("");
  const [items, setItems] = useState<ManualItemForm[]>([newItem()]);
  const [search, setSearch] = useState("");
  const [file, setFile] = useState<File>();
  const [result, setResult] = useState<ExcelImportResult>();

  // Real store orders list state
  const [orders, setOrders] = useState<StoreOrderRecord[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [ordersTotalPages, setOrdersTotalPages] = useState(1);
  const [ordersPage, setOrdersPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [searchField, setSearchField] = useState<OrderSearchField>("ALL");
  const [ordersRefreshCount, setOrdersRefreshCount] = useState(0);
  const [activeDropdownOrderId, setActiveDropdownOrderId] = useState<string | null>(null);
  const [copiedTrackingId, setCopiedTrackingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setActiveDropdownOrderId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCopyTracking = (tracking: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(tracking);
    setCopiedTrackingId(tracking);
    toast.success(`Đã sao chép mã vận đơn: ${tracking}`);
    setTimeout(() => setCopiedTrackingId(null), 2000);
  };

  const searchPlaceholder = useMemo(() => {
    switch (searchField) {
      case "ORDER_SN":
        return "Nhập mã đơn (#DH-...)...";
      case "CUSTOMER_NAME":
        return "Nhập tên khách hàng...";
      case "PHONE":
        return "Nhập số điện thoại nhận hàng...";
      case "TRACKING":
        return "Nhập mã vận đơn (GHN-...)...";
      case "PRODUCT":
        return "Nhập tên sản phẩm...";
      default:
        return "Tìm mã đơn, tên, SĐT, vận đơn...";
    }
  }, [searchField]);

  const displayedOrders = useMemo(() => {
    if (!orderSearchQuery.trim() || searchField === "ALL") return orders;
    const q = orderSearchQuery.trim().toLowerCase();
    switch (searchField) {
      case "ORDER_SN":
        return orders.filter(
          (o) =>
            o.externalOrderSn?.toLowerCase().includes(q) ||
            o.id.toLowerCase().includes(q)
        );
      case "CUSTOMER_NAME":
        return orders.filter((o) =>
          o.customerName?.toLowerCase().includes(q)
        );
      case "PHONE":
        return orders.filter((o) =>
          o.customerPhone?.replace(/\s+/g, "").includes(q.replace(/\s+/g, ""))
        );
      case "TRACKING":
        return orders.filter((o) =>
          o.trackingNumber?.toLowerCase().includes(q)
        );
      case "PRODUCT":
        return orders.filter((o) =>
          o.items?.some(
            (it) =>
              it.title?.toLowerCase().includes(q) ||
              it.sku?.toLowerCase().includes(q)
          )
        );
      default:
        return orders;
    }
  }, [orders, orderSearchQuery, searchField]);

  // Modals for order fulfillment & viewing
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<StoreOrderRecord | null>(null);
  const [returnResponse, setReturnResponse] = useState('');
  const [returnError, setReturnError] = useState('');
  const [respondingReturn, setRespondingReturn] = useState(false);
  const [shippingModalOrder, setShippingModalOrder] = useState<StoreOrderRecord | null>(null);
  const [shippingCarrier, setShippingCarrier] = useState("GHN");
  const [shippingTrackingNumber, setShippingTrackingNumber] = useState("");
  const [shippingNote, setShippingNote] = useState("");
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [ghnCreateError, setGhnCreateError] = useState<string | null>(null);
  const [confirmDeliveredOrder, setConfirmDeliveredOrder] = useState<StoreOrderRecord | null>(null);
  const [updatingFulfillment, setUpdatingFulfillment] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const trackingInputRef = useRef<HTMLInputElement>(null);

  const getItemThumbnail = (item: { productId?: string; title?: string; imageUrl?: string }) => {
    if (item.imageUrl && item.imageUrl.trim() !== "") return item.imageUrl;
    const found = products.find(
      (p) =>
        (item.productId && p.id === item.productId) ||
        (item.title && p.title.trim().toLowerCase() === item.title.trim().toLowerCase())
    );
    if (found?.imageUrl && found.imageUrl.trim() !== "") return found.imageUrl;
    if (found?.mediaAssets && found.mediaAssets.length > 0 && found.mediaAssets[0].urlOrContent?.trim() !== "") {
      return found.mediaAssets[0].urlOrContent;
    }
    return null;
  };

  const [printPreviewOrder, setPrintPreviewOrder] = useState<StoreOrderRecord | null>(null);

  // ────── SHOP CANCEL ORDER ──────
  const [cancelModalOrder, setCancelModalOrder] = useState<StoreOrderRecord | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelCustomReason, setCancelCustomReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const CANCEL_REASONS = [
    "Khách hàng yêu cầu hủy đơn",
    "Sản phẩm tạm hết hàng trong kho",
    "Địa chỉ giao hàng không hợp lệ hoặc ngoài vùng phủ",
    "Không liên lạc được với khách hàng",
    "Khách đặt nhầm / thay đổi ý định",
    "Phát hiện đơn hàng nghi ngờ gian lận",
    "Lý do khác (nhập bên dưới)",
  ];

  useEffect(() => {
    let active = true;
    setOrdersLoading(true);

    let queryStatus: string | undefined = undefined;
    let queryPaymentStatus: string | undefined = undefined;

    if (statusFilter === "ALL") {
      queryStatus = undefined;
    } else if (statusFilter === "UNPAID") {
      queryPaymentStatus = "UNPAID";
    } else if (statusFilter === "PENDING") {
      queryStatus = "PENDING";
      queryPaymentStatus = "PAID";
    } else if (statusFilter === "RETURNS") {
      queryStatus = "RETURNS";
    } else {
      queryStatus = statusFilter;
    }

    orderService
      .getMyStoreOrders({
        status: queryStatus,
        paymentStatus: queryPaymentStatus,
        search: orderSearchQuery.trim() || undefined,
        page: ordersPage,
        limit: 12,
        storeId,
      }, ordersRefreshCount > 0)
      .then((res) => {
        if (active && res) {
          setOrders(res.items || []);
          setOrdersTotal(res.pagination?.total || 0);
          setOrdersTotalPages(res.pagination?.totalPages || 1);
        }
      })
      .catch((err) => {
        console.error("Lỗi tải danh sách đơn hàng:", err);
      })
      .finally(() => {
        if (active) setOrdersLoading(false);
      });
    return () => {
      active = false;
    };
  }, [storeId, statusFilter, ordersPage, ordersRefreshCount, orderSearchQuery]);

  useEffect(() => {
    const refresh = () => {
      if (!document.hidden) setOrdersRefreshCount(count => count + 1);
    };
    const timer = window.setInterval(refresh, 10000);
    window.addEventListener('focus', refresh);
    document.addEventListener('visibilitychange', refresh);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', refresh);
      document.removeEventListener('visibilitychange', refresh);
    };
  }, []);

  // Deep-linking: Tự động mở chi tiết đơn hàng khi URL có ?orderId=... hoặc ?search=...
  useEffect(() => {
    const targetOrderId = searchParams.get('orderId') || searchParams.get('search');
    if (!targetOrderId || deepLinkHandledRef.current === targetOrderId) return;

    // Tìm trong danh sách hiện tại
    const found = orders.find(
      (o) => o.id === targetOrderId || o.externalOrderSn === targetOrderId
    );
    if (found) {
      setSelectedOrderDetails(found);
      deepLinkHandledRef.current = targetOrderId;
      return;
    }

    // Nếu chưa có trong danh sách hiện tại, gọi API truy vấn trực tiếp
    if (storeId) {
      orderService
        .getMyStoreOrders({
          search: targetOrderId,
          storeId,
          limit: 5,
        })
        .then((res) => {
          const directMatch =
            res.items?.find(
              (o) => o.id === targetOrderId || o.externalOrderSn === targetOrderId
            ) || res.items?.[0];
          if (directMatch) {
            setSelectedOrderDetails(directMatch);
            deepLinkHandledRef.current = targetOrderId;
          }
        })
        .catch(() => {});
    }
  }, [searchParams, orders, storeId]);

  const [creatingGhnEnvironment, setCreatingGhnEnvironment] = useState<"LIVE" | "TEST" | null>(null);
  const [trackingGhnDetail, setTrackingGhnDetail] = useState<GhnTrackingDetail | null>(null);
  const [trackingGhnOrderId, setTrackingGhnOrderId] = useState<string | null>(null);
  const [loadingTracking, setLoadingTracking] = useState(false);

  const handleOpenShippingModal = (order: StoreOrderRecord) => {
    setShippingModalOrder(order);
    setShippingCarrier("GHN");
    setShippingTrackingNumber(
      isGeneratedGhnTestTrackingCode(order.trackingNumber) ? "" : order.trackingNumber || "",
    );
    setShippingNote("");
    setShippingError(null);
    setGhnCreateError(null);
  };

  const handleCreateGhnShippingOrder = async (environment: "LIVE" | "TEST") => {
    if (!shippingModalOrder || creatingGhnEnvironment !== null) return;
    const targetOrder = shippingModalOrder;
    const completeCreation = (trackingNumber: string, targetEnvironment?: "LIVE" | "TEST" | null) => {
      setGhnCreateError(null);
      setShippingCarrier("GHN");
      setShippingTrackingNumber(trackingNumber);
      setActionSuccessMsg(targetEnvironment === "TEST"
        ? `Đã tạo vận đơn mô phỏng ${trackingNumber}. Mở Tra cứu để bắt đầu và xác nhận giao thử thành công.`
        : targetEnvironment === "LIVE"
          ? `Đã tạo vận đơn GHN thật thành công. Mã vận đơn: ${trackingNumber}`
          : `Đã lưu vận đơn GHN: ${trackingNumber}. Mở hành trình để kiểm tra môi trường và tiến độ.`);
      setTimeout(() => setActionSuccessMsg(null), 8000);
      setShippingModalOrder(null);
      setOrdersRefreshCount(c => c + 1);
    };
    setGhnCreateError(null);
    setCreatingGhnEnvironment(environment);
    try {
      const res = await shippingService.createGhnOrder(shippingModalOrder.id, {
        environment,
        note: shippingNote.trim() || undefined,
        requiredNote: "CHOXEMHANGKHONGTHU",
      });
      completeCreation(res.trackingNumber, res.environment);
    } catch (err: any) {
      // A delayed response may time out after the carrier code was already saved.
      // Re-read the existing order instead of encouraging another creation call.
      try {
        const refreshed = await orderService.getMyStoreOrders({ search: targetOrder.externalOrderSn, limit: 10 }, true);
        const saved = refreshed.items.find(item => item.id === targetOrder.id);
        if (saved?.status === 'SHIPPING' && saved.trackingNumber) {
          completeCreation(saved.trackingNumber, saved.ghnEnvironment);
          return;
        }
      } catch { /* Preserve the original error if the verification request fails. */ }
      const apiMessage = err?.response?.data?.message;
      const message = Array.isArray(apiMessage)
        ? apiMessage.join(" ")
        : apiMessage || err?.message || "Không kết nối được GHN để tạo vận đơn. Vui lòng thử lại sau.";
      const environmentMessage = `${environment === 'LIVE' ? 'GHN thật' : 'GHN sandbox'}: ${String(message)}`;
      setGhnCreateError(environmentMessage);
      toast.error("Chưa xác nhận được vận đơn GHN", { description: environmentMessage });
    } finally {
      setCreatingGhnEnvironment(null);
    }
  };

  const handleOpenGhnTracking = async (order: StoreOrderRecord) => {
    const code = order.trackingNumber || order.externalOrderSn;
    setLoadingTracking(true);
    try {
      const detail = await shippingService.trackOrder(code);
      setTrackingGhnOrderId(order.id);
      setTrackingGhnDetail(detail);
    } catch (err: any) {
      alert(err?.response?.data?.message || "Không thể tải hành trình vận chuyển");
    } finally {
      setLoadingTracking(false);
    }
  };

  const handleSubmitShipping = async () => {
    if (!shippingModalOrder) return;
    if (shippingCarrier === "GHN" && isGeneratedGhnTestTrackingCode(shippingTrackingNumber)) {
      const message = "Đây là mã thử nội bộ, không phải vận đơn do GHN cấp. Hãy tạo vận đơn GHN thật hoặc nhập mã GHN hợp lệ.";
      setShippingError(message);
      toast.warning("Mã thử không thể dùng để giao hàng", { description: message });
      return;
    }
    if (!shippingTrackingNumber.trim()) {
      setShippingError("Vui lòng nhập mã vận đơn bưu cục!");
      toast.warning("Vui lòng nhập mã vận đơn bưu cục!", {
        description: "Nhập mã vận đơn do GHN cấp để khách hàng & KOL tra cứu hành trình.",
      });
      trackingInputRef.current?.focus();
      return;
    }
    setUpdatingFulfillment(true);
    try {
      await orderService.updateOrderFulfillment(shippingModalOrder.id, {
        status: "SHIPPING",
        carrierName: shippingCarrier,
        trackingNumber: shippingTrackingNumber.trim(),
        note: shippingNote.trim() || undefined,
      });
      toast.success(`Đã giao bưu cục đơn #${shippingModalOrder.externalOrderSn}`, {
        description: `Mã vận đơn ${shippingTrackingNumber.trim()} (${shippingCarrier}) đã được lưu và chuyển sang Đang giao.`,
      });
      setActionSuccessMsg(`Đã cập nhật đơn #${shippingModalOrder.externalOrderSn} sang Đang giao hàng!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      setShippingModalOrder(null);
      setOrdersRefreshCount((c) => c + 1);
    } catch (err: any) {
      toast.error("Không thể cập nhật trạng thái vận đơn", {
        description: err.message || "Vui lòng kiểm tra lại kết nối hoặc thử lại sau.",
      });
    } finally {
      setUpdatingFulfillment(false);
    }
  };

  const handleExecuteDelivered = async () => {
    if (!confirmDeliveredOrder) return;
    setUpdatingFulfillment(true);
    try {
      await orderService.updateOrderFulfillment(confirmDeliveredOrder.id, {
        status: "DELIVERED",
      });
      toast.success("Xác nhận giao hàng thành công!", {
        description: `Đơn #${confirmDeliveredOrder.externalOrderSn} đã hoàn tất và bắt đầu chu kỳ đối soát hoa hồng.`,
      });
      setActionSuccessMsg(`Đã xác nhận giao thành công đơn #${confirmDeliveredOrder.externalOrderSn}!`);
      setTimeout(() => setActionSuccessMsg(null), 4000);
      setConfirmDeliveredOrder(null);
      setOrdersRefreshCount((c) => c + 1);
    } catch (err: any) {
      toast.error("Không thể cập nhật trạng thái đơn hàng", {
        description: err.message || "Vui lòng kiểm tra kết nối mạng và thử lại.",
      });
    } finally {
      setUpdatingFulfillment(false);
    }
  };

  const handleShopCancelOrder = async () => {
    if (!cancelModalOrder) return;
    const finalReason =
      cancelReason === "Lý do khác (nhập bên dưới)"
        ? cancelCustomReason.trim()
        : cancelReason;
    if (!finalReason) {
      alert("Vui lòng chọn hoặc nhập lý do hủy đơn!");
      return;
    }
    setCancelling(true);
    try {
      await orderService.shopCancelOrder(cancelModalOrder.id, finalReason);
      setActionSuccessMsg(
        `Đã hủy đơn #${cancelModalOrder.externalOrderSn} — Kho hàng đã được hoàn lại, hoa hồng KOL đã thu hồi.`
      );
      setTimeout(() => setActionSuccessMsg(null), 6000);
      setCancelModalOrder(null);
      setCancelReason("");
      setCancelCustomReason("");
      setOrdersRefreshCount((c) => c + 1);
    } catch (err: any) {
      alert(
        err?.response?.data?.message ||
          err?.message ||
          "Không thể hủy đơn hàng. Vui lòng thử lại."
      );
    } finally {
      setCancelling(false);
    }
  };

  const handleReturnDecision = async (decision: 'APPROVE' | 'REJECT') => {
    if (!selectedOrderDetails?.returnRequest || returnResponse.trim().length < 10) {
      const errText = 'Vui lòng ghi rõ hướng xử lý (ít nhất 10 ký tự).';
      setReturnError(errText);
      toast.warning('Vui lòng nhập lý do / hướng xử lý', {
        description: 'Nội dung phản hồi cần tối thiểu 10 ký tự để khách hàng nắm rõ.',
      });
      return;
    }
    setRespondingReturn(true);
    setReturnError('');
    try {
      const result = await orderService.respondReturnRequest(selectedOrderDetails.id, {
        decision,
        response: returnResponse.trim(),
      });
      toast.success(decision === 'APPROVE' ? 'Đã chấp thuận yêu cầu đổi trả' : 'Đã từ chối yêu cầu đổi trả', {
        description: result.message || 'Hệ thống đã cập nhật và gửi thông báo phản hồi tới người mua.',
      });
      setActionSuccessMsg(result.message);
      setSelectedOrderDetails(null);
      setReturnResponse('');
      setOrdersRefreshCount((count) => count + 1);
    } catch (error) {
      const errMsg = messageOf(error);
      setReturnError(errMsg);
      toast.error('Không thể xử lý yêu cầu đổi trả', {
        description: errMsg,
      });
    } finally {
      setRespondingReturn(false);
    }
  };

  useEffect(() => {
    let active = true;
    setLoadingProducts(true);
    setProductError("");
    void (async () => {
      try {
        const store = await storeService.getMyStore();
        const all: Product[] = [];
        let page = 1;
        while (true) {
          const data = (await productService.getProducts({
            storeId: store.id,
            page,
            limit: 100,
          })) as { items: Product[]; pagination: { totalPages: number } };
          all.push(...data.items.filter((p) => p.isActive));
          if (page >= data.pagination.totalPages) break;
          page++;
          if (!active) return;
        }
        if (active) {
          setStoreId(store.id);
          setProducts(all);
        }
      } catch (error) {
        if (active) setProductError(messageOf(error));
      } finally {
        if (active) setLoadingProducts(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [reload]);

  useEffect(() => {
    if (action !== "manual" || addresses.length) return;
    const controller = new AbortController();
    setLoadingAddresses(true);
    setAddressError("");
    void loadShippingAddresses(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) {
          setAddresses(data);
          setLoadingAddresses(false);
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setAddressError(messageOf(error));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingAddresses(false);
      });
    return () => controller.abort();
  }, [action, addressReload, addresses.length]);

  useEffect(() => {
    if (!action || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      dialog.close();
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, [action]);

  useEffect(() => {
    if (!notice || !action) return;
    noticeRef.current?.scrollIntoView({ block: "nearest" });
    noticeRef.current?.focus({ preventScroll: true });
  }, [notice, action]);

  const province = addresses.find((p) => String(p.code) === provinceCode);
  const district = province?.districts.find(
    (d) => String(d.code) === districtCode,
  );
  const ward = district?.wards.find((w) => String(w.code) === wardCode);
  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, item) =>
          sum +
          (moneyInCents(item.unitPrice) ?? 0) * (Number(item.quantity) || 0),
        0,
      ),
    [items],
  );
  const discountFingerprint = JSON.stringify({
    items: items.map(({ productId, quantity, unitPrice }) => ({
      productId,
      quantity,
      unitPrice,
    })),
    phone: phone.replace(/[()\s-]/g, ""),
    discountCode: discountCode.trim().toUpperCase(),
  });
  const appliedDiscount =
    discount?.fingerprint === discountFingerprint ? discount.amount : 0;
  const total = subtotal + (moneyInCents(shippingFee) ?? 0) - appliedDiscount;
  const locked = busy || applying;
  const availableProducts = products.filter((p) =>
    `${p.title} ${p.sku}`
      .toLocaleLowerCase("vi")
      .includes(search.toLocaleLowerCase("vi")),
  );
  const close = () => {
    if (inFlight.current) return;
    setAction(null);
    onClose?.();
  };
  const open = (next: OrderAction) => {
    setNotice(null);
    setAction(next);
  };
  const itemInputs = () =>
    items.map((item) => ({
      productId: item.productId,
      sku: products.find((p) => p.id === item.productId)?.sku,
      quantity: Number(item.quantity),
      unitPrice: (moneyInCents(item.unitPrice) ?? 0) / 100,
    }));
  const updateItem = (id: string, patch: Partial<ManualItemForm>) =>
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );

  async function applyDiscount() {
    if (inFlight.current) return;
    const error = validateManualItems(items, products);
    if (
      error ||
      !/^(0\d{9}|\+84\d{9})$/.test(phone.replace(/[()\s-]/g, "")) ||
      !discountCode.trim()
    ) {
      setNotice({
        error: true,
        message: error || "Nhập SĐT hợp lệ và mã giảm giá trước khi áp dụng",
      });
      return;
    }
    inFlight.current = true;
    setApplying(true);
    setNotice(null);
    setDiscount(null);
    try {
      const quote = await orderService.quoteDiscount({
        storeId,
        customerPhone: phone,
        discountCode: discountCode.trim(),
        items: itemInputs(),
      });
      setDiscount({
        code: quote.code,
        amount: Math.round(quote.discountAmount * 100),
        fingerprint: discountFingerprint,
      });
      setNotice({
        error: false,
        message: `${quote.message}: ${currency(Math.round(quote.discountAmount * 100))}`,
      });
    } catch (error) {
      setNotice({ error: true, message: messageOf(error) });
    } finally {
      inFlight.current = false;
      setApplying(false);
    }
  }

  async function submitManual(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (inFlight.current) return;
    const error = validateManualItems(items, products);
    if (error || !storeId || productError) {
      setNotice({
        error: true,
        message: error || "Chưa tải được cửa hàng / sản phẩm",
      });
      return;
    }
    if (
      !name.trim() ||
      !address.trim() ||
      !province ||
      !district ||
      !/^(0\d{9}|\+84\d{9})$/.test(phone.replace(/[()\s-]/g, ""))
    ) {
      setNotice({
        error: true,
        message: "Điền đầy đủ tên, địa chỉ, tỉnh/huyện và SĐT Việt Nam hợp lệ",
      });
      return;
    }
    const shipping = moneyInCents(shippingFee);
    if (
      shipping === null ||
      shipping > 999999999999 ||
      !Number.isSafeInteger(total) ||
      total < 0 ||
      total > 999999999999999
    ) {
      setNotice({
        error: true,
        message: "Phí ship hoặc tổng tiền không hợp lệ",
      });
      return;
    }
    if (
      discountCode.trim() &&
      (!discount || discount.fingerprint !== discountFingerprint)
    ) {
      setNotice({
        error: true,
        message:
          "Vui lòng áp dụng lại mã giảm giá sau khi thay đổi thông tin đơn",
      });
      return;
    }
    inFlight.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const response = await orderService.createManualOrder({
        storeId,
        requestId: requestId.current,
        externalOrderSn: orderCode.trim() || undefined,
        customer: {
          name: name.trim(),
          phone,
          email: email.trim() || undefined,
          address: address.trim(),
          province: province.name,
          district: district.name,
          ward: ward?.name,
        },
        items: itemInputs(),
        paymentMethod: payment,
        shippingFee: shipping / 100,
        discountCode:
          discount?.fingerprint === discountFingerprint
            ? discount.code
            : undefined,
        discountAmount: appliedDiscount / 100,
        note: note.trim() || undefined,
        totalAmount: total / 100,
      });
      const message = `${response.message}: ${response.order.externalOrderSn}`;
      setNotice({ error: false, message });
      onCompleted?.(message);
      setOrdersRefreshCount((c) => c + 1);
      close();
      requestId.current = crypto.randomUUID();
      setOrderCode("");
      setName("");
      setPhone("");
      setEmail("");
      setAddress("");
      setProvinceCode("");
      setDistrictCode("");
      setWardCode("");
      setShippingFee("0");
      setDiscountCode("");
      setDiscount(null);
      setNote("");
      setItems([newItem()]);
      setPayment("COD");
    } catch (error) {
      setNotice({ error: true, message: messageOf(error) });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  function selectFile(next?: File) {
    setResult(undefined);
    setNotice(null);
    if (!next) return;
    const error = validateExcelFile(next);
    setFile(error ? undefined : next);
    if (error) setNotice({ error: true, message: error });
  }
  async function importExcel() {
    if (inFlight.current || !file) return;
    inFlight.current = true;
    setBusy(true);
    setResult(undefined);
    setNotice(null);
    try {
      const response = await orderService.importExcel(file, storeId);
      setResult(response);
      const message = `Đã xử lý: ${response.summary.importedOrders} đơn thành công, ${response.summary.skippedOrders} đơn bỏ qua, ${response.summary.errorRows} dòng lỗi`;
      setNotice({ error: response.errors.length > 0, message });
      if (response.summary.importedOrders) {
        onCompleted?.(message);
        setOrdersRefreshCount((c) => c + 1);
      }
    } catch (error) {
      setNotice({ error: true, message: messageOf(error) });
    } finally {
      inFlight.current = false;
      setBusy(false);
    }
  }

  const noticeView = notice && (
    <div
      ref={noticeRef}
      tabIndex={-1}
      role={notice.error ? "alert" : "status"}
      className={`rounded-xl border p-3 text-sm ${notice.error ? "border-red-200 bg-red-50 text-danger" : "border-brand-border bg-brand-soft text-ink"}`}
    >
      {notice.message}
    </div>
  );
  return (
    <div className="merchant-orders-page space-y-4 text-ink text-left pb-6">
      {!initialAction && (
        <>
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-[#EAE4D7] bg-white p-2 shadow-sm">
            <div className="inline-flex max-w-full items-center gap-1 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-1" role="group" aria-label="Chuyển chế độ đơn hàng">
              <button
                type="button"
                onClick={() => setActiveOrderView("COMMERCIAL")}
                aria-pressed={activeOrderView === "COMMERCIAL"}
                className={`inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition cursor-pointer ${
                  activeOrderView === "COMMERCIAL"
                    ? "border border-[#EEDFC6] bg-white text-[#1A1612] shadow-xs"
                    : "border border-transparent text-[#7D715E] hover:text-[#1A1612]"
                }`}
              >
                <ShoppingBag className="h-3.5 w-3.5 shrink-0 text-[#B88E4F]" />
                <span>Đơn bán hàng</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveOrderView("SAMPLES")}
                aria-pressed={activeOrderView === "SAMPLES"}
                className={`inline-flex min-h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs font-semibold transition cursor-pointer ${
                  activeOrderView === "SAMPLES"
                    ? "border border-[#EEDFC6] bg-white text-[#1A1612] shadow-xs"
                    : "border border-transparent text-[#7D715E] hover:text-[#1A1612]"
                }`}
              >
                <Package className="h-3.5 w-3.5 shrink-0 text-[#B88E4F]" />
                <span>Hàng mẫu KOL</span>
              </button>
            </div>
            {activeOrderView === "COMMERCIAL" && (
              <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => open("excel")}
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-3 text-xs font-semibold text-[#1A1612] transition hover:border-[#C59B58] hover:bg-[#F3EFE6] cursor-pointer"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 text-[#B88E4F]" />
                  <span>Nhập Excel</span>
                </button>
                <button
                  type="button"
                  onClick={() => open("manual")}
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-3 text-xs font-semibold text-[#1A1612] transition hover:border-[#C59B58] hover:bg-[#F3EFE6] cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5 shrink-0 text-[#B88E4F]" />
                  <span>Tạo đơn thủ công</span>
                </button>
                <button
                  type="button"
                  onClick={() => setOrdersRefreshCount((c) => c + 1)}
                  className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl border border-[#EAE4D7] bg-white px-3 text-xs font-semibold text-[#1A1612] transition hover:border-[#C59B58] hover:bg-[#FBF5EB] cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 shrink-0 text-[#B88E4F] ${ordersLoading ? "animate-spin" : ""}`} />
                  <span>Làm mới</span>
                </button>
              </div>
            )}
          </div>

          {activeOrderView === "SAMPLES" ? (
            <ShopSampleManagementTab />
          ) : (
            <>
              {/* Success Alert Banner (Chuẩn màu Vàng Be) */}
              {actionSuccessMsg && (
                <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#1A1612] text-xs font-semibold animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
                  <span>{actionSuccessMsg}</span>
                </div>
              )}

          {/* 2. Quick Metrics Bar Chuẩn Hóa */}
          <div className="merchant-orders-metrics grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              title="Tổng đơn hàng"
              value={ordersTotal}
              icon={<ShoppingBag className="w-4 h-4" />}
            />
            <StatCard
              title="Chờ xử lý"
              value={orders.filter((o) => o.status === "PENDING").length}
              icon={<PackagePlus className="w-4 h-4" />}
            />
            <StatCard
              title="Đang giao"
              value={orders.filter((o) => o.status === "SHIPPING").length}
              icon={<Truck className="w-4 h-4" />}
            />
            <StatCard
              title="Đã giao thành công"
              value={orders.filter((o) => o.status === "DELIVERED" || o.status === "COMPLETED").length}
              icon={<CheckCircle2 className="w-4 h-4" />}
            />
          </div>

          {/* Filter & Search Bar */}
          <div className="p-3 bg-white border border-[#EAE4D7] rounded-2xl flex flex-col gap-3">
            {/* Status Tabs - Modern Segmented Control */}
            <div className="w-full overflow-x-auto pb-1" role="group" aria-label="Lọc đơn hàng theo trạng thái">
              <div className="grid min-w-[980px] grid-cols-7 gap-1.5">
              {[
                { id: "ALL", label: "Tất cả" },
                { id: "UNPAID", label: "Chờ thanh toán" },
                { id: "PENDING", label: "Chờ lấy hàng" },
                { id: "SHIPPING", label: "Đang giao" },
                { id: "DELIVERED", label: "Đã giao" },
                { id: "RETURNS", label: "Trả hàng / Hoàn tiền" },
                { id: "CANCELLED", label: "Đã hủy" },
              ].map((tab) => {
                const active = statusFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      if (tab.id === 'RETURNS') { navigate('/merchant/returns'); return; }
                      setStatusFilter(tab.id);
                      setOrdersPage(1);
                    }}
                    className={`flex min-h-10 w-full cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-center text-xs font-bold transition-all ${
                      active
                        ? "bg-white text-[#B88E4F] font-black shadow-2xs border border-[#EEDFC6]"
                        : "text-[#7D715E] hover:text-[#1A1612] border border-transparent"
                    }`}
                  >
                    <span>{tab.label}</span>
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-[#C59B58]" />}
                  </button>
                );
              })}
              </div>
            </div>

            {/* Search Input with Criteria Dropdown */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1 border-t border-[#EAE4D7]/70">
              <div className="flex items-center flex-1 rounded-xl border border-[#EAE4D7] bg-white shadow-2xs focus-within:border-[#C59B58] focus-within:ring-1 focus-within:ring-[#C59B58]/20 transition overflow-hidden">
                {/* Search Criteria Dropdown */}
                <div className="relative shrink-0 border-r border-[#EAE4D7] bg-[#FAF8F5]">
                  <select
                    value={searchField}
                    onChange={(e) => {
                      setSearchField(e.target.value as OrderSearchField);
                      setOrdersPage(1);
                    }}
                    aria-label="Chọn tiêu chí tìm kiếm"
                    className="h-9 pl-3 pr-7 text-xs font-semibold text-[#1A1612] bg-transparent outline-none cursor-pointer appearance-none"
                  >
                    <option value="ALL">Tất cả tiêu chí</option>
                    <option value="ORDER_SN">Mã đơn hàng</option>
                    <option value="CUSTOMER_NAME">Tên khách hàng</option>
                    <option value="PHONE">Số điện thoại</option>
                    <option value="TRACKING">Mã vận đơn</option>
                    <option value="PRODUCT">Tên sản phẩm</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-[#7D715E] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Text Input */}
                <div className="relative flex-1 flex items-center">
                  <Search className="w-3.5 h-3.5 text-[#7D715E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    aria-label="Tìm kiếm đơn hàng"
                    placeholder={searchPlaceholder}
                    value={orderSearchQuery}
                    onChange={(e) => {
                      setOrderSearchQuery(e.target.value);
                      setOrdersPage(1);
                    }}
                    className="w-full h-9 pl-9 pr-8 text-xs bg-transparent text-[#1A1612] placeholder:text-[#7D715E]/60 outline-none"
                  />
                  {orderSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setOrderSearchQuery("");
                        setOrdersPage(1);
                      }}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-[#EAE4D7] text-[#7D715E] hover:text-[#1A1612] hover:bg-[#D9D1C1] text-[10px] font-bold grid place-items-center cursor-pointer transition"
                      title="Xóa tìm kiếm"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Refresh button */}
              <button
                type="button"
                onClick={() => setOrdersRefreshCount((c) => c + 1)}
                title="Tải lại danh sách"
                className="h-9 px-3 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] hover:bg-[#FBF5EB] hover:border-[#B88E4F] text-[#7D715E] hover:text-[#B88E4F] transition flex items-center gap-1.5 shadow-2xs cursor-pointer active:scale-95 shrink-0 text-xs font-semibold"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${ordersLoading ? "animate-spin text-[#B88E4F]" : ""}`} />
                <span className="hidden sm:inline">Làm mới</span>
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="merchant-orders-table @container/order-list bg-white border border-[#EAE4D7] rounded-2xl overflow-hidden">
            <div className="merchant-orders-table-heading flex items-center justify-between flex-wrap gap-2 p-3.5 sm:p-[14px_18px] border-b border-[#EAE4D7]">
              <div className="flex items-center gap-2">
                <h2 className="text-[14px] font-bold text-[#1A1612]">
                  Danh sách đơn hàng
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] text-[11px] font-bold text-[#8A642C]">
                  {displayedOrders.length !== ordersTotal ? `${displayedOrders.length} / ${ordersTotal} đơn` : `${ordersTotal} đơn`}
                </span>
              </div>
            </div>
            {ordersLoading ? (
              <div className="p-12 text-center text-xs font-semibold text-[#7D715E] flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#B88E4F]" />
                <span>Đang tải đơn hàng...</span>
              </div>
            ) : displayedOrders.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-[#FBF5EB] border border-[#EAE4D7] text-[#B88E4F] grid place-items-center">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#1A1612]">Chưa có đơn hàng</h3>
                  <p className="text-xs text-[#7D715E] mt-1">
                    {orderSearchQuery || statusFilter !== "ALL"
                      ? "Không tìm thấy đơn hàng phù hợp với điều kiện lọc."
                      : "Đơn hàng mới sẽ hiển thị tại đây."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="merchant-orders-scroll overflow-x-auto min-h-[340px]" tabIndex={0} role="region" aria-label="Bảng đơn hàng, có thể cuộn ngang">
                <table className="merchant-orders-data min-w-[1320px] w-full table-fixed border-collapse text-left text-xs">
                  <colgroup>
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '9%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '12%' }} />
                    <col style={{ width: '11%' }} />
                    <col style={{ width: '17%' }} />
                  </colgroup>
                  <thead>
                    <tr className="border-b border-[#EAE4D7] bg-[#FFFCF7] text-xs font-bold uppercase tracking-wide text-[#7D715E] select-none">
                      <th className="px-3 py-3.5 font-bold whitespace-nowrap">Mã đơn &amp; Ngày tạo</th>
                      <th className="px-3 py-3.5 font-bold whitespace-nowrap">Khách hàng</th>
                      <th className="px-3 py-3.5 font-bold">Sản phẩm</th>
                      <th className="px-3 py-3.5 font-bold whitespace-nowrap">Tổng tiền</th>
                      <th className="px-3 py-3.5 font-bold whitespace-nowrap">Trạng thái</th>
                      <th className="px-3 py-3.5 font-bold whitespace-nowrap">Vận đơn</th>
                      <th className="px-3 py-3.5 font-bold whitespace-nowrap">Hoa hồng CTV</th>
                      <th className="px-3 py-3.5 text-right font-bold whitespace-nowrap">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE4D7]/70 bg-white">
                    {displayedOrders.map((order, orderIdx) => {
                      const statusBadgeConfig: Record<
                        string,
                        { label: string; bg: string; text: string; border: string; dot: string }
                      > = {
                        UNPAID: {
                          label: "Chờ xác nhận thanh toán",
                          bg: "bg-slate-50",
                          text: "text-slate-700",
                          border: "border-slate-200",
                          dot: "bg-slate-400",
                        },
                        PENDING: {
                          label: "Chờ lấy hàng",
                          bg: "bg-amber-50",
                          text: "text-amber-800",
                          border: "border-amber-200/90",
                          dot: "bg-amber-500",
                        },
                        SHIPPING: {
                          label: "Đang giao",
                          bg: "bg-sky-50",
                          text: "text-sky-800",
                          border: "border-sky-200/90",
                          dot: "bg-sky-500",
                        },
                        DELIVERED: {
                          label: "Đã giao",
                          bg: "bg-[#FBF5EB]",
                          text: "text-[#8A642C]",
                          border: "border-[#EEDFC6]",
                          dot: "bg-[#B88E4F]",
                        },
                        COMPLETED: {
                          label: "Hoàn tất",
                          bg: "bg-[#FBF5EB]",
                          text: "text-[#B88E4F]",
                          border: "border-[#EEDFC6]",
                          dot: "bg-[#B88E4F]",
                        },
                        CANCELLED: {
                          label: "Đã hủy",
                          bg: "bg-rose-50",
                          text: "text-rose-800",
                          border: "border-rose-200/90",
                          dot: "bg-rose-500",
                        },
                        RETURN_REQUESTED: {
                          label: "Yêu cầu đổi trả",
                          bg: "bg-orange-50",
                          text: "text-orange-800",
                          border: "border-orange-200/90",
                          dot: "bg-orange-500",
                        },
                        DISPUTED: {
                          label: "Đang khiếu nại",
                          bg: "bg-orange-50",
                          text: "text-orange-800",
                          border: "border-orange-200/90",
                          dot: "bg-orange-500",
                        },
                        RETURNED: {
                          label: "Trả hàng",
                          bg: "bg-purple-50",
                          text: "text-purple-800",
                          border: "border-purple-200/90",
                          dot: "bg-purple-500",
                        },
                      };

                      const badgeStatus = order.status === "PENDING" && order.paymentStatus !== "PAID" ? "UNPAID" : order.status;
                      const badge = statusBadgeConfig[badgeStatus] || {
                        label: order.status,
                        bg: "bg-gray-50",
                        text: "text-gray-700",
                        border: "border-gray-200",
                        dot: "bg-gray-400",
                      };

                      return (
                        <tr key={order.id} className="group even:bg-[#FFFEFC] hover:bg-[#FBF5EB]/55 transition-colors duration-150">
                          {/* Mã đơn */}
                          <td data-label="Mã đơn & Ngày tạo" className="py-3 px-3 align-middle">
                            <div className="flex min-w-0 flex-col items-start gap-1">
                              <span title={order.externalOrderSn} className="max-w-full truncate font-mono font-bold text-xs text-[#1A1612] bg-[#FAF8F5] px-2 py-0.5 rounded-lg border border-[#EAE4D7] shadow-2xs group-hover:border-[#C59B58]/40 transition-colors inline-block tracking-tight">
                                #{order.externalOrderSn}
                              </span>
                              <span className="flex items-center gap-1 text-[11px] text-[#7D715E] whitespace-nowrap">
                                <Clock className="w-3 h-3 text-[#B88E4F] shrink-0" />
                                <span>
                                  {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                    day: "2-digit",
                                    month: "2-digit",
                                    year: "numeric",
                                  })}
                                </span>
                              </span>
                            </div>
                          </td>

                          {/* Khách hàng (Tinh gọn, không phơi bày địa chỉ) */}
                          <td data-label="Khách hàng" className="py-3 px-3 align-middle">
                            <div className="flex max-w-[170px] flex-col gap-0.5">
                              <strong className="text-[#1A1612] font-bold text-xs truncate block" title={order.customerName || "Khách lẻ"}>
                                {order.customerName || "Khách lẻ"}
                              </strong>
                              {order.customerPhone && (
                                <span className="flex items-center gap-1 text-[11px] text-[#7D715E] font-mono">
                                  <Phone className="w-2.5 h-2.5 text-[#B88E4F] shrink-0" />
                                  <span>{order.customerPhone}</span>
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Sản phẩm (Tinh gọn, không lặp lại SKU và đơn giá lẻ) */}
                          <td data-label="Sản phẩm" className="py-3 px-3 align-middle">
                            <div className="flex min-w-0 max-w-[280px] flex-col gap-1.5">
                              {order.items.slice(0, 1).map((item, idx) => {
                                const thumb = getItemThumbnail(item);
                                return (
                                  <div key={idx} className="flex items-center gap-2.5">
                                    <ProductThumbnail src={thumb} alt={item.title} quantity={item.quantity} />
                                    <div className="flex flex-col min-w-0 flex-1">
                                      <span
                                        className="font-medium text-xs text-[#1A1612] line-clamp-2 leading-snug"
                                        title={item.title}
                                      >
                                        {item.title}
                                      </span>
                                      <span className="text-[11px] text-[#7D715E] mt-0.5">
                                        SL: <strong className="text-[#1A1612] font-semibold">{item.quantity}</strong>
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                              {order.items.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedOrderDetails(order);
                                    setReturnResponse("");
                                    setReturnError("");
                                  }}
                                  className="text-[11px] font-bold text-[#B88E4F] hover:underline self-start flex items-center gap-1 cursor-pointer pl-12 whitespace-nowrap"
                                >
                                  +{order.items.length - 1} sản phẩm khác
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Tổng tiền */}
                          <td data-label="Tổng tiền" className="py-3 px-3 align-middle whitespace-nowrap">
                            <div className="flex flex-col items-start gap-1">
                              <strong className="text-xs font-bold text-[#1A1612] font-mono block whitespace-nowrap">
                                {order.finalAmount.toLocaleString("vi-VN")} ₫
                              </strong>
                              <span
                                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider whitespace-nowrap ${
                                  order.paymentMethod === "COD"
                                    ? "bg-[#FAF8F5] text-[#7D715E] border border-[#EAE4D7]"
                                    : "bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6]"
                                }`}
                              >
                                {order.paymentMethod}
                              </span>
                            </div>
                          </td>

                          {/* Trạng thái */}
                          <td data-label="Trạng thái" className="py-3 px-3 align-middle whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.border} ${badge.bg} ${badge.text} whitespace-nowrap shrink-0`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                              <span>{badge.label}</span>
                            </span>
                          </td>

                          {/* Vận đơn (Copy 1-chạm & Tên đơn vị) */}
                          <td data-label="Vận đơn" className="py-3 px-3 align-middle whitespace-nowrap">
                            {order.trackingNumber ? (
                              <div className="flex flex-col items-start gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => handleCopyTracking(order.trackingNumber!, e)}
                                  title="Sao chép mã vận đơn"
                                  className="group/copy inline-flex items-center gap-1 font-mono text-xs font-bold text-[#1A1612] bg-[#FAF8F5] hover:bg-[#FBF5EB] px-2 py-0.5 rounded border border-[#EAE4D7] hover:border-[#C59B58] transition cursor-pointer"
                                >
                                  <span>{order.trackingNumber}</span>
                                  {copiedTrackingId === order.trackingNumber ? (
                                    <Check className="w-3 h-3 text-[#059669]" />
                                  ) : (
                                    <Copy className="w-3 h-3 text-[#7D715E] group-hover/copy:text-[#B88E4F]" />
                                  )}
                                </button>
                                <span className="flex items-center gap-1 text-[11px] text-[#7D715E] font-medium">
                                  <Truck className="w-3 h-3 shrink-0 text-[#B88E4F]" />
                                  <span className="truncate max-w-[120px]">{order.carrierName || "Bưu cục"}</span>
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#7D715E]/60 italic whitespace-nowrap">
                                Chưa tạo vận đơn
                              </span>
                            )}
                          </td>

                          {/* Hoa hồng CTV */}
                          <td data-label="Hoa hồng CTV" className="py-3 px-3 align-middle whitespace-nowrap">
                            {order.totalCommission > 0 ? (
                              <div className="flex flex-col items-start gap-0.5">
                                <strong className="text-xs font-bold text-[#B88E4F] font-mono block whitespace-nowrap">
                                  +{order.totalCommission.toLocaleString("vi-VN")} ₫
                                </strong>
                                <span
                                  className="flex min-w-0 max-w-[110px] items-center gap-1 text-[10px] text-[#7D715E] truncate"
                                  title={order.attributedCollaborator?.fullName || order.couponCode || "CTV"}
                                >
                                  <Users className="w-2.5 h-2.5 text-[#B88E4F] shrink-0" />
                                  <span className="truncate">
                                    {order.attributedCollaborator?.fullName || order.couponCode || "CTV"}
                                  </span>
                                </span>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#7D715E]/40 whitespace-nowrap">—</span>
                            )}
                          </td>

                          {/* Thao tác (1 CTA chính + Mắt chi tiết + Menu ... phụ) */}
                          <td data-label="Thao tác" className="py-3 px-3 align-middle text-right">
                            <div className="flex min-w-0 flex-wrap items-center justify-end gap-1.5">
                              {/* 1. Nút Thao tác chính theo chu kỳ đơn hàng */}
                              {order.status === "PENDING" && order.paymentStatus === "PAID" && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenShippingModal(order)}
                                  className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#A37B3E] text-white text-[11px] font-bold transition shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95 shrink-0"
                                  title="Nhập mã vận đơn & giao hàng"
                                >
                                  <Truck className="w-3.5 h-3.5" />
                                  <span>Giao hàng</span>
                                </button>
                              )}

                              {order.status === "SHIPPING" && isGeneratedGhnTestTrackingCode(order.trackingNumber) ? (
                                <button
                                  type="button"
                                  onClick={() => handleOpenShippingModal(order)}
                                  className="px-2.5 py-1.5 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] text-[#8A642C] hover:bg-[#F3EFE6] text-[11px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                                  title="Chọn GHN Test hoặc GHN Production"
                                >
                                  <Truck className="w-3.5 h-3.5 text-[#B88E4F]" />
                                  <span>Chọn môi trường GHN</span>
                                </button>
                              ) : order.status === "SHIPPING" && (
                                <button
                                  type="button"
                                  onClick={() => handleOpenGhnTracking(order)}
                                  disabled={loadingTracking}
                                  className="px-2.5 py-1.5 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] text-[#8A642C] hover:bg-[#F3EFE6] text-[11px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer active:scale-95"
                                  title="Tra cứu hành trình vận chuyển GHN"
                                >
                                  {loadingTracking ? (
                                    <RefreshCw className="w-3.5 h-3.5 text-[#B88E4F] animate-spin" />
                                  ) : (
                                    <Truck className="w-3.5 h-3.5 text-[#B88E4F]" />
                                  )}
                                  <span>Tra cứu</span>
                                </button>
                              )}

                              {(order.status === "RETURN_REQUESTED" || order.status === "DISPUTED") && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedOrderDetails(order);
                                    setReturnResponse("");
                                    setReturnError("");
                                  }}
                                  className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 text-[11px] font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
                                  title="Xem yêu cầu khiếu nại / hoàn tiền"
                                >
                                  <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
                                  <span>Xử lý đổi trả</span>
                                </button>
                              )}

                              {/* 2. Nút Xem chi tiết (Con mắt) */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedOrderDetails(order);
                                  setReturnResponse("");
                                  setReturnError("");
                                }}
                                className="w-7 h-7 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] hover:bg-[#FBF5EB] text-[#7D715E] hover:text-[#B88E4F] hover:border-[#B88E4F] transition grid place-items-center shadow-2xs cursor-pointer active:scale-95 shrink-0"
                                title="Xem chi tiết đơn hàng (Địa chỉ, SKU, biến thể, tài chính)"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* 3. Menu Thao tác phụ (...) */}
                              <div className="relative inline-block text-left" ref={activeDropdownOrderId === order.id ? dropdownRef : undefined}>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveDropdownOrderId(activeDropdownOrderId === order.id ? null : order.id);
                                  }}
                                  className="w-7 h-7 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] hover:bg-[#FBF5EB] text-[#7D715E] hover:text-[#1A1612] hover:border-[#C59B58] transition grid place-items-center shadow-2xs cursor-pointer active:scale-95 shrink-0"
                                  title="Thao tác khác"
                                >
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </button>

                                {activeDropdownOrderId === order.id && (
                                  <div
                                    className={`absolute right-0 ${
                                      orderIdx >= displayedOrders.length - 2 && displayedOrders.length > 2
                                        ? "bottom-full mb-1"
                                        : "top-full mt-1"
                                    } w-44 rounded-xl border border-[#EAE4D7] bg-white shadow-lg py-1 z-30 animate-in fade-in zoom-in-95 text-left`}
                                  >
                                    {/* In phiếu A6 */}
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPrintPreviewOrder({
                                          ...order,
                                          trackingNumber: order.trackingNumber || order.externalOrderSn,
                                          carrierName: order.carrierName || "GHN",
                                        });
                                        setActiveDropdownOrderId(null);
                                      }}
                                      className="w-full px-3 py-1.5 text-left text-xs font-medium text-[#1A1612] hover:bg-[#FBF5EB] hover:text-[#B88E4F] flex items-center gap-2 cursor-pointer transition"
                                    >
                                      <Printer className="w-3.5 h-3.5 text-[#B88E4F]" />
                                      <span>In phiếu giao A6</span>
                                    </button>

                                    {/* Xác nhận đã giao */}
                                    {(order.status === "PENDING" || order.status === "SHIPPING") && (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setConfirmDeliveredOrder(order);
                                          setActiveDropdownOrderId(null);
                                        }}
                                        disabled={updatingFulfillment}
                                        className="w-full px-3 py-1.5 text-left text-xs font-medium text-[#1A1612] hover:bg-[#FBF5EB] hover:text-[#059669] flex items-center gap-2 cursor-pointer transition disabled:opacity-50"
                                      >
                                        <CheckCircle2 className="w-3.5 h-3.5 text-[#059669]" />
                                        <span>Xác nhận đã giao</span>
                                      </button>
                                    )}

                                    {/* Hủy đơn */}
                                    {(order.status === "PENDING" || order.status === "SHIPPING") && (
                                      <>
                                        <div className="h-px bg-[#EAE4D7] my-1" />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setCancelModalOrder(order);
                                            setCancelReason("");
                                            setCancelCustomReason("");
                                            setActiveDropdownOrderId(null);
                                          }}
                                          className="w-full px-3 py-1.5 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer transition"
                                        >
                                          <X className="w-3.5 h-3.5 text-rose-500" />
                                          <span>Hủy đơn hàng</span>
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {ordersTotalPages > 1 && (
              <div className="p-3.5 border-t border-[#EAE4D7] bg-[#FAF8F5]/50 flex items-center justify-between text-xs text-[#7D715E]">
                <span>
                  Trang <strong className="text-[#1A1612] font-bold">{ordersPage}</strong> / {ordersTotalPages} (Tổng {ordersTotal} đơn)
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={ordersPage <= 1}
                    onClick={() => setOrdersPage((p) => Math.max(1, p - 1))}
                    className="w-8 h-8 rounded-xl border border-[#EAE4D7] bg-white hover:bg-[#FBF5EB] hover:border-[#B88E4F] text-[#7D715E] hover:text-[#B88E4F] disabled:opacity-30 disabled:pointer-events-none transition grid place-items-center shadow-2xs cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    disabled={ordersPage >= ordersTotalPages}
                    onClick={() => setOrdersPage((p) => Math.min(ordersTotalPages, p + 1))}
                    className="w-8 h-8 rounded-xl border border-[#EAE4D7] bg-white hover:bg-[#FBF5EB] hover:border-[#B88E4F] text-[#7D715E] hover:text-[#B88E4F] disabled:opacity-30 disabled:pointer-events-none transition grid place-items-center shadow-2xs cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
          {!action && noticeView}
        </>
      )}
    </>
  )}

      {/* Modal Cập nhật Vận đơn Bưu cục (Shipping) */}
      {shippingModalOrder && (
        <div className="shipping-dispatch-overlay">
          <div
            className="shipping-dispatch-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="shipping-dispatch-title"
            aria-busy={creatingGhnEnvironment !== null || updatingFulfillment}
            onKeyDown={(event) => {
              if (event.key === 'Escape' && !creatingGhnEnvironment && !updatingFulfillment) {
                setShippingModalOrder(null);
              }
            }}
          >
            <div className="shipping-dispatch-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center shrink-0">
                  <Truck className="w-5 h-5 text-[#B88E4F]" />
                </div>
                <div>
                  <p className="shipping-dispatch-eyebrow">XỬ LÝ GIAO HÀNG</p>
                  <h3 id="shipping-dispatch-title" className="shipping-dispatch-title">
                    Tạo & cập nhật vận đơn
                  </h3>
                  <p className="shipping-dispatch-order">
                    Đơn <span>#{shippingModalOrder.externalOrderSn}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                autoFocus
                aria-label="Đóng cửa sổ giao hàng"
                disabled={creatingGhnEnvironment !== null || updatingFulfillment}
                onClick={() => setShippingModalOrder(null)}
                className="shipping-dispatch-close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="shipping-dispatch-body">
              {/* --- 1-Click GHN API Dispatch Card --- */}
              <div className="shipping-dispatch-api">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
                    <Truck className="h-5 w-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm font-bold text-[#1A1612]">Tạo vận đơn GHN</strong>
                    </div>
                  </div>
                </div>
                <div className="shipping-dispatch-choices" role="group" aria-label="Chọn cách tạo vận đơn GHN">
                  <button
                    type="button"
                    disabled={creatingGhnEnvironment !== null || updatingFulfillment}
                    onClick={() => handleCreateGhnShippingOrder("TEST")}
                    className="shipping-dispatch-choice shipping-dispatch-choice-test"
                    title="Tạo vận đơn trên máy chủ thử nghiệm GHN, không điều phối giao hàng thật"
                  >
                    {creatingGhnEnvironment === "TEST" ? (
                      <RefreshCw className="h-4 w-4 shrink-0 animate-spin text-[#B88E4F]" />
                    ) : (
                      <Truck className="h-4 w-4 shrink-0 text-[#B88E4F]" />
                    )}
                    <span className="min-w-0">
                      <span className="shipping-dispatch-choice-title">
                        {creatingGhnEnvironment === "TEST" ? "Đang tạo vận đơn mô phỏng…" : "Giao hàng mô phỏng"}
                      </span>
                      <span className="shipping-dispatch-choice-description">
                        Mô phỏng nội bộ · Không gọi GHN
                      </span>
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled
                    onClick={() => handleCreateGhnShippingOrder("LIVE")}
                    className="shipping-dispatch-choice shipping-dispatch-choice-live"
                    title="Tạo vận đơn thật trên GHN Production"
                  >
                    {creatingGhnEnvironment === "LIVE" ? (
                      <RefreshCw className="h-4 w-4 shrink-0 animate-spin" />
                    ) : (
                      <Truck className="h-4 w-4 shrink-0" />
                    )}
                    <span className="min-w-0">
                      <span className="shipping-dispatch-choice-title">
                        {creatingGhnEnvironment === "LIVE" ? "Đang tạo vận đơn…" : "Tạo vận đơn GHN thật"}
                      </span>
                      <span className="shipping-dispatch-choice-description">
                        Chưa kết nối API giao hàng thật
                      </span>
                    </span>
                  </button>
                </div>
                <div className="shipping-dispatch-note">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#B88E4F]" />
                  <p className="m-0 text-[11px] leading-relaxed text-[#7D715E]">
                    Dùng mô phỏng để test luồng. Nếu đã có vận đơn thật, nhập mã thủ công bên dưới.
                  </p>
                </div>
                {creatingGhnEnvironment !== null && <p role="status" className="mt-3 rounded-lg bg-[#FBF5EB] px-3 py-2 text-[11px] leading-relaxed text-[#795A2D]">Đang chờ GHN cấp mã vận đơn. Hệ thống sẽ tự cập nhật khi hoàn tất; vui lòng không bấm tạo lại.</p>}
                {ghnCreateError && (
                  <div
                    role="alert"
                    className="mt-3 flex items-start gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-3"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#DC2626]" />
                    <div className="min-w-0">
                      <p className="m-0 text-xs font-bold text-[#991B1B]">Chưa xác nhận được vận đơn GHN</p>
                      <p className="mb-0 mt-1 break-words text-[11px] leading-relaxed text-[#7F1D1D]">{ghnCreateError}</p>
                      <p className="mb-0 mt-1.5 text-[10.5px] leading-relaxed text-[#7D715E]">Nếu kết nối bị gián đoạn, hãy làm mới danh sách đơn để kiểm tra mã đã được tạo trước khi thử lại.</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="shipping-dispatch-divider"><span>Đã có mã GHN? Nhập thủ công</span></div>
              <div className="shipping-dispatch-fields">
              <div>
                <label htmlFor="dispatch-carrier" className="shipping-dispatch-label">
                  Đơn vị vận chuyển <span className="text-[#DC2626]">*</span>
                </label>
                <Select
                  id="dispatch-carrier"
                  value={shippingCarrier}
                  disabled={creatingGhnEnvironment !== null || updatingFulfillment}
                  onChange={(e) => setShippingCarrier(e.target.value)}
                  className="shipping-dispatch-input"
                >
                  <option value="GHN">Giao Hàng Nhanh (GHN)</option>
                </Select>
              </div>

              <div>
                <label htmlFor="dispatch-tracking" className="shipping-dispatch-label">
                  Mã vận đơn bưu cục <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  id="dispatch-tracking"
                  ref={trackingInputRef}
                  disabled={creatingGhnEnvironment !== null || updatingFulfillment}
                  aria-invalid={Boolean(shippingError)}
                  type="text"
                  placeholder="Nhập mã do đơn vị vận chuyển cấp"
                  value={shippingTrackingNumber}
                  onChange={(e) => {
                    setShippingTrackingNumber(e.target.value);
                    if (shippingError) setShippingError(null);
                  }}
                  className={`shipping-dispatch-input ${
                    shippingError
                      ? 'border-[#DC2626] bg-[#FEF2F2]/40 ring-2 ring-[#DC2626]/20'
                      : ''
                  }`}
                />
                {shippingError && (
                  <p className="text-[11px] text-[#DC2626] font-medium flex items-center gap-1.5 mt-1.5 animate-in fade-in duration-150">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{shippingError}</span>
                  </p>
                )}
              </div>

              <div className="shipping-dispatch-field-wide">
                <label htmlFor="dispatch-note" className="shipping-dispatch-label">
                  Ghi chú giao hàng <span className="shipping-dispatch-optional">Không bắt buộc</span>
                </label>
                <textarea
                  id="dispatch-note"
                  rows={2}
                  disabled={creatingGhnEnvironment !== null || updatingFulfillment}
                  placeholder="Ví dụ: Gọi trước khi giao, lưu ý hàng dễ vỡ…"
                  value={shippingNote}
                  onChange={(e) => setShippingNote(e.target.value)}
                  className="shipping-dispatch-input"
                />
              </div>
              </div>
            </div>

            <div className="shipping-dispatch-footer">
              <button
                type="button"
                disabled={!shippingTrackingNumber.trim()}
                onClick={() => {
                  if (shippingModalOrder && shippingTrackingNumber.trim()) {
                    printShippingLabel(
                      shippingModalOrder,
                      shippingTrackingNumber.trim(),
                      shippingCarrier,
                      shippingNote.trim() || undefined,
                      shippingModalOrder.store?.name,
                    );
                  }
                }}
                className="shipping-dispatch-print"
              >
                <Printer className="w-3.5 h-3.5" />
                In phiếu A6
              </button>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShippingModalOrder(null)}
                  disabled={creatingGhnEnvironment !== null || updatingFulfillment}
                  className="shipping-dispatch-cancel"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  disabled={updatingFulfillment || creatingGhnEnvironment !== null}
                  onClick={handleSubmitShipping}
                  className="shipping-dispatch-submit"
                >
                  {updatingFulfillment ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <span>Lưu mã & xác nhận gửi hàng</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ PRINT PREVIEW MODAL ══ */}
      {printPreviewOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EAE4D7] flex flex-col gap-4 p-6 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EAE4D7] pb-3">
              <div>
                <h3 className="text-base font-extrabold text-[#1A1612] m-0 flex items-center gap-2">
                  <Printer className="w-4 h-4 text-[#B88E4F]" /> Xem trước Phiếu Giao Hàng A6
                </h3>
                <p className="text-xs text-[#7D715E] mt-0.5 m-0">
                  Phiếu chuẩn 105×148mm — gồm Barcode Code-128 và QR tra cứu
                </p>
              </div>
              <button
                onClick={() => setPrintPreviewOrder(null)}
                className="p-1 rounded-lg text-[#7D715E] hover:bg-[#F3EFE6] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex justify-center overflow-x-auto">
              <ShippingLabel
                order={printPreviewOrder}
                trackingNumber={printPreviewOrder.trackingNumber || ""}
                carrier={printPreviewOrder.carrierName || "SCANMS Express"}
                note={shippingNote.trim() || undefined}
                storeName={printPreviewOrder.store?.name}
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#EAE4D7]">
              <button
                type="button"
                onClick={() => setPrintPreviewOrder(null)}
                className="px-4 py-2 rounded-xl border border-[#EAE4D7] text-xs font-bold text-[#7D715E] hover:bg-[#F3EFE6] cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                onClick={() => {
                  printShippingLabel(
                    printPreviewOrder,
                    printPreviewOrder.trackingNumber || "",
                    printPreviewOrder.carrierName || "SCANMS Express",
                    shippingNote.trim() || undefined,
                    printPreviewOrder.store?.name,
                  );
                }}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#A37B3E] text-white text-xs font-bold shadow-md transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                In Phiếu Giao Hàng A6
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Xác nhận đã giao hàng thành công */}
      {confirmDeliveredOrder && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-2xl border border-[#EAE4D7] shadow-2xl p-6 text-left flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-11 h-11 rounded-2xl bg-[#ECFDF5] border border-[#A7F3D0] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-6 h-6 text-[#059669]" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-extrabold text-[#1A1612] m-0">
                  Xác nhận giao hàng thành công
                </h3>
                <p className="text-xs text-[#7D715E] mt-1 m-0">
                  Đơn hàng <strong className="text-[#1A1612]">#{confirmDeliveredOrder.externalOrderSn}</strong>
                </p>
              </div>
              <button
                onClick={() => setConfirmDeliveredOrder(null)}
                className="p-1 rounded-lg text-[#7D715E] hover:bg-[#F3EFE6] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] p-3 text-xs text-[#7D715E] leading-relaxed">
              Bạn có chắc chắn khách hàng đã nhận được kiện hàng này? Sau khi xác nhận:
              <ul className="list-disc pl-4 mt-1.5 space-y-1 text-[#1A1612] font-medium">
                <li>Trạng thái đơn hàng sẽ chuyển thành <span className="text-[#059669] font-bold">Hoàn thành</span>.</li>
                <li>Hệ thống SCANMS sẽ bắt đầu ghi nhận và kích hoạt chu kỳ đối soát hoa hồng cho đối tác CTV / KOL.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EAE4D7]">
              <button
                type="button"
                onClick={() => setConfirmDeliveredOrder(null)}
                className="px-4 py-2 rounded-xl border border-[#EAE4D7] bg-white text-xs font-bold text-[#7D715E] hover:bg-[#F3EFE6] transition active:scale-95 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={updatingFulfillment}
                onClick={handleExecuteDelivered}
                className="px-5 py-2 rounded-xl bg-[#059669] hover:bg-[#047857] text-white text-xs font-bold transition disabled:opacity-50 shadow-xs flex items-center gap-1.5 active:scale-95 cursor-pointer"
              >
                {updatingFulfillment ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Xác nhận đã giao</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MODAL HỦY ĐƠN HÀNG (Shop chủ động) ══ */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-md bg-white rounded-2xl border border-rose-200 shadow-xl p-6 text-left flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-rose-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-rose-700 m-0 flex items-center gap-2">
                  <X className="w-4 h-4" /> Hủy Đơn Hàng
                </h3>
                <p className="text-xs text-[#7D715E] mt-0.5 m-0">
                  Đơn <strong className="font-mono text-[#1A1612]">#{cancelModalOrder.externalOrderSn}</strong>
                  {" — "}{cancelModalOrder.customerName}
                </p>
              </div>
              <button
                onClick={() => setCancelModalOrder(null)}
                className="p-1 rounded-lg text-[#7D715E] hover:bg-rose-50 shrink-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Thông tin tác động */}
            <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-800 flex flex-col gap-1">
              <p className="font-bold m-0">⚠️ Hành động này không thể hoàn tác. Khi hủy:</p>
              <ul className="list-disc pl-4 m-0 space-y-0.5">
                <li>Trạng thái đơn → <strong>ĐÃ HỦY</strong></li>
                <li>Tồn kho sản phẩm được <strong>hoàn lại tự động</strong></li>
                <li>Mã giảm giá (nếu có) được <strong>hoàn lượt sử dụng</strong></li>
                <li>Hoa hồng KOL đang tạm giữ bị <strong>thu hồi (Clawback)</strong></li>
              </ul>
            </div>

            {/* Chọn lý do */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-[#4A3E2D] block">
                Lý do hủy đơn <span className="text-rose-500">*</span>
              </label>
              <div className="flex flex-col gap-1.5">
                {CANCEL_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setCancelReason(r)}
                    className={`text-left px-3 py-2 rounded-xl border text-xs font-medium transition cursor-pointer ${
                      cancelReason === r
                        ? "border-rose-400 bg-rose-50 text-rose-800 font-bold ring-2 ring-rose-300/50"
                        : "border-[#EAE4D7] bg-white text-[#4A3E2D] hover:border-rose-300 hover:bg-rose-50"
                    }`}
                  >
                    {cancelReason === r ? "✓ " : ""}{r}
                  </button>
                ))}
              </div>

              {cancelReason === "Lý do khác (nhập bên dưới)" && (
                <textarea
                  placeholder="Mô tả chi tiết lý do hủy đơn..."
                  value={cancelCustomReason}
                  onChange={(e) => setCancelCustomReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs outline-none focus:border-rose-400 resize-none"
                />
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE4D7]">
              <button
                type="button"
                disabled={cancelling}
                onClick={() => setCancelModalOrder(null)}
                className="px-4 py-2 rounded-xl border border-[#EAE4D7] text-xs font-bold text-[#7D715E] hover:bg-[#F3EFE6] disabled:opacity-50 cursor-pointer"
              >
                Đóng
              </button>
              <button
                type="button"
                disabled={cancelling || !cancelReason || (cancelReason === "Lý do khác (nhập bên dưới)" && !cancelCustomReason.trim())}
                onClick={handleShopCancelOrder}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition disabled:opacity-50 shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {cancelling ? (
                  <><span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin inline-block" /> Đang hủy...</>
                ) : (
                  <><X className="w-3.5 h-3.5" /> Xác nhận Hủy Đơn</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Chi tiết Đơn hàng */}
      {selectedOrderDetails && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4 bg-[#231D15]/35 backdrop-blur-xs">
          <div role="dialog" aria-modal="true" aria-labelledby="order-detail-title" className="w-full max-w-[580px] max-h-[86dvh] flex flex-col overflow-hidden border border-[#EAE4D7] rounded-2xl bg-white text-[#1A1612] shadow-[0_24px_80px_rgba(35,29,21,0.18)] text-left">
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#EAE4D7] shrink-0">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]"><ShoppingBag size={20} /></div>
              <div>
                <h3 id="order-detail-title" className="text-base font-bold text-[#1A1612] m-0">
                  Chi tiết đơn hàng
                </h3>
                <span className="font-mono text-xs font-bold text-[#B88E4F]">#{selectedOrderDetails.externalOrderSn}</span>
                <p className="text-xs text-[#7D715E] mt-0.5 m-0">
                  Ngày đặt: {new Date(selectedOrderDetails.createdAt).toLocaleString("vi-VN")}
                </p>
              </div>
              <button
                type="button"
                aria-label="Đóng chi tiết đơn hàng"
                onClick={() => setSelectedOrderDetails(null)}
                className="ml-auto p-1 rounded-lg text-[#7D715E] hover:bg-[#F3EFE6] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4 p-5 overflow-y-auto">
            {/* Khách hàng & Địa chỉ */}
            <section className="p-3.5 border border-[#EAE4D7] rounded-xl bg-[#FAF8F5] space-y-2">
              <h4 className="flex items-center gap-1.5 text-xs font-bold text-[#1A1612] m-0"><Users size={16} /> Thông tin người nhận</h4>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div><dt className="text-[11px] text-[#7D715E]">Họ tên</dt><dd className="font-semibold text-[#1A1612] mt-0.5">{selectedOrderDetails.customerName}</dd></div>
              <div><dt className="text-[11px] text-[#7D715E]">Số điện thoại</dt><dd className="font-semibold text-[#1A1612] mt-0.5">{selectedOrderDetails.customerPhone}</dd></div>
              {selectedOrderDetails.customerEmail && (
                <div className="sm:col-span-2"><dt className="text-[11px] text-[#7D715E]">Email</dt><dd className="font-semibold text-[#1A1612] mt-0.5">{selectedOrderDetails.customerEmail}</dd></div>
              )}
              <div className="sm:col-span-2"><dt className="text-[11px] text-[#7D715E]">Địa chỉ giao hàng</dt><dd className="font-semibold text-[#1A1612] mt-0.5">{selectedOrderDetails.shippingAddress}</dd></div>
              </dl>
            </section>

            {/* Sản phẩm trong đơn */}
            <section className="p-3.5 border border-[#EAE4D7] rounded-xl bg-[#FAF8F5] flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1A1612]">Sản phẩm ({selectedOrderDetails.items.length}):</span>
                <span className="text-[11px] text-[#7D715E]">
                  Tổng SL: {selectedOrderDetails.items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="divide-y divide-[#EAE4D7] border border-[#EAE4D7] rounded-xl overflow-hidden bg-white">
                {selectedOrderDetails.items.map((item, idx) => {
                  const thumb = getItemThumbnail(item);
                  return (
                    <div key={idx} className="order-detail-product p-3 flex items-center justify-between gap-3 text-xs bg-white hover:bg-[#FAF8F5]/60 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <ProductThumbnail src={thumb} alt={item.title} quantity={item.quantity} />
                        <div className="min-w-0">
                          <strong className="text-[#1A1612] block" title={item.title}>
                            {item.title}
                          </strong>
                          <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-[#7D715E]">
                            <span>{item.quantity} × {item.unitPrice.toLocaleString("vi-VN")} ₫</span>
                            {item.sku && <span className="text-[10px] font-mono bg-[#F3EFE6] px-1 py-0.2 rounded">SKU: {item.sku}</span>}
                          </div>
                        </div>
                      </div>
                      <strong className="text-xs font-black text-[#1A1612] shrink-0 font-mono">
                        {(item.unitPrice * item.quantity).toLocaleString("vi-VN")} ₫
                      </strong>
                    </div>
                  );
                })}
              </div>
            </section>

            {selectedOrderDetails.returnRequest && (
              <section className="order-detail-return order-detail-section space-y-3 text-xs">
                <h4><RefreshCw size={16} /> Hồ sơ đổi trả / hoàn tiền</h4>
                <span className="order-detail-return-status">{returnStatusLabel(selectedOrderDetails.returnRequest.status)}</span>
                <p className="order-detail-submitted">Gửi lúc {new Date(selectedOrderDetails.returnRequest.submittedAt).toLocaleString('vi-VN')}</p>
                <p>Lý do: <strong>{({ DAMAGED: 'Sản phẩm hư hỏng', WRONG_ITEM: 'Giao sai sản phẩm', EXPIRED: 'Sản phẩm hết hạn', OTHER: 'Lý do khác' } as Record<string, string>)[selectedOrderDetails.returnRequest.reason] || selectedOrderDetails.returnRequest.reason}</strong></p>
                {selectedOrderDetails.returnRequest.details && <p>{selectedOrderDetails.returnRequest.details}</p>}
                <div className="order-detail-evidence flex flex-wrap gap-2">
                  {selectedOrderDetails.returnRequest.imageUrls.map((url, index) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer" className="text-[#B88E4F] underline">Ảnh {index + 1}</a>
                  ))}
                  {selectedOrderDetails.returnRequest.unboxingVideoUrl && <a href={selectedOrderDetails.returnRequest.unboxingVideoUrl} target="_blank" rel="noopener noreferrer" className="text-[#B88E4F] underline">Video mở hộp</a>}
                </div>
                {selectedOrderDetails.returnRequest.shopResponse && <div className="order-detail-response"><span>Phản hồi của gian hàng</span><p>{selectedOrderDetails.returnRequest.shopResponse}</p></div>}
                {selectedOrderDetails.returnRequest.status === 'REQUESTED' && (
                  <div className="space-y-2">
                    <label className="block font-bold">Hướng xử lý gửi khách
                      <textarea value={returnResponse} onChange={(event) => setReturnResponse(event.target.value)} maxLength={1000} rows={3}
                        className="mt-1 w-full rounded-xl border border-[#EAE4D7] bg-white p-3 font-normal outline-none focus:border-[#C59B58]" />
                    </label>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" disabled={respondingReturn || returnResponse.trim().length < 10} onClick={() => handleReturnDecision('APPROVE')}
                        className="rounded-xl bg-[#C59B58] px-4 py-2 font-bold text-white disabled:opacity-50">Duyệt yêu cầu</button>
                      <button type="button" disabled={respondingReturn || returnResponse.trim().length < 10} onClick={() => handleReturnDecision('REJECT')}
                        className="rounded-xl border border-[#DC2626] px-4 py-2 font-bold text-[#DC2626] disabled:opacity-50">Từ chối</button>
                    </div>
                    {returnError && <p role="alert" className="text-[#DC2626]">{returnError}</p>}
                    <p className="text-[#7D715E]">Duyệt yêu cầu không đồng nghĩa tiền đã được hoàn; cần đối soát thanh toán riêng.</p>
                  </div>
                )}
              </section>
            )}

            {/* Tài chính & Hoa hồng */}
            <section className="order-detail-finance order-detail-section flex flex-col gap-1.5 text-xs">
              <h4><ShoppingBag size={16} /> Thanh toán & hoa hồng</h4>
              <div className="flex justify-between">
                <span className="text-[#7D715E]">Tiền hàng:</span>
                <span className="font-bold">{selectedOrderDetails.subtotalAmount.toLocaleString("vi-VN")} ₫</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#7D715E]">Phí vận chuyển:</span>
                <span className="font-bold">{selectedOrderDetails.shippingFee.toLocaleString("vi-VN")} ₫</span>
              </div>
              {selectedOrderDetails.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Giảm giá (Coupon):</span>
                  <span className="font-bold">-{selectedOrderDetails.discountAmount.toLocaleString("vi-VN")} ₫</span>
                </div>
              )}
              <div className="flex justify-between border-t border-[#EAE4D7] pt-1.5 text-sm font-black text-[#1A1612]">
                <span>Tổng thanh toán:</span>
                <span className="text-[#B88E4F]">{selectedOrderDetails.finalAmount.toLocaleString("vi-VN")} ₫</span>
              </div>
              <div className="flex justify-between pt-1 text-[11px] text-[#7D715E]">
                <span>Hoa hồng KOL ghi nhận:</span>
                <span className="font-bold text-emerald-700">
                  +{selectedOrderDetails.totalCommission.toLocaleString("vi-VN")} ₫
                </span>
              </div>
            </section>
            </div>
            <div className="px-5 py-3 border-t border-[#EAE4D7] flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setSelectedOrderDetails(null)}
                className="px-4 py-2 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-[#231D15] text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
      {action &&
        createPortal(
          <dialog
            ref={dialogRef}
            aria-labelledby="order-dialog-title"
            className="m-auto max-h-[92dvh] w-[min(1100px,calc(100%-2rem))] overflow-y-auto rounded-2xl border border-line bg-canvas p-0 text-ink shadow-2xl backdrop:bg-brand-dark/50"
            onCancel={(event) => {
              event.preventDefault();
              close();
            }}
            onClick={(event) => {
              if (event.target === event.currentTarget) {
                const rect = event.currentTarget.getBoundingClientRect();
                if (
                  event.clientX < rect.left ||
                  event.clientX > rect.right ||
                  event.clientY < rect.top ||
                  event.clientY > rect.bottom
                )
                  close();
              }
            }}
          >
            <header className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-white px-6 py-4">
              <div>
                <h2 id="order-dialog-title" className="text-xl font-bold">
                  {action === "manual"
                    ? "Tạo đơn thủ công"
                    : "Import đơn hàng từ Excel"}
                </h2>
                <p className="mt-1 text-xs text-muted">
                  SCANMS · Đối soát đơn hàng
                </p>
              </div>
              <button
                type="button"
                disabled={locked}
                aria-label="Đóng"
                onClick={close}
                className="rounded-lg p-2 hover:bg-brand-soft disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </header>
            <div className="space-y-5 p-4 sm:p-6">
              {noticeView}
              {productError && (
                <div role="alert" className="text-sm text-danger">
                  {productError}{" "}
                  <button
                    className={buttonClass}
                    disabled={locked}
                    onClick={() => setReload((n) => n + 1)}
                  >
                    Tải lại cửa hàng
                  </button>
                </div>
              )}
              {action === "manual" ? (
                <form onSubmit={submitManual} className="space-y-5">
                  <fieldset disabled={locked} className="space-y-5">
                    <section className="rounded-2xl border border-line bg-white p-5">
                      <h3 className="mb-4 font-bold">Thông tin khách hàng</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-sm">
                          Họ tên khách hàng *
                          <input
                            autoFocus
                            required
                            maxLength={150}
                            className={inputClass}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            autoComplete="name"
                          />
                        </label>
                        <label className="text-sm">
                          Số điện thoại *
                          <input
                            required
                            type="tel"
                            maxLength={20}
                            placeholder="0901 234 567"
                            className={inputClass}
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            autoComplete="tel"
                          />
                        </label>
                        <label className="text-sm">
                          Email
                          <input
                            type="email"
                            maxLength={255}
                            className={inputClass}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="email"
                          />
                        </label>
                        <label className="text-sm">
                          Mã đơn (tùy chọn)
                          <input
                            maxLength={100}
                            className={inputClass}
                            value={orderCode}
                            onChange={(e) => setOrderCode(e.target.value)}
                            placeholder="Để trống để tự sinh mã"
                          />
                        </label>
                        <label className="text-sm sm:col-span-2">
                          Địa chỉ giao hàng *
                          <textarea
                            required
                            maxLength={700}
                            rows={2}
                            className={inputClass}
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            placeholder="Số nhà, đường, tòa nhà..."
                          />
                        </label>
                        <label className="text-sm">
                          Tỉnh/Thành phố *
                          <CustomSelect
                            className="mt-1"
                            required
                            disabled={loadingAddresses}
                            value={provinceCode}
                            onChange={(code) => {
                              setProvinceCode(code);
                              setDistrictCode("");
                              setWardCode("");
                            }}
                            placeholder={loadingAddresses ? "Đang tải địa chỉ..." : "Chọn tỉnh/thành phố"}
                            options={addresses.map((p) => ({ value: String(p.code), label: p.name }))}
                          />
                        </label>
                        <label className="text-sm">
                          Quận/Huyện *
                          <CustomSelect
                            className="mt-1"
                            required
                            disabled={!province}
                            value={districtCode}
                            onChange={(code) => {
                              setDistrictCode(code);
                              setWardCode("");
                            }}
                            placeholder="Chọn quận/huyện"
                            options={(province?.districts || []).map((d) => ({ value: String(d.code), label: d.name }))}
                          />
                        </label>
                        <label className="text-sm">
                          Phường/Xã
                          <CustomSelect
                            className="mt-1"
                            disabled={!district}
                            value={wardCode}
                            onChange={setWardCode}
                            placeholder="Chọn phường/xã (tùy chọn)"
                            options={(district?.wards || []).map((w) => ({ value: String(w.code), label: w.name }))}
                          />
                        </label>
                        <p className="self-center text-xs text-muted">
                          Danh mục địa chỉ giao hàng 3 cấp (v1, trước sắp xếp
                          hành chính). Địa chỉ mới có thể ghi bổ sung trong ghi
                          chú.
                        </p>
                        {addressError && (
                          <div
                            role="alert"
                            className="text-sm text-danger sm:col-span-2"
                          >
                            {addressError}{" "}
                            <button
                              type="button"
                              className={buttonClass}
                              onClick={() => setAddressReload((n) => n + 1)}
                            >
                              Tải lại địa chỉ
                            </button>
                          </div>
                        )}
                      </div>
                    </section>
                    <section className="rounded-2xl border border-line bg-white p-5">
                      <h3 className="mb-4 font-bold">Danh sách sản phẩm</h3>
                      <label className="text-sm">
                        Tìm sản phẩm / SKU
                        <input
                          type="search"
                          className={inputClass}
                          placeholder="Nhập tên sản phẩm hoặc SKU"
                          value={search}
                          onChange={(e) => setSearch(e.target.value)}
                        />
                      </label>
                      {loadingProducts && (
                        <p role="status" className="py-3 text-sm text-muted">
                          Đang tải sản phẩm của shop...
                        </p>
                      )}
                      {!loadingProducts && !products.length && (
                        <p className="py-3 text-sm text-danger">
                          Shop chưa có sản phẩm đang bán. Hãy thêm sản phẩm
                          trước khi tạo đơn.
                        </p>
                      )}
                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full min-w-[750px] text-sm">
                          <thead className="bg-brand-soft text-left text-muted">
                            <tr>
                              {[
                                "Sản phẩm *",
                                "SKU",
                                "SL *",
                                "Đơn giá *",
                                "Thành tiền",
                                "",
                              ].map((title, i) => (
                                <th key={i} className="p-2">
                                  {title}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {items.map((item, index) => {
                              const product = products.find(
                                (p) => p.id === item.productId,
                              );
                              const options =
                                product &&
                                !availableProducts.some(
                                  (p) => p.id === product.id,
                                )
                                  ? [product, ...availableProducts]
                                  : availableProducts;
                              return (
                                <tr
                                  key={item.id}
                                  className="border-b border-line"
                                >
                                  <td className="w-[34%] p-2">
                                    <Select
                                      required
                                      aria-label={`Sản phẩm dòng ${index + 1}`}
                                      disabled={loadingProducts}
                                      value={item.productId}
                                      onChange={(e) => {
                                        const selected = products.find(
                                          (p) => p.id === e.target.value,
                                        );
                                        updateItem(item.id, {
                                          productId: e.target.value,
                                          unitPrice: selected
                                            ? String(selected.price)
                                            : "",
                                          quantity: "1",
                                        });
                                      }}
                                      className="w-full text-xs font-medium"
                                    >
                                      <option value="">Chọn sản phẩm</option>
                                      {options.map((p) => (
                                        <option
                                          key={p.id}
                                          value={p.id}
                                          disabled={p.stockQuantity <= 0}
                                        >
                                          {p.title} (tồn: {p.stockQuantity})
                                        </option>
                                      ))}
                                    </Select>
                                  </td>
                                  <td className="p-2 text-muted">
                                    {product?.sku || "—"}
                                  </td>
                                  <td className="w-24 p-2">
                                    <input
                                      required
                                      aria-label={`Số lượng dòng ${index + 1}`}
                                      type="number"
                                      min={1}
                                      max={product?.stockQuantity || 1}
                                      step={1}
                                      className={inputClass}
                                      value={item.quantity}
                                      onChange={(e) =>
                                        updateItem(item.id, {
                                          quantity: e.target.value,
                                        })
                                      }
                                    />
                                  </td>
                                  <td className="w-40 p-2">
                                    <input
                                      required
                                      aria-label={`Đơn giá dòng ${index + 1}`}
                                      type="number"
                                      min="0.01"
                                      step="0.01"
                                      className={inputClass}
                                      value={item.unitPrice}
                                      onChange={(e) =>
                                        updateItem(item.id, {
                                          unitPrice: e.target.value,
                                        })
                                      }
                                    />
                                  </td>
                                  <td className="whitespace-nowrap p-2 font-semibold">
                                    {currency(
                                      (moneyInCents(item.unitPrice) ?? 0) *
                                        (Number(item.quantity) || 0),
                                    )}
                                  </td>
                                  <td className="p-2">
                                    <button
                                      type="button"
                                      aria-label={`Xóa dòng sản phẩm ${index + 1}`}
                                      disabled={items.length === 1}
                                      onClick={() =>
                                        setItems((current) =>
                                          current.filter(
                                            (row) => row.id !== item.id,
                                          ),
                                        )
                                      }
                                      className="rounded-lg p-2 text-danger hover:bg-red-50 disabled:opacity-30"
                                    >
                                      <Trash2 size={17} />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <button
                        type="button"
                        disabled={items.length >= 500}
                        className={`${buttonClass} mt-4`}
                        onClick={() =>
                          setItems((current) => [...current, newItem()])
                        }
                      >
                        <Plus size={16} className="mr-2 inline" />
                        Thêm sản phẩm
                      </button>
                    </section>
                    <section className="rounded-2xl border border-line bg-white p-5">
                      <h3 className="mb-4 font-bold">Thông tin đơn hàng</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-sm">
                          Phương thức thanh toán *
                          <Select
                            required
                            value={payment}
                            onChange={(e) =>
                              setPayment(e.target.value as typeof payment)
                            }
                            className="w-full text-xs font-medium"
                          >
                            <option value="COD">
                              COD — Thanh toán khi nhận hàng
                            </option>
                            <option value="BANK_TRANSFER">Chuyển khoản</option>
                            <option value="E_WALLET">Ví điện tử</option>
                          </Select>
                          <span className="mt-1 block text-xs text-muted">
                            Ghi nhận phương thức, không xác nhận đã thanh toán.
                          </span>
                        </label>
                        <label className="text-sm">
                          Phí vận chuyển (₫) *
                          <input
                            required
                            type="number"
                            min={0}
                            max="9999999999.99"
                            step="0.01"
                            className={inputClass}
                            value={shippingFee}
                            onChange={(e) => setShippingFee(e.target.value)}
                          />
                          <span className="mt-1 block text-xs text-muted">
                            Nhập theo báo giá vận chuyển thực tế.
                          </span>
                        </label>
                        <label className="text-sm">
                          Mã giảm giá
                          <div className="flex items-center gap-2">
                            <input
                              maxLength={20}
                              className={inputClass}
                              value={discountCode}
                              onChange={(e) => setDiscountCode(e.target.value)}
                            />
                            <button
                              type="button"
                              className={`${buttonClass} mt-1 shrink-0`}
                              onClick={applyDiscount}
                              disabled={!discountCode.trim()}
                            >
                              {applying ? "Đang kiểm tra..." : "Áp dụng"}
                            </button>
                          </div>
                          {discountCode.trim() &&
                            discount?.fingerprint !== discountFingerprint && (
                              <span className="mt-1 block text-xs text-muted">
                                Mã chưa áp dụng hoặc thông tin đơn đã thay đổi.
                              </span>
                            )}
                        </label>
                        <label className="text-sm">
                          Ghi chú đơn hàng
                          <textarea
                            maxLength={1000}
                            rows={2}
                            className={inputClass}
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                          />
                        </label>
                      </div>
                      <dl className="mt-5 space-y-2 rounded-xl bg-brand-soft p-4 text-sm">
                        <div className="flex justify-between">
                          <dt>Tổng tiền hàng</dt>
                          <dd>{currency(subtotal)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Phí vận chuyển</dt>
                          <dd>{currency(moneyInCents(shippingFee) ?? 0)}</dd>
                        </div>
                        <div className="flex justify-between">
                          <dt>Giảm giá</dt>
                          <dd>− {currency(appliedDiscount)}</dd>
                        </div>
                        <div className="flex justify-between border-t border-brand-border pt-3 text-lg font-bold">
                          <dt>Tổng đơn hàng</dt>
                          <dd>{currency(total)}</dd>
                        </div>
                      </dl>
                    </section>
                  </fieldset>
                  <footer className="flex justify-end gap-3">
                    <button
                      type="button"
                      disabled={locked}
                      className={buttonClass}
                      onClick={close}
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      disabled={
                        locked ||
                        loadingProducts ||
                        !products.length ||
                        !storeId ||
                        loadingAddresses ||
                        !addresses.length ||
                        Boolean(productError)
                      }
                      className={`${buttonClass} scanms-brand-action`}
                    >
                      {busy ? "Đang tạo đơn..." : "Tạo đơn hàng"}
                    </button>
                  </footer>
                </form>
              ) : (
                <div className="space-y-5">
                  <p className="text-sm leading-6 text-muted">
                    Chỉ nhận .xlsx, tối đa 5 MB / 10.000 dòng. Cột bắt buộc:{" "}
                    <code>
                      order_code, customer_name, customer_phone,
                      shipping_address, sku, quantity
                    </code>
                    . Tùy chọn: <code>status, unit_price, discount_amount</code>
                    . SĐT cần định dạng Text để giữ số 0 đầu. Mỗi đơn được xử lý
                    trong transaction riêng; đơn hợp lệ vẫn được import khi đơn
                    khác lỗi.
                  </p>
                  <button
                    type="button"
                    disabled={locked}
                    className={buttonClass}
                    onClick={() => {
                      void orderService
                        .downloadExcelTemplate()
                        .catch((error: unknown) =>
                          setNotice({ error: true, message: messageOf(error) }),
                        );
                    }}
                  >
                    <Download size={16} className="mr-2 inline" />
                    Tải file Excel mẫu
                  </button>
                  <button
                    type="button"
                    disabled={locked}
                    onClick={() => fileRef.current?.click()}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (!locked) {
                        if (e.dataTransfer.files.length !== 1)
                          setNotice({
                            error: true,
                            message: "Chỉ chọn một file Excel mỗi lần",
                          });
                        else selectFile(e.dataTransfer.files[0]);
                      }
                    }}
                    className="flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed border-brand-border bg-brand-soft px-6 py-10 text-center disabled:opacity-50"
                  >
                    <Upload className="text-brand-strong" />
                    <span className="font-semibold">
                      {file?.name || "Chọn hoặc kéo thả file Excel vào đây"}
                    </span>
                    <span className="text-xs text-muted">
                      {file
                        ? `${(file.size / 1024).toFixed(1)} KB`
                        : "File .xlsx · Tối đa 5 MB"}
                    </span>
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".xlsx"
                    hidden
                    disabled={locked}
                    onChange={(e) => {
                      selectFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                  {result && (
                    <section className="space-y-4">
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                          ["Số dòng", result.summary.totalRows],
                          ["Số đơn", result.summary.totalOrders],
                          ["Thành công", result.summary.importedOrders],
                          ["Bỏ qua", result.summary.skippedOrders],
                        ].map(([label, value]) => (
                          <div
                            key={label}
                            className="rounded-xl border border-line bg-white p-3"
                          >
                            <p className="text-xs text-muted">{label}</p>
                            <p className="mt-1 text-xl font-bold">{value}</p>
                          </div>
                        ))}
                      </div>
                      {result.errors.length > 0 && (
                        <div className="max-h-72 overflow-auto rounded-xl border border-line bg-white">
                          <table className="w-full text-left text-sm">
                            <thead className="sticky top-0 bg-surface-sand">
                              <tr>
                                {["Dòng", "Mã đơn", "Trường", "Lỗi"].map(
                                  (title) => (
                                    <th key={title} className="p-3">
                                      {title}
                                    </th>
                                  ),
                                )}
                              </tr>
                            </thead>
                            <tbody>
                              {result.errors.map((error, index) => (
                                <tr
                                  key={`${error.row}-${index}`}
                                  className="border-t border-line"
                                >
                                  <td className="p-3">{error.row}</td>
                                  <td className="p-3">
                                    {error.orderCode || "—"}
                                  </td>
                                  <td className="p-3">{error.field || "—"}</td>
                                  <td className="p-3 text-danger">
                                    {error.message}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                      {result.importedOrders.length > 0 && (
                        <details className="rounded-xl border border-line bg-white p-3">
                          <summary className="cursor-pointer font-semibold">
                            Các đơn đã import ({result.importedOrders.length})
                          </summary>
                          <ul className="mt-2 space-y-1 text-sm">
                            {result.importedOrders.map((order) => (
                              <li key={order.orderId}>
                                {order.orderCode} · {order.itemCount} sản phẩm
                              </li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </section>
                  )}
                  <footer className="flex justify-end gap-3">
                    <button
                      type="button"
                      disabled={locked}
                      className={buttonClass}
                      onClick={close}
                    >
                      Đóng
                    </button>
                    <button
                      type="button"
                      disabled={
                        locked ||
                        !file ||
                        loadingProducts ||
                        !storeId ||
                        Boolean(productError)
                      }
                      className={`${buttonClass} scanms-brand-action`}
                      onClick={importExcel}
                    >
                      {busy ? "Đang xử lý file..." : "Import đơn hàng"}
                    </button>
                  </footer>
                </div>
              )}
            </div>
          </dialog>,
          document.body,
        )}

      {/* ══ GHN TRACKING TIMELINE MODAL ══ */}
      {trackingGhnDetail && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#231D15]/40 backdrop-blur-xs p-3 sm:p-5">
          <div role="dialog" aria-modal="true" aria-labelledby="ghn-tracking-title" className="ghn-tracking-dialog bg-white rounded-[20px] shadow-2xl border border-[#EAE4D7] max-w-[540px] max-h-[92dvh] overflow-hidden w-full flex flex-col animate-in fade-in zoom-in-95 duration-150 text-left">
            <div className="sticky top-0 z-10 flex shrink-0 items-center justify-between gap-3 border-b border-[#EAE4D7] bg-white px-5 py-4">
              <div>
                <h3 id="ghn-tracking-title" className="text-base font-bold text-[#1A1612] m-0">
                  Theo dõi bưu kiện
                </h3>
              </div>
              <button
                type="button"
                aria-label="Đóng hành trình"
                onClick={() => setTrackingGhnDetail(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FAF8F5] text-[#7D715E] hover:bg-[#F3EFE6] focus-visible:outline-2 focus-visible:outline-[#B88E4F]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
            <GhnTrackingTimeline key={String(trackingGhnDetail.isSimulation) + trackingGhnDetail.orderCode} orderCode={trackingGhnDetail.orderCode} environment={trackingGhnDetail.environment} />
            {trackingGhnOrderId && <ShippingSimulationControls key={trackingGhnOrderId}
              orderId={trackingGhnOrderId} tracking={trackingGhnDetail} onStarted={setTrackingGhnDetail}
              onCompleted={() => {
                setTrackingGhnDetail(null);
                setOrdersRefreshCount(value => value + 1);
                setReload(value => value + 1);
                toast.success('Đã đồng bộ giao thử', { description: 'Khách có thể tải lại Đơn mua để kiểm thử nhận hàng/đổi trả.' });
              }} />}
            </div>

            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[#EAE4D7] bg-[#FAF8F5] px-5 py-3">
              {trackingGhnDetail.environment !== 'TEST' && trackingGhnDetail.trackingUrl ? (
                <a
                  href={trackingGhnDetail.trackingUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-[#8C6B32] hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Tra cứu trực tiếp trên GHN.VN</span>
                  <span className="text-xs">↗</span>
                </a>
              ) : <span />}
              <button
                type="button"
                onClick={() => setTrackingGhnDetail(null)}
                className="px-4 py-2 rounded-xl bg-[#C59B58] text-[#1A1612] font-bold text-xs hover:bg-[#B88E4F]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
