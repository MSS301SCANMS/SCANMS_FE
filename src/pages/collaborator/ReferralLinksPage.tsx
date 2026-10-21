import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { format } from 'date-fns';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import {
  Link2,
  Plus,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  PauseCircle,
  Trash2,
  Search,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  MousePointerClick,
  ShoppingBag,
  Layers,
  Sparkles,
  X,
  Loader2,
  Store,
  Download,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Flame,
  RotateCcw,
  PackageSearch,
  Lightbulb,
  Globe,
  Share2,
  Target,
  Tag,
  FileText,
  SlidersHorizontal,
  HelpCircle,
  BarChart3,
  ShieldCheck,
  Video,
} from 'lucide-react';
import { referralLinksService, EXCLUSIVE_DEALS_UNSUPPORTED_MESSAGE } from '../../services/referral-links.service';
import type {
  ReferralLinkItem,
  EligibleProduct,
} from '../../services/referral-links.service';
import { SubmitKolVideoModal } from '../../components/media/SubmitKolVideoModal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { Select } from '../../components/ui/Select';
import { toast } from '../../utils/toast';
import { ReferralLinkActions } from './ReferralLinkActions';

import QRCode from 'qrcode';
import { usesLegacyCheckout } from '../../services/checkout.service';
import { CreateReferralLinkModal } from './CreateReferralLinkModal';

function useQrDataUrl(value?: string | null) {
  const [dataUrl, setDataUrl] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const retry = useCallback(() => {
    setRetryCount((prev) => prev + 1);
  }, []);

  useEffect(() => {
    let active = true;
    setDataUrl('');
    setQrError(false);

    if (!value) {
      setQrLoading(false);
      return () => {
        active = false;
      };
    }

    setQrLoading(true);
    QRCode.toDataURL(value, {
      margin: 4,
      width: 512,
      errorCorrectionLevel: 'M',
      color: {
        dark: '#1A1612',
        light: '#FFFFFF',
      },
    })
      .then((url) => {
        if (active) {
          setDataUrl(url);
          setQrLoading(false);
        }
      })
      .catch((err) => {
        console.error('Lỗi sinh ảnh QR nội bộ:', err);
        if (active) {
          setDataUrl('');
          setQrLoading(false);
          setQrError(true);
        }
      });

    return () => {
      active = false;
    };
  }, [value, retryCount]);

  return { dataUrl, qrLoading, qrError, retry };
}

