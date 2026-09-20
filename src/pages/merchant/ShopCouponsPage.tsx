import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Tag,
  Ticket,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Store,
  Coins,
  ShieldAlert,
  Loader2,
  Sliders,
  SlidersHorizontal,
  XCircle,
  Pause,
  Calendar,
  Percent,
  Check,
  ChevronDown,
} from 'lucide-react';
import {
  couponService,
  type CouponItem,
  type DiscountType,
  type CouponScope,
  type ApproveCouponPayload,
} from '../../services/coupon.service';
import { toast } from '../../utils/toast';
import api from '../../services/api';

interface CustomSandSelectOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

function CustomSandSelect<T extends string>({
  value,
  onChange,
  options,
  className = '',
  buttonClassName = '',
}: {
  value: T;
  onChange: (val: T) => void;
  options: CustomSandSelectOption<T>[];
  className?: string;
  buttonClassName?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value) || options[0];

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border rounded-xl flex items-center justify-between transition-all cursor-pointer text-left ${
          isOpen
            ? 'border-[#C59B58] ring-2 ring-[#C59B58]/20 bg-white shadow-xs'
            : 'border-[#EAE4D7] hover:border-[#C59B58]/60 hover:bg-[#F3EFE6]/40'
        } ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          {selectedOption?.icon}
          <span className="font-semibold text-[#1A1612] truncate">
            {selectedOption?.label || value}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[#7D715E] shrink-0 transition-transform duration-200 ml-2 ${
            isOpen ? 'rotate-180 text-[#C59B58]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 z-60 bg-white border border-[#EEDFC6] rounded-xl shadow-xl overflow-hidden py-1 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
                className={`w-full px-3.5 py-2.5 text-left text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#FBF5EB] text-[#B88E4F] font-bold border-l-3 border-[#C59B58]'
                    : 'text-[#1A1612] hover:bg-[#F3EFE6] hover:text-[#B88E4F]'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {opt.icon}
                  <span className="truncate">{opt.label}</span>
                </div>
                {isSelected && (
                  <Check className="w-3.5 h-3.5 text-[#C59B58] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export const ShopCouponsPage: React.FC = () => {
  const { storeId: urlStoreId } = useParams<{ storeId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryStoreId = searchParams.get('storeId') || '';
  const targetStoreId = urlStoreId || queryStoreId;

  const [storeId, setStoreId] = useState<string>('');
  const [storeName, setStoreName] = useState<string>('Gian Hàng Của Bạn');
  const [storesList, setStoresList] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ACTIVE' | 'HISTORY'>('PENDING');


  const [selectedCouponToApprove, setSelectedCouponToApprove] = useState<CouponItem | null>(null);
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [approveForm, setApproveForm] = useState<ApproveCouponPayload>({
    discountType: 'PERCENTAGE',
    discountValue: 10,
    maximumDiscountAmount: 50000,
    minimumOrderAmount: 200000,
    budgetTotal: 5000000,
    usageLimitTotal: 100,
    usageLimitPerCustomer: 1,
    scopeType: 'STORE_WIDE',
    fundingSource: 'SHOP_FUNDED',
    stackableWithProductDiscount: false,
    stackableWithShopVoucher: false,
    stackableWithPlatformVoucher: false,
  });
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);


  const [selectedCouponToReject, setSelectedCouponToReject] = useState<CouponItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);


  const [selectedCouponToBlock, setSelectedCouponToBlock] = useState<CouponItem | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);

  const hasOpenModal = isApproveModalOpen || selectedCouponToReject !== null || selectedCouponToBlock !== null;

  useEffect(() => {
    if (window.self === window.top) return;

    try {
      const parentDoc = window.parent.document;
      const topbar = parentDoc.querySelector('.topbar') || parentDoc.querySelector('header.topbar');
      if (topbar) {
        (topbar as HTMLElement).style.display = hasOpenModal ? 'none' : '';
      }
      parentDoc.body.classList.toggle('scanms-modal-open', hasOpenModal);
      const pageContainer = parentDoc.querySelector('.page-full-iframe') || parentDoc.querySelector('.page');
      if (pageContainer) {
        (pageContainer as HTMLElement).style.height = hasOpenModal ? '100vh' : '';
      }
      const iframeWrapper = parentDoc.querySelector('#shop-coupons-iframe')?.parentElement;
      if (iframeWrapper) {
        (iframeWrapper as HTMLElement).style.height = hasOpenModal ? '100vh' : '';
      }
      const iframe = parentDoc.querySelector('#shop-coupons-iframe');
      if (iframe) {
        (iframe as HTMLElement).style.height = hasOpenModal ? '100vh' : '';
      }
    } catch (err) {
      console.warn('Cannot access parent DOM:', err);
    }

    try {
      window.parent.postMessage(
        { type: 'SCANMS_MODAL_STATE', open: hasOpenModal },
        '*',
      );
    } catch {}

    return () => {
      try {
        const parentDoc = window.parent.document;
        const topbar = parentDoc.querySelector('.topbar') || parentDoc.querySelector('header.topbar');
        if (topbar) {
          (topbar as HTMLElement).style.display = '';
        }
        parentDoc.body.classList.remove('scanms-modal-open');
        const pageContainer = parentDoc.querySelector('.page-full-iframe') || parentDoc.querySelector('.page');
        if (pageContainer) {
          (pageContainer as HTMLElement).style.height = '';
        }
        const iframeWrapper = parentDoc.querySelector('#shop-coupons-iframe')?.parentElement;
        if (iframeWrapper) {
          (iframeWrapper as HTMLElement).style.height = '';
        }
        const iframe = parentDoc.querySelector('#shop-coupons-iframe');
        if (iframe) {
          (iframe as HTMLElement).style.height = '';
        }
      } catch {}
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

  const initStoreRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    initStoreRef.current();
  }, [targetStoreId]);

  const initStore = async () => {
    try {
      setLoading(true);
      let availableStores: any[] = [];
      try {
        const res: any = await api.get('/auth/me');
        const user = res?.data || res;
        if (user?.stores && user.stores.length > 0) {
          availableStores = user.stores;
        }
      } catch (e) {
        console.warn('Cannot fetch /auth/me stores:', e);
      }

      if (availableStores.length === 0) {
        try {
          const myStoreRes: any = await api.get('/stores/my-store');
          const myStore = myStoreRes?.data || myStoreRes;
          if (myStore && myStore.id) {
            availableStores = [myStore];
          }
        } catch (e) {
          console.warn('Cannot fetch /stores/my-store:', e);
        }
      }



      setStoresList(availableStores);

      let foundStore: any = null;
      if (targetStoreId) {
        foundStore = availableStores.find(
          (s) => s.id === targetStoreId || s.slug === targetStoreId,
        );
      }
      if (!foundStore) {

        const savedStoreId = localStorage.getItem('current_store_id');
        foundStore =
          (savedStoreId && availableStores.find((s) => s.id === savedStoreId)) ||
          availableStores[0];
      }

      if (foundStore) {
        setStoreId(foundStore.id);
        setStoreName(foundStore.name);
        localStorage.setItem('current_store_id', foundStore.id);
        if (queryStoreId && queryStoreId !== foundStore.id) {
          setSearchParams({ storeId: foundStore.id }, { replace: true });
        }
        await fetchStoreCoupons(foundStore.id);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Lỗi khởi tạo gian hàng:', err);
      setLoading(false);
    }
  };
  initStoreRef.current = initStore;

  const handleStoreChange = (newStoreId: string) => {
    const selected = storesList.find((s) => s.id === newStoreId);
    if (selected) {
      setStoreId(selected.id);
      setStoreName(selected.name);
      setSearchParams({ storeId: selected.id });
      localStorage.setItem('current_store_id', selected.id);
      fetchStoreCoupons(selected.id);
    }
  };

  const fetchStoreCoupons = async (currentStoreId: string) => {
    try {
      setLoading(true);
      const res: any = await couponService.getStoreCoupons(currentStoreId);
      const rawList = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
        ? res.data
        : Array.isArray(res?.data?.data)
        ? res.data.data
        : Array.isArray(res?.coupons)
        ? res.coupons
        : [];
      setCoupons(rawList);
    } catch (err) {
      console.error('Lỗi tải danh sách coupon gian hàng:', err);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenApproveModal = (coupon: CouponItem) => {
    setSelectedCouponToApprove(coupon);
    setApproveForm({
      discountType: coupon.discountType || 'PERCENTAGE',
      discountValue: Number(coupon.discountValue || 10),
      maximumDiscountAmount: coupon.maximumDiscountAmount
        ? Number(coupon.maximumDiscountAmount)
        : 50000,
      minimumOrderAmount: coupon.minimumOrderAmount
        ? Number(coupon.minimumOrderAmount)
        : 200000,
      budgetTotal: coupon.budgetTotal ? Number(coupon.budgetTotal) : 5000000,
      usageLimitTotal: coupon.usageLimitTotal || 100,
      usageLimitPerCustomer: coupon.usageLimitPerCustomer || 1,
      scopeType: coupon.scopeType || 'STORE_WIDE',
      fundingSource: coupon.fundingSource || 'SHOP_FUNDED',
      stackableWithProductDiscount: !!coupon.stackableWithProductDiscount,
      stackableWithShopVoucher: !!coupon.stackableWithShopVoucher,
      stackableWithPlatformVoucher: !!coupon.stackableWithPlatformVoucher,
    });
    setApproveError(null);
    setIsApproveModalOpen(true);
  };

  const handleApproveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCouponToApprove || !storeId) return;

    try {
      setIsSubmittingApprove(true);
      setApproveError(null);
      await couponService.approveCoupon(
        storeId,
        selectedCouponToApprove.id,
        approveForm,
      );
      setIsApproveModalOpen(false);
      setSelectedCouponToApprove(null);
      await fetchStoreCoupons(storeId);
    } catch (err: any) {
      setApproveError(
        err.response?.data?.message ||
          'Không thể phê duyệt coupon. Vui lòng kiểm tra lại cấu hình.',
      );
    } finally {
      setIsSubmittingApprove(false);
    }
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCouponToReject || !storeId || !rejectReason.trim()) return;

    try {
      setIsSubmittingReject(true);
      await couponService.rejectCoupon(
        storeId,
        selectedCouponToReject.id,
        rejectReason.trim(),
      );
      setSelectedCouponToReject(null);
      setRejectReason('');
      toast.success('Đã từ chối mã giảm giá');
      await fetchStoreCoupons(storeId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể từ chối coupon');
    } finally {
      setIsSubmittingReject(false);
    }
  };

  const handleBlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCouponToBlock || !storeId || !blockReason.trim()) return;

    try {
      setIsSubmittingBlock(true);
      await couponService.blockCoupon(
        storeId,
        selectedCouponToBlock.id,
        blockReason.trim(),
      );
      setSelectedCouponToBlock(null);
      setBlockReason('');
      toast.success('Đã khóa mã giảm giá');
      await fetchStoreCoupons(storeId);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Không thể khóa coupon');
    } finally {
      setIsSubmittingBlock(false);
    }
  };


  const safeCoupons = Array.isArray(coupons) ? coupons : [];
  const pendingCoupons = safeCoupons.filter(
    (c) => c && c.status === 'PENDING_APPROVAL',
  );
  const activeCoupons = safeCoupons.filter(
    (c) => c && (c.status === 'ACTIVE' || c.status === 'PAUSED'),
  );
  const historyCoupons = safeCoupons.filter(
    (c) =>
      c &&
      (c.status === 'REJECTED' ||
        c.status === 'EXPIRED' ||
        c.status === 'BLOCKED' ||
        c.status === 'DELETED'),
  );

  const displayedCoupons = (
    activeTab === 'PENDING'
      ? pendingCoupons
      : activeTab === 'ACTIVE'
      ? activeCoupons
      : historyCoupons
  ).filter(
    (c) =>
      c &&
      ((c.codeNormalized &&
        c.codeNormalized.includes(searchTerm.trim().toUpperCase())) ||
        (c.displayCode &&
          c.displayCode.toUpperCase().includes(searchTerm.trim().toUpperCase())) ||
        (c.collaborator?.fullName &&
          c.collaborator.fullName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()))),
  );

  return (
    <div className="min-h-screen h-full overflow-y-auto bg-[#FAF8F5] p-4 sm:p-6 lg:p-8 text-[#1A1612]">
      <div className="max-w-[1520px] mx-auto mb-8">

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE4D7] pb-6 mb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6]">
                <Store className="w-3.5 h-3.5" />
                {storeName}
              </span>
              {storesList.length > 1 && (
                <div className="inline-flex items-center gap-1.5 ml-1">
                  <span className="text-xs text-[#7D715E]">Chọn Shop:</span>
                  <CustomSandSelect
                    value={storeId}
                    onChange={(val) => handleStoreChange(val)}
                    options={storesList.map((s) => ({ value: s.id, label: s.name }))}
                    className="min-w-[160px]"
                    buttonClassName="py-1 px-2.5 text-xs font-semibold"
                  />
                </div>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1612]">
              Quản lý Coupon KOL (FR-12)
            </h1>
            <p className="text-sm sm:text-base text-[#7D715E] mt-1">
              Phê duyệt đề xuất mã giảm giá từ các Nhà sáng tạo (KOL/KOC), cấu
              hình mức giảm giá, ngân sách và theo dõi doanh thu đơn hàng.
            </p>
          </div>
        </div>


        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-[#EAE4D7] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#7D715E]">
                Yêu cầu chờ duyệt
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-amber-700">
              {pendingCoupons.length}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EAE4D7] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#7D715E]">
                Mã đang hoạt động
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1A1612]">
              {safeCoupons.filter((c) => c && c.status === 'ACTIVE').length}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EAE4D7] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#7D715E]">
                Lượt dùng thành công
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FAF0DC] border border-[#EEDFC6] flex items-center justify-center shrink-0">
                <Ticket className="w-4 h-4 text-[#C59B58]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1A1612]">
              {safeCoupons.reduce((acc, c) => acc + (c?.usageCount || 0), 0)}
            </p>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#EAE4D7] shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#7D715E]">
                Ngân sách đã chi
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FBF5EB] border border-[#DEBE85] flex items-center justify-center shrink-0">
                <Coins className="w-4 h-4 text-[#B88E4F]" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1A1612]">
              {safeCoupons
                .reduce((acc, c) => acc + Number(c?.budgetUsed || 0), 0)
                .toLocaleString('vi-VN')}{' '}
              ₫
            </p>
          </div>
        </div>


        <div className="bg-white p-4 rounded-xl border border-[#EAE4D7] shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 border-b md:border-b-0 pb-2 md:pb-0">
            <button
              onClick={() => setActiveTab('PENDING')}
              className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 ${
                activeTab === 'PENDING'
                  ? 'bg-[#F5E7CC] text-[#1A1612] border border-[#DEBE85] shadow-xs'
                  : 'bg-[#F3EFE6] text-[#7D715E] hover:bg-[#EEDFC6] hover:text-[#1A1612] border border-transparent'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  activeTab === 'PENDING'
                    ? 'bg-white border border-[#DEBE85] text-[#8C6B32] shadow-2xs'
                    : 'bg-[#FAF8F5] border border-[#EAE4D7] text-[#7D715E]'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
              </div>
              <span>Yêu cầu chờ duyệt</span>
              {pendingCoupons.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-extrabold shadow-2xs">
                  {pendingCoupons.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 ${
                activeTab === 'ACTIVE'
                  ? 'bg-[#F5E7CC] text-[#1A1612] border border-[#DEBE85] shadow-xs'
                  : 'bg-[#F3EFE6] text-[#7D715E] hover:bg-[#EEDFC6] hover:text-[#1A1612] border border-transparent'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  activeTab === 'ACTIVE'
                    ? 'bg-white border border-[#DEBE85] text-[#8C6B32] shadow-2xs'
                    : 'bg-[#FAF8F5] border border-[#EAE4D7] text-[#7D715E]'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Đang áp dụng ({activeCoupons.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 ${
                activeTab === 'HISTORY'
                  ? 'bg-[#F5E7CC] text-[#1A1612] border border-[#DEBE85] shadow-xs'
                  : 'bg-[#F3EFE6] text-[#7D715E] hover:bg-[#EEDFC6] hover:text-[#1A1612] border border-transparent'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  activeTab === 'HISTORY'
                    ? 'bg-white border border-[#DEBE85] text-[#8C6B32] shadow-2xs'
                    : 'bg-[#FAF8F5] border border-[#EAE4D7] text-[#7D715E]'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
              </div>
              <span>Lịch sử / Từ chối ({historyCoupons.length})</span>
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <div className="w-6 h-6 rounded-lg bg-[#FAF0DC] border border-[#EEDFC6] absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#B88E4F] pointer-events-none">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm mã coupon hoặc tên KOL..."
              className="w-full pl-11 pr-4 py-2 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58] transition-colors"
            />
          </div>
        </div>


        {loading ? (
          <div className="bg-white rounded-xl border border-[#EAE4D7] p-12 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-[#C59B58] mx-auto mb-3" />
            <p className="text-sm text-[#7D715E]">Đang tải dữ liệu coupon...</p>
          </div>
        ) : displayedCoupons.length === 0 ? (
          <div className="bg-white rounded-xl border border-[#EAE4D7] p-12 text-center">
            <Tag className="w-8 h-8 text-[#C59B58] mx-auto mb-2 opacity-50" />
            <p className="text-sm text-[#7D715E]">
              Không có mã giảm giá nào trong mục này.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#EAE4D7] shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] border-b border-[#EAE4D7] text-[#7D715E] uppercase font-bold text-[10px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Mã Coupon</th>
                    <th className="px-5 py-3.5">KOL Đề Xuất</th>
                    <th className="px-5 py-3.5">Chính Sách Ưu Đãi</th>
                    <th className="px-5 py-3.5">Sử Dụng & Ngân Sách</th>
                    <th className="px-5 py-3.5">Thời Hạn</th>
                    <th className="px-5 py-3.5">Trạng Thái</th>
                    <th className="px-5 py-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE4D7]">
                  {displayedCoupons.map((coupon) => {
                    const isPercent = coupon.discountType === 'PERCENTAGE';
                    const discountVal = Number(coupon.discountValue || 0);

                    return (
                      <tr
                        key={coupon.id}
                        className="hover:bg-[#FAF8F5] transition-colors"
                      >

                        <td className="px-5 py-4">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-[#FBF5EB] via-[#FAF8F5] to-[#F3EFE6] border border-[#EEDFC6] shadow-2xs group hover:border-[#C59B58] transition-all">
                            <div className="w-6 h-6 rounded-lg bg-[#FAF0DC] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center shrink-0 shadow-2xs group-hover:bg-[#C59B58] group-hover:text-white transition-colors">
                              <Ticket className="w-3.5 h-3.5" />
                            </div>
                            <span className="font-mono font-bold text-xs tracking-wider text-[#1A1612]">
                              {coupon.displayCode}
                            </span>
                          </div>
                        </td>


                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#FFF9ED] via-[#FBF5EB] to-[#F3EFE6] border border-[#DEBE85] flex items-center justify-center font-extrabold text-xs text-[#B88E4F] shadow-xs">
                                {coupon.collaborator?.fullName?.charAt(0) || 'K'}
                              </div>
                              <span
                                className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#C59B58] text-white flex items-center justify-center text-[8px] font-bold shadow-xs ring-2 ring-white"
                                title="KOL được chứng thực"
                              >
                                ★
                              </span>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="font-semibold text-[#1A1612]">
                                  {coupon.collaborator?.fullName || 'KOL SCANMS'}
                                </p>
                                <span className="px-1.5 py-0.2 rounded-md text-[9px] font-bold bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6]">
                                  KOL
                                </span>
                              </div>
                              <p className="text-[11px] text-[#7D715E]">
                                {coupon.collaborator?.email}
                              </p>
                            </div>
                          </div>
                        </td>


                        <td className="px-5 py-4">
                          {coupon.status === 'PENDING_APPROVAL' ? (
                            <div className="inline-flex items-center gap-2 text-amber-700 italic">
                              <div className="w-5 h-5 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center shrink-0">
                                <Clock className="w-3 h-3 text-amber-600" />
                              </div>
                              <span>Chờ cấu hình ưu đãi</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-lg bg-[#FAF0DC] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center shrink-0">
                                <Percent className="w-3 h-3" />
                              </div>
                              <div>
                                <p className="font-semibold text-[#1A1612]">
                                  {isPercent
                                    ? `Giảm ${discountVal}%`
                                    : `Giảm ${discountVal.toLocaleString(
                                        'vi-VN',
                                      )} ₫`}
                                  {coupon.maximumDiscountAmount &&
                                    ` (Tối đa ${Number(
                                      coupon.maximumDiscountAmount,
                                    ).toLocaleString('vi-VN')} ₫)`}
                                </p>
                                {coupon.minimumOrderAmount && (
                                  <p className="text-[11px] text-[#7D715E]">
                                    Đơn từ:{' '}
                                    {Number(
                                      coupon.minimumOrderAmount,
                                    ).toLocaleString('vi-VN')}{' '}
                                    ₫
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                        </td>


                        <td className="px-5 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-6 h-6 rounded-lg bg-[#FAF8F5] border border-[#EAE4D7] text-[#7D715E] flex items-center justify-center shrink-0">
                              <Coins className="w-3 h-3 text-[#B88E4F]" />
                            </div>
                            <div>
                              <p className="font-medium text-[#1A1612]">
                                {coupon.usageCount}
                                {coupon.usageLimitTotal
                                  ? ` / ${coupon.usageLimitTotal} lượt`
                                  : ' lượt'}
                              </p>
                              {coupon.budgetTotal && (
                                <p className="text-[11px] text-[#7D715E]">
                                  Đã dùng:{' '}
                                  {Number(coupon.budgetUsed).toLocaleString(
                                    'vi-VN',
                                  )}{' '}
                                  /{' '}
                                  {Number(coupon.budgetTotal).toLocaleString(
                                    'vi-VN',
                                  )}{' '}
                                  ₫
                                </p>
                              )}
                            </div>
                          </div>
                        </td>


                        <td className="px-5 py-4 text-[#7D715E]">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-5 h-5 rounded-lg bg-[#FAF8F5] border border-[#EAE4D7] flex items-center justify-center shrink-0">
                              <Calendar className="w-3 h-3 text-[#7D715E]" />
                            </div>
                            {coupon.expiresAt ? (
                              <span>
                                {new Date(coupon.expiresAt).toLocaleDateString(
                                  'vi-VN',
                                )}
                              </span>
                            ) : (
                              <span>Không giới hạn</span>
                            )}
                          </div>
                        </td>


                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border shadow-2xs ${
                              coupon.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : coupon.status === 'PENDING_APPROVAL'
                                ? 'bg-amber-50 text-amber-800 border-amber-200'
                                : coupon.status === 'PAUSED'
                                ? 'bg-stone-100 text-stone-600 border-stone-200'
                                : 'bg-red-50 text-red-600 border-red-200'
                            }`}
                          >
                            <span className="w-3.5 h-3.5 flex items-center justify-center shrink-0">
                              {coupon.status === 'ACTIVE' && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              )}
                              {coupon.status === 'PENDING_APPROVAL' && (
                                <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                              )}
                              {coupon.status === 'PAUSED' && (
                                <Pause className="w-3.5 h-3.5 text-stone-500" />
                              )}
                              {coupon.status === 'REJECTED' && (
                                <XCircle className="w-3.5 h-3.5 text-red-600" />
                              )}
                            </span>
                            {coupon.status === 'ACTIVE'
                              ? 'Đang chạy'
                              : coupon.status === 'PENDING_APPROVAL'
                              ? 'Chờ duyệt'
                              : coupon.status === 'PAUSED'
                              ? 'Tạm ngưng'
                              : coupon.status === 'REJECTED'
                              ? 'Từ chối'
                              : 'Bị khóa'}
                          </span>
                        </td>


                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {coupon.status === 'PENDING_APPROVAL' && (
                              <>
                                <button
                                  onClick={() =>
                                    handleOpenApproveModal(coupon)
                                  }
                                  className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-[#F5E7CC] hover:bg-[#EDD8B5] text-[#1A1612] border border-[#DEBE85] font-bold text-xs transition-all shadow-xs hover:shadow cursor-pointer"
                                >
                                  <div className="w-5 h-5 rounded-md bg-white border border-[#DEBE85] flex items-center justify-center shrink-0 shadow-2xs text-[#8C6B32]">
                                    <SlidersHorizontal className="w-3 h-3" />
                                  </div>
                                  <span>Cấu hình & Duyệt</span>
                                </button>
                                <button
                                  onClick={() =>
                                    setSelectedCouponToReject(coupon)
                                  }
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white border border-[#EAE4D7] hover:border-red-300 hover:bg-red-50 text-red-600 font-semibold text-xs transition-colors cursor-pointer"
                                >
                                  <div className="w-4 h-4 rounded-md bg-red-50 flex items-center justify-center shrink-0">
                                    <XCircle className="w-3 h-3 text-red-600" />
                                  </div>
                                  <span>Từ chối</span>
                                </button>
                              </>
                            )}

                            {coupon.status === 'ACTIVE' && (
                              <>
                                <button
                                  onClick={() =>
                                    handleOpenApproveModal(coupon)
                                  }
                                  className="p-2 rounded-xl border border-[#EAE4D7] hover:border-[#C59B58] bg-[#FAF8F5] hover:bg-[#FAF0DC] text-[#7D715E] hover:text-[#B88E4F] transition-all cursor-pointer shadow-2xs"
                                  title="Chỉnh sửa chính sách ưu đãi"
                                >
                                  <Sliders className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() =>
                                    setSelectedCouponToBlock(coupon)
                                  }
                                  className="p-2 rounded-xl border border-[#EAE4D7] hover:border-red-300 bg-[#FAF8F5] hover:bg-red-50 text-red-600 transition-all cursor-pointer shadow-2xs"
                                  title="Khóa mã coupon này"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>


      {isApproveModalOpen && selectedCouponToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-xl rounded-2xl border border-[#EAE4D7] shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-[#EAE4D7] flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1A1612]">
                  Cấu hình chính sách & Phê duyệt Coupon
                </h3>
                <p className="text-xs text-[#7D715E] mt-0.5">
                  Mã đề xuất:{' '}
                  <span className="font-mono font-bold text-[#B88E4F]">
                    {selectedCouponToApprove.displayCode}
                  </span>{' '}
                  — KOL:{' '}
                  <span className="font-semibold text-[#1A1612]">
                    {selectedCouponToApprove.collaborator?.fullName}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setIsApproveModalOpen(false)}
                className="text-[#7D715E] hover:text-[#1A1612] p-1.5 rounded-lg hover:bg-stone-100 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form
              onSubmit={handleApproveSubmit}
              className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5"
            >
              {approveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{approveError}</span>
                </div>
              )}


              <div className="p-3.5 bg-[#FBF5EB] border border-[#EEDFC6] rounded-xl flex items-start gap-3 text-xs text-[#7D715E]">
                <div className="w-8 h-8 rounded-xl bg-[#FAF0DC] border border-[#EEDFC6] flex items-center justify-center shrink-0 text-[#B88E4F] shadow-2xs">
                  <Coins className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-semibold text-[#1A1612]">
                    Chính sách chi phí giảm giá (Section 16):
                  </p>
                  <p className="mt-0.5 text-[11px] leading-relaxed">
                    Mặc định Gian hàng chịu 100% chi phí chiết khấu của coupon.
                    Hoa hồng cho KOL được tính trên doanh thu sau khi đã trừ số
                    tiền giảm giá này.
                  </p>
                </div>
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                    Hình thức giảm giá <span className="text-red-500">*</span>
                  </label>
                  <CustomSandSelect
                    value={approveForm.discountType}
                    onChange={(val) =>
                      setApproveForm({
                        ...approveForm,
                        discountType: val as DiscountType,
                      })
                    }
                    options={[
                      { value: 'PERCENTAGE', label: 'Giảm theo phần trăm (%)' },
                      { value: 'FIXED_AMOUNT', label: 'Giảm số tiền cố định (₫)' },
                    ]}
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                    Mức giảm giá <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={approveForm.discountValue}
                      onChange={(e) =>
                        setApproveForm({
                          ...approveForm,
                          discountValue: Number(e.target.value),
                        })
                      }
                      min={1}
                      max={
                        approveForm.discountType === 'PERCENTAGE' ? 100 : undefined
                      }
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58]"
                      required
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#7D715E] font-semibold">
                      {approveForm.discountType === 'PERCENTAGE' ? '%' : '₫'}
                    </span>
                  </div>
                </div>
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {approveForm.discountType === 'PERCENTAGE' && (
                  <div>
                    <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                      Giảm tối đa (VNĐ)
                    </label>
                    <input
                      type="number"
                      value={approveForm.maximumDiscountAmount || ''}
                      onChange={(e) =>
                        setApproveForm({
                          ...approveForm,
                          maximumDiscountAmount: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      placeholder="Ví dụ: 50000"
                      className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58]"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                    Đơn hàng tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={approveForm.minimumOrderAmount || ''}
                    onChange={(e) =>
                      setApproveForm({
                        ...approveForm,
                        minimumOrderAmount: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="Ví dụ: 200000"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58]"
                  />
                </div>
              </div>


              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                    Tổng ngân sách cấp (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={approveForm.budgetTotal || ''}
                    onChange={(e) =>
                      setApproveForm({
                        ...approveForm,
                        budgetTotal: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="Ví dụ: 5000000"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                    Tổng lượt dùng
                  </label>
                  <input
                    type="number"
                    value={approveForm.usageLimitTotal || ''}
                    onChange={(e) =>
                      setApproveForm({
                        ...approveForm,
                        usageLimitTotal: e.target.value
                          ? Number(e.target.value)
                          : undefined,
                      })
                    }
                    placeholder="Ví dụ: 100"
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                    Lượt dùng/khách
                  </label>
                  <input
                    type="number"
                    value={approveForm.usageLimitPerCustomer || 1}
                    onChange={(e) =>
                      setApproveForm({
                        ...approveForm,
                        usageLimitPerCustomer: Number(e.target.value) || 1,
                      })
                    }
                    min={1}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58]"
                  />
                </div>
              </div>


              <div>
                <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                  Phạm vi áp dụng
                </label>
                <CustomSandSelect
                  value={approveForm.scopeType || 'STORE_WIDE'}
                  onChange={(val) =>
                    setApproveForm({
                      ...approveForm,
                      scopeType: val as CouponScope,
                    })
                  }
                  options={[
                    { value: 'STORE_WIDE', label: 'Toàn bộ sản phẩm của gian hàng' },
                    { value: 'PRODUCTS', label: 'Sản phẩm cụ thể' },
                    { value: 'CATEGORIES', label: 'Danh mục cụ thể' },
                  ]}
                />
              </div>


              <div className="p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl space-y-2 text-xs">
                <p className="font-semibold text-[#1A1612]">
                  Cộng dồn khuyến mãi (Section 26):
                </p>
                <label className="flex items-center gap-2 text-[#7D715E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={approveForm.stackableWithProductDiscount}
                    onChange={(e) =>
                      setApproveForm({
                        ...approveForm,
                        stackableWithProductDiscount: e.target.checked,
                      })
                    }
                    className="rounded text-[#C59B58] focus:ring-[#C59B58]"
                  />
                  <span>Cho phép cộng dồn với giá giảm thông thường của sản phẩm</span>
                </label>
                <label className="flex items-center gap-2 text-[#7D715E] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={approveForm.stackableWithShopVoucher}
                    onChange={(e) =>
                      setApproveForm({
                        ...approveForm,
                        stackableWithShopVoucher: e.target.checked,
                      })
                    }
                    className="rounded text-[#C59B58] focus:ring-[#C59B58]"
                  />
                  <span>Cho phép cộng dồn với Voucher khác của Shop</span>
                </label>
              </div>


              <div className="pt-3 border-t border-[#EAE4D7] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#7D715E] hover:bg-stone-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApprove}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#F5E7CC] hover:bg-[#EDD8B5] text-[#1A1612] border border-[#DEBE85] text-xs font-bold transition-all shadow-xs hover:shadow cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingApprove ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#8C6B32]" />
                      Đang xử lý...
                    </>
                  ) : (
                    'Kích hoạt & Duyệt mã'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {selectedCouponToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[#EAE4D7] shadow-2xl overflow-hidden p-6 my-auto animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[#1A1612] mb-1">
              Từ chối yêu cầu coupon
            </h3>
            <p className="text-xs text-[#7D715E] mb-4">
              Vui lòng nhập lý do từ chối mã <strong>{selectedCouponToReject.displayCode}</strong>.
              KOL sẽ nhận được thông báo về lý do này.
            </p>

            <form onSubmit={handleRejectSubmit}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                  Lý do từ chối (bắt buộc) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Tên mã chưa phù hợp với quy chuẩn hoặc Shop đã hết ngân sách..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedCouponToReject(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#7D715E] hover:bg-stone-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!rejectReason.trim() || isSubmittingReject}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingReject ? 'Đang gửi...' : 'Xác nhận từ chối'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {selectedCouponToBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[#EAE4D7] shadow-2xl overflow-hidden p-6 my-auto animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[#1A1612] mb-1">
              Khóa mã giảm giá
            </h3>
            <p className="text-xs text-[#7D715E] mb-4">
              Mã <strong>{selectedCouponToBlock.displayCode}</strong> sẽ bị khóa
              ngay lập tức và không thể áp dụng cho các đơn hàng mới.
            </p>

            <form onSubmit={handleBlockSubmit}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                  Lý do khóa mã (bắt buộc) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ví dụ: Phát hiện dấu hiệu gian lận hoặc dừng đột xuất..."
                  rows={3}
                  className="w-full px-3 py-2 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setSelectedCouponToBlock(null)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#7D715E] hover:bg-stone-100 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!blockReason.trim() || isSubmittingBlock}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingBlock ? 'Đang khóa...' : 'Xác nhận khóa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShopCouponsPage;

