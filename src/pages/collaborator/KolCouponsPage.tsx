import React, { useState, useEffect, useRef } from 'react';
import {
  Tag,
  Plus,
  Copy,
  Check,
  Pause,
  Play,
  Trash2,
  Search,
  Store,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Percent,
  Loader2,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import {
  couponService,
  type CouponItem,
  type CouponStatus,
} from '../../services/coupon.service';
import { toast as sonnerToast } from '../../utils/toast';
import api from '../../services/api';

const STATUS_LABELS: Record<CouponStatus, { label: string; bg: string; text: string; border: string }> = {
  ACTIVE: {
    label: 'Đang hoạt động',
    bg: 'bg-[#FBF5EB]',
    text: 'text-[#B88E4F]',
    border: 'border-[#EEDFC6]',
  },
  PENDING_APPROVAL: {
    label: 'Chờ Shop duyệt',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  PAUSED: {
    label: 'Tạm ngưng',
    bg: 'bg-stone-100',
    text: 'text-stone-600',
    border: 'border-stone-200',
  },
  REJECTED: {
    label: 'Đã từ chối',
    bg: 'bg-red-50',
    text: 'text-red-600',
    border: 'border-red-200',
  },
  EXPIRED: {
    label: 'Hết hạn',
    bg: 'bg-stone-100',
    text: 'text-stone-500',
    border: 'border-stone-200',
  },
  BLOCKED: {
    label: 'Đã bị khóa',
    bg: 'bg-red-50',
    text: 'text-red-700',
    border: 'border-red-300',
  },
  DELETED: {
    label: 'Đã xóa',
    bg: 'bg-stone-100',
    text: 'text-stone-400',
    border: 'border-stone-200',
  },
};

export const KolCouponsPage: React.FC = () => {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [summary, setSummary] = useState<{
    totalSales: number;
    totalCommission: number;
    totalOrders: number;
    activeCoupons: number;
  }>({ totalSales: 0, totalCommission: 0, totalOrders: 0, activeCoupons: 0 });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);


  const [isModalOpen, setIsModalOpen] = useState(false);
  const [approvedStores, setApprovedStores] = useState<any[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [isStoreDropdownOpen, setIsStoreDropdownOpen] = useState(false);
  const storeDropdownRef = useRef<HTMLDivElement>(null);
  const [proposeCode, setProposeCode] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);


  const [deleteTarget, setDeleteTarget] = useState<CouponItem | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);


  const [toast, setToast] = useState<{
    id: number;
    type: 'success' | 'error' | 'info';
    title: string;
    message: string;
  } | null>(null);

  const showToast = (
    type: 'success' | 'error' | 'info',
    title: string,
    message: string,
  ) => {
    const id = Date.now();
    setToast({ id, type, title, message });

    if (window.self !== window.top) {
      window.parent.postMessage(
        { type: 'SCANMS_TOAST', message: `${title}: ${message}` },
        window.location.origin,
      );
    }

    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 4500);
  };

  const hasOpenModal = isModalOpen || deleteTarget !== null;

  useEffect(() => {
    if (window.self === window.top) return;

    window.parent.postMessage(
      { type: 'SCANMS_MODAL_STATE', open: hasOpenModal },
      window.location.origin,
    );

    return () => {
      if (hasOpenModal) {
        window.parent.postMessage(
          { type: 'SCANMS_MODAL_STATE', open: false },
          window.location.origin,
        );
      }
    };
  }, [hasOpenModal]);

  useEffect(() => {
    if (hasOpenModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [hasOpenModal]);


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        storeDropdownRef.current &&
        !storeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsStoreDropdownOpen(false);
      }
    };
    if (isStoreDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStoreDropdownOpen]);

  const fetchCouponsRef = useRef<(retryCount?: number) => Promise<void>>(() => Promise.resolve());
  const fetchApprovedStoresRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    fetchCouponsRef.current();
    fetchApprovedStoresRef.current();

    const handleSync = (e: MessageEvent) => {
      if (e.data?.type === 'SCANMS_AUTH_SYNC') {
        fetchCouponsRef.current();
        fetchApprovedStoresRef.current();
      }
    };
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user' || e.key === 'scanms-current-role') {
        fetchCouponsRef.current();
        fetchApprovedStoresRef.current();
      }
    };
    const handleFocus = () => {
      fetchCouponsRef.current();
    };

    window.addEventListener('message', handleSync);
    window.addEventListener('storage', handleStorage);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('message', handleSync);
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const fetchCoupons = async (retryCount = 0) => {
    try {
      setLoading(true);
      const res = await couponService.getKolCoupons();
      const list = Array.isArray(res?.data)
        ? res.data
        : (Array.isArray(res?.data?.data) ? res.data.data : (Array.isArray(res) ? res : []));
      setCoupons(list);
      const sum = res?.summary || res?.data?.summary;
      if (sum) {
        setSummary(sum);
      }
      if (list.length === 0 && retryCount < 2) {
        setTimeout(() => fetchCoupons(retryCount + 1), 400);
      }
    } catch (err) {
      console.error('Lỗi khi tải danh sách coupon của KOL:', err);
      if (retryCount < 2) {
        setTimeout(() => fetchCoupons(retryCount + 1), 400);
      }
    } finally {
      setLoading(false);
    }
  };
  fetchCouponsRef.current = fetchCoupons;

  const fetchApprovedStores = async () => {
    try {

      const res = await api.get('/collaborator/coupons/eligible-stores');
      const storeList = res.data?.data || res.data || [];
      setApprovedStores(storeList);
      if (storeList.length > 0) {
        setSelectedStoreId(storeList[0].id || storeList[0].storeId);
      } else {
        setSelectedStoreId('');
      }
    } catch (err) {
      console.error('Lỗi lấy danh sách gian hàng đủ điều kiện tạo coupon:', err);
      setApprovedStores([]);
      setSelectedStoreId('');
    }
  };
  fetchApprovedStoresRef.current = fetchApprovedStores;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    sonnerToast.success('Đã sao chép mã giảm giá!');
    setTimeout(() => setCopiedCode(null), 2500);
  };

  const handleTogglePause = async (coupon: CouponItem) => {
    try {
      await couponService.togglePauseCoupon(coupon.id);
      sonnerToast.success(coupon.status === 'ACTIVE' ? 'Đã tạm dừng mã giảm giá' : 'Đã kích hoạt lại mã giảm giá');
      await fetchCoupons();
    } catch (err: any) {
      sonnerToast.error(err.response?.data?.message || 'Không thể thay đổi trạng thái coupon');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      setDeleteLoading(true);
      await couponService.deleteCoupon(deleteTarget.id, deleteReason);
      setDeleteTarget(null);
      setDeleteReason('');
      sonnerToast.success('Đã xóa mã giảm giá');
      await fetchCoupons();
    } catch (err: any) {
      sonnerToast.error(err.response?.data?.message || 'Không thể xóa mã giảm giá');
    } finally {
      setDeleteLoading(false);
    }
  };


  const trimmedCode = proposeCode.trim().toUpperCase();
  const isLengthValid = trimmedCode.length >= 4 && trimmedCode.length <= 20;
  const isAlphanumeric = /^[A-Z0-9]+$/.test(trimmedCode);
  const hasLetter = /[A-Z]/.test(trimmedCode);
  const isBanned = [
    'ADMIN',
    'SCANMS',
    'OFFICIAL',
    'SYSTEM',
    'SUPPORT',
    'ROOT',
    'MODERATOR',
    'STAFF',
    'HELPDESK',
    'VOUCHER',
    'PROMO',
    'DISCOUNT',
  ].some((word) => trimmedCode === word || trimmedCode.includes(word));

  const isCodeValid =
    isLengthValid && isAlphanumeric && hasLetter && !isBanned;

  const handleProposeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStoreId) {
      setModalError('Vui lòng chọn Gian hàng đối tác');
      return;
    }
    if (!isCodeValid) {
      setModalError('Mã không hợp lệ. Vui lòng kiểm tra lại các yêu cầu bên dưới');
      return;
    }

    try {
      setModalLoading(true);
      setModalError(null);
      await couponService.proposeCoupon({
        storeId: selectedStoreId,
        code: trimmedCode,
      });


      setModalSuccess(
        `Đề xuất mã "${trimmedCode}" thành công! Đang chuyển tiếp...`,
      );
      setTimeout(() => {
        setIsModalOpen(false);
        setModalSuccess(null);
        setProposeCode('');
        fetchCoupons();
        showToast(
          'success',
          'Đã gửi đề xuất mã thành công!',
          `Mã "${trimmedCode}" đã được gửi tới Gian hàng và đang chờ cấu hình ưu đãi xét duyệt.`,
        );
      }, 500);
    } catch (err: any) {
      setModalError(
        err.response?.data?.message ||
          'Không thể gửi đề xuất mã giảm giá. Vui lòng kiểm tra lại.',
      );
    } finally {
      setModalLoading(false);
    }
  };


  const safeCoupons = Array.isArray(coupons) ? coupons : [];
  const filteredCoupons = safeCoupons.filter((c) => {
    if (!c) return false;
    const matchSearch =
      (c.codeNormalized &&
        c.codeNormalized.includes(searchTerm.trim().toUpperCase())) ||
      (c.displayCode &&
        c.displayCode.toUpperCase().includes(searchTerm.trim().toUpperCase())) ||
      (c.store?.name &&
        c.store.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchStatus =
      statusFilter === 'ALL' ? true : c.status === statusFilter;
    return matchSearch && matchStatus;
  });


  const totalCount = safeCoupons.length;
  const activeCount = safeCoupons.filter((c) => c && c.status === 'ACTIVE').length;
  const pendingCount = safeCoupons.filter(
    (c) => c && c.status === 'PENDING_APPROVAL',
  ).length;
  const totalRedemptions = safeCoupons.reduce(
    (acc, curr) => acc + (curr?.usageCount || 0),
    0,
  );

  return (
    <div className="min-h-screen h-full overflow-y-auto bg-[#FAF8F5] p-4 sm:p-6 lg:p-8 text-[#1A1612]">

      <div className="max-w-[1520px] mx-auto mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE4D7] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6]">
                <Sparkles className="w-3.5 h-3.5" />
                Mạng lưới Tiếp thị Liên kết (FR-12)
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1612]">
              Mã giảm giá cá nhân (Coupon Attribution)
            </h1>
            <p className="text-sm sm:text-base text-[#7D715E] mt-1">
              Đề xuất mã riêng mang thương hiệu của bạn. Đơn hàng khách nhập mã
              sẽ được giảm giá và tự động ghi nhận hoa hồng cho bạn.
            </p>
          </div>

          <button
            onClick={() => {
              setIsModalOpen(true);
              setModalError(null);
              setModalSuccess(null);
            }}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white font-medium shadow-sm transition-all duration-200 cursor-pointer text-sm"
          >
            <Plus className="w-4 h-4" />
            Đề xuất mã mới
          </button>
        </div>


        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-[#EAE4D7] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#7D715E]">
                Doanh số qua Coupon
              </span>
              <Sparkles className="w-4 h-4 text-[#C59B58]" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[#1A1612]">
              {Number(summary.totalSales || 0).toLocaleString('vi-VN')} ₫
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EAE4D7] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#7D715E]">
                Hoa hồng dự kiến
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[#B88E4F]">
              +{Number(summary.totalCommission || 0).toLocaleString('vi-VN')} ₫
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EAE4D7] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#7D715E]">
                Đơn hàng / Lượt dùng
              </span>
              <Percent className="w-4 h-4 text-[#B88E4F]" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[#1A1612]">
              {summary.totalOrders || 0} đơn ({totalRedemptions} lượt)
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EAE4D7] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#7D715E]">
                Mã đang hoạt động
              </span>
              <Tag className="w-4 h-4 text-[#C59B58]" />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-[#1A1612]">
              {activeCount} / {totalCount} mã
            </p>
            <span className="text-[11px] text-[#7D715E] block mt-0.5">
              ({pendingCount} mã chờ duyệt)
            </span>
          </div>
        </div>


        <div className="bg-white p-4 rounded-xl border border-[#EAE4D7] shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D715E]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm mã coupon hoặc tên gian hàng..."
              className="w-full pl-10 pr-4 py-2 text-sm bg-[#FAF8F5] border border-[#EAE4D7] rounded-lg focus:outline-none focus:border-[#C59B58] transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'ACTIVE', label: 'Đang chạy' },
              { key: 'PENDING_APPROVAL', label: 'Chờ duyệt' },
              { key: 'PAUSED', label: 'Tạm ngưng' },
              { key: 'REJECTED', label: 'Từ chối' },
              { key: 'BLOCKED', label: 'Bị khóa' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-[#F5E7CC] text-[#1A1612] border border-[#DEBE85] font-bold shadow-xs'
                    : 'bg-[#F3EFE6] text-[#7D715E] hover:bg-[#EEDFC6] hover:text-[#1A1612]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>


        {loading ? (
          <div className="bg-white rounded-xl border border-[#EAE4D7] p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#C59B58] mx-auto mb-3" />
            <p className="text-sm text-[#7D715E]">
              Đang tải danh sách mã giảm giá...
            </p>
          </div>
        ) : filteredCoupons.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#EAE4D7] p-12 text-center">
            <div className="w-14 h-14 bg-[#FBF5EB] rounded-full flex items-center justify-center mx-auto mb-4 border border-[#EEDFC6]">
              <Tag className="w-6 h-6 text-[#C59B58]" />
            </div>
            <h3 className="text-lg font-semibold text-[#1A1612] mb-1">
              Chưa có mã giảm giá nào
            </h3>
            <p className="text-sm text-[#7D715E] max-w-md mx-auto mb-5">
              Bạn có thể bắt đầu tạo mã giảm giá riêng (ví dụ: THANGVIP10,
              NHATXINH) để chia sẻ cho khách hàng và đẩy doanh số nhận hoa hồng.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-sm font-medium transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Đề xuất mã đầu tiên
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredCoupons.map((coupon) => {
              const statusCfg =
                STATUS_LABELS[coupon.status] || STATUS_LABELS.PENDING_APPROVAL;
              const isDiscountPercent =
                coupon.discountType === 'PERCENTAGE';
              const discountVal = Number(coupon.discountValue || 0);

              return (
                <div
                  key={coupon.id}
                  className="bg-white rounded-xl border border-[#EAE4D7] p-5 shadow-xs hover:border-[#C59B58] transition-all duration-200 flex flex-col justify-between"
                >
                  <div>

                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <Store className="w-4 h-4 text-[#B88E4F] shrink-0" />
                        <span className="text-xs font-semibold text-[#1A1612] truncate">
                          {coupon.store?.name || 'Gian hàng đối tác'}
                        </span>
                      </div>
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium border shrink-0 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>


                    <div className="bg-[#FAF8F5] border border-[#EEDFC6] rounded-xl p-3 flex items-center justify-between mb-4">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-[#7D715E] tracking-wider block">
                          MÃ COUPON
                        </span>
                        <span className="text-lg font-mono font-bold text-[#1A1612] tracking-wide">
                          {coupon.displayCode}
                        </span>
                      </div>
                      <button
                        onClick={() => handleCopy(coupon.displayCode)}
                        className="p-2 rounded-lg bg-white border border-[#EAE4D7] hover:border-[#C59B58] text-[#7D715E] hover:text-[#1A1612] transition-colors cursor-pointer"
                        title="Sao chép mã"
                      >
                        {copiedCode === coupon.displayCode ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>


                    <div className="space-y-2 mb-4 text-xs text-[#7D715E]">
                      {coupon.status === 'PENDING_APPROVAL' ? (
                        <div className="bg-amber-50/60 p-2.5 rounded-lg border border-amber-200/60 flex items-start gap-2">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-amber-800">
                            Yêu cầu đang chờ Shop xác nhận và cấu hình tỷ lệ
                            giảm giá, ngân sách và thời hạn.
                          </p>
                        </div>
                      ) : coupon.status === 'REJECTED' ? (
                        <div className="bg-red-50/70 p-2.5 rounded-lg border border-red-200 flex items-start gap-2">
                          <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[11px] font-semibold text-red-800">
                              Lý do từ chối:
                            </p>
                            <p className="text-[11px] text-red-700 mt-0.5">
                              {coupon.rejectedReason ||
                                'Không đáp ứng điều kiện chiến dịch'}
                            </p>
                          </div>
                        </div>
                      ) : coupon.status === 'BLOCKED' ? (
                        <div className="bg-red-50/70 p-2.5 rounded-lg border border-red-200 flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-[11px] font-semibold text-red-800">
                              Mã đã bị khóa:
                            </p>
                            <p className="text-[11px] text-red-700 mt-0.5">
                              {coupon.blockedReason ||
                                'Vi phạm chính sách sử dụng'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between">
                            <span>Ưu đãi áp dụng:</span>
                            <span className="font-semibold text-[#1A1612]">
                              {isDiscountPercent
                                ? `Giảm ${discountVal}%`
                                : `Giảm ${discountVal.toLocaleString('vi-VN')} ₫`}
                              {coupon.maximumDiscountAmount &&
                                ` (Tối đa ${Number(
                                  coupon.maximumDiscountAmount,
                                ).toLocaleString('vi-VN')} ₫)`}
                            </span>
                          </div>

                          {coupon.minimumOrderAmount && (
                            <div className="flex items-center justify-between">
                              <span>Đơn tối thiểu:</span>
                              <span className="font-medium text-[#1A1612]">
                                {Number(
                                  coupon.minimumOrderAmount,
                                ).toLocaleString('vi-VN')}{' '}
                                ₫
                              </span>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span>Đã dùng:</span>
                            <span className="font-medium text-[#1A1612]">
                              {coupon.usageCount}
                              {coupon.usageLimitTotal
                                ? ` / ${coupon.usageLimitTotal} lượt`
                                : ' lượt'}
                            </span>
                          </div>

                          {coupon.expiresAt && (
                            <div className="flex items-center justify-between">
                              <span>Hạn dùng:</span>
                              <span className="font-medium text-[#1A1612]">
                                {new Date(coupon.expiresAt).toLocaleDateString(
                                  'vi-VN',
                                )}
                              </span>
                            </div>
                          )}
                        </>
                      )}
                    </div>


                    {(coupon.status === 'ACTIVE' || coupon.status === 'PAUSED') && (
                      <div className="mb-4 p-2.5 rounded-lg bg-[#FAF8F5] border border-[#EEDFC6] text-xs space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[#7D715E]">Doanh số tạo ra:</span>
                          <span className="font-bold text-[#1A1612]">
                            {Number((coupon as any).totalSales || 0).toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#7D715E]">Hoa hồng dự kiến:</span>
                          <span className="font-bold text-[#B88E4F]">
                            +{Number((coupon as any).totalCommission || 0).toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                      </div>
                    )}
                  </div>


                  <div className="pt-3 border-t border-[#EAE4D7] flex items-center justify-between gap-2">
                    <span className="text-[11px] text-[#7D715E]">
                      Tạo lúc:{' '}
                      {new Date(coupon.createdAt).toLocaleDateString('vi-VN')}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {coupon.status === 'ACTIVE' && (
                        <button
                          onClick={() => handleTogglePause(coupon)}
                          className="p-1.5 rounded-lg text-[#7D715E] hover:bg-stone-100 hover:text-[#1A1612] transition-colors cursor-pointer"
                          title="Tạm ngưng mã"
                        >
                          <Pause className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {coupon.status === 'PAUSED' && (
                        <button
                          onClick={() => handleTogglePause(coupon)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                          title="Kích hoạt lại"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {coupon.status !== 'DELETED' && (
                        <button
                          onClick={() => setDeleteTarget(coupon)}
                          className="p-1.5 rounded-lg text-[#7D715E] hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                          title="Xóa mềm mã"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl border border-[#EAE4D7] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 my-auto max-h-[92vh] flex flex-col">
            <div className="px-6 py-5 border-b border-[#EAE4D7] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-lg font-bold text-[#1A1612]">
                  Đề xuất mã giảm giá riêng
                </h3>
                <p className="text-xs text-[#7D715E] mt-0.5">
                  Tạo mã định danh mang phong cách cá nhân của bạn
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#7D715E] hover:text-[#1A1612] p-1.5 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleProposeSubmit} className="p-6 space-y-5 overflow-y-auto">
              {modalError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5 text-xs text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{modalSuccess}</span>
                </div>
              )}


              <div>
                <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                  Chọn Gian hàng đối tác <span className="text-red-500">*</span>
                </label>

                <div ref={storeDropdownRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setIsStoreDropdownOpen((prev) => !prev)}
                    className={`w-full px-3.5 py-2.5 text-sm bg-[#FAF8F5] border rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                      isStoreDropdownOpen
                        ? 'border-[#C59B58] ring-2 ring-[#C59B58]/20 bg-white shadow-xs'
                        : 'border-[#EAE4D7] hover:border-[#C59B58]/60 hover:bg-[#F3EFE6]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-lg bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center shrink-0 text-[#B88E4F]">
                        <Store className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-medium text-[#1A1612] truncate text-left">
                        {approvedStores.find(
                          (s) => (s.id || s.storeId) === selectedStoreId,
                        )?.name ||
                          approvedStores.find(
                            (s) => (s.id || s.storeId) === selectedStoreId,
                          )?.storeName ||
                          (approvedStores.length > 0
                            ? approvedStores[0].name || approvedStores[0].storeName
                            : 'Chưa có gian hàng nào được duyệt')}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#7D715E] shrink-0 transition-transform duration-200 ${
                        isStoreDropdownOpen ? 'rotate-180 text-[#C59B58]' : ''
                      }`}
                    />
                  </button>


                  {isStoreDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-[#EEDFC6] rounded-xl shadow-xl overflow-hidden py-1.5 max-h-56 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
                      {approvedStores.length > 0 ? (
                        approvedStores.map((s) => {
                          const storeId = s.id || s.storeId;
                          const storeName =
                            s.name || s.storeName || 'Gian hàng đối tác';
                          const isSelected = selectedStoreId === storeId;
                          return (
                            <button
                              key={storeId}
                              type="button"
                              onClick={() => {
                                setSelectedStoreId(storeId);
                                setIsStoreDropdownOpen(false);
                              }}
                              className={`w-full px-3.5 py-2.5 text-left text-xs sm:text-sm flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                isSelected
                                  ? 'bg-[#FBF5EB] text-[#B88E4F] font-semibold border-l-3 border-[#C59B58]'
                                  : 'text-[#1A1612] hover:bg-[#F3EFE6] hover:text-[#B88E4F]'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-sm">🏪</span>
                                <span className="truncate">{storeName}</span>
                              </div>
                              {isSelected && (
                                <Check className="w-4 h-4 text-[#C59B58] shrink-0" />
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="px-3.5 py-2.5 text-xs text-[#7D715E] italic bg-[#FAF8F5]">
                          Không có gian hàng nào khả dụng
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {approvedStores.length === 0 && (
                  <div className="mt-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                    <span>
                      Bạn chưa có quan hệ đối tác được phê duyệt với Gian hàng nào để tạo mã giảm giá riêng. Vui lòng liên kết với Gian hàng trước.
                    </span>
                  </div>
                )}

                <span className="text-[11px] text-[#7D715E] mt-1 block">
                  Chỉ hiển thị các Shop bạn đã được duyệt hợp tác tiếp thị (APPROVED).
                </span>
              </div>


              <div>
                <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                  Mã coupon mong muốn <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={proposeCode}
                    onChange={(e) => setProposeCode(e.target.value)}
                    placeholder="Ví dụ: THANGVIP10, NHATXINH"
                    maxLength={20}
                    className="w-full px-3.5 py-2.5 text-sm font-mono uppercase bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58] transition-colors"
                    required
                  />
                  {trimmedCode && (
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold">
                      {isCodeValid ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-500" />
                      )}
                    </span>
                  )}
                </div>


                <div className="mt-3 p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl space-y-1.5 text-[11px]">
                  <p className="font-semibold text-[#1A1612] mb-1">
                    Tiêu chuẩn mã hợp lệ (Section 8 & 10):
                  </p>
                  <div
                    className={`flex items-center gap-1.5 ${
                      isLengthValid ? 'text-emerald-700' : 'text-[#7D715E]'
                    }`}
                  >
                    {isLengthValid ? '✓' : '•'} Độ dài từ 4 đến 20 ký tự
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      isAlphanumeric && proposeCode
                        ? 'text-emerald-700'
                        : 'text-[#7D715E]'
                    }`}
                  >
                    {isAlphanumeric && proposeCode ? '✓' : '•'} Chỉ gồm chữ cái
                    Latin (A-Z) và số (0-9), không khoảng trắng/ký tự đặc biệt
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      hasLetter ? 'text-emerald-700' : 'text-[#7D715E]'
                    }`}
                  >
                    {hasLetter ? '✓' : '•'} Không được chỉ toàn số, phải có ít
                    nhất 1 chữ cái
                  </div>
                  <div
                    className={`flex items-center gap-1.5 ${
                      !isBanned && proposeCode
                        ? 'text-emerald-700'
                        : 'text-[#7D715E]'
                    }`}
                  >
                    {!isBanned && proposeCode ? '✓' : '•'} Không chứa từ khóa
                    cấm (ADMIN, SCANMS, OFFICIAL, SYSTEM...)
                  </div>
                </div>
              </div>


              {trimmedCode && (
                <div className="p-3 bg-[#FBF5EB] border border-[#EEDFC6] rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#7D715E] block">
                      Xem trước hiển thị
                    </span>
                    <span className="text-base font-mono font-bold text-[#B88E4F]">
                      {trimmedCode}
                    </span>
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-medium">
                    Chờ Shop duyệt
                  </span>
                </div>
              )}


              <div className="pt-3 border-t border-[#EAE4D7] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#7D715E] hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={!isCodeValid || modalLoading || approvedStores.length === 0 || !selectedStoreId}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-colors cursor-pointer"
                >
                  {modalLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Đang gửi...
                    </>
                  ) : (
                    'Gửi đề xuất mã'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[#EAE4D7] shadow-2xl overflow-hidden p-6 my-auto animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[#1A1612] mb-1">
              Xác nhận xóa mã giảm giá
            </h3>
            <p className="text-xs text-[#7D715E] mb-4">
              Mã coupon <strong>{deleteTarget.displayCode}</strong> sẽ được xóa
              mềm. Dữ liệu đơn hàng cũ vẫn được bảo lưu, nhưng mã này sẽ không
              thể dùng cho đơn mới.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                Lý do xóa (tùy chọn)
              </label>
              <textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Nhập lý do xóa mã giảm giá này..."
                rows={2}
                className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58]"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#7D715E] hover:bg-stone-100 cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deleteLoading}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
              >
                {deleteLoading ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}


      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed top-5 right-5 z-[99999] flex items-start gap-3.5 max-w-sm sm:max-w-md p-4 bg-white/95 backdrop-blur-md rounded-2xl border border-[#EEDFC6] shadow-2xl shadow-amber-900/15 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto"
        >
          <div className="w-9 h-9 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center shrink-0 mt-0.5 text-[#B88E4F]">
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-red-600" />
            ) : (
              <Sparkles className="w-5 h-5 text-[#C59B58]" />
            )}
          </div>

          <div className="flex-1 min-w-0 pr-1">
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <h4 className="text-xs font-bold text-[#1A1612] uppercase tracking-wider">
                {toast.title}
              </h4>
            </div>
            <p className="text-xs text-[#7D715E] leading-relaxed break-words">
              {toast.message}
            </p>
          </div>

          <button
            onClick={() => setToast(null)}
            className="text-[#7D715E] hover:text-[#1A1612] p-1 rounded-lg hover:bg-[#F3EFE6] transition-colors cursor-pointer shrink-0 -mr-1 -mt-1"
            title="Đóng thông báo"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default KolCouponsPage;