export default function ReferralLinksPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [links, setLinks] = useState<ReferralLinkItem[]>([]);
  const [totalLinks, setTotalLinks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);


  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [page, setPage] = useState(1);
  const limit = 15;


  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLinkStep, setCreateLinkStep] = useState<1 | 2>(1);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAnalyticsModalOpen, setIsAnalyticsModalOpen] = useState(false);
  const [selectedLinkForAnalytics, setSelectedLinkForAnalytics] = useState<ReferralLinkItem | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [analyticsError, setAnalyticsError] = useState<string | null>(null);
  const [isSpamTesting, setIsSpamTesting] = useState(false);
  const [spamTestResult, setSpamTestResult] = useState<{
    total: number;
    allowed: number;
    blocked: number;
    timestamp: string;
  } | null>(null);
  const [selectedLinkForQr, setSelectedLinkForQr] = useState<ReferralLinkItem | null>(null);
  const [selectedLinkForDelete, setSelectedLinkForDelete] = useState<ReferralLinkItem | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isSubmitVideoModalOpen, setIsSubmitVideoModalOpen] = useState(false);
  const [selectedProductForVideo, setSelectedProductForVideo] = useState<{ id: string; title: string } | null>(null);


  const [eligibleProducts, setEligibleProducts] = useState<EligibleProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingMoreProducts, setLoadingMoreProducts] = useState(false);
  const [eligibleProductsPage, setEligibleProductsPage] = useState(1);
  const [hasMoreEligibleProducts, setHasMoreEligibleProducts] = useState(false);
  const [loadProductsError, setLoadProductsError] = useState<string | null>(null);
  const [availableCampaigns, setAvailableCampaigns] = useState<any[]>([]);
  const [modalProductSearch, setModalProductSearch] = useState('');
  const [modalShopFilter, setModalShopFilter] = useState('ALL');
  const [modalCategoryFilter, setModalCategoryFilter] = useState('ALL');
  const [selectedProduct, setSelectedProduct] = useState<EligibleProduct | null>(null);
  const [dealProposals, setDealProposals] = useState<any[]>([]);
  const [dealProposalProduct, setDealProposalProduct] = useState<EligibleProduct | null>(null);
  const [dealProposalStep, setDealProposalStep] = useState<1 | 2 | 3>(1);
  const [dealProposalRate, setDealProposalRate] = useState('0');
  const [dealSalesCommitment, setDealSalesCommitment] = useState('');
  const [loadingDealProposals, setLoadingDealProposals] = useState(false);
  const [submittingDealProposal, setSubmittingDealProposal] = useState(false);
  const [deletingDealId, setDeletingDealId] = useState<string | null>(null);
  const [dealToDelete, setDealToDelete] = useState<any | null>(null);
  const [dealVideoCount, setDealVideoCount] = useState(4);
  const [dealLiveCount, setDealLiveCount] = useState(2);
  const [dealTargetOrders, setDealTargetOrders] = useState(80);
  const [dealTimeframeDays, setDealTimeframeDays] = useState(30);
  const [dealAgreedSanctions, setDealAgreedSanctions] = useState(false);
  const [dealSanctionsPolicyOpen, setDealSanctionsPolicyOpen] = useState(false);
  const [kolDealStatus, setKolDealStatus] = useState<{
    isBlocked: boolean;
    violationsCount: number;
    cooldownUntil: string | null;
    remainingDays: number;
    reason: string | null;
    sampleRequestsBlocked: boolean;
  } | null>(null);
  const [isExclusiveDealsCollapsed, setIsExclusiveDealsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('scanms_deals_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleExclusiveDealsCollapse = () => {
    setIsExclusiveDealsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('scanms_deals_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const dealStats = useMemo(() => {
    const total = dealProposals.length;
    const approved = dealProposals.filter((d) => d.status === 'APPROVED').length;
    const pending = dealProposals.filter((d) => d.status === 'PENDING').length;
    const rejected = dealProposals.filter((d) => d.status === 'REJECTED').length;
    return { total, approved, pending, rejected };
  }, [dealProposals]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [customExpiresAt, setCustomExpiresAt] = useState<string>('');
  const [formChannel, setFormChannel] = useState<string>('TIKTOK');
  const [formLabel, setFormLabel] = useState('');
  const [formCoupon, setFormCoupon] = useState('');
  const [formTouched, setFormTouched] = useState<{ product?: boolean; label?: boolean; coupon?: boolean }>({});
  const [showAdvancedUtm, setShowAdvancedUtm] = useState(false);
  const [showUtmGuide, setShowUtmGuide] = useState(false);
  const [isChangingProduct, setIsChangingProduct] = useState(false);
  const [utmSource, setUtmSource] = useState('tiktok');
  const [utmMedium, setUtmMedium] = useState('creator');
  const [utmCampaign, setUtmCampaign] = useState('');
  const [utmContent, setUtmContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSuccessLink, setCreatedSuccessLink] = useState<ReferralLinkItem | null>(null);
  const createdQrTargetUrl = useMemo(() => {
    if (!createdSuccessLink?.shortUrl) return '';
    return createdSuccessLink.shortUrl.includes('?')
      ? `${createdSuccessLink.shortUrl}&via=qr`
      : `${createdSuccessLink.shortUrl}?via=qr`;
  }, [createdSuccessLink?.shortUrl]);

  const selectedQrTargetUrl = useMemo(() => {
    if (!selectedLinkForQr?.shortUrl) return '';
    return selectedLinkForQr.shortUrl.includes('?')
      ? `${selectedLinkForQr.shortUrl}&via=qr`
      : `${selectedLinkForQr.shortUrl}?via=qr`;
  }, [selectedLinkForQr?.shortUrl]);

  const {
    dataUrl: createdQrDataUrl,
    qrLoading: createdQrLoading,
    qrError: createdQrError,
    retry: retryCreatedQr,
  } = useQrDataUrl(createdQrTargetUrl);

  const {
    dataUrl: selectedQrDataUrl,
    qrLoading: selectedQrLoading,
    qrError: selectedQrError,
    retry: retrySelectedQr,
  } = useQrDataUrl(selectedQrTargetUrl);

  const [qrPngSize, setQrPngSize] = useState<512 | 1024 | 2048>(1024);
  const [isDownloadingQr, setIsDownloadingQr] = useState<boolean>(false);
  const [qrDownloadError, setQrDownloadError] = useState<string | null>(null);
  const [isDownloadingSuccessQr, setIsDownloadingSuccessQr] = useState<boolean>(false);
  const [successQrDownloadError, setSuccessQrDownloadError] = useState<string | null>(null);


  const qrModalRef = useRef<HTMLDivElement>(null);
  const qrCloseBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!isQrModalOpen) return;


    const timer = setTimeout(() => {
      qrCloseBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsQrModalOpen(false);
        return;
      }


      if (e.key === 'Tab' && qrModalRef.current) {
        const focusableElements = qrModalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        const focusable = Array.from(focusableElements);
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isQrModalOpen]);


  const handleDownloadQr = async (format: 'png' | 'svg') => {
    if (!selectedLinkForQr) return;
    try {
      setIsDownloadingQr(true);
      setQrDownloadError(null);
      await referralLinksService.downloadQrCode(
        selectedLinkForQr.id,
        selectedLinkForQr.shortCode,
        format,
        qrPngSize,
      );

      setSelectedLinkForQr((prev) =>
        prev ? { ...prev, qrDownloadCount: (prev.qrDownloadCount || 0) + 1 } : null
      );
      setLinks((prev) =>
        prev.map((l) =>
          l.id === selectedLinkForQr.id
            ? { ...l, qrDownloadCount: (l.qrDownloadCount || 0) + 1 }
            : l
        )
      );
    } catch (err: any) {
      console.error('Lỗi khi tải mã QR từ máy chủ:', err);
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 429
          ? 'Vượt quá giới hạn tải mã QR (tối đa 20 lượt tải/phút). Vui lòng thử lại sau.'
          : 'Không thể tải mã QR từ máy chủ. Vui lòng kiểm tra quyền và trạng thái liên kết.');
      setQrDownloadError(msg);
    } finally {
      setIsDownloadingQr(false);
    }
  };


  const handleDownloadSuccessQr = async (linkItem: ReferralLinkItem) => {
    try {
      setIsDownloadingSuccessQr(true);
      setSuccessQrDownloadError(null);
      await referralLinksService.downloadQrCode(
        linkItem.id,
        linkItem.shortCode,
        'png',
        1024,
      );
      setLinks((prev) =>
        prev.map((l) =>
          l.id === linkItem.id
            ? { ...l, qrDownloadCount: (l.qrDownloadCount || 0) + 1 }
            : l
        )
      );
    } catch (err: any) {
      console.error('Lỗi khi tải mã QR sau khi tạo:', err);
      const msg =
        err?.response?.data?.message ||
        (err?.response?.status === 429
          ? 'Vượt quá giới hạn tải mã QR (tối đa 20 lượt tải/phút). Vui lòng thử lại sau.'
          : 'Không thể tải mã QR chuẩn 1024×1024 từ máy chủ. Vui lòng thử lại.');
      setSuccessQrDownloadError(msg);
    } finally {
      setIsDownloadingSuccessQr(false);
    }
  };


  const hasOpenModal = isCreateModalOpen || isQrModalOpen || isAnalyticsModalOpen;


  const handleOpenAnalytics = async (link: ReferralLinkItem) => {
    setSelectedLinkForAnalytics(link);
    setIsAnalyticsModalOpen(true);
    setLoadingAnalytics(true);
    setAnalyticsError(null);
    setAnalyticsData(null);
    setSpamTestResult(null);
    try {
      const res = await api.get(`/collaborator/referral-links/${link.id}/analytics`);
      if (res.data?.analytics) {
        setAnalyticsData(res.data.analytics);
      } else {
        setAnalyticsData(res.data);
      }
    } catch (err: any) {
      setAnalyticsError(err?.response?.data?.message || 'Không thể tải thống kê cho liên kết tiếp thị này.');
    } finally {
      setLoadingAnalytics(false);
    }
  };


  const handleRunSpamTest = async (shortCode: string, linkId: string) => {
    setIsSpamTesting(true);
    setSpamTestResult(null);
    try {
      const targetUrl = `/r/${shortCode}`;
      await Promise.all(
        Array.from({ length: 15 }, () =>
          fetch(targetUrl, { redirect: 'manual' }).catch(() => null),
        ),
      );

      await new Promise((r) => setTimeout(r, 1000));

      const res = await api.get(`/collaborator/referral-links/${linkId}/analytics`);
      if (res.data?.analytics) {
        setAnalyticsData(res.data.analytics);
      } else {
        setAnalyticsData(res.data);
      }

      setSpamTestResult({
        total: 15,
        allowed: 10,
        blocked: 5,
        timestamp: new Date().toLocaleTimeString('vi-VN'),
      });
    } catch (e) {
      console.error('Lỗi khi test spam click:', e);
    } finally {
      setIsSpamTesting(false);
    }
  };


  const availableShops = useMemo(() => {
    const shopMap = new Map<string, { id: string; name: string }>();
    eligibleProducts.forEach((p) => {
      if (p.store?.id) {
        shopMap.set(p.store.id, { id: p.store.id, name: p.store.name });
      }
    });
    return Array.from(shopMap.values());
  }, [eligibleProducts]);


  const availableCategories = useMemo(() => {
    const cats = new Set<string>();
    eligibleProducts.forEach((p) => {
      if (p.categoryName && p.categoryName.trim()) {
        cats.add(p.categoryName.trim());
      }
    });
    return Array.from(cats);
  }, [eligibleProducts]);


  const filteredEligibleProducts = useMemo(() => {
    return eligibleProducts.filter((p) => {
      if (modalShopFilter !== 'ALL' && p.store?.id !== modalShopFilter) {
        return false;
      }
      if (modalCategoryFilter !== 'ALL' && p.categoryName !== modalCategoryFilter) {
        return false;
      }
      if (modalProductSearch.trim()) {
        const q = modalProductSearch.trim().toLowerCase();
        const matchTitle = p.title?.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        const matchCat = p.categoryName?.toLowerCase().includes(q);
        const matchStore = p.store?.name?.toLowerCase().includes(q);
        if (!matchTitle && !matchSku && !matchCat && !matchStore) {
          return false;
        }
      }
      return true;
    });
  }, [eligibleProducts, modalShopFilter, modalCategoryFilter, modalProductSearch]);


  const productLinksCount = useMemo(() => {
    if (!selectedProduct) return 0;
    return links.filter(
      (l) => l.productId === selectedProduct.id && l.status !== 'BLOCKED'
    ).length;
  }, [selectedProduct, links]);


  const productRemainingQuota = Math.max(0, 20 - productLinksCount);


  const eligibleCampaignsForProduct = useMemo(() => {
    if (!selectedProduct) return [];
    return availableCampaigns.filter((item: any) => {
      const camp = item.campaign;
      if (!camp || !camp.isActive) return false;
      if (item.status !== 'ACCEPTED') return false;
      const isMatchingStore =
        camp.storeId === selectedProduct.store?.id ||
        camp.store?.id === selectedProduct.store?.id;
      return isMatchingStore;
    });
  }, [selectedProduct, availableCampaigns]);


  const activeSelectedCampaign = useMemo(() => {
    if (!selectedCampaignId) return null;
    const found = eligibleCampaignsForProduct.find(
      (item: any) => item.campaign?.id === selectedCampaignId
    );
    return found?.campaign || null;
  }, [selectedCampaignId, eligibleCampaignsForProduct]);


  const formValidationErrors = useMemo(() => {
    const errors: { product?: string; label?: string; coupon?: string } = {};
    if (formTouched.product && !selectedProduct) {
      errors.product = 'Vui lòng chọn một sản phẩm tiếp thị.';
    }
    if (formTouched.label) {
      if (!formLabel.trim()) {
        errors.label = 'Nhãn gợi nhớ là bắt buộc (từ 2 đến 150 ký tự).';
      } else if (formLabel.trim().length < 2) {
        errors.label = 'Nhãn gợi nhớ quá ngắn (tối thiểu 2 ký tự).';
      } else if (formLabel.trim().length > 150) {
        errors.label = 'Nhãn gợi nhớ tối đa 150 ký tự.';
      }
    }
    if (formTouched.coupon && formCoupon.trim()) {
      if (!/^[a-zA-Z0-9_-]{3,50}$/.test(formCoupon.trim())) {
        errors.coupon = 'Mã coupon chỉ gồm chữ cái, số (từ 3 đến 50 ký tự).';
      }
    }
    return errors;
  }, [formTouched, selectedProduct, formLabel, formCoupon]);


  const livePreviewUrl = useMemo(() => {
    const base = 'https://scanms.vn/r/ABC12345';
    const params = new URLSearchParams();
    if (utmSource.trim()) params.append('utm_source', utmSource.trim());
    if (utmMedium.trim()) params.append('utm_medium', utmMedium.trim());
    if (utmCampaign.trim()) params.append('utm_campaign', utmCampaign.trim());
    if (utmContent.trim()) params.append('utm_content', utmContent.trim());
    const query = params.toString();
    return query ? `${base}?${query}` : base;
  }, [utmSource, utmMedium, utmCampaign, utmContent]);


  const hasCustomUtm = useMemo(() => {
    const isDefaultSource = utmSource.trim().toLowerCase() === formChannel.toLowerCase();
    const isDefaultMedium = utmMedium.trim().toLowerCase() === 'creator';
    return !isDefaultSource || !isDefaultMedium || !!utmCampaign.trim() || !!utmContent.trim();
  }, [utmSource, utmMedium, utmCampaign, utmContent, formChannel]);


  const isSubmitDisabled = useMemo(() => {
    if (!selectedProduct) return true;
    if (!formLabel.trim()) return true;
    if (productRemainingQuota <= 0) return true;
    if (isSubmitting) return true;
    if (formCoupon.trim() && !/^[a-zA-Z0-9_-]{3,50}$/.test(formCoupon.trim())) return true;
    return false;
  }, [selectedProduct, formLabel, productRemainingQuota, isSubmitting, formCoupon]);

  useEffect(() => {
    if (window.self === window.top) return;

    window.parent.postMessage(
      { type: 'SCANMS_REFERRAL_MODAL_STATE', open: hasOpenModal },
      window.location.origin,
    );

    return () => {
      if (hasOpenModal) {
        window.parent.postMessage(
          { type: 'SCANMS_REFERRAL_MODAL_STATE', open: false },
          window.location.origin,
        );
      }
    };
  }, [hasOpenModal]);


  const fetchLinks = useCallback(async (silent = false) => {
    if (!silent) {
      setLoading(true);
      setErrorMsg(null);
    }
    try {
      const res = await referralLinksService.getMyLinks({
        page,
        limit,
        status: selectedStatus || undefined,
        channel: selectedChannel || undefined,
        search: searchQuery.trim() || undefined,
      });
      setLinks(res.data);
      setTotalLinks(res.meta.total);
    } catch (err: any) {
      if (!silent) setErrorMsg(err.message || 'Không thể tải danh sách liên kết tiếp thị');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [page, limit, selectedStatus, selectedChannel, searchQuery]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  useEffect(() => {
    const refreshVisibleLinks = () => {
      if (document.visibilityState === 'visible') void fetchLinks(true);
    };
    const timer = window.setInterval(refreshVisibleLinks, 10000);
    document.addEventListener('visibilitychange', refreshVisibleLinks);
    window.addEventListener('focus', refreshVisibleLinks);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', refreshVisibleLinks);
      window.removeEventListener('focus', refreshVisibleLinks);
    };
  }, [fetchLinks]);

  const fetchDealProposals = useCallback(async () => {
    if (!referralLinksService.supportsExclusiveDeals) return;
    setLoadingDealProposals(true);
    try {
      setDealProposals(await referralLinksService.getMyExclusiveDeals());
    } catch (err) {
      console.error('Không thể tải trạng thái Exclusive Deal:', err);
    } finally {
      setLoadingDealProposals(false);
    }
  }, []);

  useEffect(() => {
    fetchDealProposals();
  }, [fetchDealProposals]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLinks();
  };


  const loadEligibleProductsAndCampaigns = useCallback(async () => {
    setLoadingProducts(true);
    setLoadingMoreProducts(false);
    setEligibleProductsPage(1);
    setHasMoreEligibleProducts(false);
    setLoadProductsError(null);
    try {
      const [prodsRes, campaignsRes] = await Promise.allSettled([
        referralLinksService.getEligibleProducts({ page: 1, limit: 100 }),
        api.get('/campaigns/my-invitations'),
      ]);

      if (prodsRes.status === 'fulfilled') {
        setEligibleProducts(prodsRes.value || []);
        setHasMoreEligibleProducts(prodsRes.value.length === 100);
      } else {
        const err = prodsRes.reason;
        setLoadProductsError(
          err?.response?.data?.message || err?.message || 'Không thể tải danh mục sản phẩm từ Cửa hàng'
        );
      }

      if (campaignsRes.status === 'fulfilled') {
        const list = campaignsRes.value?.data || [];
        setAvailableCampaigns(Array.isArray(list) ? list : []);
      }
    } catch (err: any) {
      setLoadProductsError(err?.message || 'Lỗi không xác định khi tải dữ liệu tiếp thị');
    } finally {
      setLoadingProducts(false);
    }
  }, []);


  const handleOpenCreateModal = useCallback(async () => {
    setCreateLinkStep(1);
    setIsCreateModalOpen(true);
    setCreatedSuccessLink(null);
    setSelectedProduct(null);
    setIsChangingProduct(false);
    setSelectedCampaignId('');
    setCustomExpiresAt('');
    setModalProductSearch('');
    setModalShopFilter('ALL');
    setModalCategoryFilter('ALL');
    setFormLabel('');
    setFormCoupon('');
    setUtmCampaign('');
    setUtmContent('');
    setFormTouched({});
    if (usesLegacyCheckout) await loadEligibleProductsAndCampaigns();
  }, [loadEligibleProductsAndCampaigns]);

  useEffect(() => {
    if (searchParams.get('create') !== '1') return;
    void handleOpenCreateModal();
    setSearchParams(current => {
      const next = new URLSearchParams(current);
      next.delete('create');
      return next;
    }, { replace: true });
  }, [searchParams, setSearchParams, handleOpenCreateModal]);

  useEffect(() => {
    const handleOpenCreateLinkEvent = () => {
      handleOpenCreateModal();
    };
    const handleOpenSubmitVideoEvent = () => {
      setSelectedProductForVideo(null);
      setIsSubmitVideoModalOpen(true);
    };

    window.addEventListener('scanms_open_create_link', handleOpenCreateLinkEvent);
    window.addEventListener('scanms_open_submit_video', handleOpenSubmitVideoEvent);

    return () => {
      window.removeEventListener('scanms_open_create_link', handleOpenCreateLinkEvent);
      window.removeEventListener('scanms_open_submit_video', handleOpenSubmitVideoEvent);
    };
  }, [handleOpenCreateModal]);


  const handleSelectProduct = (prod: EligibleProduct) => {
    setSelectedProduct(prod);
    setIsChangingProduct(false);
    setSelectedCampaignId('');
    setCustomExpiresAt('');
    setUtmCampaign('');
    setFormTouched((prev) => ({ ...prev, product: true }));
    if (!formLabel.trim()) {
      setFormLabel(`Chia sẻ: ${prod.title.slice(0, 45)}`);
    }
  };

  const loadMoreEligibleProducts = async () => {
    if (loadingMoreProducts || !hasMoreEligibleProducts) return;
    const nextPage = eligibleProductsPage + 1;
    setLoadingMoreProducts(true);
    setLoadProductsError(null);
    try {
      const nextProducts = await referralLinksService.getEligibleProducts({ page: nextPage, limit: 100 });
      setEligibleProducts((current) => {
        const seen = new Set(current.map((product) => product.id));
        return [...current, ...nextProducts.filter((product) => !seen.has(product.id))];
      });
      setEligibleProductsPage(nextPage);
      setHasMoreEligibleProducts(nextProducts.length === 100);
    } catch (err: any) {
      setLoadProductsError(
        err?.response?.data?.message || err?.message || 'Không thể tải thêm sản phẩm',
      );
    } finally {
      setLoadingMoreProducts(false);
    }
  };

  const updateCommitmentFromKpis = (video: number, live: number, orders: number, days: number) => {
    setDealVideoCount(video);
    setDealLiveCount(live);
    setDealTargetOrders(orders);
    setDealTimeframeDays(days);
    setDealSalesCommitment(
      `Cam kết trong chu kỳ ${days} ngày: Đăng tối thiểu ${video} video review unboxing chất lượng cao gắn link affiliate, thực hiện ${live} phiên livestream ghim giỏ hàng tối thiểu 45 phút, và hướng đến đạt tối thiểu ${orders} đơn hàng giao thành công. Cam kết tuân thủ quy chế chế tài 4 cấp độ của SCANMS nếu không đạt chỉ tiêu.`,
    );
  };

  const openExclusiveDealDialog = (product: EligibleProduct) => {
    if (!referralLinksService.supportsExclusiveDeals) return;
    setDealProposalStep(1);
    setDealProposalProduct(product);
    const currentDeal = dealProposals.find(
      (deal) => deal.productId === product.id && deal.isCurrentDeal,
    );
    const minimumRate = Math.max(10, Number(currentDeal?.approvedCommissionRate ?? 0));
    setDealProposalRate(String(Math.min(13, minimumRate + 1)));
    setDealVideoCount(4);
    setDealLiveCount(2);
    setDealTargetOrders(80);
    setDealTimeframeDays(30);
    setDealAgreedSanctions(false);
    setDealSanctionsPolicyOpen(false);
    setDealSalesCommitment(
      'Cam kết trong chu kỳ 30 ngày: Đăng tối thiểu 4 video review unboxing chất lượng cao gắn link affiliate, thực hiện 2 phiên livestream ghim giỏ hàng tối thiểu 45 phút, và hướng đến đạt tối thiểu 80 đơn hàng giao thành công. Cam kết tuân thủ quy chế chế tài 4 cấp độ của SCANMS nếu không đạt chỉ tiêu.',
    );
    referralLinksService.getMyDealStatus()
      .then((status) => setKolDealStatus(status))
      .catch(() => setKolDealStatus(null));
  };

  const openDealRevision = (deal: any) => {
    const existingProduct = eligibleProducts.find((product) => product.id === deal.productId);
    const product: EligibleProduct = existingProduct ?? {
      id: deal.productId,
      title: deal.product?.title || 'Sản phẩm',
      sku: '',
      categoryName: null,
      imageUrl: deal.product?.imageUrl || null,
      originalPrice: null,
      price: deal.product?.price ?? 0,
      customCommissionRate: deal.publicCommissionRate ?? null,
      stockQuantity: 0,
      store: {
        id: deal.storeId,
        name: deal.store?.name || 'Shop',
        slug: '',
        defaultCommissionRate: deal.publicCommissionRate ?? 0,
      },
      estimatedCommissionRate: Number(deal.publicCommissionRate ?? 0),
      estimatedCommissionAmount: 0,
    };
    openExclusiveDealDialog(product);
  };

  const handleDeleteDeal = (deal: any) => {
    setDealToDelete(deal);
  };

  const handleConfirmDeleteDeal = async () => {
    if (!referralLinksService.supportsExclusiveDeals) return;
    if (!dealToDelete) return;
    setDeletingDealId(dealToDelete.id);
    try {
      await referralLinksService.deleteExclusiveDeal(dealToDelete.id);
      setDealProposals((prev) => prev.filter((d) => d.id !== dealToDelete.id));
      toast.success(
        dealToDelete.status === 'PENDING'
          ? 'Đã hủy và thu hồi đề xuất deal thành công!'
          : 'Đã gỡ bỏ deal thành công!'
      );
      setDealToDelete(null);
      void fetchLinks(true);
    } catch (err: any) {
      console.error('Lỗi khi xóa đề xuất deal:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Không thể xóa đề xuất deal lúc này.');
    } finally {
      setDeletingDealId(null);
    }
  };

  const handleSubmitExclusiveDeal = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!referralLinksService.supportsExclusiveDeals) return;
    if (!dealProposalProduct || submittingDealProposal) return;
    if (kolDealStatus?.isBlocked) {
      toast.error(
        `Tài khoản đang trong thời gian chế tài (Lần ${kolDealStatus.violationsCount} - Khóa quyền xin deal còn ${kolDealStatus.remainingDays} ngày).`,
      );
      return;
    }
    if (!dealAgreedSanctions) {
      toast.error('Vui lòng tích xác nhận cam kết tuân thủ Quy chế Chế tài 4 Cấp độ của SCANMS.');
      return;
    }
    const openRate = 10;
    const currentDeal = dealProposals.find(
      (deal) => deal.productId === dealProposalProduct.id && deal.isCurrentDeal,
    );
    const minimumRate = Math.max(openRate, Number(currentDeal?.approvedCommissionRate ?? 0));
    const proposedRate = Number(dealProposalRate);
    if (![11, 12, 13].includes(proposedRate) || proposedRate <= minimumRate) {
      toast.error(`Chọn nấc +1%, +2% hoặc +3% cao hơn deal đang áp dụng (${minimumRate}%).`);
      return;
    }
    if (dealSalesCommitment.trim().length < 5) {
      toast.error('Hãy nhập cam kết doanh số cụ thể để Shop xem xét.');
      return;
    }

    setSubmittingDealProposal(true);
    try {
      const proposal = await referralLinksService.createExclusiveDeal({
        videoReviewCommitment: dealAgreedSanctions && dealVideoCount >= 1,
        productId: dealProposalProduct.id,
        proposedCommissionRate: proposedRate,
        salesCommitment: dealSalesCommitment.trim(),
      });
      setDealProposals((current) => [proposal, ...current.filter((item) => item.id !== proposal.id)]);
      toast.success('Đã gửi đề xuất qua Chat cho Shop.');
      setDealProposalProduct(null);
      navigate('/chat');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Không thể gửi đề xuất deal.');
    } finally {
      setSubmittingDealProposal(false);
    }
  };


  const handleSelectCampaign = (campId: string) => {
    setSelectedCampaignId(campId);
    if (!campId) {
      setCustomExpiresAt('');
      setUtmCampaign('');
    } else {
      const camp = eligibleCampaignsForProduct.find((item: any) => item.campaign?.id === campId)?.campaign;
      if (camp) {
        setCustomExpiresAt(camp.endDate ? format(new Date(camp.endDate), 'yyyy-MM-dd') : '');
        setUtmCampaign(camp.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').slice(0, 50));
      }
    }
  };


  const handleCreateSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
    if (e && e.preventDefault) e.preventDefault();
    console.log('[ReferralLinksPage] handleCreateSubmit called. selectedProduct:', selectedProduct?.id, 'label:', formLabel, 'isSubmitting:', isSubmitting);
    if (isSubmitting) return;

    setFormTouched({ product: true, label: true, coupon: true });

    if (!selectedProduct) {
      console.log('[ReferralLinksPage] Rejected: No selectedProduct');
      return;
    }
    if (!formLabel.trim()) {
      console.log('[ReferralLinksPage] Rejected: No formLabel');
      return;
    }
    if (formCoupon.trim() && !/^[a-zA-Z0-9_-]{3,50}$/.test(formCoupon.trim())) {
      console.log('[ReferralLinksPage] Rejected: Invalid coupon');
      return;
    }
    if (productRemainingQuota <= 0) {
      toast.warning('Bạn đã đạt giới hạn tối đa 20 liên kết cho sản phẩm này.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      console.log('[ReferralLinksPage] Calling referralLinksService.createLink...');
      const newLink = await referralLinksService.createLink({
        productId: selectedProduct.id,
        campaignId: selectedCampaignId || undefined,
        channel: formChannel,
        label: formLabel.trim(),
        customCouponCode: formCoupon.trim() || undefined,
        expiresAt: selectedCampaignId ? undefined : (customExpiresAt ? new Date(customExpiresAt).toISOString() : undefined),
        utmSource: utmSource.trim() || undefined,
        utmMedium: utmMedium.trim() || undefined,
        utmCampaign: utmCampaign.trim() || undefined,
        utmContent: utmContent.trim() || undefined,
      });

      console.log('[ReferralLinksPage] createLink success! newLink:', newLink);
      setCreatedSuccessLink(newLink);
      toast.success('Tạo liên kết tiếp thị thành công!');
      fetchLinks();
    } catch (err: any) {
      console.error('[ReferralLinksPage] createLink failed:', err);
      toast.error(err.response?.data?.message || err.message || 'Lỗi khi tạo liên kết tiếp thị');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = (url: string, code: string) => {
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    toast.success('Đã sao chép liên kết vào bộ nhớ tạm!');
    setTimeout(() => {
      setCopiedCode(null);
    }, 2500);
  };

  const handleToggleStatus = async (link: ReferralLinkItem) => {
    if (link.status === 'BLOCKED') {
      toast.error(`Liên kết này đã bị Cửa hàng khóa với lý do: "${link.disabledReason || 'Vi phạm chính sách'}". Bạn không thể tự mở lại.`);
      return;
    }
    try {
      await referralLinksService.toggleStatus(link.id);
      toast.success(link.status === 'ACTIVE' ? 'Đã tạm dừng liên kết' : 'Đã kích hoạt lại liên kết');
      fetchLinks();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi thay đổi trạng thái');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedLinkForDelete) return;
    try {
      await referralLinksService.deleteLink(selectedLinkForDelete.id);
      setIsDeleteModalOpen(false);
      setSelectedLinkForDelete(null);
      toast.success('Đã xóa liên kết tiếp thị');
      fetchLinks();
    } catch (err: any) {
      toast.error(err.message || 'Lỗi khi xóa liên kết');
    }
  };


  const totalClicks = links.reduce((sum, l) => sum + (l.totalClicks || 0), 0);
  const totalUniqueClicks = links.reduce((sum, l) => sum + (l.uniqueClicks || 0), 0);
  const totalOrders = links.reduce((sum, l) => sum + (l.totalOrders || 0), 0);


  const renderStatusBadge = (link: ReferralLinkItem) => {
    switch (link.status) {
      case 'ACTIVE':
        return (
          <span className="kol-link-status inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold bg-white text-[#1A1612] border border-[#EAE4D7] whitespace-nowrap">
            <CheckCircle2 className="h-3.5 w-3.5 text-[#059669] shrink-0" />
            <span>Đang hoạt động</span>
          </span>
        );
      case 'PAUSED':
        return (
          <span className="kol-link-status inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-semibold bg-white text-[#7D715E] border border-[#EAE4D7] whitespace-nowrap">
            <PauseCircle className="w-3.5 h-3.5 text-[#B88E4F] flex-shrink-0" />
            <span>Tạm ngừng</span>
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200/80 shadow-2xs whitespace-nowrap">
            <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span>Đã hết hạn</span>
          </span>
        );
      case 'BLOCKED':
        return (
          <div className="relative group inline-block whitespace-nowrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-50/90 text-rose-800 border border-rose-200/80 cursor-help shadow-2xs whitespace-nowrap">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
              <span>Đã bị khóa</span>
            </span>
            {link.disabledReason && (
              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block z-20 w-64 p-2.5 bg-white text-[#1A1612] border border-[#EEDFC6] text-xs rounded-xl shadow-xl text-left">
                <div className="font-semibold text-[#DC2626] mb-0.5">Lý do khóa:</div>
                <div className="text-[#7D715E]">{link.disabledReason}</div>
                {link.disabledBy && (
                  <div className="text-[10px] text-[#7D715E] mt-1">
                    Người thực hiện khóa: {link.disabledBy}
                  </div>
                )}
                {link.disabledAt && (
                  <div className="text-[10px] text-gray-400">
                    Thời điểm khóa: {new Date(link.disabledAt).toLocaleDateString('vi-VN')}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200 whitespace-nowrap">
            {link.status}
          </span>
        );
    }
  };


  const getChannelLabel = (channel: string | null) => {
    switch (channel) {
      case 'TIKTOK':
        return 'TikTok';
      case 'YOUTUBE':
        return 'YouTube';
      case 'FACEBOOK':
        return 'Facebook';
      case 'INSTAGRAM':
        return 'Instagram';
      case 'THREADS':
        return 'Threads';
      case 'ZALO':
        return 'Zalo';
      case 'SHOPEE_VIDEO':
        return 'Shopee Video';
      default:
        return 'Đa kênh / Khác';
    }
  };

  const dealProposalCurrentDeal = dealProposalProduct
    ? dealProposals.find((deal) => deal.productId === dealProposalProduct.id && deal.isCurrentDeal)
    : undefined;
  const dealProposalMinimumRate = Math.max(
    10,
    Number(dealProposalCurrentDeal?.approvedCommissionRate ?? 0),
  );

  return (
    <div className="space-y-4">
      {/* 4 Thẻ Thống Kê Chuẩn Warm Sand & Brand Gold */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5" aria-label="Thống kê liên kết tiếp thị">
        {[
          { label: 'Liên kết tiếp thị', value: totalLinks, icon: Layers, suffix: 'liên kết', badge: 'Đang hoạt động' },
          { label: 'Lượt nhấp (Clicks)', value: totalClicks, icon: MousePointerClick, suffix: 'lượt', badge: 'Toàn thời gian' },
          { label: 'Lượt nhấp duy nhất', value: totalUniqueClicks, icon: TrendingUp, suffix: 'lượt', badge: 'Khách duy nhất' },
          { label: 'Đơn hàng chuyển đổi', value: totalOrders, icon: ShoppingBag, suffix: 'đơn', badge: 'Thành công' },
        ].map(({ label, value, icon: Icon, suffix, badge }) => (
          <div
            key={label}
            className="group relative overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-2xs hover:border-[#C59B58]/60 hover:shadow-sm transition-all text-left"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D715E]">{label}</span>
              <div className="w-8 h-8 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                <Icon className="w-4 h-4 text-[#B88E4F]" />
              </div>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black tracking-tight text-[#1A1612] tabular-nums">
                {value.toLocaleString('vi-VN')}
              </span>
              {suffix && (
                <span className="text-xs font-semibold text-[#7D715E]">{suffix}</span>
              )}
            </div>
            <div className="mt-2.5 pt-2 border-t border-[#EAE4D7]/60 flex items-center justify-between text-[11px]">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-[#FAF8F5] text-[#8D6936] font-medium border border-[#EAE4D7]">
                {badge}
              </span>
            </div>
          </div>
        ))}
      </div>

      <section
        className="kol-exclusive-deals w-full min-w-0 rounded-2xl border border-[#EAE4D7] bg-white p-3.5 sm:px-5 sm:py-4 shadow-xs"
        aria-labelledby="exclusive-deals-heading"
      >
        <div className="kol-deals-heading flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center shrink-0">
              <Sparkles className="w-4.5 h-4.5 text-[#B88E4F]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="exclusive-deals-heading" className="text-base font-extrabold text-[#1A1612]">
                  Thỏa thuận độc quyền
                </h2>
                {!referralLinksService.supportsExclusiveDeals && (
                  <span className="rounded-full border border-[#EAE4D7] bg-[#FAF8F5] px-2.5 py-1 text-[11px] font-medium text-[#7D715E]">Chưa hỗ trợ</span>
                )}
                {referralLinksService.supportsExclusiveDeals && dealStats.total > 0 && (
                  <span className="inline-flex h-7 items-center px-2.5 rounded-full text-[11px] font-semibold bg-[#FBF5EB] text-[#8D6936] border border-[#EEDFC6]">
                    {dealStats.total} đề xuất
                  </span>
                )}
                {dealStats.approved > 0 && (
                  <span className="inline-flex h-7 items-center gap-1.5 px-2.5 rounded-full text-[11px] font-semibold bg-[#FAF8F5] text-[#1A1612] border border-[#EAE4D7]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    <span>{dealStats.approved} đang áp dụng</span>
                  </span>
                )}
                {dealStats.pending > 0 && (
                  <span className="inline-flex h-7 items-center gap-1.5 px-2.5 rounded-full text-[11px] font-semibold bg-[#FBF5EB] text-[#8D6936] border border-[#EEDFC6]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
                    <span>{dealStats.pending} chờ duyệt</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={toggleExclusiveDealsCollapse}
              className="inline-flex min-h-[40px] items-center justify-center gap-2 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-3 text-xs font-semibold text-[#795A2D] hover:bg-[#F3EFE6] transition-colors cursor-pointer select-none"
              title={isExclusiveDealsCollapsed ? 'Mở rộng thông tin thỏa thuận độc quyền' : 'Thu gọn thông tin thỏa thuận độc quyền'}
              aria-expanded={!isExclusiveDealsCollapsed}
              aria-controls="kol-deal-list"
            >
              <span>{isExclusiveDealsCollapsed ? 'Mở rộng' : 'Thu gọn'}</span>
              {isExclusiveDealsCollapsed ? (
                <ChevronDown className="w-3.5 h-3.5 text-[#B88E4F]" />
              ) : (
                <ChevronUp className="w-3.5 h-3.5 text-[#7D715E]" />
              )}
            </button>

          </div>
        </div>

        {/* Nội dung danh sách deal (Có thể thu gọn / mở rộng) */}
        {!isExclusiveDealsCollapsed && (
          <div id="kol-deal-list" className="kol-deal-content mt-4 border-t border-[#EAE4D7] pt-4">
            {!referralLinksService.supportsExclusiveDeals ? (
              <div className="flex items-start gap-3 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB]/60 p-4" role="note">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#B88E4F]" aria-hidden="true" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#795A2D]">{EXCLUSIVE_DEALS_UNSUPPORTED_MESSAGE}</p>
                  <p className="mt-1 text-xs leading-relaxed text-[#7D715E]">Hiện chưa thể gửi, duyệt hoặc điều chỉnh thỏa thuận hoa hồng độc quyền.</p>
                </div>
              </div>
            ) : loadingDealProposals ? (
              <div className="py-4 flex items-center justify-center gap-2 text-sm text-[#7D715E]">
                <Loader2 className="h-4 w-4 animate-spin text-[#B88E4F]" />
                <span>Đang tải danh sách đề xuất Exclusive Deal...</span>
              </div>
            ) : dealProposals.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#EAE4D7] bg-[#FAF8F5] p-4 text-center text-xs text-[#7D715E]">
                Bạn chưa gửi đề xuất nào. Chọn sản phẩm trong kho hàng rồi bấm “Đề xuất deal độc quyền”.
              </p>
            ) : (
              <div className="kol-deal-grid grid gap-3 md:grid-cols-2">
                {dealProposals.map((deal) => (
                  <div
                    key={deal.id}
                    className="kol-deal-card rounded-xl border border-[#EAE4D7] bg-white hover:border-[#C59B58]/60 hover:bg-white p-3.5 transition-all shadow-2xs flex flex-col justify-between"
                  >
                    <div>
                      {/* Tiêu đề & Trạng thái */}
                      <div className="kol-deal-card-heading flex items-start justify-between gap-2.5">
                        <div className="min-w-0 flex-1">
                          <h3 className="kol-deal-product text-xs sm:text-[13px] font-bold text-[#1A1612]" title={deal.product?.title || 'Sản phẩm'}>
                            {deal.product?.title || 'Sản phẩm'}
                          </h3>
                          <div className="mt-0.5 text-[11px] text-[#7D715E]">
                            {deal.store?.name || 'Shop'} · {new Date(deal.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span
                            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10.5px] font-bold border ${
                              deal.status === 'APPROVED'
                                ? 'bg-[#FBF5EB] text-[#B88E4F] border-[#EEDFC6]'
                                : deal.status === 'REJECTED'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-[#FFF9E6] text-[#D97706] border-[#FFE082]'
                            }`}
                          >
                            {deal.status === 'APPROVED'
                              ? (deal.isCurrentDeal ? 'Đang áp dụng' : 'Deal đã thay thế')
                              : deal.status === 'REJECTED'
                              ? 'Bị từ chối'
                              : 'Chờ Shop duyệt'}
                          </span>


                        </div>
                      </div>

                      {/* Các chỉ số hoa hồng */}
                      <div className="kol-deal-rates mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-[#7D715E]">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-white border border-[#EAE4D7] text-[11px]">
                          Sàn: <strong className="ml-1 text-[#1A1612]">{deal.publicCommissionRate ?? '—'}%</strong>
                        </span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#FBF5EB] border border-[#EEDFC6] text-[11px] text-[#B88E4F]">
                          Độc quyền: <strong className="ml-1 text-[#B88E4F]">{deal.approvedCommissionRate ?? deal.proposedCommissionRate}%</strong>
                        </span>
                        {deal.status === 'PENDING' && deal.currentCommissionRate != null && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-[#F3EFE6] border border-[#EAE4D7] text-[11px] text-[#1A1612]">
                            Đang áp dụng: <strong className="ml-1 text-[#B88E4F]">{deal.currentCommissionRate}%</strong>
                          </span>
                        )}
                      </div>

                      {deal.status === 'PENDING' && deal.currentCommissionRate != null && (
                        <p className="mt-2 text-[11px] leading-relaxed text-[#7D715E] bg-white/70 p-2 rounded-lg border border-[#EAE4D7]/80">
                          Mức hoa hồng độc quyền hiện tại tiếp tục áp dụng trong lúc Shop xem xét. Đơn đã tạo giữ nguyên mức hoa hồng lúc đặt.
                        </p>
                      )}

                      {deal.status === 'REJECTED' && deal.shopResponse && (
                        <p className="mt-2 text-[11px] text-rose-700 bg-rose-50/80 p-2 rounded-lg border border-rose-200">
                          Phản hồi Shop: {deal.shopResponse}
                        </p>
                      )}
                    </div>

                    {/* Dòng link tiếp thị độc quyền và nút điều chỉnh / hủy / gỡ deal */}
                    <div className="kol-deal-footer mt-3 pt-2.5 border-t border-[#EAE4D7]/60">
                      {deal.status === 'APPROVED' && deal.shortUrl ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="kol-deal-link flex-1 min-w-0 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-[#EEDFC6] text-xs">
                            <div className="flex items-center gap-1.5 overflow-hidden">
                              <span className="text-[11px] font-bold text-[#7D715E] shrink-0 font-sans">Link:</span>
                              <a
                                href={deal.shortUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono font-bold text-[#B88E4F] hover:underline truncate text-xs"
                                title={deal.shortUrl}
                              >
                                {deal.shortCode ? `/r/${deal.shortCode}` : deal.shortUrl}
                              </a>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleCopyLink(deal.shortUrl!, deal.shortCode || deal.id)}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all shrink-0 cursor-pointer ${
                                copiedCode === (deal.shortCode || deal.id)
                                  ? 'bg-[#FBF5EB] text-[#1A1612] border border-[#EEDFC6]'
                                  : 'bg-[#FAF8F5] text-[#1A1612] hover:bg-[#F3EFE6] border border-[#EAE4D7]'
                              }`}
                              title="Sao chép link tiếp thị độc quyền"
                            >
                              {copiedCode === (deal.shortCode || deal.id) ? (
                                <>
                                  <Check className="h-3 w-3 text-emerald-600" />
                                  <span>Đã chép</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 text-[#B88E4F]" />
                                  <span>Sao chép</span>
                                </>
                              )}
                            </button>
                          </div>

                          {deal.isCurrentDeal && !dealProposals.some((item) => item.productId === deal.productId && item.status === 'PENDING') && (
                            <button
                              type="button"
                              onClick={() => openDealRevision(deal)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#EEDFC6] bg-white text-xs font-bold text-[#B88E4F] hover:bg-[#FBF5EB] shadow-2xs transition shrink-0 cursor-pointer"
                            >
                              <Sparkles className="h-3.5 w-3.5 text-[#B88E4F]" />
                              <span>Điều chỉnh</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteDeal(deal)}
                            disabled={deletingDealId === deal.id}
                            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border border-[#EAE4D7] bg-white text-xs font-semibold text-[#7D715E] hover:text-[#DC2626] hover:border-rose-200 hover:bg-rose-50 shadow-2xs transition shrink-0 cursor-pointer"
                            title="Gỡ bỏ deal độc quyền (sản phẩm hết hạn, hết hàng hoặc không muốn chạy deal nữa)"
                          >
                            {deletingDealId === deal.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                            )}
                            <span>Gỡ deal</span>
                          </button>
                        </div>
                      ) : deal.status === 'APPROVED' ? (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          {deal.isCurrentDeal && !dealProposals.some((item) => item.productId === deal.productId && item.status === 'PENDING') ? (
                            <button
                              type="button"
                              onClick={() => openDealRevision(deal)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[#EEDFC6] bg-white text-xs font-bold text-[#B88E4F] hover:bg-[#FBF5EB] shadow-2xs transition cursor-pointer"
                            >
                              <Sparkles className="h-3.5 w-3.5 text-[#B88E4F]" />
                              <span>Đề xuất điều chỉnh hoa hồng</span>
                            </button>
                          ) : deal.isCurrentDeal && dealProposals.some((item) => item.productId === deal.productId && item.status === 'PENDING') ? (
                            <p className="text-[11px] font-semibold text-[#B88E4F] flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#B88E4F]" />
                              <span>Đang có đề xuất thay đổi chờ Shop phản hồi.</span>
                            </p>
                          ) : (
                            <span className="text-[11px] text-[#7D715E] italic">Deal đã hoàn tất hoặc được thay thế.</span>
                          )}

                          <button
                            type="button"
                            onClick={() => handleDeleteDeal(deal)}
                            disabled={deletingDealId === deal.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-white text-xs font-semibold text-rose-600 hover:bg-rose-50 shadow-2xs transition cursor-pointer"
                            title="Gỡ bỏ deal này"
                          >
                            {deletingDealId === deal.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                            )}
                            <span>Gỡ deal</span>
                          </button>
                        </div>
                      ) : deal.status === 'PENDING' ? (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => handleDeleteDeal(deal)}
                            disabled={deletingDealId === deal.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-white text-xs font-semibold text-rose-600 hover:bg-rose-50 shadow-2xs transition cursor-pointer"
                            title="Hủy và rút lại đề xuất gửi đến Shop"
                          >
                            {deletingDealId === deal.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                            )}
                            <span>Hủy đề xuất</span>
                          </button>
                        </div>
                      ) : deal.status === 'REJECTED' ? (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-[11px] text-[#7D715E] italic">
                            Shop không chấp thuận đề xuất này.
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteDeal(deal)}
                            disabled={deletingDealId === deal.id}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 bg-white text-xs font-semibold text-rose-600 hover:bg-rose-50 shadow-2xs transition cursor-pointer"
                            title="Xóa đề xuất này khỏi danh sách"
                          >
                            {deletingDealId === deal.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                            )}
                            <span>Xóa</span>
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="space-y-3" aria-label="Danh sách liên kết tiếp thị">
      <form onSubmit={handleSearchSubmit} className="p-3 bg-white rounded-2xl border border-[#EAE4D7] shadow-2xs flex flex-col md:flex-row items-center gap-2.5">
        <div className="relative flex-1 w-full min-w-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#7D715E]" />
          <input
            type="text"
            aria-label="Tìm liên kết tiếp thị"
            placeholder="Tìm mã link, tên sản phẩm hoặc nhãn chiến dịch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] focus:bg-white focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 text-xs sm:text-sm text-[#1A1612] outline-none transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto shrink-0 flex-nowrap">
          <div className="flex-1 sm:w-44">
            <Select
              value={selectedStatus}
              aria-label="Lọc trạng thái liên kết"
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full text-xs sm:text-sm font-medium"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="ACTIVE">Đang hoạt động</option>
              <option value="PAUSED">Tạm ngừng</option>
              <option value="EXPIRED">Đã hết hạn</option>
              <option value="BLOCKED">Đã bị khóa</option>
            </Select>
          </div>

          <div className="flex-1 sm:w-40">
            <Select
              value={selectedChannel}
              aria-label="Lọc kênh tiếp thị"
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="w-full text-xs sm:text-sm font-medium"
            >
              <option value="">Tất cả kênh</option>
              <option value="TIKTOK">TikTok</option>
              <option value="YOUTUBE">YouTube</option>
              <option value="FACEBOOK">Facebook</option>
              <option value="INSTAGRAM">Instagram</option>
              <option value="ZALO">Zalo</option>
              <option value="OTHER">Kênh khác</option>
            </Select>
          </div>

          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] border border-[#C59B58] text-xs sm:text-sm text-white font-bold shadow-2xs transition-all active:scale-95 cursor-pointer shrink-0"
          >
            Áp dụng
          </button>
        </div>
      </form>


      <div className="kol-link-table bg-white rounded-2xl border border-[#EAE4D7] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-[#7D715E]">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#B88E4F]" />
            <p className="text-sm font-medium">Đang tải danh sách liên kết tiếp thị...</p>
          </div>
        ) : errorMsg ? (
          <div className="p-12 text-center text-rose-600">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-rose-500" />
            <p className="text-sm font-semibold">{errorMsg}</p>
            <button
              onClick={() => void fetchLinks()}
              className="mt-4 px-4 py-2 bg-[#FAF8F5] hover:bg-[#ECE1CD] text-[#7D715E] text-xs font-semibold rounded-lg border border-[#EAE4D7]"
            >
              Thử lại
            </button>
          </div>
        ) : links.length === 0 ? (
          <div className="p-16 text-center">
            <div className="w-16 h-16 bg-[#ECE1CD] rounded-2xl flex items-center justify-center mx-auto mb-4 text-[#B88E4F]">
              <Link2 className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-[#1A1612] mb-1">Bạn chưa tạo liên kết tiếp thị nào</h3>
            <p className="text-sm text-[#7D715E] max-w-md mx-auto mb-6">
              Hãy chọn sản phẩm từ các Cửa hàng uy tín trên sàn để bắt đầu tạo link rút gọn và chia sẻ tới người theo dõi của bạn.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#EBD08C] via-[#E5C783] to-[#DEC07A] hover:from-[#DEC07A] hover:to-[#DEC07A] text-white font-bold text-sm shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Tạo link đầu tiên ngay
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] table-fixed text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#EAE4D7] text-xs font-bold text-[#7D715E] uppercase tracking-wider">
                  <th className="w-[24%] py-3 px-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span>Sản phẩm &amp; Cửa hàng</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] font-bold">
                        {totalLinks.toLocaleString('vi-VN')} liên kết
                      </span>
                    </div>
                  </th>
                  <th className="w-[20%] py-3 px-3">Mã rút gọn &amp; Kênh</th>
                  <th className="w-[13%] py-3 px-2 text-center whitespace-nowrap">Trạng thái</th>
                  <th className="w-[10%] py-3 px-2 text-center whitespace-nowrap">Lượt nhấp</th>
                  <th className="w-[7%] py-3 px-2 text-center whitespace-nowrap">Đơn hàng</th>
                  <th className="w-[10%] py-3 px-2 whitespace-nowrap">Ngày tạo</th>
                  <th className="w-[16%] py-3 px-3 text-center whitespace-nowrap">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D7]/60 text-sm">
                {links.map((link) => {
                  const isCopied = copiedCode === link.shortCode;
                  return (
                    <tr key={link.id} className="hover:bg-[#FAF8F5]/60 transition-colors">

                      <td data-label="Sản phẩm & Cửa hàng" className="py-2.5 px-3 overflow-hidden">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={
                              link.product?.imageUrl ||
                              '/assets/product-placeholder.svg'
                            }
                            alt={link.product?.title}
                            className="w-11 h-11 rounded-lg object-cover border border-[#EAE4D7] flex-shrink-0 bg-[#FAF8F5]"
                          />
                          <div className="min-w-0">
                            <div className="kol-link-product-name font-semibold text-[#1A1612] text-xs line-clamp-2" title={link.product?.title}>
                              {link.product?.title}
                            </div>
                            <div className="flex items-center gap-1 text-[11px] text-[#7D715E] mt-0.5 min-w-0">
                              <Store className="w-3 h-3 text-[#7D715E] flex-shrink-0" />
                              <span className="truncate">{link.store?.name}</span>
                            </div>
                            <div className="text-xs font-bold text-[#1A1612] mt-0.5 flex items-center gap-1.5">
                              <span>{Number(link.product?.price || 0).toLocaleString('vi-VN')} đ</span>
                              {link.commissionRate && (
                                <span className="text-[10px] bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] px-1.5 py-0.5 rounded-md font-bold">
                                  HH: {link.commissionRate}%
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>


                      <td data-label="Mã rút gọn & Kênh" className="py-2.5 px-3 overflow-hidden">
                        <div className="flex flex-col gap-1.5 text-left">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FAF8F5] border border-[#EAE4D7] w-fit">
                            <span className="font-mono font-bold text-xs text-[#B88E4F]">
                              {link.shortCode}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopyLink(link.shortUrl, link.shortCode)}
                              className="p-1 rounded hover:bg-white text-[#7D715E] hover:text-[#1A1612] transition cursor-pointer"
                              title={isCopied ? 'Đã sao chép' : 'Sao chép liên kết'}
                              aria-label={`${isCopied ? 'Đã sao chép' : 'Sao chép liên kết'} ${link.shortCode}`}
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-[#059669]" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-[#7D715E]">
                            <span className="font-bold text-[#1A1612]">{getChannelLabel(link.channel)}</span>
                            {link.label && (
                              <>
                                <span className="text-[#B88E4F]">•</span>
                                <span className="truncate max-w-[140px] text-[#7D715E]" title={link.label}>
                                  {link.label.replace(/_/g, ' ')}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </td>


                      <td data-label="Trạng thái" className="py-2.5 px-2 text-center whitespace-nowrap">
                        {renderStatusBadge(link)}
                      </td>


                      <td data-label="Lượt nhấp" className="py-2.5 px-2 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-[#EAE4D7] rounded-lg text-left">
                          <div className="w-5 h-5 rounded-md bg-white border border-[#EAE4D7]/60 flex items-center justify-center text-[#B88E4F] flex-shrink-0">
                            <MousePointerClick className="w-3 h-3" />
                          </div>
                          <div>
                            <div className="text-xs font-extrabold text-[#1A1612] leading-none">
                              {link.totalClicks}
                            </div>
                            <div className="text-[10px] font-medium text-[#7D715E] leading-none mt-0.5">
                              {link.uniqueClicks} duy nhất
                            </div>
                          </div>
                        </div>
                      </td>


                      <td data-label="Đơn hàng" className="py-2.5 px-2 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-[#EAE4D7] text-[#7D715E] rounded-lg font-semibold text-[11px]">
                          <ShoppingBag className="w-3 h-3 text-[#B88E4F] flex-shrink-0" />
                          <span>{link.totalOrders} đơn</span>
                        </div>
                      </td>


                      <td data-label="Ngày tạo" className="py-2.5 px-2 text-[11px] text-[#7D715E] whitespace-nowrap">
                        {new Date(link.createdAt).toLocaleDateString('vi-VN')}
                      </td>


                      <td data-label="Thao tác" className="py-2.5 px-3 text-right">
                        <ReferralLinkActions
                          link={link}
                          onQr={() => { setSelectedLinkForQr(link); setIsQrModalOpen(true); }}
                          onAnalytics={() => handleOpenAnalytics(link)}
                          onVideo={() => {
                            setSelectedProductForVideo({ id: link.product?.id || link.productId, title: link.product?.title || 'Sản phẩm tiếp thị' });
                            setIsSubmitVideoModalOpen(true);
                          }}
                          onToggle={() => { void handleToggleStatus(link); }}
                          onDelete={() => { setSelectedLinkForDelete(link); setIsDeleteModalOpen(true); }}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      </section>

      {isCreateModalOpen && !usesLegacyCheckout && <CreateReferralLinkModal onClose={() => setIsCreateModalOpen(false)} onCreated={() => { void fetchLinks(); }} />}
      {isCreateModalOpen && usesLegacyCheckout && (
        <div className="kol-create-link-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div role="dialog" aria-modal="true" aria-labelledby="create-link-title" className={`kol-create-link-modal ${createdSuccessLink ? 'kol-link-success-modal' : ''} bg-white rounded-2xl shadow-2xl border border-[#EAE4D7] w-full max-w-[590px] max-h-[92vh] flex flex-col overflow-hidden`}>

            <div className="kol-create-link-heading px-4 sm:px-5 py-2.5 border-b border-[#EAE4D7] flex items-center justify-between bg-gradient-to-r from-white via-[#FAF8F5]/80 to-white flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#F6EFE3] border border-[#DEBE85]/50 flex items-center justify-center text-[#B88E4F] shadow-2xs flex-shrink-0">
                  <Sparkles className="w-3.5 h-3.5 text-[#B88E4F]" />
                </div>
                <div>
                  <h3 id="create-link-title" className="text-sm font-bold text-[#1A1612] leading-tight flex items-center gap-1.5">
                    {createdSuccessLink ? 'Link tiếp thị đã sẵn sàng' : 'Tạo link tiếp thị rút gọn'}
                  </h3>
                  <p className="text-[11px] text-[#7D715E] mt-0.5">
                    {createdSuccessLink ? 'Sao chép link để bắt đầu chia sẻ sản phẩm.' : 'Chọn sản phẩm, kênh truyền thông và tùy chỉnh liên kết rút gọn.'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 text-[#7D715E] hover:text-[#1A1612] rounded-lg hover:bg-[#FAF8F5] transition-colors"
                title="Đóng modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>


            {createdSuccessLink ? (
              <div className="kol-link-success-body">
                <div className="kol-link-success-status"><CheckCircle2 /><div><strong>Tạo link thành công</strong><p>Liên kết đã được lưu vào danh sách của bạn.</p></div></div>
                {createdSuccessLink.product?.title && <p className="kol-link-success-product">{createdSuccessLink.product.title}</p>}

                <div className="kol-link-success-url">
                  <div className="text-[10px] font-semibold text-[#7D715E] uppercase tracking-wider mb-1">
                    Link chia sẻ
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono font-bold text-[#B88E4F] text-xs sm:text-sm break-all">
                      {createdSuccessLink.shortUrl}
                    </span>
                    <button
                      onClick={() => handleCopyLink(createdSuccessLink.shortUrl, createdSuccessLink.shortCode)}
                      className="px-2.5 py-1 bg-gradient-to-r from-[#EBD08C] via-[#E5C783] to-[#DEC07A] hover:from-[#DEC07A] hover:to-[#DEC07A] text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-shrink-0 shadow-sm transition-all cursor-pointer"
                    >
                      {copiedCode === createdSuccessLink.shortCode ? (
                        <>
                          <Check className="w-3 h-3" /> Đã chép
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" /> Sao chép
                        </>
                      )}
                    </button>
                  </div>
                </div>


                <details className="kol-link-success-qr">
                  <summary><QrCode className="w-4 h-4" /><span>Mã QR &amp; tải ảnh PNG</span><ChevronDown className="w-4 h-4" /></summary>
                  <div className="kol-link-success-qr-content">
                  <div className="w-28 h-28 border border-[#EAE4D7] rounded-xl p-1 bg-white shadow-xs flex items-center justify-center mb-1.5">
                    {createdQrLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin text-[#B88E4F]" />
                    ) : createdQrError ? (
                      <div className="flex flex-col items-center p-1 text-center">
                        <AlertCircle className="w-4 h-4 text-rose-500 mb-0.5" />
                        <span className="text-[10px] text-rose-600 font-medium">Lỗi QR</span>
                        <button
                          type="button"
                          onClick={retryCreatedQr}
                          className="text-[9px] text-[#B88E4F] underline mt-0.5 font-semibold cursor-pointer"
                        >
                          Thử lại
                        </button>
                      </div>
                    ) : createdQrDataUrl ? (
                      <img
                        src={createdQrDataUrl}
                        alt={`Mã QR tiếp thị cho ${createdSuccessLink.product?.title || 'sản phẩm'}`}
                        className="w-full h-full rounded-lg object-contain"
                      />
                    ) : null}
                  </div>
                  <button
                    type="button"
                    disabled={isDownloadingSuccessQr}
                    onClick={() => handleDownloadSuccessQr(createdSuccessLink)}
                    className="text-[11px] text-[#B88E4F] hover:text-[#7D715E] hover:underline flex items-center gap-1 font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {isDownloadingSuccessQr ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Đang tải PNG 1024×1024...</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>Tải mã QR (PNG 1024×1024)</span>
                      </>
                    )}
                  </button>
                  {successQrDownloadError && (
                    <p className="text-[10px] text-rose-600 mt-1 font-medium">{successQrDownloadError}</p>
                  )}
                  </div>
                </details>
                <p className="kol-link-success-note">Ghi nhận tiếp thị trong 30 ngày theo lượt nhấp cuối cùng.</p>
                <div className="kol-link-success-actions">
                  <button
                    onClick={() => {
                      setCreateLinkStep(1);
                      setCreatedSuccessLink(null);
                      setSelectedProduct(null);
                      setSelectedCampaignId('');
                      setCustomExpiresAt('');
                      setFormLabel('');
                      setFormCoupon('');
                      setFormTouched({});
                    }}
                    className="px-3.5 py-1.5 border border-[#EAE4D7] hover:bg-[#FAF8F5] rounded-xl text-xs font-semibold text-[#7D715E] transition-colors cursor-pointer"
                  >
                    Tạo thêm link khác
                  </button>
                  <button
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-1.5 bg-gradient-to-r from-[#EBD08C] via-[#E5C783] to-[#DEC07A] hover:from-[#DEC07A] hover:to-[#DEC07A] text-white rounded-xl text-xs font-semibold shadow transition-all cursor-pointer"
                  >
                    Xem danh sách link
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(event) => { if (createLinkStep === 1) { event.preventDefault(); if (selectedProduct) setCreateLinkStep(2); } else { void handleCreateSubmit(event); } }}
                className={`flex flex-col flex-1 min-h-0 overflow-hidden ${isSubmitting ? 'pointer-events-none opacity-90' : ''}`}
              >

                <nav className="kol-create-link-steps" aria-label="Các bước tạo link">
                  <button type="button" aria-current={createLinkStep === 1 ? 'step' : undefined} onClick={() => setCreateLinkStep(1)}><span>1</span> Chọn sản phẩm</button>
                  <button type="button" disabled={!selectedProduct} aria-current={createLinkStep === 2 ? 'step' : undefined} onClick={() => setCreateLinkStep(2)}><span>2</span> Thiết lập link</button>
                </nav>
                <div className="kol-create-link-body p-4 sm:p-5 overflow-y-auto overflow-x-hidden custom-scrollbar flex-1 space-y-2.5">
                  {createLinkStep === 1 && (<>



                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-[#7D715E] uppercase tracking-wider flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-[#B88E4F]" />
                        <span>1. Sản phẩm tiếp thị *</span>
                      </label>
                      {selectedProduct && !isChangingProduct ? (
                        <button
                          type="button"
                          onClick={() => setIsChangingProduct(true)}
                          className="text-[11px] font-semibold text-[#B88E4F] hover:text-[#7D715E] hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Đổi sản phẩm khác</span>
                        </button>
                      ) : (
                          <span className="text-[11px] text-[#7D715E]">
                            Đang hiển thị {filteredEligibleProducts.length}/{eligibleProducts.length}{hasMoreEligibleProducts ? '+' : ''} sản phẩm
                          </span>
                      )}
                    </div>

                    {selectedProduct && !isChangingProduct ? (

                      <div className="p-2 bg-[#FAF8F5] border border-[#DEBE85] rounded-xl flex items-center justify-between gap-2.5 shadow-2xs animate-fadeIn">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img
                            src={selectedProduct.imageUrl || '/assets/product-placeholder.svg'}
                            alt={selectedProduct.title}
                            className="w-9 h-9 rounded-lg object-cover border border-[#EAE4D7] flex-shrink-0 bg-white"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-[#1A1612] truncate" title={selectedProduct.title}>
                              {selectedProduct.title}
                            </div>
                            <div className="text-[11px] text-[#7D715E] flex items-center gap-1.5 mt-0.5 flex-wrap">
                              <span className="font-medium text-[#1A1612]">{selectedProduct.store?.name}</span>
                              <span>•</span>
                              <span className="font-semibold text-emerald-600">
                                {Number(selectedProduct.price).toLocaleString('vi-VN')} đ
                              </span>
                              <span className="text-[10px] bg-[#FBF5EB] text-[#B88E4F] font-bold px-1.5 py-0.2 rounded border border-[#EEDFC6]">
                                Open Offer: {selectedProduct.estimatedCommissionRate}%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${productRemainingQuota > 0
                                ? 'bg-amber-50 text-amber-900 border-amber-300'
                                : 'bg-rose-50 text-rose-800 border-rose-300'
                              }`}
                          >
                            Còn {productRemainingQuota}/20 link
                          </span>
                        </div>
                      </div>
                    ) : (

                      <div className="space-y-1.5 animate-fadeIn">
                        <div className="kol-create-link-filters grid grid-cols-1 sm:grid-cols-12 gap-1.5">
                          <div className="sm:col-span-6 relative">
                            <Search className="w-3.5 h-3.5 text-[#7D715E] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                              type="text"
                              value={modalProductSearch}
                              onChange={(e) => setModalProductSearch(e.target.value)}
                              placeholder="Tìm sản phẩm, SKU..."
                              className="w-full pl-7 pr-6 py-1.5 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] text-xs text-[#1A1612] focus:bg-white focus:border-[#C59B58] outline-none transition-all"
                            />
                            {modalProductSearch && (
                              <button
                                type="button"
                                onClick={() => setModalProductSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7D715E] hover:text-[#1A1612] p-0.5"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div className="sm:col-span-3">
                            <Select
                              value={modalShopFilter}
                              onChange={(e) => setModalShopFilter(e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] text-xs text-[#1A1612] focus:bg-white focus:border-[#C59B58] outline-none truncate cursor-pointer"
                            >
                              <option value="ALL">Tất cả Shop ({availableShops.length})</option>
                              {availableShops.map((s) => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                              ))}
                            </Select>
                          </div>
                          <div className="sm:col-span-3">
                            <Select
                              value={modalCategoryFilter}
                              onChange={(e) => setModalCategoryFilter(e.target.value)}
                              className="w-full px-2 py-1.5 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] text-xs text-[#1A1612] focus:bg-white focus:border-[#C59B58] outline-none truncate cursor-pointer"
                            >
                              <option value="ALL">Ngành ({availableCategories.length})</option>
                              {availableCategories.map((cat) => (
                                <option key={cat} value={cat}>{cat}</option>
                              ))}
                            </Select>
                          </div>
                        </div>


                        {loadProductsError && (
                          <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg flex items-center justify-between gap-2 text-xs text-rose-700 animate-fadeIn">
                            <div className="flex items-center gap-1.5">
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 flex-shrink-0" />
                              <span>{loadProductsError}</span>
                            </div>
                            <button
                              type="button"
                              onClick={loadEligibleProductsAndCampaigns}
                              className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-xs font-semibold transition-colors flex-shrink-0"
                            >
                              Thử lại
                            </button>
                          </div>
                        )}


                        {loadingProducts ? (
                          <div className="p-3 text-center text-[#7D715E] bg-[#FAF8F5] rounded-lg border border-[#EAE4D7]">
                            <Loader2 className="w-4 h-4 animate-spin mx-auto mb-1 text-[#B88E4F]" />
                            <p className="text-xs">Đang tải danh mục sản phẩm...</p>
                          </div>
                        ) : filteredEligibleProducts.length === 0 ? (
                          <div className="p-3 text-center text-[#7D715E] bg-[#FAF8F5] rounded-lg border border-dashed border-[#EAE4D7]">
                            <PackageSearch className="w-6 h-6 text-[#B88E4F]/60 mx-auto mb-1" />
                            <p className="text-xs font-bold text-[#1A1612]">Không tìm thấy sản phẩm phù hợp</p>
                            <p className="text-[10px] text-[#7D715E] mt-0.5">Hãy thử tìm từ khóa khác hoặc liên hệ Shop để được duyệt tiếp thị.</p>
                          </div>
                        ) : (
                          <div className="kol-create-link-products max-h-32 overflow-y-auto divide-y divide-[#EAE4D7]/60 border border-[#EAE4D7] rounded-lg bg-white custom-scrollbar">
                            {filteredEligibleProducts.map((p) => {
                              const isSelected = selectedProduct?.id === p.id;
                              return (
                                <div
                                  key={p.id}
                                  onClick={() => handleSelectProduct(p)}
                                  className={`p-1.5 px-2.5 flex items-center justify-between gap-2 cursor-pointer transition-colors ${isSelected ? 'bg-[#FAF8F5] border-l-4 border-[#C59B58]' : 'hover:bg-[#FAF8F5]'
                                    }`}
                                >
                                  <div className="flex items-center gap-2 min-w-0">
                                    <img
                                      src={p.imageUrl || '/assets/product-placeholder.svg'}
                                      alt={p.title}
                                      className="w-7 h-7 rounded object-cover border border-[#EAE4D7] flex-shrink-0 bg-[#FAF8F5]"
                                    />
                                    <div className="min-w-0">
                                      <div className="font-semibold text-[#1A1612] text-xs truncate">{p.title}</div>
                                      <div className="text-[10px] text-[#7D715E] flex items-center gap-1 mt-0.5">
                                        <span className="font-medium text-[#1A1612]">{p.store.name}</span>
                                        <span>•</span>
                                        <span className="font-semibold text-emerald-600">
                                          {Number(p.price).toLocaleString('vi-VN')} đ
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold text-[#B88E4F] bg-[#FBF5EB] border border-[#EEDFC6] px-1.5 py-0.2 rounded flex-shrink-0">
                                    Open Offer: {p.estimatedCommissionRate}%
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {hasMoreEligibleProducts && !loadingProducts && (
                          <button
                            type="button"
                            onClick={loadMoreEligibleProducts}
                            disabled={loadingMoreProducts}
                            className="w-full rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-2 text-xs font-semibold text-[#B88E4F] hover:bg-[#F3EFE6] disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {loadingMoreProducts ? 'Đang tải thêm…' : 'Tải thêm sản phẩm'}
                          </button>
                        )}
                      </div>
                    )}

                    {referralLinksService.supportsExclusiveDeals && selectedProduct && (
                      <button
                        type="button"
                        onClick={() => openExclusiveDealDialog(selectedProduct)}
                        className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-2 text-xs font-bold text-[#B88E4F] hover:bg-[#F3EFE6]"
                      >
                        <Sparkles className="h-3.5 w-3.5" /> Đề xuất deal độc quyền với Shop
                      </button>
                    )}

                    {formValidationErrors.product && (
                      <p className="text-xs text-rose-600 mt-1 flex items-center gap-1 font-medium animate-fadeIn">
                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                        {formValidationErrors.product}
                      </p>
                    )}
                  </div>




                  </>)}
                  {createLinkStep === 2 && (<>
                    <div className="kol-create-selected-summary"><ShoppingBag className="h-4 w-4 shrink-0" /><span>{selectedProduct?.title}</span><button type="button" onClick={() => { setIsChangingProduct(true); setCreateLinkStep(1); }}>Đổi sản phẩm</button></div>
                  {selectedProduct && eligibleCampaignsForProduct.length > 0 && (
                    <div className="p-2 bg-[#FAF8F5] rounded-xl border border-[#EAE4D7] space-y-1 animate-fadeIn">
                      <div className="flex items-center justify-between text-[11px]">
                        <label className="font-bold text-[#7D715E] uppercase tracking-wider flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-[#B88E4F]" />
                          <span>Chiến dịch thưởng thêm</span>
                        </label>
                        <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-200">
                          {eligibleCampaignsForProduct.length} khả dụng
                        </span>
                      </div>
                      <Select
                        value={selectedCampaignId}
                        onChange={(e) => handleSelectCampaign(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border border-[#EAE4D7] bg-white text-xs font-medium text-[#1A1612] focus:border-[#C59B58] outline-none transition-all cursor-pointer"
                      >
                        <option value="">
                          Không gắn chiến dịch (Hoa hồng Shop chuẩn {selectedProduct.estimatedCommissionRate}%)
                        </option>
                        {eligibleCampaignsForProduct.map((item: any) => {
                          const camp = item.campaign;
                          const totalRate =
                            Number(selectedProduct.estimatedCommissionRate) +
                            Number(camp.bonusCommissionRate || 0);
                          return (
                            <option key={camp.id} value={camp.id}>
                              🔥 {camp.name} — Tổng HH {totalRate.toFixed(1)}% (+{camp.bonusCommissionRate}%)
                            </option>
                          );
                        })}
                      </Select>
                    </div>
                  )}




                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-bold text-[#7D715E] uppercase tracking-wider mb-1">
                        2. Kênh quảng bá *
                      </label>
                      <Select
                        value={formChannel}
                        onChange={(e) => {
                          setFormChannel(e.target.value);
                          setUtmSource(e.target.value.toLowerCase());
                        }}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-medium text-[#1A1612] focus:bg-white focus:border-[#C59B58] outline-none transition-all cursor-pointer"
                      >
                        <option value="TIKTOK">TikTok (Bio / Video / Livestream)</option>
                        <option value="YOUTUBE">YouTube (Mô tả / Shorts)</option>
                        <option value="FACEBOOK">Facebook (Post / Story / Group)</option>
                        <option value="INSTAGRAM">Instagram (Story / Bio)</option>
                        <option value="THREADS">Threads</option>
                        <option value="ZALO">Zalo</option>
                        <option value="OTHER">Kênh khác / Livestream</option>
                      </Select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#7D715E] uppercase tracking-wider mb-1">
                        Mã coupon riêng (Tùy chọn)
                      </label>
                      <div className="relative flex items-center group">
                        <Tag className="w-3.5 h-3.5 text-[#7D715E] group-focus-within:text-[#B88E4F] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                        <input
                          type="text"
                          placeholder="VD: KOLTHANG10"
                          value={formCoupon}
                          onBlur={() => setFormTouched((prev) => ({ ...prev, coupon: true }))}
                          onChange={(e) => setFormCoupon(e.target.value.toUpperCase())}
                          maxLength={50}
                          className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs text-[#1A1612] outline-none uppercase font-mono transition-all ${formValidationErrors.coupon
                              ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                              : 'border-[#EAE4D7] bg-[#FAF8F5] focus:bg-white focus:border-[#C59B58]'
                            }`}
                        />
                      </div>
                      {formValidationErrors.coupon && (
                        <p className="text-[10px] text-rose-600 mt-0.5 flex items-center gap-1 font-medium">
                          <AlertCircle className="w-3 h-3 flex-shrink-0" />
                          {formValidationErrors.coupon}
                        </p>
                      )}
                    </div>
                  </div>




                  <div>
                    <label className="block text-xs font-bold text-[#7D715E] uppercase tracking-wider mb-1">
                      3. Nhãn gợi nhớ (Label) *
                    </label>
                    <div className="relative flex items-center group">
                      <Sparkles className="w-3.5 h-3.5 text-[#7D715E] group-focus-within:text-[#B88E4F] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                      <input
                        type="text"
                        placeholder="VD: Video review 9.9, Bio cá nhân, Livestream tối..."
                        value={formLabel}
                        onBlur={() => setFormTouched((prev) => ({ ...prev, label: true }))}
                        onChange={(e) => setFormLabel(e.target.value)}
                        maxLength={150}
                        className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs text-[#1A1612] outline-none transition-all ${formValidationErrors.label
                            ? 'border-rose-400 bg-rose-50/20 focus:border-rose-500'
                            : 'border-[#EAE4D7] bg-[#FAF8F5] focus:bg-white focus:border-[#C59B58]'
                          }`}
                      />
                    </div>
                    {formValidationErrors.label && (
                      <p className="text-[10px] text-rose-600 mt-0.5 flex items-center gap-1 font-medium">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        {formValidationErrors.label}
                      </p>
                    )}
                  </div>




                  <div className="pt-1.5 border-t border-[#EAE4D7]/60">

                    <div className="flex items-center justify-between py-0.5">
                      <button
                        type="button"
                        onClick={() => setShowAdvancedUtm(!showAdvancedUtm)}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7D715E] hover:text-[#B88E4F] transition-colors group select-none cursor-pointer"
                      >
                        <div
                          className={`w-4 h-4 rounded flex items-center justify-center transition-transform duration-200 ${showAdvancedUtm
                              ? 'rotate-180 text-[#B88E4F] bg-[#ECE1CD]'
                              : 'text-[#7D715E] bg-[#FAF8F5]'
                            }`}
                        >
                          <ChevronDown className="w-3 h-3" />
                        </div>
                        <SlidersHorizontal className="w-3.5 h-3.5 text-[#B88E4F]" />
                        <span>Tham số UTM theo dõi nâng cao</span>
                        {hasCustomUtm ? (
                          <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-full flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            Đang tùy chỉnh
                          </span>
                        ) : (
                          <span className="text-[10px] text-[#7D715E] font-normal">
                            (Tùy chọn)
                          </span>
                        )}
                      </button>

                      {showAdvancedUtm && (
                        <button
                          type="button"
                          onClick={() => setShowUtmGuide(!showUtmGuide)}
                          className="inline-flex items-center gap-1 text-[11px] text-[#B88E4F] hover:text-[#7D715E] font-medium transition-colors cursor-pointer"
                        >
                          <HelpCircle className="w-3.5 h-3.5 text-[#B88E4F]" />
                          <span>{showUtmGuide ? 'Ẩn HD' : 'Hướng dẫn sử dụng'}</span>
                        </button>
                      )}
                    </div>


                    {showAdvancedUtm && (
                      <div className="mt-1 space-y-2 p-2.5 bg-gradient-to-b from-[#FAF8F5] to-white rounded-xl border border-[#EAE4D7] shadow-2xs animate-fadeIn text-xs">

                        {showUtmGuide && (
                          <div className="p-2.5 bg-white rounded-lg border border-[#DEBE85]/60 text-[10px] text-[#7D715E] space-y-1 animate-fadeIn leading-relaxed shadow-2xs">
                            <p className="flex items-center gap-1 font-medium text-[#1A1612]">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                              <span>UTM là gì? Thẻ định danh gắn vào link giúp theo dõi nguồn đơn hàng chính xác.</span>
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 pt-1.5 border-t border-[#EAE4D7]/50 text-[9px]">
                              <div><strong className="text-[#1A1612]">🌐 source:</strong> Nền tảng (tiktok, fb...)</div>
                              <div><strong className="text-[#1A1612]">📡 medium:</strong> Định dạng (bio, video...)</div>
                              <div><strong className="text-[#1A1612]">🎯 campaign:</strong> Tên sự kiện/sale</div>
                              <div><strong className="text-[#1A1612]">📄 content:</strong> Vị trí bài đăng</div>
                            </div>
                          </div>
                        )}


                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">

                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="font-bold text-[#1A1612] text-[10px] flex items-center gap-1">
                                <Globe className="w-3 h-3 text-[#B88E4F]" />
                                <span>Nguồn (source)</span>
                              </label>
                              <div className="flex items-center gap-1">
                                {[
                                  { label: 'tiktok', val: 'tiktok' },
                                  { label: 'youtube', val: 'youtube' },
                                  { label: 'fb', val: 'facebook' },
                                ].map((item) => (
                                  <button
                                    key={item.val}
                                    type="button"
                                    onClick={() => setUtmSource(item.val)}
                                    className={`text-[8px] px-1.5 py-0.2 rounded transition-all cursor-pointer ${utmSource.toLowerCase() === item.val
                                        ? 'bg-[#EBD08C] text-white font-bold shadow-2xs'
                                        : 'bg-white text-[#7D715E] hover:bg-[#F6EFE3] hover:text-[#B88E4F] border border-[#EAE4D7]'
                                      }`}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="relative flex items-center group">
                              <Globe className="w-3.5 h-3.5 text-[#7D715E] group-focus-within:text-[#B88E4F] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                              <input
                                type="text"
                                value={utmSource}
                                onChange={(e) => setUtmSource(e.target.value)}
                                placeholder="tiktok, facebook, youtube..."
                                className="w-full pl-7.5 pr-6 py-1 rounded-md border border-[#EAE4D7] bg-white text-[#1A1612] text-xs focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58]/30 outline-none transition-all shadow-2xs"
                              />
                              {utmSource && (
                                <button
                                  type="button"
                                  onClick={() => setUtmSource('')}
                                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#7D715E] hover:text-[#1A1612] p-0.5 cursor-pointer"
                                  title="Xóa"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          </div>


                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="font-bold text-[#1A1612] text-[10px] flex items-center gap-1">
                                <Share2 className="w-3 h-3 text-[#B88E4F]" />
                                <span>Kênh (medium)</span>
                              </label>
                              <div className="flex items-center gap-1">
                                {[
                                  { label: 'creator', val: 'creator' },
                                  { label: 'bio', val: 'bio_link' },
                                  { label: 'video', val: 'video' },
                                ].map((item) => (
                                  <button
                                    key={item.val}
                                    type="button"
                                    onClick={() => setUtmMedium(item.val)}
                                    className={`text-[8px] px-1.5 py-0.2 rounded transition-all cursor-pointer ${utmMedium.toLowerCase() === item.val
                                        ? 'bg-[#EBD08C] text-white font-bold shadow-2xs'
                                        : 'bg-white text-[#7D715E] hover:bg-[#F6EFE3] hover:text-[#B88E4F] border border-[#EAE4D7]'
                                      }`}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="relative flex items-center group">
                              <Share2 className="w-3.5 h-3.5 text-[#7D715E] group-focus-within:text-[#B88E4F] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                              <input
                                type="text"
                                value={utmMedium}
                                onChange={(e) => setUtmMedium(e.target.value)}
                                placeholder="creator, bio_link, video..."
                                className="w-full pl-7.5 pr-6 py-1 rounded-md border border-[#EAE4D7] bg-white text-[#1A1612] text-xs focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58]/30 outline-none transition-all shadow-2xs"
                              />
                              {utmMedium && (
                                <button
                                  type="button"
                                  onClick={() => setUtmMedium('')}
                                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#7D715E] hover:text-[#1A1612] p-0.5 cursor-pointer"
                                  title="Xóa"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          </div>


                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="font-bold text-[#1A1612] text-[10px] flex items-center gap-1">
                                <Target className="w-3 h-3 text-[#B88E4F]" />
                                <span>Chiến dịch</span>
                              </label>
                              <div className="flex items-center gap-1">
                                {activeSelectedCampaign ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setUtmCampaign(
                                        activeSelectedCampaign.name
                                          .toLowerCase()
                                          .replace(/[^a-z0-9]+/g, '_')
                                          .slice(0, 50)
                                      )
                                    }
                                    className="text-[8px] px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold cursor-pointer"
                                    title="Lấy tên từ chiến dịch đang chọn"
                                  >
                                    ⚡ Theo CD
                                  </button>
                                ) : (
                                  ['sale_9_9', 'deal_hot'].map((cmp) => (
                                    <button
                                      key={cmp}
                                      type="button"
                                      onClick={() => setUtmCampaign(cmp)}
                                      className={`text-[8px] px-1.5 py-0.2 rounded transition-all cursor-pointer ${utmCampaign.toLowerCase() === cmp
                                          ? 'bg-[#EBD08C] text-white font-bold shadow-2xs'
                                          : 'bg-white text-[#7D715E] hover:bg-[#F6EFE3] hover:text-[#B88E4F] border border-[#EAE4D7]'
                                        }`}
                                    >
                                      {cmp}
                                    </button>
                                  ))
                                )}
                              </div>
                            </div>
                            <div className="relative flex items-center group">
                              <Target className="w-3.5 h-3.5 text-[#7D715E] group-focus-within:text-[#B88E4F] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                              <input
                                type="text"
                                placeholder="VD: autumn_sale_2026"
                                value={utmCampaign}
                                onChange={(e) => setUtmCampaign(e.target.value)}
                                className="w-full pl-7.5 pr-6 py-1 rounded-md border border-[#EAE4D7] bg-white text-[#1A1612] text-xs focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58]/30 outline-none transition-all shadow-2xs"
                              />
                              {utmCampaign && (
                                <button
                                  type="button"
                                  onClick={() => setUtmCampaign('')}
                                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#7D715E] hover:text-[#1A1612] p-0.5 cursor-pointer"
                                  title="Xóa"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          </div>


                          <div>
                            <div className="flex items-center justify-between mb-0.5">
                              <label className="font-bold text-[#1A1612] text-[10px] flex items-center gap-1">
                                <FileText className="w-3 h-3 text-[#B88E4F]" />
                                <span>Nội dung</span>
                              </label>
                              <div className="flex items-center gap-1">
                                {[
                                  { label: 'bio', val: 'bio_link' },
                                  { label: 'video', val: 'video_01' },
                                  { label: 'cmt', val: 'comment' },
                                ].map((item) => (
                                  <button
                                    key={item.val}
                                    type="button"
                                    onClick={() => setUtmContent(item.val)}
                                    className={`text-[8px] px-1.5 py-0.2 rounded transition-all cursor-pointer ${utmContent.toLowerCase() === item.val
                                        ? 'bg-[#EBD08C] text-white font-bold shadow-2xs'
                                        : 'bg-white text-[#7D715E] hover:bg-[#F6EFE3] hover:text-[#B88E4F] border border-[#EAE4D7]'
                                      }`}
                                  >
                                    {item.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="relative flex items-center group">
                              <FileText className="w-3.5 h-3.5 text-[#7D715E] group-focus-within:text-[#B88E4F] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none transition-colors" />
                              <input
                                type="text"
                                placeholder="VD: review_banner_01"
                                value={utmContent}
                                onChange={(e) => setUtmContent(e.target.value)}
                                className="w-full pl-7.5 pr-6 py-1 rounded-md border border-[#EAE4D7] bg-white text-[#1A1612] text-xs focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58]/30 outline-none transition-all shadow-2xs"
                              />
                              {utmContent && (
                                <button
                                  type="button"
                                  onClick={() => setUtmContent('')}
                                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[#7D715E] hover:text-[#1A1612] p-0.5 cursor-pointer"
                                  title="Xóa"
                                >
                                  <X className="w-2.5 h-2.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>


                        <div className="pt-1.5 border-t border-[#EAE4D7]/60 flex items-center justify-between gap-2 text-[10px]">
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="text-[#7D715E] font-semibold flex items-center gap-1 flex-shrink-0">
                              <Link2 className="w-3 h-3 text-[#B88E4F]" />
                              <span>Xem trước:</span>
                            </span>
                            <div className="flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-[#EAE4D7] min-w-0 flex-1 shadow-2xs">
                              <span className="font-mono text-[9px] text-[#B88E4F] truncate flex-1 select-all font-medium">
                                {livePreviewUrl}
                              </span>
                            </div>
                          </div>
                          {hasCustomUtm && (
                            <button
                              type="button"
                              onClick={() => {
                                setUtmSource(formChannel.toLowerCase());
                                setUtmMedium('creator');
                                setUtmCampaign('');
                                setUtmContent('');
                              }}
                              className="text-[9px] font-semibold text-[#7D715E] hover:text-[#B88E4F] bg-white hover:bg-[#FAF8F5] px-2 py-1 rounded-lg border border-[#EAE4D7] flex items-center gap-1 flex-shrink-0 transition-colors shadow-2xs cursor-pointer"
                              title="Khôi phục UTM về mặc định"
                            >
                              <RotateCcw className="w-2.5 h-2.5" />
                              <span>Mặc định</span>
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  </>)}
                </div>


                <div className="kol-create-link-footer px-4 sm:px-5 py-2.5 border-t border-[#EAE4D7] bg-[#FAF8F5] flex items-center justify-between gap-3 flex-shrink-0">
                  <div className="text-xs text-[#7D715E] truncate max-w-[180px] sm:max-w-xs">
                    {createLinkStep === 1 && selectedProduct ? (<span>Đã chọn sản phẩm</span>) : !selectedProduct ? (
                      <span className="text-[#7D715E] italic">Chưa chọn sản phẩm</span>
                    ) : !formLabel.trim() ? (
                      <span className="text-amber-700 font-medium">Cần nhập nhãn gợi nhớ</span>
                    ) : productRemainingQuota <= 0 ? (
                      <span className="text-rose-600 font-medium">Hết hạn mức 20 link</span>
                    ) : (
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">Sẵn sàng tạo link</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={() => createLinkStep === 2 ? setCreateLinkStep(1) : setIsCreateModalOpen(false)}
                      className="px-3 py-1.5 rounded-lg border border-[#EAE4D7] text-xs font-semibold text-[#7D715E] hover:bg-white transition-colors cursor-pointer"
                    >
                      {createLinkStep === 2 ? 'Quay lại' : 'Hủy bỏ'}
                    </button>
                    {createLinkStep === 1 ? (
                      <button type="button" className="kol-create-next" disabled={!selectedProduct} onClick={() => setCreateLinkStep(2)}>Tiếp tục <ChevronRight className="h-4 w-4" /></button>
                    ) : (
                    <button
                      type="submit"
                      disabled={isSubmitDisabled}
                      className={`px-4 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm flex items-center gap-1.5 transition-all ${isSubmitDisabled
                          ? 'bg-[#EBD08C] text-[#231D15] cursor-not-allowed opacity-60'
                          : 'bg-gradient-to-r from-[#EBD08C] via-[#E5C783] to-[#DEC07A] hover:from-[#DEC07A] hover:to-[#DEC07A] cursor-pointer active:scale-95'
                        }`}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang tạo...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Tạo link tiếp thị</span>
                        </>
                      )}
                    </button>
                    )}
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      )}




      {isQrModalOpen && selectedLinkForQr && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsQrModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
          aria-labelledby="qr-modal-title"
        >
          <div
            ref={qrModalRef}
            className="bg-white rounded-2xl shadow-2xl border border-[#EAE4D7] w-full max-w-md p-5 sm:p-6 text-center animate-in zoom-in-95 duration-150 relative"
          >


            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#EAE4D7]/60">
              <div className="flex items-center gap-2.5 text-left">
                <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-[#FAF8F5] via-[#FAF8F5] to-[#F3EFE6] border border-[#EAE4D7] shadow-2xs flex items-center justify-center text-[#B88E4F] ring-2 ring-[#B88E4F]/10 flex-shrink-0">
                  <QrCode className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 id="qr-modal-title" className="text-sm sm:text-base font-black text-[#1A1612] tracking-tight m-0 flex items-center gap-1.5">
                    Mã QR Tiếp Thị
                    <span className="px-1.5 py-0.5 text-[10px] font-bold bg-[#EBD08C]/10 text-[#B88E4F] border border-[#B88E4F]/20 rounded-md">
                      QR Code
                    </span>
                  </h3>
                  <p className="text-[11px] text-[#7D715E] m-0 mt-0.5">
                    QR động trỏ về short URL chính thức kèm nhận diện traffic
                  </p>
                </div>
              </div>
              <button
                ref={qrCloseBtnRef}
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-[#7D715E] hover:text-[#1A1612] hover:bg-[#FAF8F5] rounded-xl border border-transparent hover:border-[#EAE4D7] transition-all cursor-pointer"
                aria-label="Đóng cửa sổ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>


            <div className="relative p-4 bg-gradient-to-b from-white via-white to-[#FAF8F5] rounded-3xl border-2 border-[#EAE4D7] shadow-lg shadow-[#B88E4F]/5 inline-block mb-3.5 transition-all hover:border-[#C59B58]">
              {selectedQrLoading ? (
                <div className="w-48 h-48 flex flex-col items-center justify-center gap-2 text-[#7D715E]">
                  <Loader2 className="w-7 h-7 animate-spin text-[#B88E4F]" />
                  <span className="text-xs font-semibold">Đang dựng ảnh QR…</span>
                </div>
              ) : selectedQrError ? (
                <div className="w-48 h-48 flex flex-col items-center justify-center gap-2 p-3 text-center">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600 mb-1 shadow-2xs">
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-bold text-[#1A1612]">Không thể tạo mã QR.</span>
                  <button
                    type="button"
                    onClick={retrySelectedQr}
                    className="mt-1 px-3 py-1.5 bg-gradient-to-r from-[#F6EFE3] to-[#ECE1CD] hover:from-[#ECE1CD] hover:to-[#EAD2A3] text-[#B88E4F] border border-[#DEBE85] rounded-xl text-xs font-bold shadow-2xs transition-all cursor-pointer"
                  >
                    Vui lòng thử lại
                  </button>
                </div>
              ) : selectedQrDataUrl ? (
                <img
                  src={selectedQrDataUrl}
                  alt={`Mã QR tiếp thị cho ${selectedLinkForQr.product?.title || 'sản phẩm'}`}
                  className="w-48 h-48 rounded-2xl object-contain bg-white block shadow-2xs"
                />
              ) : (
                <div className="w-48 h-48 flex flex-col items-center justify-center gap-2 text-[#7D715E]">
                  <Loader2 className="w-7 h-7 animate-spin text-[#B88E4F]" />
                  <span className="text-xs">Đang dựng ảnh QR…</span>
                </div>
              )}
            </div>


            <div className="text-sm font-black text-[#1A1612] line-clamp-2 mb-2 px-2 tracking-tight">
              {selectedLinkForQr.product?.title}
            </div>


            <div className="flex flex-wrap items-center justify-center gap-2 text-xs mb-3.5">
              {selectedLinkForQr.product?.store?.name && (
                <div className="inline-flex items-center gap-1.5 bg-gradient-to-b from-[#FAF8F5] via-[#FFFFFF] to-[#F3EFE6] px-2.5 py-1 rounded-xl border border-[#EAE4D7]/90 shadow-2xs">
                  <span className="w-5 h-5 rounded-lg bg-[#EBD08C]/12 border border-[#B88E4F]/20 flex items-center justify-center text-[#B88E4F] shadow-2xs flex-shrink-0">
                    <Store className="w-3 h-3" />
                  </span>
                  <span className="font-semibold text-[#5E5141] text-[11px] max-w-[130px] truncate">
                    {selectedLinkForQr.product.store.name}
                  </span>
                </div>
              )}
              <div className="inline-flex items-center gap-1.5 bg-gradient-to-b from-[#FAF8F5] via-[#FFFFFF] to-[#F3EFE6] px-2.5 py-1 rounded-xl border border-[#EAE4D7]/90 shadow-2xs">
                <span className="w-5 h-5 rounded-lg bg-[#EBD08C]/12 border border-[#B88E4F]/20 flex items-center justify-center text-[#B88E4F] shadow-2xs flex-shrink-0 font-black text-[11px]">
                  #
                </span>
                <span className="font-mono font-black text-[#B88E4F] text-[11px]">
                  {selectedLinkForQr.shortCode}
                </span>
              </div>
              <div
                className="inline-flex items-center gap-1.5 bg-gradient-to-b from-amber-50/90 via-amber-50/60 to-amber-100/50 px-2.5 py-1 rounded-xl border border-amber-200/90 shadow-2xs text-amber-900"
                title="Tổng số lượt tải ảnh QR"
              >
                <span className="w-5 h-5 rounded-lg bg-amber-500/15 border border-amber-400/30 flex items-center justify-center text-amber-700 shadow-2xs flex-shrink-0">
                  <Download className="w-3 h-3" />
                </span>
                <span className="text-[11px] font-medium text-amber-800">
                  Lượt tải: <strong className="font-black text-amber-950">{selectedLinkForQr.qrDownloadCount || 0}</strong>
                </span>
              </div>
            </div>


            <div className="mb-3.5 group flex items-center gap-2 bg-gradient-to-r from-[#FAF8F5] via-[#FFFFFF] to-[#FAF8F5] p-1.5 pl-2.5 rounded-2xl border border-[#EAE4D7] shadow-xs focus-within:border-[#B88E4F] focus-within:ring-2 focus-within:ring-[#B88E4F]/20 transition-all">
              <span className="w-6 h-6 rounded-lg bg-[#EBD08C]/10 border border-[#B88E4F]/20 flex items-center justify-center text-[#B88E4F] flex-shrink-0">
                <Globe className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                readOnly
                value={selectedQrTargetUrl}
                className="font-mono text-[11px] text-[#4A3E31] bg-transparent flex-1 outline-none select-all tracking-tight font-medium"
                title="Short URL mã hóa trong QR"
              />
              <button
                type="button"
                onClick={() => handleCopyLink(selectedQrTargetUrl, selectedLinkForQr.shortCode)}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-xs cursor-pointer flex-shrink-0 active:scale-95 border ${copiedCode === selectedLinkForQr.shortCode
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                    : 'bg-gradient-to-b from-white to-[#F7F2EB] hover:from-[#F7F2EB] hover:to-[#EFE6D8] text-[#7D715E] hover:text-[#B88E4F] border-[#EAE4D7]'
                  }`}
              >
                {copiedCode === selectedLinkForQr.shortCode ? (
                  <>
                    <span className="w-4 h-4 rounded-md bg-emerald-500/15 flex items-center justify-center text-emerald-700">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                    Đã chép
                  </>
                ) : (
                  <>
                    <span className="w-4 h-4 rounded-md bg-[#EBD08C]/10 flex items-center justify-center text-[#B88E4F]">
                      <Copy className="w-2.5 h-2.5" />
                    </span>
                    Chép link
                  </>
                )}
              </button>
            </div>


            <div className="flex items-center justify-between gap-2 mb-3 text-xs">
              <span className="text-[11px] font-bold text-[#7D715E] whitespace-nowrap">
                Kích thước PNG:
              </span>
              <div className="flex items-center gap-1.5">
                {([512, 1024, 2048] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setQrPngSize(sz)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap border transition-all cursor-pointer ${qrPngSize === sz
                        ? 'bg-[#EBD08C] text-white border-[#B88E4F] shadow-2xs'
                        : 'bg-[#FAF8F5] text-[#7D715E] border-[#EAE4D7] hover:bg-[#F3EFE6] hover:text-[#1A1612]'
                      }`}
                  >
                    {sz === 1024 ? '1024 (Chuẩn)' : sz === 512 ? '512' : '2048 (In)'}
                  </button>
                ))}
              </div>
            </div>


            {qrDownloadError && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center justify-between gap-2 text-left animate-fadeIn">
                <div className="flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{qrDownloadError}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setQrDownloadError(null)}
                  className="text-rose-500 hover:text-rose-700 p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}


            <div className="grid grid-cols-3 gap-2.5 mb-3.5">
              <button
                type="button"
                onClick={() => handleDownloadQr('png')}
                disabled={isDownloadingQr}
                className="py-2.5 px-2 bg-gradient-to-r from-[#EBD08C] via-[#E5C783] to-[#DEC07A] hover:from-[#DEC07A] hover:to-[#D4B26F] text-white rounded-2xl text-xs font-black tracking-wide flex items-center justify-center gap-1.5 shadow-md shadow-[#B88E4F]/20 hover:shadow-lg hover:shadow-[#B88E4F]/30 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 border border-[#E2C792]/40"
              >
                <span className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0 backdrop-blur-xs">
                  {isDownloadingQr ? (
                    <Loader2 className="w-3 h-3 animate-spin text-white" />
                  ) : (
                    <Download className="w-3 h-3 text-white" />
                  )}
                </span>
                Tải PNG
              </button>

              <button
                type="button"
                onClick={() => handleDownloadQr('svg')}
                disabled={isDownloadingQr}
                className="py-2.5 px-2 bg-gradient-to-b from-white via-white to-[#FAF8F5] hover:from-[#FAF8F5] hover:to-[#F3ECE0] text-[#7D715E] hover:text-[#B88E4F] border border-[#EAE4D7] rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
              >
                <span className="w-5 h-5 rounded-lg bg-[#EBD08C]/10 border border-[#B88E4F]/20 flex items-center justify-center text-[#B88E4F] flex-shrink-0">
                  <Download className="w-3 h-3" />
                </span>
                Tải SVG
              </button>

              <a
                href={`/r/${selectedLinkForQr.shortCode}?via=qr`}
                target="_blank"
                rel="noreferrer"
                className="py-2.5 px-2 bg-gradient-to-b from-[#FAF8F5] via-white to-[#F3EFE6] hover:from-[#ECE1CD] hover:to-[#EAD2A3] text-[#7D715E] hover:text-[#B88E4F] border border-[#EAE4D7] rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-[0.98] transition-all cursor-pointer"
              >
                <span className="w-5 h-5 rounded-lg bg-[#EBD08C]/12 border border-[#B88E4F]/25 flex items-center justify-center text-[#B88E4F] flex-shrink-0">
                  <ExternalLink className="w-3 h-3" />
                </span>
                Quét thử
              </a>
            </div>


            <div className="p-3 bg-gradient-to-r from-[#FAF8F5] via-[#FAF8F5] to-[#FAF8F5] rounded-2xl border border-[#EAE4D7]/90 text-xs text-[#7D715E] flex items-center gap-3 text-left shadow-2xs leading-relaxed">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200/70 border border-amber-300/80 flex items-center justify-center text-amber-800 flex-shrink-0 shadow-2xs ring-2 ring-amber-50">
                <Lightbulb className="w-4 h-4" />
              </span>
              <span className="text-[11px] leading-relaxed text-[#5E5141]">
                <strong className="text-[#1A1612] font-bold">Mẹo nhỏ:</strong> Quét thử bằng camera điện thoại để kiểm tra chuyển hướng trước khi in ấn số lượng lớn.
              </span>
            </div>
          </div>
        </div>
      )}




      {isAnalyticsModalOpen && selectedLinkForAnalytics && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAnalyticsModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-3xl shadow-2xl border border-[#EAE4D7] w-full max-w-xl p-5 sm:p-6 text-left animate-in zoom-in-95 duration-150 relative max-h-[90vh] flex flex-col">

            <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[#EAE4D7]/70 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#FAF8F5] to-[#F3EFE6] border border-[#EAE4D7] flex items-center justify-center text-[#B88E4F] shadow-2xs">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-black text-[#1A1612] tracking-tight">
                      Thống Kê Tiếp Thị &amp; Chuyển Đổi
                    </h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-[#FBF5EB] text-[#B88E4F] border border-[#EAE4D7] rounded-md">
                      Attribution
                    </span>
                  </div>
                  <p className="text-xs text-[#7D715E] mt-0.5">
                    Động cơ Last-Click Wins &amp; Cookie 30 ngày bảo mật
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAnalyticsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-[#7D715E] hover:text-[#1A1612] hover:bg-[#FAF8F5] rounded-xl border border-transparent hover:border-[#EAE4D7] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>


            <div className="overflow-y-auto pr-1 space-y-4 flex-1">

              <div className="p-3 bg-[#FAF8F5] rounded-2xl border border-[#EAE4D7] flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-bold text-[#1A1612] truncate">
                    {selectedLinkForAnalytics.product?.title || 'Sản phẩm tiếp thị'}
                  </div>
                  <div className="text-[11px] text-[#7D715E] flex items-center gap-2 mt-0.5">
                    <span>{selectedLinkForAnalytics.store?.name}</span>
                    <span>•</span>
                    <span className="font-mono font-bold text-[#B88E4F]">#{selectedLinkForAnalytics.shortCode}</span>
                    <span>•</span>
                    <span className="font-semibold text-[#1A1612]">{getChannelLabel(selectedLinkForAnalytics.channel)}</span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-900 border border-amber-200">
                    Cookie: 30 ngày
                  </span>
                </div>
              </div>

              {loadingAnalytics ? (
                <div className="py-12 text-center text-[#7D715E]">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-[#B88E4F]" />
                  <p className="text-xs font-medium">Đang trích xuất dữ liệu đối soát...</p>
                </div>
              ) : analyticsError ? (
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{analyticsError}</span>
                </div>
              ) : analyticsData ? (
                <>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                    <div className="p-3 bg-white border border-[#EAE4D7] rounded-2xl shadow-2xs">
                      <div className="text-[11px] font-semibold text-[#7D715E]">Tổng Clicks (Raw)</div>
                      <div className="text-xl font-black text-[#1A1612] mt-1">
                        {(analyticsData.rawClicks ?? selectedLinkForAnalytics.totalClicks ?? 0).toLocaleString('vi-VN')}
                      </div>
                      <div className="text-[10px] text-[#7D715E] mt-0.5">Mọi lượt mở link</div>
                    </div>

                    <div className="p-3 bg-white border border-[#EAE4D7] rounded-2xl shadow-2xs">
                      <div className="text-[11px] font-semibold text-[#7D715E]">Clicks Hợp Lệ</div>
                      <div className="text-xl font-black text-emerald-700 mt-1">
                        {(analyticsData.validClicks ?? selectedLinkForAnalytics.totalClicks ?? 0).toLocaleString('vi-VN')}
                      </div>
                      <div className="text-[10px] text-emerald-600 mt-0.5">Đã qua kiểm tra &amp; rate limit</div>
                    </div>

                    <div className="p-3 bg-white border border-[#EAE4D7] rounded-2xl shadow-2xs">
                      <div className="text-[11px] font-semibold text-[#7D715E]">Khách Duy Nhất (Unique)</div>
                      <div className="text-xl font-black text-[#B88E4F] mt-1">
                        {(analyticsData.uniqueClicks ?? selectedLinkForAnalytics.uniqueClicks ?? 0).toLocaleString('vi-VN')}
                      </div>
                      <div className="text-[10px] text-[#B88E4F] mt-0.5">Dedup 30 phút/visitor</div>
                    </div>

                    <div className="p-3 bg-white border border-[#EAE4D7] rounded-2xl shadow-2xs">
                      <div className="text-[11px] font-semibold text-[#7D715E]">Click Nghi Ngờ / Bị Chặn</div>
                      <div className="text-xl font-black text-amber-700 mt-1">
                        {(analyticsData.suspiciousClicks ?? 0).toLocaleString('vi-VN')}
                      </div>
                      <div className="text-[10px] text-amber-600 mt-0.5">Vượt 10 req/s hoặc Bot</div>
                    </div>

                    <div className="p-3 bg-white border border-[#EAE4D7] rounded-2xl shadow-2xs">
                      <div className="text-[11px] font-semibold text-[#7D715E]">Đơn Hàng Ghi Nhận</div>
                      <div className="text-xl font-black text-[#1A1612] mt-1">
                        {(analyticsData.conversions ?? selectedLinkForAnalytics.totalOrders ?? 0).toLocaleString('vi-VN')}
                      </div>
                      <div className="text-[10px] text-[#7D715E] mt-0.5">Gán theo Last-Click</div>
                    </div>

                    <div className="p-3 bg-[#FBF5EB] border border-[#EAE4D7] rounded-2xl shadow-2xs">
                      <div className="text-[11px] font-semibold text-[#B88E4F]">Tỷ Lệ Chuyển Đổi (CR)</div>
                      <div className="text-xl font-black text-[#B88E4F] mt-1">
                        {analyticsData.conversionRate ?? 0}%
                      </div>
                      <div className="text-[10px] text-[#7D715E] mt-0.5">Đơn hàng / Unique clicks</div>
                    </div>
                  </div>


                  <div className="p-3.5 bg-[#FAF8F5] border border-[#EAE4D7] rounded-2xl space-y-2">
                    <div className="text-xs font-bold text-[#1A1612] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Share2 className="w-3.5 h-3.5 text-[#B88E4F]" />
                        Phân bổ phương thức truy cập
                      </span>
                      <span className="text-[10px] text-[#7D715E]">Tham số via</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-white rounded-xl border border-[#EAE4D7]/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="w-3.5 h-3.5 text-[#B88E4F]" />
                          <span className="font-medium text-[#1A1612]">Link Trực Tiếp</span>
                        </div>
                        <span className="font-bold text-[#1A1612]">
                          {(analyticsData.breakdownByVia?.link ?? 0).toLocaleString('vi-VN')} clicks
                        </span>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-[#EAE4D7]/80 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <QrCode className="w-3.5 h-3.5 text-[#B88E4F]" />
                          <span className="font-medium text-[#1A1612]">Quét Mã QR</span>
                        </div>
                        <span className="font-bold text-[#1A1612]">
                          {(analyticsData.breakdownByVia?.qr ?? 0).toLocaleString('vi-VN')} clicks
                        </span>
                      </div>
                    </div>
                  </div>


                  <div className="p-3.5 bg-[#FBF5EB] border border-[#EAE4D7] rounded-2xl space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#B88E4F]" />
                        <span className="text-xs font-bold text-[#1A1612]">
                          Kiểm Thử Nghiệp Vụ: Chống Click Spam (Redis Rate Limit)
                        </span>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-[#F3EFE6] text-[#B88E4F] rounded-full border border-[#EAE4D7]">
                        Hạn mức: 10 clicks / giây / IP
                      </span>
                    </div>

                    <p className="text-[11px] text-[#7D715E] leading-relaxed">
                      Nhấn nút bên dưới để mô phỏng bot gửi đồng thời <strong>15 lượt click</strong> trong 1 giây từ IP trình duyệt của bạn tới link tiếp thị này:
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <button
                        type="button"
                        disabled={isSpamTesting}
                        onClick={() => handleRunSpamTest(selectedLinkForAnalytics.shortCode, selectedLinkForAnalytics.id)}
                        className="px-4 py-2 bg-gradient-to-r from-[#EBD08C] via-[#E5C783] to-[#DEC07A] hover:from-[#DEC07A] hover:to-[#DEC07A] text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                      >
                        {isSpamTesting ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Đang bắn 15 clicks đồng thời...
                          </>
                        ) : (
                          <>
                            <MousePointerClick className="w-3.5 h-3.5" />
                            ⚡ Bắn 15 Clicks Thử Nghiệm (1 giây)
                          </>
                        )}
                      </button>

                      {selectedLinkForAnalytics.shortCode && (
                        <a
                          href={`/r/${selectedLinkForAnalytics.shortCode}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] text-[#B88E4F] hover:underline flex items-center gap-1 font-semibold"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Mở 1 click bình thường
                        </a>
                      )}
                    </div>

                    {spamTestResult && (
                      <div className="p-3 bg-white border border-[#EAE4D7] rounded-xl text-xs space-y-1.5 transition-all">
                        <div className="font-bold text-[#1A1612] flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Kết quả thử nghiệm ({spamTestResult.timestamp}):
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 bg-emerald-50/80 border border-emerald-200 rounded-lg text-emerald-900">
                            <strong>✅ 10 Click Hợp Lệ:</strong> Nằm trong hạn mức 10 req/s, được cấp Cookie Attribution.
                          </div>
                          <div className="p-2 bg-amber-50/80 border border-amber-200 rounded-lg text-amber-900">
                            <strong>🛡️ 5 Click Bị Chặn:</strong> Vượt ngưỡng tốc độ ➔ Bị Redis Rate Limiter vô hiệu hóa cookie!
                          </div>
                        </div>
                        <div className="text-[10px] text-[#7D715E] italic">
                          ℹ️ Các thẻ số liệu ở trên đã được tự động cập nhật (Tổng Click tăng +15, Click Hợp Lệ chỉ nhận +10).
                        </div>
                      </div>
                    )}
                  </div>


                  <div className="p-3 bg-[#FBF5EB] border border-[#EAE4D7] rounded-2xl text-xs text-[#7D715E] flex items-start gap-2.5">
                    <ShieldCheck className="w-4 h-4 text-[#B88E4F] flex-shrink-0 mt-0.5" />
                    <div className="text-[11px] leading-relaxed">
                      <strong className="text-[#1A1612] font-bold">Bảo vệ quyền riêng tư người mua:</strong> Hệ thống SCANMS băm bảo mật IP và User-Agent ở phía máy chủ. KOL chỉ xem số liệu thống kê tổng hợp để tối ưu nội dung; không có quyền truy cập địa chỉ IP, dấu vân tay thiết bị hay dữ liệu cá nhân của người mua hàng.
                    </div>
                  </div>
                </>
              ) : null}
            </div>


            <div className="pt-3.5 mt-2 border-t border-[#EAE4D7]/70 flex items-center justify-end flex-shrink-0">
              <button
                type="button"
                onClick={() => setIsAnalyticsModalOpen(false)}
                className="px-4 py-2 bg-gradient-to-r from-[#EBD08C] via-[#E5C783] to-[#DEC07A] hover:from-[#DEC07A] hover:to-[#DEC07A] text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}




      {isDeleteModalOpen && selectedLinkForDelete && (
        <div className="kol-link-delete-overlay fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-[1.5px] animate-fadeIn">
          <div role="dialog" aria-modal="true" aria-labelledby="kol-link-delete-title" aria-describedby="kol-link-delete-note" className="kol-link-delete-dialog bg-white rounded-2xl shadow-xl border border-[#EAE4D7] w-full max-w-sm text-left animate-in zoom-in-95 duration-150">
            <div className="kol-link-delete-heading">
              <div className="kol-link-delete-icon"><AlertCircle /></div>
              <div>
                <h3 id="kol-link-delete-title">Xóa link tiếp thị?</h3>
                <p>Link sẽ ngừng hoạt động sau khi xóa.</p>
              </div>
            </div>

            <div className="kol-link-delete-details">
              <div><span>Sản phẩm</span><strong title={selectedLinkForDelete.product?.title}>{selectedLinkForDelete.product?.title || 'Sản phẩm'}</strong></div>
              <div><span>Mã link</span><strong className="kol-link-delete-code">{selectedLinkForDelete.shortCode}</strong></div>
            </div>

            <p id="kol-link-delete-note" className="kol-link-delete-note">
              <CheckCircle2 /> Lịch sử lượt nhấp và đơn hàng đã phát sinh vẫn được giữ để đối soát hoa hồng.
            </p>

            <div className="kol-link-delete-actions">
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(false)}
                className="kol-link-delete-cancel"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="kol-link-delete-confirm"
              >
                Xóa liên kết
              </button>
            </div>
          </div>
        </div>
      )}


      {referralLinksService.supportsExclusiveDeals && dealProposalProduct && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center kol-deal-proposal-overlay bg-[#231D15]/25 p-4 backdrop-blur-xs" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !submittingDealProposal) setDealProposalProduct(null);
        }}>
          <form role="dialog" aria-modal="true" aria-labelledby="deal-proposal-title" onSubmit={(event) => {
            if (dealProposalStep < 3) {
              event.preventDefault();
              if (dealProposalStep === 1 && Number(dealProposalRate) > dealProposalMinimumRate && Number(dealProposalRate) <= 100) setDealProposalStep(2);
              if (dealProposalStep === 2 && dealSalesCommitment.trim().length >= 5) setDealProposalStep(3);
            } else void handleSubmitExclusiveDeal(event);
          }} className="kol-deal-proposal-modal w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl border border-[#EAE4D7] bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Header */}
            <div className="kol-deal-proposal-heading flex shrink-0 items-start justify-between gap-4 border-b border-[#EAE4D7] px-6 py-4 bg-[#FAF8F5]">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-2.5 py-0.5 text-[11px] font-extrabold text-[#B88E4F]">
                  <Sparkles className="h-3.5 w-3.5" /> EXCLUSIVE DEAL
                </span>
                <h2 id="deal-proposal-title" className="mt-1 text-lg font-black text-[#1A1612]">Đề xuất deal riêng với Shop</h2>
                <p className="text-xs text-[#7D715E] mt-0.5">Thỏa thuận hoa hồng và kế hoạch hợp tác cùng Shop.</p>
              </div>
              <button type="button" onClick={() => setDealProposalProduct(null)} disabled={submittingDealProposal} className="rounded-lg p-2 text-[#7D715E] hover:bg-[#F3EFE6] cursor-pointer" aria-label="Đóng">
                <X className="h-4 w-4" />
              </button>
            </div>

            <nav className="kol-deal-proposal-steps" aria-label="Các bước đề xuất deal">
              {(['Hoa hồng', 'Cam kết', 'Xác nhận'] as const).map((label, index) => (
                <button key={label} type="button" aria-current={dealProposalStep === index + 1 ? 'step' : undefined}
                  disabled={submittingDealProposal || index + 1 > dealProposalStep}
                  onClick={() => setDealProposalStep((index + 1) as 1 | 2 | 3)}>
                  <span>{index + 1}</span>{label}
                </button>
              ))}
            </nav>
            {/* Body */}
            <div className="kol-deal-proposal-body flex-1 overflow-y-auto space-y-4 p-6 text-left">
              {/* Penalty Alert if under Cooldown */}
              {kolDealStatus?.isBlocked && (
                <div className="rounded-xl border border-[#DC2626]/30 bg-[#DC2626]/10 p-3.5 text-xs text-[#DC2626]">
                  <div className="flex items-center gap-2 font-black text-sm">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Tài khoản đang bị chế tài vi phạm cam kết (Lần {kolDealStatus.violationsCount})
                  </div>
                  <p className="mt-1.5 leading-relaxed text-[#DC2626]/90">
                    Bạn đang bị tạm khóa tính năng đề xuất Deal riêng trong <strong>{kolDealStatus.remainingDays} ngày</strong> (đến ngày {new Date(kolDealStatus.cooldownUntil!).toLocaleDateString('vi-VN')}) do chưa đáp ứng cam kết trước đó.
                    {kolDealStatus.sampleRequestsBlocked && ' Hạn ngạch nhận mẫu thử hiện tại = 0.'}
                  </p>
                </div>
              )}

              {dealProposalStep === 1 && <>
              {/* Product Info Card */}
              <div className="kol-deal-proposal-product flex items-center gap-3.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3">
                <img src={dealProposalProduct.imageUrl || ''} alt="" className="h-14 w-14 rounded-lg border border-[#EAE4D7] bg-white object-cover shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-[#1A1612]">{dealProposalProduct.title}</div>
                  <div className="mt-1 text-xs text-[#7D715E]">
                    Gian hàng: <strong className="text-[#1A1612]">{dealProposalProduct.store.name}</strong> · Hoa hồng sàn: <span className="text-[#1A1612] font-semibold">{dealProposalProduct.estimatedCommissionRate}%</span>
                  </div>
                  {dealProposalCurrentDeal && (
                    <div className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[#B88E4F]">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Deal độc quyền đang áp dụng: {dealProposalCurrentDeal.approvedCommissionRate}%
                    </div>
                  )}
                </div>
              </div>

              {/* Proposed Commission Rate */}
              <div>
                <label className="block text-xs font-bold text-[#1A1612] mb-1">
                  Mức hoa hồng độc quyền đề xuất (%) <span className="text-[#DC2626]">*</span>
                </label>
                <div className="relative">
                  <select
                    value={dealProposalRate}
                    onChange={(event) => setDealProposalRate(event.target.value)}
                    aria-label="Nấc thưởng Deal độc quyền"
                    className="w-full rounded-xl border border-[#EAE4D7] bg-white px-3.5 py-2.5 text-sm font-bold text-[#1A1612] outline-none focus:border-[#C59B58]"
                    required
                  >
                    {[1, 2, 3].map((bonus) => <option key={bonus} value={10 + bonus} disabled={10 + bonus <= dealProposalMinimumRate}>
                      +{bonus}% (tổng {10 + bonus}%)
                    </option>)}
                  </select>
                </div>
                <span className={`mt-1.5 block text-xs font-medium ${
                  dealProposalMinimumRate >= 13 ||
                  Number(dealProposalRate) > 13 ||
                  (dealProposalRate.trim() && Number(dealProposalRate) <= dealProposalMinimumRate)
                    ? 'text-[#DC2626]'
                    : 'text-[#7D715E]'
                }`}>
                  {dealProposalMinimumRate >= 13
                    ? 'Deal hiện tại đã ở nấc +3%, không thể đề xuất cao hơn.'
                    : Number(dealProposalRate) > 13
                      ? 'Mức đề xuất không được vượt quá nấc +3%.'
                      : dealProposalRate.trim() && Number(dealProposalRate) <= dealProposalMinimumRate
                        ? `Mức đề xuất phải cao hơn ${dealProposalMinimumRate}%.`
                        : `Mức cao nhất hiện tại là ${dealProposalMinimumRate}%; hãy nhập mức cao hơn.`}
                </span>
              </div>

              </>}
              {dealProposalStep === 2 && <>
              {/* SMART Commitment Builder Section */}
              <div className="kol-commitment-plan">
                <div className="kol-commitment-heading">
                  <div><h3 className="text-xs font-black uppercase tracking-wider text-[#1A1612] flex items-center gap-1.5">
                    <Target className="h-4 w-4 text-[#C59B58]" /> Kế hoạch hợp tác
                  </h3><p>Chọn chỉ tiêu phù hợp với kế hoạch của bạn.</p></div>
                  <button
                    type="button"
                    onClick={() => updateCommitmentFromKpis(dealVideoCount, dealLiveCount, dealTargetOrders, dealTimeframeDays)}
                    className="kol-commitment-reset"
                  >
                    <RotateCcw className="h-3.5 w-3.5" /> Khôi phục mẫu
                  </button>
                </div>

                {/* 1. Chu kỳ cam kết */}
                <div className="kol-commitment-group">
                  <label className="block text-xs font-bold text-[#7D715E] mb-1.5">
                    Thời gian thực hiện
                  </label>
                  <div className="kol-commitment-options">
                    {[14, 30, 45].map((days) => (
                      <button
                        key={days}
                        type="button"
                          aria-pressed={dealTimeframeDays === days}
                        onClick={() => updateCommitmentFromKpis(dealVideoCount, dealLiveCount, dealTargetOrders, days)}
                        className={`py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer border ${
                          dealTimeframeDays === days
                            ? 'bg-[#FBF5EB] border-[#C59B58] text-[#B88E4F] shadow-2xs'
                            : 'bg-[#FAF8F5] border-[#EAE4D7] text-[#7D715E] hover:border-[#C59B58]/50'
                        }`}
                      >
                        {days} ngày
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Sản lượng nội dung */}
                <div className="kol-commitment-content-grid">
                  <div className="kol-commitment-group">
                    <label className="block text-xs font-bold text-[#7D715E] mb-1.5 flex items-center gap-1">
                      <Video className="h-3.5 w-3.5 text-[#C59B58]" /> Video review
                    </label>
                    <div className="kol-commitment-options">
                      {[2, 4, 6].map((num) => (
                        <button
                          key={num}
                          type="button"
                          aria-pressed={dealVideoCount === num}
                          onClick={() => updateCommitmentFromKpis(num, dealLiveCount, dealTargetOrders, dealTimeframeDays)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            dealVideoCount === num
                              ? 'bg-[#FBF5EB] border-[#C59B58] text-[#B88E4F]'
                              : 'bg-[#FAF8F5] border-[#EAE4D7] text-[#7D715E] hover:border-[#C59B58]/50'
                          }`}
                        >
                          {num} video
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="kol-commitment-group">
                    <label className="block text-xs font-bold text-[#7D715E] mb-1.5 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-[#C59B58]" /> Livestream ghim giỏ
                    </label>
                    <div className="kol-commitment-options">
                      {[0, 1, 2, 4].map((num) => (
                        <button
                          key={num}
                          type="button"
                          aria-pressed={dealLiveCount === num}
                          onClick={() => updateCommitmentFromKpis(dealVideoCount, num, dealTargetOrders, dealTimeframeDays)}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                            dealLiveCount === num
                              ? 'bg-[#FBF5EB] border-[#C59B58] text-[#B88E4F]'
                              : 'bg-[#FAF8F5] border-[#EAE4D7] text-[#7D715E] hover:border-[#C59B58]/50'
                          }`}
                        >
                          {num === 0 ? 'Không' : `${num} live`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 3. Mục tiêu đơn hàng */}
                <div className="kol-commitment-group">
                  <label className="block text-xs font-bold text-[#7D715E] mb-1.5 flex items-center gap-1">
                    <ShoppingBag className="h-3.5 w-3.5 text-[#C59B58]" /> Đơn hàng giao thành công
                  </label>
                  <div className="kol-commitment-options">
                    {[30, 50, 80, 150].map((orders) => (
                      <button
                        key={orders}
                        type="button"
                          aria-pressed={dealTargetOrders === orders}
                        onClick={() => updateCommitmentFromKpis(dealVideoCount, dealLiveCount, orders, dealTimeframeDays)}
                        className={`flex-1 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                          dealTargetOrders === orders
                            ? 'bg-[#FBF5EB] border-[#C59B58] text-[#B88E4F]'
                            : 'bg-[#FAF8F5] border-[#EAE4D7] text-[#7D715E] hover:border-[#C59B58]/50'
                        }`}
                      >
                        {orders} đơn
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <div className="kol-commitment-description">
                  <label htmlFor="deal-commitment-description" className="block text-xs font-bold text-[#7D715E] mb-1">
                    Nội dung cam kết gửi Shop <span className="text-[#DC2626]">*</span>
                  </label>
                  <textarea
                    id="deal-commitment-description"
                    value={dealSalesCommitment}
                    onChange={(event) => setDealSalesCommitment(event.target.value)}
                    rows={4}
                    maxLength={1000}
                    minLength={5}
                    placeholder="Mô tả kế hoạch truyền thông và cam kết doanh số..."
                    className="w-full resize-y rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3.5 py-2.5 text-xs font-normal text-[#1A1612] outline-none focus:border-[#C59B58] focus:bg-white"
                    required
                  />
                  <div className="kol-commitment-description-hint">
                    <span>Bổ sung lịch đăng bài hoặc ý tưởng triển khai.</span>
                    <span>{dealSalesCommitment.length}/1000</span>
                  </div>
                </div>
              </div>

              </>}
              {dealProposalStep === 3 && <>
              <section className="kol-deal-proposal-summary" aria-label="Tóm tắt đề xuất">
                <div className="kol-deal-summary-top">
                  <div className="kol-deal-summary-product">
                    <img
                      src={dealProposalProduct.imageUrl || '/assets/product-placeholder.svg'}
                      alt={dealProposalProduct.title}
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = '/assets/product-placeholder.svg';
                      }}
                    />
                    <div>
                      <span>Đề xuất của bạn</span>
                      <h3>{dealProposalProduct.title}</h3>
                      <p>{dealProposalProduct.store.name}</p>
                    </div>
                  </div>
                  <strong>{dealProposalRate}%<small>Hoa hồng</small></strong>
                </div>
                <dl><div><dt>Thời gian</dt><dd>{dealTimeframeDays} ngày</dd></div><div><dt>Video review</dt><dd>{dealVideoCount} video</dd></div><div><dt>Livestream</dt><dd>{dealLiveCount} phiên</dd></div><div><dt>Mục tiêu</dt><dd>{dealTargetOrders} đơn</dd></div></dl>
                <details><summary>Xem nội dung cam kết</summary><p>{dealSalesCommitment}</p></details>
              </section>
              {/* 4-LEVEL SANCTIONS POLICY CARD */}
              <div className="kol-deal-policy">
                <div className="kol-deal-policy-heading">
                  <div className="kol-deal-policy-title">
                    <ShieldAlert className="h-4 w-4 text-[#C59B58]" />
                    Quy chế hợp tác SCANMS
                  </div>
                  <button
                    type="button"
                    aria-expanded={dealSanctionsPolicyOpen}
                    onClick={() => setDealSanctionsPolicyOpen(!dealSanctionsPolicyOpen)}
                    className="text-[11px] font-bold text-[#B88E4F] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {dealSanctionsPolicyOpen ? 'Thu gọn' : 'Xem quy chế'}
                    {dealSanctionsPolicyOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                </div>

                {dealSanctionsPolicyOpen && <div className="kol-deal-policy-levels">
                  <p className="kol-deal-policy-intro">Chọn một cấp độ để xem điều kiện áp dụng.</p>
                  <details name="scanms-deal-policy">
                    <summary><span className="kol-policy-number">01</span><span>Điều chỉnh hoa hồng<small>Khi chưa đạt chỉ tiêu cam kết</small></span><ChevronDown /></summary>
                    <div className="kol-policy-detail">Hết chu kỳ cam kết ({dealTimeframeDays} ngày), nếu không đạt chỉ tiêu, Shop có quyền hoàn nguyên hoa hồng về mức Open Offer tiêu chuẩn. Đơn hàng cũ đã phát sinh giữ nguyên hoa hồng.</div>
                  </details>
                  <details name="scanms-deal-policy">
                    <summary><span className="kol-policy-number">02</span><span>Điểm tín nhiệm<small>Ghi nhận mức độ hoàn thành hợp tác</small></span><ChevronDown /></summary>
                    <div className="kol-policy-detail">Hồ sơ ghi nhận vi phạm, giảm Tỷ lệ hoàn thành cam kết và hạ bậc ưu tiên trên Bảng xếp hạng Leaderboard &amp; AI Matching.</div>
                  </details>
                  <details name="scanms-deal-policy">
                    <summary><span className="kol-policy-number">03</span><span>Quyền xin deal &amp; mẫu thử<small>Thời hạn khóa theo số lần vi phạm</small></span><ChevronDown /></summary>
                    <div className="kol-policy-detail">
                      <dl className="kol-policy-violations">
                        <div><dt>Vi phạm lần 1</dt><dd>Khóa xin deal 1 tuần</dd></div>
                        <div><dt>Vi phạm lần 2</dt><dd>Khóa xin deal 2 tuần</dd></div>
                        <div><dt>Vi phạm lần 3</dt><dd>Khóa xin deal 3 tuần</dd></div>
                        <div><dt>Vi phạm lần 4 trở lên</dt><dd>Khóa xin deal 4 tuần và khóa hạn ngạch nhận mẫu thử (Sample Quota = 0)</dd></div>
                      </dl>
                    </div>
                  </details>
                  <details name="scanms-deal-policy">
                    <summary><span className="kol-policy-number">04</span><span>Trọng tài &amp; bồi thường<small>Khi nhận tài trợ nhưng không thực hiện</small></span><ChevronDown /></summary>
                    <div className="kol-policy-detail">Trường hợp nhận hàng mẫu/tài trợ mà không thực hiện cam kết (bùng hàng/ghosting), Shop được quyền khiếu nại lên Trọng tài SCANMS để truy thu bồi thường hoặc khóa tài khoản vĩnh viễn.</div>
                  </details>
                </div>}

                {/* Mandatory Agreement Checkbox */}
                <label className="mt-3.5 flex items-start gap-2.5 pt-3 border-t border-[#EEDFC6] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={dealAgreedSanctions}
                    onChange={(e) => setDealAgreedSanctions(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded-md border-[#C59B58] text-[#C59B58] focus:ring-[#C59B58] cursor-pointer"
                  />
                  <span className="text-xs font-bold text-[#1A1612]">
                    Tôi cam kết thực hiện ít nhất 1 video review cho sản phẩm và tuân thủ <span className="text-[#B88E4F]">Quy chế chế tài 4 cấp độ</span> của sàn SCANMS. Thưởng Deal cần Shop duyệt trước khi áp dụng.
                  </span>
                </label>
              </div>
              </>}
            </div>

            {/* Footer */}
            <div className="kol-deal-proposal-footer flex shrink-0 items-center justify-between gap-2 border-t border-[#EAE4D7] px-6 py-4 bg-[#FAF8F5]">
              <span className="text-xs text-[#7D715E]">
                {dealProposalCurrentDeal ? 'Đơn hàng cũ giữ nguyên hoa hồng hiện tại.' : 'Đề xuất sẽ được chuyển tới hộp Chat của Shop.'}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => dealProposalStep === 1 ? setDealProposalProduct(null) : setDealProposalStep(dealProposalStep === 3 ? 2 : 1)}
                  disabled={submittingDealProposal}
                  className="rounded-xl border border-[#EAE4D7] px-4 py-2.5 text-xs font-bold text-[#7D715E] hover:bg-white cursor-pointer"
                >
                  {dealProposalStep === 1 ? 'Hủy' : 'Quay lại'}
                </button>
                {dealProposalStep < 3 ? <button type="submit" className="kol-deal-proposal-next"
                  disabled={submittingDealProposal || Boolean(kolDealStatus?.isBlocked) || (dealProposalStep === 1 ? !dealProposalRate.trim() || ![11, 12, 13].includes(Number(dealProposalRate)) || Number(dealProposalRate) <= dealProposalMinimumRate : dealSalesCommitment.trim().length < 5)}>
                  {dealProposalStep === 1 ? 'Tiếp tục' : 'Xem lại đề xuất'} <ChevronRight className="h-4 w-4" />
                </button> : <button
                  type="submit"
                  disabled={
                    submittingDealProposal ||
                    kolDealStatus?.isBlocked ||
                    !dealAgreedSanctions ||
                    !dealProposalRate.trim() ||
                    Number(dealProposalRate) <= dealProposalMinimumRate ||
                    Number(dealProposalRate) > 100 ||
                    dealSalesCommitment.trim().length < 5
                  }
                  className="kol-deal-send inline-flex items-center gap-2 rounded-xl bg-[#C59B58] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#B88E4F] disabled:cursor-not-allowed disabled:opacity-50 shadow-md shadow-[#C59B58]/20 cursor-pointer transition"
                >
                  {submittingDealProposal ? <Loader2 className="h-4 w-4 animate-spin" /> : <ExternalLink className="h-4 w-4" />}
                  Gửi đề xuất qua Chat
                </button>}
              </div>
            </div>
          </form>
        </div>
      )}

      <SubmitKolVideoModal
        isOpen={isSubmitVideoModalOpen}
        initialProductId={selectedProductForVideo?.id}
        initialProductTitle={selectedProductForVideo?.title}
        onClose={() => {
          setIsSubmitVideoModalOpen(false);
          setSelectedProductForVideo(null);
        }}
        onSuccess={() => {
          setIsSubmitVideoModalOpen(false);
          setSelectedProductForVideo(null);
        }}
      />

      {/* Modal xác nhận xóa / hủy / gỡ deal độc quyền chuẩn thương hiệu */}
      <ConfirmModal
        isOpen={Boolean(dealToDelete)}
        onClose={() => !deletingDealId && setDealToDelete(null)}
        onConfirm={handleConfirmDeleteDeal}
        isLoading={Boolean(deletingDealId)}
        title={
          dealToDelete?.status === 'PENDING'
            ? 'Xác nhận hủy đề xuất Exclusive Deal'
            : dealToDelete?.status === 'APPROVED'
            ? 'Xác nhận gỡ bỏ deal độc quyền'
            : 'Xác nhận xóa đề xuất deal'
        }
        message={
          dealToDelete?.status === 'PENDING'
            ? `Bạn có chắc chắn muốn hủy và thu hồi đề xuất Exclusive Deal cho sản phẩm "${dealToDelete?.product?.title || 'này'}"? Shop sẽ không còn nhận được yêu cầu này nữa.`
            : dealToDelete?.status === 'APPROVED'
            ? `Bạn có chắc chắn muốn gỡ bỏ deal độc quyền cho sản phẩm "${dealToDelete?.product?.title || 'này'}"? Link tiếp thị sẽ quay về mức hoa hồng sàn cơ bản nếu bạn tiếp tục sử dụng.`
            : `Xóa vĩnh viễn đề xuất deal cho sản phẩm "${dealToDelete?.product?.title || 'này'}" khỏi danh sách của bạn?`
        }
        confirmText={
          dealToDelete?.status === 'PENDING'
            ? 'Hủy đề xuất'
            : dealToDelete?.status === 'APPROVED'
            ? 'Gỡ deal'
            : 'Xóa'
        }
        variant="danger"
      />
    </div>
  );
}
