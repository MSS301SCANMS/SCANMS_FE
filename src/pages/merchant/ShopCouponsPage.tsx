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
  Loader2,
  Calendar,
  Percent,
  Check,
  ChevronDown,
  Sparkles,
  Plus,
  Copy,
  Layers,
  ShoppingBag,
  Zap,
  Gift,
} from 'lucide-react';
import {
  couponService,
  type CouponItem,
  type ApproveCouponPayload,
  type CreateStoreCouponPayload,
  type PlatformSubsidySummary,
} from '../../services/coupon.service';
import { toast } from '../../utils/toast';
import api from '../../services/api';
import { usesLegacyCheckout } from '../../services/checkout.service';
import { CreateCampaignModal } from '../../components/common/CreateCampaignModal';

export interface CustomSandSelectOption<T extends string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export function CustomSandSelect<T extends string>({
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
  void storesList;
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'ACTIVE' | 'HISTORY'>('ACTIVE');
  const [sourceFilter, setSourceFilter] = useState<'ALL' | 'SHOP_ONLY' | 'KOL_ONLY'>('ALL');

  // Store Products for Scope Picker
  const [storeProducts, setStoreProducts] = useState<Array<{ id: string; title: string; price: number; imageUrl?: string }>>([]);
  const [platformSubsidy, setPlatformSubsidy] = useState<PlatformSubsidySummary | null>(null);
  const [storeCampaigns, setStoreCampaigns] = useState<Array<{ id: string; name?: string; title?: string; storeId: string; isActive: boolean; startDate: string; endDate: string }>>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [voucherProductSearch, setVoucherProductSearch] = useState('');
  const normalizeProductSearch = (value?: string | null) =>
    (value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/gi, 'd')
      .toLowerCase()
      .trim();
  const filteredVoucherProducts = (storeProducts || []).filter((product) => {
    const title = (product as any)?.title || (product as any)?.name || '';
    return normalizeProductSearch(title).includes(normalizeProductSearch(voucherProductSearch));
  });

  // Modal: Phát hành Voucher Gian Hàng (Store-issued Voucher)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateStoreCouponPayload>({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: 15,
    maximumDiscountAmount: 50000,
    minimumOrderAmount: 200000,
    budgetTotal: 3000000,
    usageLimitTotal: 100,
    usageLimitPerCustomer: 1,
    startsAt: new Date().toISOString().split('T')[0],
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    scopeType: 'STORE_WIDE',
    productIds: [],
    stackableWithProductDiscount: true,
    stackableWithShopVoucher: false,
    stackableWithPlatformVoucher: true,
  });
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [discountAmountFocused, setDiscountAmountFocused] = useState(false);
  const voucherDiscountValues = useRef({ PERCENTAGE: 15, FIXED_AMOUNT: 50000 });
  const changeVoucherDiscountType = (discountType: 'PERCENTAGE' | 'FIXED_AMOUNT') => {
    if (discountType === createForm.discountType) return;
    voucherDiscountValues.current[createForm.discountType] = createForm.discountValue;
    setCreateForm({ ...createForm, discountType, discountValue: voucherDiscountValues.current[discountType] });
  };
  const [createError, setCreateError] = useState<string | null>(null);

  // Modal: Phê duyệt Voucher KOL
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
    stackableWithPlatformVoucher: true,
  });
  const [isSubmittingApprove, setIsSubmittingApprove] = useState(false);
  const [approveError, setApproveError] = useState<string | null>(null);

  // Modal: Từ chối
  const [selectedCouponToReject, setSelectedCouponToReject] = useState<CouponItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isSubmittingReject, setIsSubmittingReject] = useState(false);

  // Modal: Khóa mã
  const [selectedCouponToBlock, setSelectedCouponToBlock] = useState<CouponItem | null>(null);
  const [blockReason, setBlockReason] = useState('');
  const [isSubmittingBlock, setIsSubmittingBlock] = useState(false);

  const hasOpenModal =
    isCreateModalOpen ||
    isApproveModalOpen ||
    selectedCouponToReject !== null ||
    selectedCouponToBlock !== null;

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
        const res: any = await api.get('/users');
        const user = res?.result || res?.data || res;
        if (user?.stores && user.stores.length > 0) {
          availableStores = user.stores;
        }
      } catch (e) {
        console.warn('Cannot fetch /users stores:', e);
      }

      if (availableStores.length === 0) {
        try {
          const myStoreRes: any = await api.get('/stores/mine');
          const stores = myStoreRes?.result || myStoreRes?.data || myStoreRes;
          if (Array.isArray(stores) && stores.length > 0) {
            availableStores = stores.map((s: any) => ({ ...s, id: s.id || s.storeId }));
          }
        } catch (e) {
          console.warn('Cannot fetch /stores/mine:', e);
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
        await Promise.all([
          fetchStoreCoupons(foundStore.id),
          couponService.getStorePlatformSubsidies(foundStore.id).then((rows) => setPlatformSubsidy(rows[0] || null)).catch(() => setPlatformSubsidy(null)),
          fetchStoreProducts(foundStore.id),
          usesLegacyCheckout ? api.get('/campaigns/shop').then((res: any) => {
            const payload = res?.data?.data || res?.data || res;
            setStoreCampaigns((Array.isArray(payload) ? payload : []).filter((campaign: any) => campaign.storeId === foundStore.id && campaign.isActive && new Date(campaign.endDate) > new Date()));
          }).catch(() => setStoreCampaigns([])) : Promise.resolve(),
        ]);
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.error('Error initializing store:', err);
      setLoading(false);
    }
  };

  initStoreRef.current = initStore;

  const fetchStoreCoupons = async (sid: string) => {
    try {
      setLoading(true);
      const res = await couponService.getStoreCoupons(sid);
      setCoupons(res.data || []);
    } catch (err) {
      console.error('Lỗi tải danh sách coupon:', err);
      toast.error('Không thể tải danh sách coupon của gian hàng');
    } finally {
      setLoading(false);
    }
  };

  const fetchStoreProducts = async (sid: string) => {
    try {
      setLoadingProducts(true);
      const res: any = await api.get(`/products?storeId=${sid}&limit=100`);
      const payload = res?.data?.data || res?.data || res?.result || res;
      const items = Array.isArray(payload) ? payload : payload?.items || [];
      const normalizedItems = (Array.isArray(items) ? items : []).map((item: any) => ({
        id: item.id || item.productId,
        title: item.title || item.name || 'Sản phẩm',
        price: Number(item.price || item.priceVnd || 0),
        imageUrl:
          item.imageUrl ||
          (Array.isArray(item.imageRefs)
            ? item.imageRefs[0]
            : typeof item.imageRefs === 'object' && item.imageRefs
            ? Object.values(item.imageRefs)[0]
            : ''),
      }));
      setStoreProducts(normalizedItems);
    } catch (err) {
      console.warn('Cannot fetch store products:', err);
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleStoreChange = (newStoreId: string) => {
    const selected = storesList.find((s) => s.id === newStoreId);
    if (selected) {
      setStoreId(selected.id);
      setStoreName(selected.name);
      localStorage.setItem('current_store_id', selected.id);
      setSearchParams({ storeId: selected.id }, { replace: true });
      fetchStoreCoupons(selected.id);
      fetchStoreProducts(selected.id);
      setStoreCampaigns([]);
      setCreateForm(form => ({ ...form, campaignId: undefined, scopeType: 'STORE_WIDE' }));
      if (usesLegacyCheckout) api.get('/campaigns/shop').then((res: any) => {
        const payload = res?.data?.data || res?.data || res;
        setStoreCampaigns((Array.isArray(payload) ? payload : []).filter((campaign: any) => campaign.storeId === selected.id && campaign.isActive && new Date(campaign.endDate) > new Date()));
      }).catch(() => setStoreCampaigns([]));
      couponService.getStorePlatformSubsidies(selected.id).then((rows) => setPlatformSubsidy(rows[0] || null)).catch(() => setPlatformSubsidy(null));
    }
  };

  // Generate random voucher code
  const generateRandomCode = (prefix = 'SHOP') => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let rand = '';
    for (let i = 0; i < 5; i++) {
      rand += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateForm((prev) => ({ ...prev, code: `${prefix}${rand}` }));
  };

  // 1-Click Voucher Presets
  const applyPreset = (presetType: 'DISCOUNT_10' | 'DISCOUNT_20' | 'FLAT_50K' | 'FREESHIP' | 'VIP_100K') => {
    const codeSuffix = Math.floor(10 + Math.random() * 90);
    switch (presetType) {
      case 'DISCOUNT_10':
        setCreateForm((prev) => ({
          ...prev,
          code: `SHOP10K${codeSuffix}`,
          benefitType: 'GOODS',
          discountType: 'PERCENTAGE',
          discountValue: 10,
          maximumDiscountAmount: 30000,
          minimumOrderAmount: 150000,
          budgetTotal: 2000000,
          usageLimitTotal: 100,
          scopeType: 'STORE_WIDE',
        }));
        break;
      case 'DISCOUNT_20':
        setCreateForm((prev) => ({
          ...prev,
          code: `SUPER20K${codeSuffix}`,
          benefitType: 'GOODS',
          discountType: 'PERCENTAGE',
          discountValue: 20,
          maximumDiscountAmount: 60000,
          minimumOrderAmount: 300000,
          budgetTotal: 3000000,
          usageLimitTotal: 50,
          scopeType: 'STORE_WIDE',
        }));
        break;
      case 'FLAT_50K':
        setCreateForm((prev) => ({
          ...prev,
          code: `GIAM50K${codeSuffix}`,
          benefitType: 'GOODS',
          discountType: 'FIXED_AMOUNT',
          discountValue: 50000,
          maximumDiscountAmount: undefined,
          minimumOrderAmount: 250000,
          budgetTotal: 2500000,
          usageLimitTotal: 50,
          scopeType: 'STORE_WIDE',
        }));
        break;
      case 'FREESHIP':
        setCreateForm((prev) => ({
          ...prev,
          code: `SHIP25K${codeSuffix}`,
          benefitType: 'SHIPPING',
          discountType: 'FIXED_AMOUNT',
          discountValue: 25000,
          maximumDiscountAmount: undefined,
          minimumOrderAmount: 120000,
          budgetTotal: 1500000,
          usageLimitTotal: 60,
          scopeType: 'STORE_WIDE',
        }));
        break;
      case 'VIP_100K':
        setCreateForm((prev) => ({
          ...prev,
          code: `VIP100K${codeSuffix}`,
          benefitType: 'GOODS',
          discountType: 'FIXED_AMOUNT',
          discountValue: 100000,
          maximumDiscountAmount: undefined,
          minimumOrderAmount: 600000,
          budgetTotal: 5000000,
          usageLimitTotal: 50,
          scopeType: 'STORE_WIDE',
        }));
        break;
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) {
      toast.error('Vui lòng chọn gian hàng');
      return;
    }

    if (!createForm.code.trim()) {
      setCreateError('Vui lòng nhập mã giảm giá');
      return;
    }

    try {
      setIsSubmittingCreate(true);
      setCreateError(null);
      if (createForm.scopeType === 'CAMPAIGN' && !storeCampaigns.some(campaign => campaign.id === createForm.campaignId)) {
        setCreateError('Vui lòng chọn một chiến dịch còn hiệu lực của gian hàng.');
        return;
      }
      await couponService.createStoreCoupon(storeId, { ...createForm,
        campaignId: createForm.scopeType === 'CAMPAIGN' ? createForm.campaignId : undefined,
        stackableWithShopVoucher: false, stackableWithPlatformVoucher: true });
      toast.success(`Phát hành voucher "${createForm.code.toUpperCase()}" thành công!`);
      setIsCreateModalOpen(false);
      await fetchStoreCoupons(storeId);
      // Reset form
      voucherDiscountValues.current = { PERCENTAGE: 15, FIXED_AMOUNT: 50000 };
      setCreateForm({
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: 15,
        maximumDiscountAmount: 50000,
        minimumOrderAmount: 200000,
        budgetTotal: 3000000,
        usageLimitTotal: 100,
        usageLimitPerCustomer: 1,
        startsAt: new Date().toISOString().split('T')[0],
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        scopeType: 'STORE_WIDE',
        productIds: [],
        stackableWithProductDiscount: true,
        stackableWithShopVoucher: false,
        stackableWithPlatformVoucher: true,
      });
    } catch (err: any) {
      setCreateError(
        err.response?.data?.message ||
          'Không thể phát hành voucher. Vui lòng kiểm tra lại thông tin.',
      );
    } finally {
      setIsSubmittingCreate(false);
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
      fundingSource: 'SHOP_FUNDED',
      shopFundingRate: 100,
      platformFundingRate: 0,
      stackableWithProductDiscount: !!coupon.stackableWithProductDiscount,
      stackableWithShopVoucher: false,
      stackableWithPlatformVoucher: true,
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
      toast.success('Đã phê duyệt và kích hoạt mã giảm giá!');
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép mã: ${text}`);
  };

  const safeCoupons = Array.isArray(coupons) ? coupons : [];
  const pendingCoupons = safeCoupons.filter((c) => c && c.status === 'PENDING_APPROVAL');
  const activeCoupons = safeCoupons.filter((c) => c && (c.status === 'ACTIVE' || c.status === 'PAUSED'));
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
  ).filter((c) => {
    if (!c) return false;
    const isShopIssued =
      c.fundingSource === 'SHOP_FUNDED' &&
      (!c.collaborator ||
        c.collaborator.fullName?.includes('Gian Hàng') ||
        !c.collaborator.collaboratorProfile?.tier);
    if (sourceFilter === 'SHOP_ONLY' && !isShopIssued) return false;
    if (sourceFilter === 'KOL_ONLY' && isShopIssued) return false;

    const matchesSearch =
      (c.codeNormalized && c.codeNormalized.includes(searchTerm.trim().toUpperCase())) ||
      (c.displayCode && c.displayCode.toUpperCase().includes(searchTerm.trim().toUpperCase())) ||
      (c.campaign?.name && c.campaign.name.toLowerCase().includes(searchTerm.trim().toLowerCase())) ||
      (c.collaborator?.fullName && c.collaborator.fullName.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });

  return (
    <div className="promotions-coupons w-full text-[#1A1612]">
      <div className="max-w-[1520px] mx-auto space-y-4 pt-1 pb-8">
        {platformSubsidy && <section className="rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] p-4 text-sm" aria-label="Đối soát voucher sàn">
          <h2 className="font-bold">Voucher sàn tài trợ cho Shop</h2>
          <p className="mt-1">{platformSubsidy.orderCount} đơn · Sàn tài trợ {platformSubsidy.amount.toLocaleString('vi-VN')}₫ · Đã ghi nhận chuyển hoàn {platformSubsidy.paidAmount.toLocaleString('vi-VN')}₫ · Còn phải hoàn {platformSubsidy.outstandingAmount.toLocaleString('vi-VN')}₫</p>
          <details className="mt-2"><summary className="cursor-pointer font-semibold text-[#B88E4F]">Xem theo đơn hàng</summary><ul className="mt-2 space-y-1">{platformSubsidy.orders.map((order) => <li key={order.orderId}>{order.orderCode}: tài trợ {order.amount.toLocaleString('vi-VN')}₫, đã ghi nhận {order.paidAmount.toLocaleString('vi-VN')}₫, còn lại {order.outstandingAmount.toLocaleString('vi-VN')}₫{order.paidAmount > order.amount ? ' — cần đối soát khoản hoàn vượt sau khi đơn đổi trạng thái' : ''}{order.payments.map((payment, index) => <span key={`${payment.bankReference}-${index}`} className="block pl-3 text-xs text-[#7D715E]">Giao dịch {payment.bankReference} · {payment.amount.toLocaleString('vi-VN')}₫ · {new Date(payment.paidAt).toLocaleDateString('vi-VN')}</span>)}</li>)}</ul></details>
          {!platformSubsidy.reimbursementReady && <p className="mt-2 text-[#DC2626]">Chức năng ghi nhận chuyển hoàn đang chờ cập nhật database.</p>}
        </section>}
        <section aria-label="Phát hành voucher gian hàng" className="coupon-issuer rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-xs sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
                <Ticket className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold text-[#1A1612]">Tạo voucher gian hàng</h2>
                <p className="mt-0.5 text-xs text-[#7D715E]">Chọn mẫu nhanh hoặc tạo ưu đãi riêng.</p>
              </div>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
              {storesList.length > 1 ? (
                <div className="flex min-w-0 items-center gap-2">
                  <span className="shrink-0 text-xs text-[#7D715E]">Gian hàng</span>
                  <CustomSandSelect value={storeId} onChange={handleStoreChange}
                    options={storesList.map((s) => ({ value: s.id, label: s.name }))}
                    className="min-w-0 flex-1 sm:w-[240px]" buttonClassName="h-10 px-3 text-xs font-medium" />
                </div>
              ) : (
                <span className="inline-flex min-w-0 items-center gap-2 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 py-2.5 text-xs text-[#7D715E]">
                  <Store className="h-4 w-4 shrink-0 text-[#B88E4F]" /><span className="truncate">{storeName}</span>
                </span>
              )}
            <button
              type="button"
              onClick={() => setIsCampaignModalOpen(true)}
              disabled={!usesLegacyCheckout}
              title={!usesLegacyCheckout ? 'Tạo chiến dịch chưa được hỗ trợ trên hệ thống hiện tại.' : undefined}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-4 text-xs font-semibold text-[#1A1612] transition-colors hover:bg-[#F3EFE6] cursor-pointer"
            >
              <Calendar className="h-4 w-4 text-[#B88E4F]" />
              Tạo chiến dịch
            </button>
            <button
              type="button"
              onClick={() => {
                generateRandomCode('SHOP');
                setIsCreateModalOpen(true);
              }}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#C59B58] px-4 text-xs font-semibold text-white transition-colors hover:bg-[#B88E4F] cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Phát hành voucher mới</span>
            </button>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[#EAE4D7] pt-3">
            <span className="mr-1 text-xs text-[#7D715E]">Mẫu nhanh</span>
            {([
              { id: 'DISCOUNT_10', label: 'Giảm 10%', icon: Zap },
              { id: 'FLAT_50K', label: 'Giảm 50K', icon: Coins },
              { id: 'FREESHIP', label: 'Freeship 25K', icon: Gift },
            ] as const).map((preset) => (
              <button key={preset.id} type="button" onClick={() => { applyPreset(preset.id); setIsCreateModalOpen(true); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#EAE4D7] bg-white px-3 py-2 text-xs font-medium text-[#7D715E] transition-colors hover:border-[#EEDFC6] hover:bg-[#FBF5EB] hover:text-[#B88E4F] cursor-pointer">
                <preset.icon className="h-3.5 w-3.5 text-[#B88E4F]" />{preset.label}
              </button>
            ))}
          </div>
        </section>

        {/* Top 4 Stat Cards */}
        <div className="coupon-metrics grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="min-h-[112px] rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-xs sm:p-5">
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

          <div className="min-h-[112px] rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-xs sm:p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[#7D715E]">
                Mã đang hoạt động
              </span>
              <div className="w-8 h-8 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              </div>
            </div>
            <p className="text-2xl font-bold text-[#1A1612]">
              {safeCoupons.filter((c) => c && c.status === 'ACTIVE').length}
            </p>
          </div>

          <div className="min-h-[112px] rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-xs sm:p-5">
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

          <div className="min-h-[112px] rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-xs sm:p-5">
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

        {/* Tab Selection & Search Filters */}
        <div className="coupon-filters bg-white p-4 rounded-xl border border-[#EAE4D7] shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab('ACTIVE')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'ACTIVE'
                  ? 'bg-[#FBF5EB] text-[#1A1612] border border-[#EEDFC6]'
                  : 'bg-white text-[#7D715E] hover:bg-[#FBF5EB] hover:text-[#1A1612] border border-[#EAE4D7]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đang áp dụng ({activeCoupons.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('PENDING')}
              className={`relative px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'PENDING'
                  ? 'bg-[#FBF5EB] text-[#1A1612] border border-[#EEDFC6]'
                  : 'bg-white text-[#7D715E] hover:bg-[#FBF5EB] hover:text-[#1A1612] border border-[#EAE4D7]'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>KOL chờ duyệt</span>
              {pendingCoupons.length > 0 && (
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-500 text-white font-extrabold shadow-2xs">
                  {pendingCoupons.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('HISTORY')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'HISTORY'
                  ? 'bg-[#FBF5EB] text-[#1A1612] border border-[#EEDFC6]'
                  : 'bg-white text-[#7D715E] hover:bg-[#FBF5EB] hover:text-[#1A1612] border border-[#EAE4D7]'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-[#7D715E]" />
              <span>Lịch sử ({historyCoupons.length})</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Filter by Voucher Source */}
            <div className="flex items-center bg-[#FAF8F5] p-1 rounded-xl border border-[#EAE4D7] shrink-0 text-xs">
              <button
                type="button"
                onClick={() => setSourceFilter('ALL')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  sourceFilter === 'ALL'
                    ? 'bg-white text-[#8C6B32] font-bold shadow-2xs'
                    : 'text-[#7D715E] hover:text-[#1A1612]'
                }`}
              >
                Tất cả
              </button>
              <button
                type="button"
                onClick={() => setSourceFilter('SHOP_ONLY')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  sourceFilter === 'SHOP_ONLY'
                    ? 'bg-white text-[#8C6B32] font-bold shadow-2xs'
                    : 'text-[#7D715E] hover:text-[#1A1612]'
                }`}
              >
                Shop tự tạo
              </button>
              <button
                type="button"
                onClick={() => setSourceFilter('KOL_ONLY')}
                className={`px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer ${
                  sourceFilter === 'KOL_ONLY'
                    ? 'bg-white text-[#8C6B32] font-bold shadow-2xs'
                    : 'text-[#7D715E] hover:text-[#1A1612]'
                }`}
              >
                KOL đề xuất
              </button>
            </div>

            <div className="relative flex-1 md:w-64">
              <div className="w-6 h-6 rounded-lg bg-[#FAF0DC] border border-[#EEDFC6] absolute left-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#B88E4F] pointer-events-none">
                <Search className="w-3.5 h-3.5" />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm mã voucher..."
                className="w-full pl-10 pr-4 py-2 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58] transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Coupons List Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-[#EAE4D7]">
            <Loader2 className="w-8 h-8 text-[#C59B58] animate-spin mb-3" />
            <p className="text-xs text-[#7D715E]">Đang tải danh sách mã giảm giá...</p>
          </div>
        ) : displayedCoupons.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-[#EAE4D7] text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-[#FAF0DC] border border-[#DEBE85] flex items-center justify-center text-[#8C6B32] mb-4 shadow-sm">
              <Ticket className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#1A1612] mb-1">
              Không có mã giảm giá nào
            </h3>
            <p className="text-xs text-[#7D715E] max-w-md mb-5">
              {searchTerm
                ? 'Không tìm thấy mã giảm giá phù hợp với từ khóa tìm kiếm của bạn.'
                : 'Gian hàng chưa phát hành voucher nào hoặc chưa có yêu cầu đề xuất.'}
            </p>
            <button
              onClick={() => {
                generateRandomCode('SHOP');
                setIsCreateModalOpen(true);
              }}
              className="px-4 py-2 bg-[#C59B58] hover:bg-[#B88E4F] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Phát hành Voucher đầu tiên ngay</span>
            </button>
          </div>
        ) : (
          <div className="coupon-list grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {displayedCoupons.map((coupon) => {
              const isShopIssued =
                coupon.fundingSource === 'SHOP_FUNDED' &&
                (!coupon.collaborator ||
                  coupon.collaborator.fullName?.includes('Gian Hàng') ||
                  !coupon.collaborator.collaboratorProfile?.tier);

              const isPercentage = coupon.discountType === 'PERCENTAGE';
              const discountDisplay = isPercentage
                ? `${coupon.discountValue}%`
                : `${Number(coupon.discountValue || 0).toLocaleString('vi-VN')}₫`;

              const budgetPercentage =
                coupon.budgetTotal && Number(coupon.budgetTotal) > 0
                  ? Math.min(
                      100,
                      Math.round(
                        (Number(coupon.budgetUsed || 0) /
                          Number(coupon.budgetTotal)) *
                          100,
                      ),
                    )
                  : 0;

              return (
                <div
                  key={coupon.id}
                  className="coupon-card relative bg-white rounded-2xl border border-[#EAE4D7] hover:border-[#C59B58] shadow-xs hover:shadow-md transition-all flex flex-col justify-between group overflow-hidden"
                >
                  {/* Ticket Cutout Notches */}
                  <div className="absolute top-[88px] -left-2.5 w-5 h-5 rounded-full bg-[#FAF8F5] border-r border-[#DEBE85] z-10 pointer-events-none" />
                  <div className="absolute top-[88px] -right-2.5 w-5 h-5 rounded-full bg-[#FAF8F5] border-l border-[#DEBE85] z-10 pointer-events-none" />

                  {/* Top Ticket Header Banner */}
                  <div className="coupon-card-heading p-4 border-b border-dashed border-[#DEBE85] bg-gradient-to-b from-white to-[#FAF8F5]/60 relative">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-[#FAF0DC] border border-[#DEBE85] flex items-center justify-center text-[#8C6B32] font-black text-sm shrink-0 shadow-2xs">
                          {isPercentage ? <Percent className="w-5 h-5" /> : <Coins className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-bold text-[#1A1612] tracking-normal uppercase font-mono">
                              {coupon.displayCode}
                            </span>
                            <button
                              onClick={() => copyToClipboard(coupon.displayCode)}
                              title="Sao chép mã"
                              className="text-[#7D715E] hover:text-[#8C6B32] transition-colors p-1 cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          <p className="text-xs font-bold text-[#8C6B32] mt-0.5">
                            Giảm {discountDisplay}
                            {coupon.maximumDiscountAmount && isPercentage && (
                              <span className="text-[11px] font-normal text-[#7D715E] ml-1">
                                (Tối đa {Number(coupon.maximumDiscountAmount).toLocaleString('vi-VN')}₫)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Status badge */}
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shrink-0 border ${
                          coupon.status === 'ACTIVE'
                            ? 'bg-white text-[#1A1612] border-[#EEDFC6]'
                            : coupon.status === 'PENDING_APPROVAL'
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : coupon.status === 'PAUSED'
                            ? 'bg-stone-100 text-stone-700 border-stone-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {coupon.status === 'ACTIVE'
                          ? 'Đang chạy'
                          : coupon.status === 'PENDING_APPROVAL'
                          ? 'Chờ duyệt'
                          : coupon.status === 'PAUSED'
                          ? 'Tạm ngưng'
                          : 'Đã đóng'}
                      </span>
                    </div>

                    {/* Source tag & Scope */}
                    <div className="flex flex-wrap items-center gap-1.5 mt-3 pt-2.5 border-t border-[#F3EFE6]/80 text-[11px]">
                      {isShopIssued ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF0DC] text-[#8C6B32] font-semibold border border-[#DEBE85]">
                          <Store className="w-3 h-3" />
                          Voucher Gian Hàng
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FBF5EB] text-[#7D715E] font-semibold border border-[#EEDFC6]">
                          <Sparkles className="w-3 h-3 text-[#B88E4F]" />
                          KOL: {coupon.collaborator?.fullName || 'Nhà sáng tạo'}
                        </span>
                      )}

                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-stone-100 text-[#7D715E] font-medium border border-stone-200">
                        <Layers className="w-3 h-3" />
                        {coupon.scopeType === 'STORE_WIDE'
                          ? 'Toàn gian hàng'
                          : coupon.scopeType === 'CAMPAIGN'
                          ? `Chiến dịch: ${coupon.campaign?.name || storeCampaigns.find(item => item.id === coupon.campaignId)?.name || 'Chiến dịch Sale'}`
                          : coupon.scopeType === 'PRODUCTS'
                          ? `${coupon.couponProducts?.length || 0} Sản phẩm chọn lọc`
                          : 'Danh mục chỉ định'}
                      </span>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 space-y-3 text-xs flex-1">
                    <div className="grid grid-cols-2 gap-2 text-[#7D715E]">
                      <div>
                        <span className="block text-[11px]">Đơn tối thiểu:</span>
                        <span className="font-bold text-[#1A1612]">
                          {coupon.minimumOrderAmount
                            ? `${Number(coupon.minimumOrderAmount).toLocaleString('vi-VN')}₫`
                            : 'Không yêu cầu'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[11px]">Lượt dùng / Khách:</span>
                        <span className="font-bold text-[#1A1612]">
                          {coupon.usageLimitPerCustomer || 1} lượt
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar: Usage */}
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-[#7D715E]">Lượt đã dùng:</span>
                        <span className="font-bold text-[#1A1612]">
                          {coupon.usageCount || 0}
                          {coupon.usageLimitTotal ? ` / ${coupon.usageLimitTotal}` : ' (Không giới hạn)'}
                        </span>
                      </div>
                      {coupon.usageLimitTotal && (
                        <div className="w-full bg-[#EAE4D7] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-[#C59B58] h-full rounded-full transition-all"
                            style={{
                              width: `${Math.min(
                                100,
                                ((coupon.usageCount || 0) / coupon.usageLimitTotal) * 100,
                              )}%`,
                            }}
                          />
                        </div>
                      )}
                    </div>

                    {/* Budget tracker if configured */}
                    {coupon.budgetTotal && Number(coupon.budgetTotal) > 0 && (
                      <div className="bg-[#FAF8F5] p-2.5 rounded-xl border border-[#EAE4D7]">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-[#7D715E]">Ngân sách đã chi:</span>
                          <span className="font-bold text-[#8C6B32]">
                            {Number(coupon.budgetUsed || 0).toLocaleString('vi-VN')}₫ / {Number(coupon.budgetTotal).toLocaleString('vi-VN')}₫
                          </span>
                        </div>
                        <div className="w-full bg-[#EAE4D7] h-1.5 rounded-full overflow-hidden">
                          <div
                            className="bg-amber-600 h-full rounded-full transition-all"
                            style={{ width: `${budgetPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Date Expiry info */}
                    <div className="flex items-center gap-1.5 text-[11px] text-[#7D715E] pt-1">
                      <Calendar className="w-3.5 h-3.5 text-[#C59B58]" />
                      <span>
                        {coupon.expiresAt
                          ? `Hạn dùng: ${new Date(coupon.expiresAt).toLocaleDateString('vi-VN')}`
                          : 'Hiệu lực vô thời hạn'}
                      </span>
                    </div>
                  </div>

                  {/* Footer Action Buttons */}
                  <div className="coupon-card-actions p-3 border-t border-[#EAE4D7] bg-white flex items-center justify-between gap-2">
                    {coupon.status === 'PENDING_APPROVAL' ? (
                      <>
                        <button
                          onClick={() => setSelectedCouponToReject(coupon)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold border border-red-200 transition-colors cursor-pointer"
                        >
                          Từ chối
                        </button>
                        <button
                          onClick={() => handleOpenApproveModal(coupon)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          Duyệt & Cấu hình
                        </button>
                      </>
                    ) : coupon.status === 'ACTIVE' ? (
                      <>
                        <button
                          onClick={() => copyToClipboard(coupon.displayCode)}
                          className="flex-1 py-1.5 px-3 rounded-xl bg-white hover:bg-[#F3EFE6] text-[#8C6B32] border border-[#DEBE85] text-xs font-semibold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép mã</span>
                        </button>
                        <button
                          onClick={() => setSelectedCouponToBlock(coupon)}
                          className="py-1.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold border border-red-200 transition-colors cursor-pointer"
                        >
                          Khóa mã
                        </button>
                      </>
                    ) : (
                      <div className="text-[11px] text-[#7D715E] italic text-center w-full">
                        {coupon.status === 'BLOCKED'
                          ? `Đã khóa: ${coupon.blockedReason || 'Không có lý do'}`
                          : coupon.status === 'REJECTED'
                          ? `Đã từ chối: ${coupon.rejectedReason || 'Không có lý do'}`
                          : 'Mã đã hết hạn sử dụng'}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL 1: PHÁT HÀNH VOUCHER GIAN HÀNG (STORE-ISSUED VOUCHER) */}
      {/* ========================================================= */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#231D15]/60 backdrop-blur-[4px]">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="store-voucher-title"
            className="flex flex-col w-full max-w-4xl max-h-[calc(100dvh-28px)] overflow-hidden border border-[#EAE4D7] rounded-2xl bg-white text-[#1A1612] shadow-2xl"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-[#EAE4D7] bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF0DC] border border-[#DEBE85] flex items-center justify-center text-[#8C6B32] shadow-2xs">
                  <Ticket className="w-5 h-5 text-[#8C6B32]" />
                </div>
                <div>
                  <h2 id="store-voucher-title" className="text-base sm:text-lg font-bold text-[#1A1612]">
                    Phát hành Voucher Gian Hàng
                  </h2>
                  <p className="text-xs text-[#7D715E]">
                    Tạo mã giảm giá độc quyền cho <strong>{storeName}</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Đóng cửa sổ phát hành voucher"
                disabled={isSubmittingCreate}
                onClick={() => setIsCreateModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#EAE4D7] hover:bg-[#F3EFE6] text-[#7D715E] flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Modal Body: 2 Columns */}
            <div className="flex-1 min-h-0 overflow-y-auto grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#EAE4D7]">
              {/* Left Column (7 cols): Presets + Form */}
              <div className="p-4 sm:p-5 md:col-span-7 space-y-4">
                {/* Presets Quick-Select */}
                <div className="p-3 border border-[#EEDFC6] rounded-xl bg-[#FBF5EB]">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-xs font-bold text-[#1A1612] flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-[#B88E4F]" />
                      Mẫu ưu đãi nhanh
                    </span>
                    <span className="text-[10px] text-[#7D715E]">Bấm để áp dụng nhanh</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2" role="group" aria-label="Mẫu ưu đãi nhanh">
                    {([
                      { id: 'DISCOUNT_10', title: 'Giảm 10%', note: 'Tối đa 30K · Đơn từ 150K', value: 10, minimum: 150000, maximum: 30000, type: 'PERCENTAGE', shipping: false, icon: Percent },
                      { id: 'DISCOUNT_20', title: 'Giảm 20%', note: 'Tối đa 60K · Đơn từ 300K', value: 20, minimum: 300000, maximum: 60000, type: 'PERCENTAGE', shipping: false, icon: Percent },
                      { id: 'FLAT_50K', title: 'Giảm 50.000đ', note: 'Giảm trực tiếp · Đơn từ 250K', value: 50000, minimum: 250000, maximum: undefined, type: 'FIXED_AMOUNT', shipping: false, icon: Coins },
                      { id: 'FREESHIP', title: 'Freeship 25K', note: 'Hỗ trợ ship · Đơn từ 120K', value: 25000, minimum: 120000, maximum: undefined, type: 'FIXED_AMOUNT', shipping: true, icon: Gift },
                    ] as const).map(preset => {
                      const selected = createForm.discountType === preset.type && Number(createForm.discountValue) === preset.value
                        && Number(createForm.minimumOrderAmount) === preset.minimum
                        && (Number(createForm.maximumDiscountAmount) || 0) === (preset.maximum || 0)
                        && (createForm.benefitType === 'SHIPPING') === preset.shipping;
                      const Icon = preset.icon;
                      return (
                        <button key={preset.id} type="button" aria-pressed={selected} onClick={() => applyPreset(preset.id)}
                          className={`relative flex min-w-0 items-start gap-2 rounded-xl border p-3 text-left transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88E4F] ${selected ? 'border-[#C59B58] bg-[#FBF5EB]' : 'border-[#EAE4D7] bg-white hover:border-[#C59B58]'}`}>
                          <Icon className="mt-0.5 hidden h-4 w-4 shrink-0 text-[#B88E4F] sm:block" />
                          <span className="min-w-0 flex-1 pr-3">
                            <span className="block text-xs font-semibold leading-5 text-[#1A1612]">{preset.title}</span>
                            <span className="block text-[10px] leading-4 text-[#7D715E]">{preset.note}</span>
                          </span>
                          {selected && <Check className="absolute right-2 top-2 h-3.5 w-3.5 text-[#B88E4F]" />}
                        </button>
                      );
                    })}
                  </div>
                  {createForm.benefitType !== 'SHIPPING' && (
                    <button type="button" aria-pressed={createForm.scopeType === 'CAMPAIGN'}
                      onClick={() => setCreateForm(previous => ({ ...previous, scopeType: previous.scopeType === 'CAMPAIGN' ? 'STORE_WIDE' : 'CAMPAIGN', productIds: [], campaignId: previous.scopeType === 'CAMPAIGN' ? undefined : previous.campaignId }))}
                      className={`mt-3 flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B88E4F] ${createForm.scopeType === 'CAMPAIGN' ? 'border-[#C59B58] bg-white' : 'border-[#EAE4D7] bg-white hover:border-[#C59B58]'}`}>
                      <Calendar className="h-4 w-4 shrink-0 text-[#B88E4F]" />
                      <span className="flex-1"><span className="block text-xs font-semibold text-[#1A1612]">Chiến dịch Sale</span><span className="mt-0.5 block text-[10px] leading-4 text-[#7D715E]">Gắn voucher với chiến dịch của gian hàng</span></span>
                      <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${createForm.scopeType === 'CAMPAIGN' ? 'border-[#C59B58] bg-[#C59B58] text-white' : 'border-[#EAE4D7]'}`}>{createForm.scopeType === 'CAMPAIGN' && <Check size={12} />}</span>
                    </button>
                  )}
                </div>

                <form id="store-voucher-form" onSubmit={handleCreateSubmit} className="space-y-4">
                  {createForm.scopeType === 'CAMPAIGN' && (
                    <div className="p-3.5 border border-[#EEDFC6] rounded-xl bg-[#FBF5EB]">
                      <label className="block text-xs font-bold text-[#1A1612] mb-2" htmlFor="voucher-campaign">Chiến dịch áp dụng *</label>
                      <select id="voucher-campaign" required value={createForm.campaignId || ''}
                        onChange={event => {
                          const campaign = storeCampaigns.find(row => row.id === event.target.value);
                          setCreateForm(form => ({ ...form, campaignId: campaign?.id,
                            startsAt: campaign?.startDate || form.startsAt, expiresAt: campaign?.endDate || form.expiresAt }));
                        }} className="w-full bg-white border border-[#EAE4D7] rounded-xl px-3 py-2.5 text-sm">
                        <option value="">Chọn chiến dịch của gian hàng</option>
                        {storeCampaigns.map(campaign => <option key={campaign.id} value={campaign.id}>{campaign.name || campaign.title}</option>)}
                      </select>
                      <p className="mt-2 text-xs text-[#7D715E]">Voucher chỉ dùng trong thời gian chiến dịch hoạt động. {storeCampaigns.length === 0 && 'Tạo chiến dịch trong mục Khuyến mãi & Hoa hồng trước.'}</p>
                    </div>
                  )}
                  {createError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{createError}</span>
                    </div>
                  )}

                  {/* Discount Type & Value */}
                  <div className="p-3.5 border border-[#EAE4D7] rounded-xl bg-[#FAF8F5]">
                    <label className="block text-xs font-bold text-[#1A1612] mb-2">
                      Hình thức & Mức giảm giá <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-1.5 p-1 mb-3 rounded-lg bg-[#F3EFE6]" role="group" aria-label="Hình thức giảm giá">
                      <button
                        type="button"
                        aria-pressed={createForm.discountType === 'PERCENTAGE'}
                        onClick={() => changeVoucherDiscountType('PERCENTAGE')}
                        className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition cursor-pointer ${
                          createForm.discountType === 'PERCENTAGE'
                            ? 'bg-white text-[#8C6B32] shadow-2xs border border-[#EEDFC6]'
                            : 'text-[#7D715E] hover:text-[#1A1612]'
                        }`}
                      >
                        Theo phần trăm (%)
                      </button>
                      <button
                        type="button"
                        aria-pressed={createForm.discountType === 'FIXED_AMOUNT'}
                        onClick={() => changeVoucherDiscountType('FIXED_AMOUNT')}
                        className={`flex-1 py-1.5 px-2 rounded-md text-xs font-bold transition cursor-pointer ${
                          createForm.discountType === 'FIXED_AMOUNT'
                            ? 'bg-white text-[#8C6B32] shadow-2xs border border-[#EEDFC6]'
                            : 'text-[#7D715E] hover:text-[#1A1612]'
                        }`}
                      >
                        Số tiền cố định (VNĐ)
                      </button>
                    </div>

                    <div className="relative">
                      <input
                        id="voucher-discount-value"
                        type="text"
                        inputMode="numeric"
                        autoComplete="off"
                        value={createForm.discountValue ? (createForm.discountType === 'FIXED_AMOUNT' && !discountAmountFocused ? createForm.discountValue.toLocaleString('vi-VN') : String(createForm.discountValue)) : ''}
                        onFocus={() => setDiscountAmountFocused(true)}
                        onBlur={() => setDiscountAmountFocused(false)}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            discountValue: Number(e.target.value.replace(/[^0-9]/g, '')),
                          })
                        }
                        className="w-full px-3.5 py-2.5 pr-10 text-sm font-bold bg-white border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58]/40 text-[#1A1612]"
                        placeholder={createForm.discountType === 'PERCENTAGE' ? 'VD: 15' : 'VD: 50.000'}
                        required
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#7D715E]">
                        {createForm.discountType === 'PERCENTAGE' ? '%' : '₫'}
                      </span>
                    </div>
                  </div>

                  {/* Voucher Code */}
                  <div>
                    <label className="block text-xs font-bold text-[#1A1612] mb-1.5">
                      Mã Voucher <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={createForm.code}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''),
                          })
                        }
                        placeholder="VD: SHOPVIP20, SUMMER15..."
                        maxLength={20}
                        className="flex-1 px-3.5 py-2.5 text-xs font-bold tracking-wider bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58] uppercase"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => generateRandomCode('SHOP')}
                        className="px-3.5 py-2 bg-[#F3EFE6] hover:bg-[#EEDFC6] text-[#8C6B32] text-xs font-bold rounded-xl border border-[#DEBE85] transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Tự sinh mã</span>
                      </button>
                    </div>
                    <span className="text-[10px] text-[#7D715E] mt-1 block">
                      4–20 ký tự chữ và số · Tự động viết hoa
                    </span>
                  </div>

                  {/* Max Discount & Min Order */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#1A1612] mb-1.5">
                        Giảm tối đa (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={createForm.maximumDiscountAmount || ''}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            maximumDiscountAmount: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        placeholder={createForm.discountType === 'PERCENTAGE' ? 'VD: 50.000₫' : 'Không áp dụng'}
                        disabled={createForm.discountType === 'FIXED_AMOUNT'}
                        className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58] disabled:opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1A1612] mb-1.5">
                        Đơn hàng tối thiểu (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={createForm.minimumOrderAmount || ''}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            minimumOrderAmount: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        placeholder="VD: 200.000₫"
                        className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58]"
                      />
                    </div>
                  </div>

                  {/* Date range */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#1A1612] mb-1.5">
                        Ngày bắt đầu
                      </label>
                      <input
                        type="date"
                        value={createForm.startsAt?.slice(0, 10) || ''}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            startsAt: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1A1612] mb-1.5">
                        Ngày hết hạn
                      </label>
                      <input
                        type="date"
                        value={createForm.expiresAt?.slice(0, 10) || ''}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            expiresAt: e.target.value,
                          })
                        }
                        className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58]"
                      />
                    </div>
                  </div>

                  {/* Scope selection */}
                  <div className="voucher-scope">
                    <label className="block text-xs font-bold text-[#1A1612] mb-1.5">
                      Phạm vi áp dụng
                    </label>
                    <div className="flex gap-1 p-1 rounded-lg bg-[#F3EFE6]" role="group" aria-label="Phạm vi áp dụng voucher">
                      <button
                        type="button"
                        aria-pressed={createForm.scopeType === 'STORE_WIDE'}
                        onClick={() => { setCreateForm({ ...createForm, scopeType: 'STORE_WIDE', productIds: [] }); setVoucherProductSearch(''); }}
                        className={`flex items-center justify-center flex-1 gap-1.5 py-1.5 px-2 text-xs font-bold rounded-md transition cursor-pointer ${
                          createForm.scopeType === 'STORE_WIDE'
                            ? 'bg-white text-[#8C6B32] shadow-2xs border border-[#EEDFC6]'
                            : 'text-[#7D715E] hover:text-[#1A1612]'
                        }`}
                      >
                        <Store className="w-3.5 h-3.5" />
                        <span>Toàn gian hàng</span>
                      </button>
                      <button
                        type="button"
                        aria-pressed={createForm.scopeType === 'PRODUCTS'}
                        onClick={() => setCreateForm({ ...createForm, scopeType: 'PRODUCTS' })}
                        className={`flex items-center justify-center flex-1 gap-1.5 py-1.5 px-2 text-xs font-bold rounded-md transition cursor-pointer ${
                          createForm.scopeType === 'PRODUCTS'
                            ? 'bg-white text-[#8C6B32] shadow-2xs border border-[#EEDFC6]'
                            : 'text-[#7D715E] hover:text-[#1A1612]'
                        }`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Chọn sản phẩm</span>
                      </button>
                    </div>

                    {createForm.scopeType === 'PRODUCTS' && (
                      <div className="mt-2.5 border border-[#EAE4D7] rounded-xl overflow-hidden bg-white shadow-2xs">
                        <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E]">
                          <Search size={14} />
                          <input
                            type="search"
                            value={voucherProductSearch}
                            onChange={event => setVoucherProductSearch(event.target.value)}
                            placeholder="Tìm sản phẩm theo tên..."
                            aria-label="Tìm sản phẩm áp dụng voucher"
                            className="flex-1 min-w-0 h-7 border-0 bg-transparent text-xs outline-none"
                          />
                          <span className="px-2 py-0.5 rounded-full bg-[#FBF5EB] text-[10px] font-bold text-[#8C6B32] border border-[#EEDFC6]">
                            {createForm.productIds?.length || 0} đã chọn
                          </span>
                        </div>
                        <div className="max-h-44 overflow-y-auto divide-y divide-[#F3EFE6]">
                          {loadingProducts ? (
                            <div className="py-4 text-center text-xs text-[#7D715E]">Đang tải sản phẩm...</div>
                          ) : storeProducts.length === 0 ? (
                            <div className="py-4 text-center text-xs text-[#7D715E]">Không có sản phẩm nào trong gian hàng.</div>
                          ) : filteredVoucherProducts.length === 0 ? (
                            <p className="p-3 text-center text-xs text-[#7D715E]">Không tìm thấy sản phẩm phù hợp.</p>
                          ) : (
                            filteredVoucherProducts.map((p) => {
                              const isSelected = createForm.productIds?.includes(p.id);
                              return (
                                <label
                                  key={p.id}
                                  className={`grid grid-cols-[16px_minmax(0,1fr)_auto] gap-2.5 items-center p-2.5 hover:bg-[#FAF8F5] cursor-pointer transition ${isSelected ? 'bg-[#FBF5EB]' : ''}`}
                                >
                                  <input
                                    type="checkbox"
                                    checked={isSelected}
                                    onChange={(e) => {
                                      const currentIds = createForm.productIds || [];
                                      if (e.target.checked) {
                                        setCreateForm({ ...createForm, productIds: [...currentIds, p.id] });
                                      } else {
                                        setCreateForm({ ...createForm, productIds: currentIds.filter((id) => id !== p.id) });
                                      }
                                    }}
                                    className="accent-[#C59B58]"
                                  />
                                  <span className="text-xs text-[#1A1612] truncate">{p.title || (p as any).name || 'Sản phẩm'}</span>
                                  <span className="text-xs font-bold text-[#8C6B32] tabular-nums whitespace-nowrap">
                                    {Number(p.price || 0).toLocaleString('vi-VN')}₫
                                  </span>
                                </label>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Usage Limits & Budget */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#1A1612] mb-1.5">
                        Tổng lượt dùng
                      </label>
                      <input
                        type="number"
                        value={createForm.usageLimitTotal || ''}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            usageLimitTotal: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        placeholder="VD: 100"
                        className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1A1612] mb-1.5">
                        Lượt / Khách hàng
                      </label>
                      <input
                        type="number"
                        value={createForm.usageLimitPerCustomer || 1}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            usageLimitPerCustomer: Number(e.target.value),
                          })
                        }
                        min={1}
                        className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1A1612] mb-1.5">
                        Ngân sách tối đa (VNĐ)
                      </label>
                      <input
                        type="number"
                        value={createForm.budgetTotal || ''}
                        onChange={(e) =>
                          setCreateForm({
                            ...createForm,
                            budgetTotal: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                        placeholder="VD: 5.000.000₫"
                        className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58]"
                      />
                    </div>
                  </div>

                  {/* Stacking Options */}
                  <div className="pt-2 border-t border-[#EAE4D7] space-y-2">
                    <span className="text-xs font-bold text-[#1A1612] block">
                      Quy tắc cộng dồn ưu đãi
                    </span>
                    <label className="flex items-center gap-2 text-xs text-[#7D715E] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createForm.stackableWithProductDiscount}
                        onChange={(e) => setCreateForm({ ...createForm, stackableWithProductDiscount: e.target.checked })}
                        className="accent-[#C59B58]"
                      />
                      <span>Cho phép cộng dồn với giá giảm trực tiếp của sản phẩm</span>
                    </label>
                    <label className="flex items-center gap-2 text-xs text-[#7D715E] cursor-pointer">
                      <input
                        type="checkbox"
                        checked={true}
                        disabled
                        className="accent-[#C59B58]"
                      />
                      <span>Dùng cùng 1 voucher Sàn và 1 voucher vận chuyển; không chồng voucher tiền hàng của Shop</span>
                    </label>
                  </div>
                </form>
              </div>

              {/* Right Column (5 cols): Live Real-Time Ticket Preview */}
              <div className="p-4 sm:p-5 md:col-span-5 bg-[#FAF8F5] flex flex-col justify-between gap-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#7D715E]">
                      Mô phỏng hiển thị trên sàn
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FBF5EB] text-[#8C6B32] border border-[#EEDFC6]">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" />
                      Live Preview
                    </span>
                  </div>

                  {/* Sand Luxury Ticket Card */}
                  <div className="relative bg-white rounded-2xl border border-[#DEBE85] shadow-md p-4 overflow-hidden">
                    {/* Left & Right Cutouts */}
                    <div className="absolute top-[88px] -left-3 w-5 h-5 rounded-full bg-[#FAF8F5] border-r border-[#DEBE85]" />
                    <div className="absolute top-[88px] -right-3 w-5 h-5 rounded-full bg-[#FAF8F5] border-l border-[#DEBE85]" />

                    {/* Top: Store Branding */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#F3EFE6]">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#FAF0DC] border border-[#DEBE85] flex items-center justify-center text-[#8C6B32] shrink-0">
                          <Store className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs font-bold text-[#1A1612] truncate">{storeName}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF0DC] text-[#8C6B32] border border-[#DEBE85] shrink-0">
                        Voucher Shop
                      </span>
                    </div>

                    {/* Middle: Discount Announcement */}
                    <div className="py-4 text-center">
                      <div className="text-2xl sm:text-3xl font-black text-[#1A1612] tracking-tight">
                        {createForm.discountType === 'PERCENTAGE'
                          ? `GIẢM ${createForm.discountValue || 0}%`
                          : `GIẢM ${Number(createForm.discountValue || 0).toLocaleString('vi-VN')}₫`}
                      </div>
                      {createForm.discountType === 'PERCENTAGE' && createForm.maximumDiscountAmount ? (
                        <p className="text-xs text-[#7D715E] mt-1 font-medium">
                          Giảm tối đa {Number(createForm.maximumDiscountAmount).toLocaleString('vi-VN')}₫
                        </p>
                      ) : (
                        <p className="text-xs text-[#7D715E] mt-1 font-medium">
                          Áp dụng cho mọi giá trị thanh toán
                        </p>
                      )}
                    </div>

                    {/* Dashed Separator */}
                    <div className="border-b border-dashed border-[#DEBE85] my-1" />

                    {/* Bottom: Details & Code */}
                    <div className="pt-3 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[#7D715E]">Mã ưu đãi:</span>
                        <span className="font-mono font-extrabold text-[#8C6B32] bg-[#FBF5EB] px-2.5 py-1 rounded-md border border-[#EEDFC6] tracking-wider">
                          {createForm.code || 'CHƯA_NHẬP_MÃ'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#7D715E]">Đơn tối thiểu:</span>
                        <span className="font-bold text-[#1A1612]">
                          {createForm.minimumOrderAmount
                            ? `${Number(createForm.minimumOrderAmount).toLocaleString('vi-VN')}₫`
                            : 'Không yêu cầu'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#7D715E]">Phạm vi:</span>
                        <span className="font-bold text-[#1A1612]">
                          {createForm.scopeType === 'STORE_WIDE'
                            ? 'Toàn gian hàng'
                            : createForm.scopeType === 'CAMPAIGN'
                            ? (storeCampaigns.find(item => item.id === createForm.campaignId)?.name || 'Chưa chọn chiến dịch')
                            : `${createForm.productIds?.length || 0} sản phẩm chỉ định`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#7D715E]">Hạn sử dụng:</span>
                        <span className="font-bold text-[#8C6B32]">
                          {createForm.expiresAt
                            ? new Date(createForm.expiresAt).toLocaleDateString('vi-VN')
                            : 'Vô thời hạn'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Summary of Rules */}
                  <div className="mt-4 p-3 bg-white rounded-xl border border-[#EAE4D7] space-y-1.5 text-xs text-[#7D715E]">
                    <div className="font-bold text-[#1A1612] text-[11px] uppercase tracking-wider mb-1">
                      Tóm tắt điều kiện
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                      <span>{createForm.usageLimitPerCustomer || 1} lượt dùng / mỗi khách hàng</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] shrink-0" />
                      <span>1 voucher Shop/KOL + 1 voucher Sàn + 1 Freeship</span>
                    </div>
                    {createForm.budgetTotal && (
                      <div className="flex items-center gap-2">
                        <Coins className="w-3.5 h-3.5 text-[#8C6B32] shrink-0" />
                        <span>Ngân sách phát hành: {Number(createForm.budgetTotal).toLocaleString('vi-VN')}₫</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[10px] text-center text-[#7D715E]">
                  Khách hàng sẽ thấy voucher này tại trang chi tiết sản phẩm và bước thanh toán giỏ hàng.
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex justify-end items-center gap-2.5 px-5 py-3.5 border-t border-[#EAE4D7] bg-white shrink-0">
              <button
                type="button"
                disabled={isSubmittingCreate}
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#7D715E] hover:bg-[#F3EFE6] cursor-pointer transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                form="store-voucher-form"
                disabled={!createForm.code.trim() || isSubmittingCreate}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#C59B58] to-[#966E2E] hover:from-[#B88E4F] hover:to-[#845E20] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#C59B58]/20 transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2"
              >
                {isSubmittingCreate ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Đang phát hành...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-200" />
                    <span>Phát hành voucher</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 2: DUYỆT VOUCHER KOL (APPROVE MODAL) */}
      {/* ========================================================= */}
      {isApproveModalOpen && selectedCouponToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-[#DEBE85] shadow-2xl overflow-hidden p-6 sm:p-8 my-auto animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-[#EAE4D7] pb-4 mb-5">
              <div>
                <h3 className="text-lg font-bold text-[#1A1612]">
                  Phê duyệt mã giảm giá: {selectedCouponToApprove.displayCode}
                </h3>
                <p className="text-xs text-[#7D715E]">
                  Đề xuất bởi KOL: <strong>{selectedCouponToApprove.collaborator?.fullName}</strong>
                </p>
                <p className="mt-1 text-xs text-[#B88E4F]">Shop chi trả 100% ngân sách giảm giá. Chỉ sau khi Shop duyệt, mã mới được kích hoạt.</p>
              </div>
              <button
                type="button"
                onClick={() => setIsApproveModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] border border-[#EAE4D7] hover:bg-[#F3EFE6] text-[#7D715E] flex items-center justify-center text-sm font-bold cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleApproveSubmit} className="space-y-4">
              {approveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{approveError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                    Hình thức giảm giá
                  </label>
                  <CustomSandSelect<'PERCENTAGE' | 'FIXED_AMOUNT'>
                    value={approveForm.discountType}
                    onChange={(val) => setApproveForm({ ...approveForm, discountType: val })}
                    options={[
                      { value: 'PERCENTAGE', label: 'Theo phần trăm (%)' },
                      { value: 'FIXED_AMOUNT', label: 'Số tiền cố định (VNĐ)' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                    Mức giảm giá <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={approveForm.discountValue || ''}
                    onChange={(e) => setApproveForm({ ...approveForm, discountValue: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                    Giảm tối đa (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={approveForm.maximumDiscountAmount || ''}
                    onChange={(e) => setApproveForm({ ...approveForm, maximumDiscountAmount: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                    Đơn tối thiểu (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={approveForm.minimumOrderAmount || ''}
                    onChange={(e) => setApproveForm({ ...approveForm, minimumOrderAmount: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                    Tổng ngân sách tài trợ (VNĐ)
                  </label>
                  <input
                    type="number"
                    value={approveForm.budgetTotal || ''}
                    onChange={(e) => setApproveForm({ ...approveForm, budgetTotal: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                    Tổng lượt dùng tối đa
                  </label>
                  <input
                    type="number"
                    value={approveForm.usageLimitTotal || ''}
                    onChange={(e) => setApproveForm({ ...approveForm, usageLimitTotal: e.target.value ? Number(e.target.value) : undefined })}
                    className="w-full px-3.5 py-2.5 text-xs bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl focus:outline-none focus:border-[#C59B58]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#EAE4D7]">
                <button
                  type="button"
                  onClick={() => setIsApproveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-[#7D715E] hover:bg-[#F3EFE6] cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingApprove}
                  className="px-5 py-2.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingApprove ? 'Đang duyệt...' : 'Phê duyệt & Kích hoạt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL 3: TỪ CHỐI (REJECT MODAL) */}
      {/* ========================================================= */}
      {selectedCouponToReject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[#EAE4D7] shadow-2xl overflow-hidden p-6 my-auto animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[#1A1612] mb-1">
              Từ chối mã giảm giá
            </h3>
            <p className="text-xs text-[#7D715E] mb-4">
              Mã <strong>{selectedCouponToReject.displayCode}</strong> sẽ bị từ chối và thông báo cho KOL.
            </p>

            <form onSubmit={handleRejectSubmit}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                  Lý do từ chối (bắt buộc) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ví dụ: Tỷ lệ chiết khấu chưa phù hợp với ngân sách hiện tại..."
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

      {/* ========================================================= */}
      {/* MODAL 4: KHÓA MÃ (BLOCK MODAL) */}
      {/* ========================================================= */}
      {selectedCouponToBlock && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-md rounded-2xl border border-[#EAE4D7] shadow-2xl overflow-hidden p-6 my-auto animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-[#1A1612] mb-1">
              Khóa mã giảm giá
            </h3>
            <p className="text-xs text-[#7D715E] mb-4">
              Mã <strong>{selectedCouponToBlock.displayCode}</strong> sẽ bị khóa ngay lập tức và không thể áp dụng cho các đơn hàng mới.
            </p>

            <form onSubmit={handleBlockSubmit}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">
                  Lý do khóa mã (bắt buộc) <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Ví dụ: Phát hiện dấu hiệu gian lận hoặc dừng đợt khuyến mãi..."
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
      {isCampaignModalOpen && usesLegacyCheckout && (
        <CreateCampaignModal
          onClose={() => setIsCampaignModalOpen(false)}
          onSuccess={(campaign) => {
            if (campaign?.id && campaign.storeId === storeId && campaign.isActive && new Date(campaign.endDate) > new Date()) {
              setStoreCampaigns(previous => [campaign, ...previous.filter(item => item.id !== campaign.id)]);
              setCreateForm(previous => ({ ...previous, scopeType: 'CAMPAIGN', campaignId: campaign.id, productIds: [], startsAt: campaign.startDate, expiresAt: campaign.endDate }));
            }
            toast.success('Đã tạo chiến dịch. Bạn có thể phát hành voucher cho chiến dịch này.');
          }}
        />
      )}
    </div>
  );
};

export default ShopCouponsPage;
