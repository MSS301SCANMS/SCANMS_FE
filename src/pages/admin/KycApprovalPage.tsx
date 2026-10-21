import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreditCard,
  Search,
  CheckCircle2,
  Eye,
  ExternalLink,
  ShieldCheck,
  Clock,
  AlertCircle,
  X,
  Store,
  Sparkles,
  MapPin,
  BadgeCheck,
  FileText,
} from 'lucide-react';
import { kycService } from '../../services/kyc.service';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import './shop-application-review.css';
import './kol-application-review.css';

function readKycMetadata(value: unknown): Record<string, any> {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value as Record<string, any>;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function formatKycDate(value?: string | Date | null): string {
  if (!value) return 'Chưa có thông tin';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Chưa có thông tin' : date.toLocaleString('vi-VN');
}

export default function KycApprovalPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'kol' | 'shop'>('shop');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('REVIEW_PENDING');

  // Inspect modals
  const [inspectProfileSnapshot, setInspectProfile] = useState<any | null>(null);
  const [inspectStoreSnapshot, setInspectStore] = useState<any | null>(null);

  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [shopReviewIntent, setShopReviewIntent] = useState<'NEEDS_INFO' | 'REJECTED' | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const shopRejectInput = useRef<HTMLTextAreaElement>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (inspectStoreSnapshot && showRejectInput && shopReviewIntent) {
      shopRejectInput.current?.focus({ preventScroll: true });
      shopRejectInput.current?.scrollIntoView({ block: 'center' });
    }
  }, [inspectStoreSnapshot, showRejectInput, shopReviewIntent]);

  // TanStack Query: Caching danh sách hồ sơ nâng cấp tổng hợp (KOL + Shop)
  const {
    data: applicationsData,
    isLoading: loading,
    isFetching,
    error: loadError,
    refetch: loadApplications,
  } = useQuery({
    queryKey: ['upgrade-applications'],
    queryFn: async () => {
      const res = await kycService.getUpgradeApplications();
      return res;
    },
    staleTime: 0,
    refetchInterval: 15000,
    refetchOnWindowFocus: true,
  });

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Mutation: Duyệt/Từ chối KOL
  const reviewKolMutation = useMutation({
    mutationFn: async ({
      profileId,
      status,
      reason,
    }: {
      profileId: string;
      status: 'VERIFIED' | 'REJECTED';
      reason?: string;
    }) => {
      return kycService.reviewKolApplication(profileId, status, reason);
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['upgrade-applications'] });
      showToast(`Đã ${status === 'VERIFIED' ? 'phê duyệt cấp Tích Xanh KOL' : 'từ chối'} hồ sơ thành công!`);
      if (status === 'VERIFIED') setFilterStatus('ALL');
      setInspectProfile(null);
      setShowRejectInput(false);
      setRejectReason('');
    },
    onError: (err: any) => {
      showToast(err.message || 'Thao tác phê duyệt thất bại', 'error');
    },
  });

  const syncKolRoleMutation = useMutation({
    mutationFn: (profileId: string) => kycService.syncApprovedKolRole(profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['upgrade-applications'] });
      showToast('Đã đồng bộ lại quyền Đối tác KOL Tiếp Thị cho tài khoản.');
      setInspectProfile(null);
    },
    onError: (err: any) => showToast(err.message || 'Không đồng bộ được quyền KOL.', 'error'),
  });

  // Mutation: Duyệt/Từ chối Gian Hàng (Shop)
  const reviewShopMutation = useMutation({
    mutationFn: async ({
      storeId,
      status,
      reason,
    }: {
      storeId: string;
      status: 'VERIFIED' | 'NEEDS_INFO' | 'REJECTED';
      reason?: string;
    }) => {
      return kycService.reviewShopApplication(storeId, status, reason);
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['upgrade-applications'] });
      showToast(
        status === 'VERIFIED'
          ? 'Đã xác minh và kích hoạt gian hàng.'
          : status === 'NEEDS_INFO'
            ? 'Đã gửi yêu cầu bổ sung hồ sơ cho Shop.'
            : 'Đã từ chối hồ sơ gian hàng.',
      );
      setInspectStore(null);
      setShowRejectInput(false);
      setShopReviewIntent(null);
      setRejectReason('');
    },
    onError: (err: any) => {
      showToast(err.message || 'Thao tác phê duyệt gian hàng thất bại', 'error');
    },
  });

  const handleReviewKol = async (profileId: string, status: 'VERIFIED' | 'REJECTED') => {
    if (reviewKolMutation.isPending || inspectProfile?.kycStatus !== 'UNVERIFIED') return;
    if (status === 'VERIFIED' && inspectProfile.missingRequiredFields.length > 0) {
      showToast('Hồ sơ còn thiếu thông tin bắt buộc, chưa thể phê duyệt.', 'error');
      return;
    }
    if (status === 'REJECTED' && !showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    if (status === 'REJECTED' && !rejectReason.trim()) {
      showToast('Vui lòng nhập lý do từ chối hồ sơ.', 'error');
      return;
    }
    reviewKolMutation.mutate({ profileId, status, reason: rejectReason.trim() || undefined });
  };

  const handleReviewShop = async (
    storeId: string,
    status: 'VERIFIED' | 'NEEDS_INFO' | 'REJECTED',
  ) => {
    if (status !== 'VERIFIED' && (!showRejectInput || shopReviewIntent !== status)) {
      setShowRejectInput(true);
      setShopReviewIntent(status);
      setRejectReason('');
      return;
    }
    if (status !== 'VERIFIED' && !rejectReason.trim()) {
      showToast('Vui lòng ghi nội dung cần bổ sung hoặc lý do từ chối.', 'error');
      return;
    }
    reviewShopMutation.mutate({ storeId, status, reason: rejectReason.trim() || undefined });
  };

  // Chuẩn hóa dữ liệu hiển thị KOL
  const rawKols = applicationsData?.kolApplications || [];
  const displayKols = rawKols.map((p: any) => {
    const rawKyc = p.kycStatus === 'PENDING' ? 'UNVERIFIED' : p.kycStatus || 'UNVERIFIED';
    const isVerified = rawKyc === 'VERIFIED';
    const isRejected = rawKyc === 'REJECTED';
    const fullName = p.fullName || p.user?.fullName || 'Đối tác SCANMS';
    const socialLinks = readKycMetadata(p.socialLinksJson);
    const socialChannels = p.user?.socialChannels || [];
    const primaryChannel = socialChannels.find((channel: any) => channel.isPrimary) || socialChannels[0];
    const frontCardUrl = socialLinks.frontCardUrl || null;
    const backCardUrl = socialLinks.backCardUrl || null;
    const channelUrl = socialLinks.channelUrl || primaryChannel?.channelUrl || null;
    const missingRequiredFields = [
      !p.idCardNumber?.trim() && 'Số CCCD',
      !frontCardUrl && 'Ảnh CCCD mặt trước',
      !backCardUrl && 'Ảnh CCCD mặt sau',
      !p.bankName?.trim() && 'Ngân hàng',
      !p.bankAccountNumber?.trim() && 'Số tài khoản',
      !p.bankAccountName?.trim() && 'Tên chủ tài khoản',
      !channelUrl && 'Đường dẫn kênh',
    ].filter(Boolean);

    return {
      id: p.id,
      fullName,
      avatarUrl: p.user?.avatarUrl || p.avatarUrl || null,
      email: p.user?.email || 'Chưa cung cấp email',
      phone: p.user?.phoneNumber || 'Chưa cung cấp',
      role: p.user?.role || 'CUSTOMER',
      kycStatus: rawKyc,
      kycLabel: isVerified ? 'Đã xác minh' : isRejected ? 'Từ chối' : 'Chờ thẩm định',
      tier: p.tier?.name || 'KOL Tiêu chuẩn',
      createdAt: formatKycDate(socialLinks.submittedAt || p.updatedAt || p.createdAt),
      status: isVerified ? 'active' : isRejected ? 'rejected' : 'pending',
      avatar: fullName[0]?.toUpperCase() || 'K',
      avatarBg: isVerified ? 'bg-[#FBF5EB] text-[#B88E4F] border border-[#EAE4D7]' : isRejected ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800',
      idCardNumber: p.idCardNumber || 'Chưa cung cấp',
      taxCode: p.taxCode || 'Chưa nộp',
      bankName: p.bankName || 'Chưa cung cấp',
      accountNumber: p.bankAccountNumber || 'Chưa cung cấp',
      accountHolder: p.bankAccountName || 'Chưa cung cấp',
      bio: p.bio || '',
      frontCardUrl,
      backCardUrl,
      channelProofUrl: socialLinks.channelProofUrl || null,
      channelPlatform: socialLinks.platform || primaryChannel?.platformName || null,
      channelName: socialLinks.channelName || primaryChannel?.channelName || null,
      channelUrl,
      followerCount: socialLinks.followerCount ?? primaryChannel?.followerCount ?? p.totalFollowers ?? 0,
      socialChannels,
      missingRequiredFields,
      channelsList: (socialLinks.channels && socialLinks.channels.length > 0)
        ? socialLinks.channels
        : (p.user?.socialChannels && p.user.socialChannels.length > 0)
          ? p.user.socialChannels.map((c: any) => ({
              platform: c.platformName || c.platform,
              channelName: c.channelName,
              channelUrl: c.channelUrl,
              followerCount: c.followerCount,
              channelProofUrl: socialLinks.channelProofUrl,
              isPrimary: c.isPrimary,
            }))
          : socialLinks.channelUrl
            ? [{
                platform: socialLinks.platform || 'TIKTOK',
                channelName: socialLinks.channelName || '',
                channelUrl: socialLinks.channelUrl,
                followerCount: socialLinks.followerCount || p.totalFollowers || 0,
                channelProofUrl: socialLinks.channelProofUrl,
                isPrimary: true,
              }]
            : [],
      specialtyCategories: socialLinks.specialtyCategories || [],
      contentStyles: socialLinks.contentStyles || [],
    };
  });

  // Chuẩn hóa dữ liệu hiển thị Shop
  const rawShops = applicationsData?.shopApplications || [];
  const displayShops = rawShops.map((s: any) => {
    let legalDocs: any = {};
    if (s.onboardingData && typeof s.onboardingData === 'object') {
      legalDocs = s.onboardingData;
    } else {
      try {
        if (s.policyReturn && s.policyReturn.startsWith('{')) {
          legalDocs = JSON.parse(s.policyReturn);
        }
      } catch {
        legalDocs = {};
      }
    }

    const onboardingStatus = s.onboardingStatus || (s.isVerified ? 'VERIFIED' : 'PENDING_APPROVAL');
    const statusLabels: Record<string, string> = {
      DRAFT: 'Bản nháp',
      PENDING_APPROVAL: 'Chờ duyệt hồ sơ',
      NEEDS_INFO: 'Cần Shop bổ sung',
      VERIFIED: 'Đã xác minh',
      REJECTED: 'Đã từ chối',
    };

    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      hasSavedDetails: Object.keys(legalDocs).length > 0,
      ownerName: legalDocs.representativeName || s.owner?.fullName || legalDocs.bankAccountName || 'Chủ gian hàng',
      ownerEmail: s.owner?.email || legalDocs.contactEmail || 'Chưa cung cấp',
      ownerPhone: s.owner?.phoneNumber || legalDocs.contactPhone || 'Chưa cập nhật',
      contactEmail: legalDocs.contactEmail || 'Chưa cung cấp',
      contactPhone: legalDocs.contactPhone || 'Chưa cung cấp',
      warehouseAddress: legalDocs.warehouseAddress || 'Chưa cung cấp địa chỉ kho',
      businessType: ({ INDIVIDUAL: 'Cá nhân', HOUSEHOLD: 'Hộ kinh doanh', ENTERPRISE: 'Doanh nghiệp' } as Record<string, string>)[legalDocs.businessType] || legalDocs.businessType || 'Chưa cung cấp',
      taxCode: legalDocs.taxCode || 'Chưa nộp',
      businessLicenseUrl: legalDocs.businessLicenseUrl || null,
      brandAuthorizationUrl: legalDocs.brandAuthorizationUrl || null,
      bankName: legalDocs.bankName || 'Chưa cung cấp',
      accountNumber: legalDocs.bankAccountNumber || 'Chưa cung cấp',
      accountHolder: legalDocs.bankAccountName || 'Chưa cung cấp',
      idCardNumber: legalDocs.idCardNumber || null,
      frontCardUrl: legalDocs.frontCardUrl || null,
      backCardUrl: legalDocs.backCardUrl || null,
      isVerified: s.isVerified,
      onboardingStatus,
      reviewNote: s.onboardingReviewNote || null,
      reviewerName: s.onboardingReviewer?.fullName || null,
      reviewedAt: s.onboardingReviewedAt ? new Date(s.onboardingReviewedAt).toLocaleString('vi-VN') : null,
      statusLabel: statusLabels[onboardingStatus] || 'Chờ duyệt hồ sơ',
      createdAt: s.onboardingSubmittedAt || legalDocs.submittedAt ? new Date(s.onboardingSubmittedAt || legalDocs.submittedAt).toLocaleDateString('vi-VN') : 'Chưa ghi nhận ngày nộp',
      missingRequiredFields: [
        !s.name?.trim() && 'Tên gian hàng',
        !legalDocs.businessType?.trim() && 'Loại hình kinh doanh',
        !legalDocs.taxCode?.trim() && 'Mã số thuế',
        !legalDocs.idCardNumber?.trim() && 'Số CCCD',
        !legalDocs.frontCardUrl && 'CCCD mặt trước',
        !legalDocs.backCardUrl && 'CCCD mặt sau',
        !legalDocs.businessLicenseUrl && 'Giấy phép kinh doanh',
        !legalDocs.warehouseAddress?.trim() && 'Địa chỉ kho',
        !legalDocs.contactPhone?.trim() && 'Điện thoại liên hệ',
        !legalDocs.contactEmail?.trim() && 'Email đối soát',
        !legalDocs.bankName?.trim() && 'Ngân hàng',
        !legalDocs.bankAccountNumber?.trim() && 'Số tài khoản',
        !legalDocs.bankAccountName?.trim() && 'Tên chủ tài khoản',
      ].filter(Boolean),
    };
  });

  const inspectProfile = displayKols.find(profile => profile.id === inspectProfileSnapshot?.id) || inspectProfileSnapshot;

  // Keep the open review in sync when the applicant updates a pending application.
  const inspectStore = displayShops.find(s => s.id === inspectStoreSnapshot?.id) || inspectStoreSnapshot;

  const filteredKols = displayKols.filter((u: any) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.idCardNumber.includes(search);
    const matchStatus = filterStatus === 'ALL' || u.kycStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const filteredShops = displayShops.filter((s: any) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      s.ownerEmail.toLowerCase().includes(search.toLowerCase()) ||
      s.taxCode.includes(search);
    const matchStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'REVIEW_PENDING' && ['PENDING_APPROVAL', 'NEEDS_INFO'].includes(s.onboardingStatus)) ||
      filterStatus === s.onboardingStatus;
    return matchSearch && matchStatus;
  });

  const pendingKolCount = displayKols.filter((u: any) => u.kycStatus === 'UNVERIFIED').length;
  const verifiedKolCount = displayKols.filter((u: any) => u.kycStatus === 'VERIFIED').length;
  const pendingShopCount = displayShops.filter((s: any) => ['PENDING_APPROVAL', 'NEEDS_INFO'].includes(s.onboardingStatus)).length;
  const verifiedShopCount = displayShops.filter((s: any) => s.isVerified).length;
  useEffect(() => {
    if (!loading && !loadError && !applicationsData?.errors?.shop && activeTab === 'shop' && pendingShopCount === 0 && filterStatus === 'REVIEW_PENDING') {
      setFilterStatus('ALL');
    }
  }, [loading, loadError, applicationsData, activeTab, pendingShopCount, filterStatus]);

  const applicationError = loadError ? 'Chưa tải được danh sách hồ sơ. Vui lòng thử lại.' : applicationsData?.errors?.[activeTab];

  return (
    <div className="w-full min-w-0 pb-6 flex flex-col gap-4 text-left">
      {toastMsg && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2 border ${
            toastMsg.type === 'error'
              ? 'bg-rose-50 text-rose-700 border-rose-200'
              : 'bg-[#FBF5EB] text-[#8F682E] border-[#EEDFC6]'
          }`}
        >
          {toastMsg.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-600" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#B88E4F]" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Ảnh phóng to Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[70] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-5xl max-h-[90dvh] overflow-hidden rounded-2xl bg-white p-2">
            <button
              aria-label="Đóng ảnh phóng to"
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Chi tiết tài liệu"
              className="max-h-[85dvh] max-w-full w-auto rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}

      {/* TOP TABS: KOL VS SHOP */}
      <div className="rounded-2xl border border-[#EAE4D7] bg-white p-1.5" aria-label="Loại hồ sơ">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <button type="button" aria-pressed={activeTab === 'kol'} onClick={() => { setActiveTab('kol'); setSearch(''); setFilterStatus('ALL'); }} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${activeTab === 'kol' ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#231D15]' : 'border-transparent text-[#7D715E] hover:bg-[#FAF8F5]'}`}>
            <Sparkles className="h-4 w-4 text-[#B88E4F]" /><span>Đối tác KOL</span><span className="rounded-full bg-[#FBF5EB] px-2 py-0.5 text-[10px] text-[#8F682E]">{pendingKolCount} chờ duyệt</span>
          </button>
          <button type="button" aria-pressed={activeTab === 'shop'} onClick={() => { setActiveTab('shop'); setSearch(''); setFilterStatus(pendingShopCount > 0 ? 'REVIEW_PENDING' : 'ALL'); }} className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${activeTab === 'shop' ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#231D15]' : 'border-transparent text-[#7D715E] hover:bg-[#FAF8F5]'}`}>
            <Store className="h-4 w-4 text-[#8F7B5E]" /><span>Gian hàng</span><span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] text-[#7D715E]">{pendingShopCount} chờ duyệt</span>
          </button>
        </div>
      </div>

      {applicationError ? (
        <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-5 text-sm text-rose-700">
          <p>{applicationError}</p>
          <button type="button" className="mt-3 rounded-xl border border-[#EEDFC6] px-4 py-2 text-[#795A2D]" disabled={isFetching} onClick={() => void loadApplications()}>Thử tải lại</button>
        </div>
      ) : loading ? <div role="status" className="rounded-2xl border border-[#EAE4D7] bg-white p-8 text-center text-sm text-[#7D715E]">Đang tải hồ sơ xét duyệt…</div> : <>
      {/* THẺ THỐNG KÊ */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[
          { label: activeTab === 'kol' ? 'Đã xác minh' : 'Gian hàng đã duyệt', value: activeTab === 'kol' ? verifiedKolCount : verifiedShopCount, filter: 'VERIFIED', hint: activeTab === 'kol' ? 'Đối tác đủ điều kiện hoạt động' : 'Đã hoàn tất xác minh', icon: <ShieldCheck className="h-4 w-4" /> },
          { label: activeTab === 'kol' ? 'Tổng hồ sơ KOL' : 'Tổng hồ sơ gian hàng', value: activeTab === 'kol' ? displayKols.length : displayShops.length, filter: 'ALL', hint: 'Xem tất cả hồ sơ', icon: <CreditCard className="h-4 w-4" /> },
          { label: 'Chờ thẩm định', value: activeTab === 'kol' ? pendingKolCount : pendingShopCount, filter: activeTab === 'kol' ? 'UNVERIFIED' : 'REVIEW_PENDING', hint: 'Xem hồ sơ cần xử lý', icon: <Clock className="h-4 w-4" /> },
        ].map((stat, index) => (
          <button type="button" key={stat.label} aria-pressed={filterStatus === stat.filter} onClick={() => { setFilterStatus(stat.filter); setSearch(''); }} className="flex items-center justify-between gap-3 rounded-2xl border border-[#EAE4D7] bg-white px-4 py-3.5 text-left transition hover:border-[#C59B58] cursor-pointer min-h-[104px]">
            <div className="min-w-0"><span className="block text-xs font-medium text-[#7D715E]">{stat.label}</span><strong className="mt-1 block text-2xl font-bold leading-none tabular-nums text-[#1A1612]">{stat.value}</strong><span className="mt-1.5 block text-[10px] text-[#9A8D78]">{stat.hint}</span></div>
            <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border ${index === 2 && stat.value > 0 ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8F682E]' : 'border-[#EAE4D7] bg-[#FAF8F5] text-[#B88E4F]'}`}>{stat.icon}</span>
          </button>
        ))}
      </div>

      {/* BỘ LỌC TÌM KIẾM */}
      <Card className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_230px_auto] items-center gap-3 rounded-2xl border-[#EAE4D7] bg-white p-3.5 shadow-none">
        <Input
          aria-label={activeTab === 'kol' ? 'Tìm hồ sơ KOL' : 'Tìm hồ sơ gian hàng'}
          placeholder={activeTab === 'kol' ? 'Tìm theo tên KOL, email hoặc CCCD...' : 'Tìm theo tên gian hàng, chủ shop hoặc MST...'}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          clearable
          onClear={() => setSearch('')}
          icon={<Search className="h-4 w-4 text-[#8F7B5E]" />}
          className="border-[#EAE4D7] bg-white focus-within:border-[#C59B58] focus-within:ring-[#C59B58]/15"
        />

        <Select
          aria-label="Lọc trạng thái hồ sơ"
          className="w-full"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={activeTab === 'shop'
            ? [
                { value: 'ALL', label: 'Tất cả trạng thái' },
                { value: 'REVIEW_PENDING', label: 'Chờ thẩm định (tất cả)' },
                { value: 'PENDING_APPROVAL', label: 'Chờ duyệt hồ sơ' },
                { value: 'VERIFIED', label: 'Đã xác minh' },
                { value: 'REJECTED', label: 'Đã từ chối' },
              ]
            : [
                { value: 'ALL', label: 'Tất cả trạng thái' },
                { value: 'VERIFIED', label: 'Đã xác minh (Tích Xanh)' },
                { value: 'UNVERIFIED', label: 'Chờ duyệt hồ sơ' },
                { value: 'REJECTED', label: 'Bị từ chối' },
              ]}
        />
        <span className="whitespace-nowrap text-xs text-[#7D715E]" aria-live="polite">{activeTab === 'kol' ? filteredKols.length : filteredShops.length} kết quả</span>
      </Card>

      {/* TAB 1: BẢNG DUYỆT KOL */}
      {activeTab === 'kol' && (
        <Card className="overflow-hidden rounded-2xl border-[#EAE4D7] bg-white p-0 shadow-none">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE4D7] bg-white px-4 py-3.5 sm:px-5">
            <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]"><Sparkles className="h-4 w-4" /></span><div><h2 className="m-0 text-sm font-bold text-[#1A1612]">Danh sách đối tác KOL</h2><p className="mb-0 mt-0.5 text-[11px] text-[#7D715E]">Hồ sơ, kênh mạng xã hội và trạng thái xác minh</p></div></div>
            <div className="kyc-list-counts">
              <span className="kyc-pending-count">{pendingKolCount} chờ duyệt</span>
              <span className="rounded-full border border-[#EAE4D7] bg-[#FAF8F5] px-3 py-1 text-[11px] font-semibold text-[#7D715E]">{filteredKols.length} / {displayKols.length} hồ sơ</span>
            </div>
          </div>
          <div className="max-w-full overflow-x-auto" role="region" aria-label="Danh sách hồ sơ KOL" tabIndex={0}>
            <table className="w-full min-w-[980px] table-fixed border-collapse text-left text-xs">
              <colgroup><col className="w-[20%]" /><col className="w-[21%]" /><col className="w-[17%]" /><col className="w-[10%]" /><col className="w-[14%]" /><col className="w-[10%]" /><col className="w-[8%]" /></colgroup>
              <thead>
                <tr className="border-b border-[#EAE4D7] bg-[#FAF8F5]">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7D715E]">Đối tác KOL</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7D715E]">Email &amp; điện thoại</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7D715E]">Kênh mạng xã hội</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7D715E]">Followers</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7D715E]">Trạng thái</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7D715E]">Ngày nộp</th>
                  <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#7D715E]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1ECE3]">
                {filteredKols.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#7D715E]">
                      <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-[#FAF8F5] text-[#B88E4F]"><Search className="h-5 w-5" /></div>
                      <div className="font-bold text-[#1A1612]">Không tìm thấy hồ sơ KOL</div>
                      <div className="mt-1 text-[11px] text-[#7D715E]">Thử đổi từ khóa hoặc trạng thái lọc.</div>
                    </td>
                  </tr>
                ) : (
                  filteredKols.map((u: any) => (
                    <tr key={u.id} className="transition-colors hover:bg-[#FAF8F5]/70">
                      <td className="px-4 py-3 align-middle">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <span
                            className={`h-9 w-9 shrink-0 overflow-hidden rounded-xl flex items-center justify-center font-bold text-xs ${u.avatarBg}`}
                          >
                            {u.avatarUrl ? <img src={u.avatarUrl} alt={u.fullName} className="h-full w-full object-cover" /> : u.avatar}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-xs font-bold leading-5 text-[#1A1612]">
                              <span className="truncate" title={u.fullName}>{u.fullName}</span>
                              {u.kycStatus === 'VERIFIED' && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#B88E4F]" />}
                            </div>
                            <div className="truncate font-mono text-[10px] text-[#7D715E]" title={`CCCD: ${u.idCardNumber}`}>CCCD · {u.idCardNumber}</div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <div className="kyc-contact-email text-[11px] leading-4 text-[#7D715E]" title={u.email}>{u.email}</div>
                        <div className="mt-0.5 text-[11px] font-medium text-[#1A1612]">{u.phone}</div>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        {u.channelUrl ? (
                          <a
                            href={u.channelUrl}
                            target="_blank"
                            rel="noreferrer"
                            title={u.channelUrl}
                            className="inline-flex max-w-full items-center gap-1 text-[11px] font-semibold text-[#8F682E] hover:underline"
                          >
                            <span className="truncate">{u.channelName || 'Mở kênh'}</span>
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        ) : u.socialChannels.length > 0 ? (
                          <span className="text-[11px] font-semibold text-[#1A1612]">{u.socialChannels.length} kênh liên kết</span>
                        ) : (
                          <span className="text-[11px] text-[#9A8D78]">Chưa liên kết</span>
                        )}
                      </td>

                      <td className="px-4 py-3 align-middle text-xs font-bold tabular-nums text-[#1A1612]">
                        {Number(u.followerCount).toLocaleString('vi-VN')}
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <Badge size="sm" className={u.status === 'active' ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8F682E]' : u.status === 'rejected' ? '' : 'border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E]'} variant={u.status === 'rejected' ? 'danger' : 'neutral'}>
                          {u.kycLabel}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 align-middle text-[10px] leading-4 text-[#7D715E]">{u.createdAt}</td>

                      <td className="px-3 py-3 align-middle text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-2.5"
                          icon={<Eye className="h-3.5 w-3.5 text-[#B88E4F]" />}
                          onClick={() => {
                            setInspectProfile(u);
                            setShowRejectInput(false);
                            setRejectReason('');
                          }}
                        >
                          Xem
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB 2: BẢNG DUYỆT SHOP */}
      {activeTab === 'shop' && (
        <Card className="overflow-hidden rounded-2xl border-[#EAE4D7] bg-white p-0 shadow-none">
          <div className="kyc-store-list-header">
            <div className="kyc-store-list-heading"><span className="kyc-store-list-icon"><Store size={18} aria-hidden="true" /></span><div><h2>Danh sách gian hàng</h2><p>Thông tin chủ sở hữu, thuế và địa chỉ kho</p></div></div>
            <div className="kyc-store-list-summary" aria-label="Thống kê danh sách gian hàng" aria-live="polite">
              <span className="kyc-store-list-pending"><Clock size={14} aria-hidden="true" /><strong>{pendingShopCount}</strong><span>chờ duyệt</span></span>
              <span className="kyc-store-list-visible"><span>Đang hiển thị</span><strong>{filteredShops.length} / {displayShops.length}</strong><span>hồ sơ</span></span>
            </div>
          </div>
          <div className="max-w-full overflow-x-auto" role="region" aria-label="Danh sách hồ sơ gian hàng" tabIndex={0}>
            <table className="w-full min-w-[1120px] table-fixed border-collapse text-left text-xs">
              <colgroup><col className="w-[16%]" /><col className="w-[17%]" /><col className="w-[11%]" /><col className="w-[21%]" /><col className="w-[12%]" /><col className="w-[10%]" /><col className="w-[13%]" /></colgroup>
              <thead>
                <tr className="border-b border-[#EAE4D7] bg-[#FAF8F5]">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7D715E]">Gian hàng</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7D715E]">Chủ sở hữu</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7D715E]">Mã số thuế</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7D715E]">Địa chỉ kho</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7D715E]">Trạng thái</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#7D715E]">Ngày đăng ký</th>
                  <th className="px-3 py-3 text-right text-[10px] font-bold uppercase tracking-[0.12em] text-[#7D715E]">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1ECE3]">
                {filteredShops.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#7D715E]">
                      <div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-2xl bg-[#FAF8F5] text-[#8F7B5E]"><Store className="h-5 w-5" /></div>
                      <div className="font-bold text-[#1A1612]">Không tìm thấy gian hàng</div>
                      <div className="mt-1 text-[11px] text-[#7D715E]">Thử đổi từ khóa hoặc trạng thái lọc.</div>
                    </td>
                  </tr>
                ) : (
                  filteredShops.map((s: any) => (
                    <tr key={s.id} className="transition-colors hover:bg-[#FAF8F5]/70">
                      <td className="px-4 py-3 align-middle">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-xs font-bold text-[#8F682E]">
                            {s.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <strong className="block truncate text-xs font-bold text-[#1A1612]" title={s.name}>{s.name}</strong>
                            <span className="mt-0.5 block truncate font-mono text-[10px] text-[#7D715E]" title={s.slug}>slug · {s.slug}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <div className="truncate text-xs font-semibold text-[#1A1612]" title={s.ownerName}>{s.ownerName}</div>
                        <div className="mt-0.5 break-all text-[10px] leading-4 text-[#7D715E]">{s.ownerEmail}</div>
                      </td>

                      <td className="break-all px-4 py-3 align-middle font-mono text-[11px] font-semibold text-[#1A1612]">
                        {s.taxCode}
                      </td>

                      <td className="px-4 py-3 align-middle text-[11px] leading-4 text-[#7D715E]">
                        <div className="line-clamp-2 break-words" title={s.warehouseAddress}>{s.warehouseAddress}</div>
                      </td>

                      <td className="px-4 py-3 align-middle">
                        <Badge size="sm" variant={s.onboardingStatus === 'REJECTED' ? 'danger' : 'neutral'} className={s.onboardingStatus === 'VERIFIED' ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8F682E]' : s.onboardingStatus === 'NEEDS_INFO' ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8F682E]' : s.onboardingStatus === 'REJECTED' ? '' : 'border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E]'}>
                          {s.statusLabel}
                        </Badge>
                      </td>

                      <td className="px-4 py-3 align-middle text-[11px] tabular-nums text-[#7D715E]">{s.createdAt}</td>

                      <td className="px-3 py-3 align-middle text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="px-2.5"
                          icon={<Eye className="h-3.5 w-3.5 text-[#B88E4F]" />}
                          onClick={() => {
                            setInspectStore(s);
                            setShowRejectInput(false);
                            setShopReviewIntent(null);
                            setRejectReason('');
                          }}
                        >
                          Thẩm định
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      </>}
      {/* MODAL THẨM ĐỊNH CHI TIẾT KOL */}
      {inspectProfile && (
        <Modal
          isOpen={true}
          onClose={() => setInspectProfile(null)}
          title={<span className="text-[#1A1612]">Thẩm định hồ sơ KOL</span>}
          subtitle={<span className="text-[#7D715E]">{inspectProfile.fullName} · {inspectProfile.email}</span>}
          icon={<BadgeCheck className="h-4 w-4" />}
          maxWidth="6xl"
          stickyHeader
          className="kol-review-dialog"
          footer={
            <div className="kyc-kol-footer flex shrink-0 flex-col-reverse gap-2 border-t border-[#EAE4D7] pt-3 sm:flex-row sm:justify-end">
              {inspectProfile.kycStatus === 'VERIFIED' ? (
                <Button
                  variant="gold"
                  size="md"
                  icon={<ShieldCheck className="w-4 h-4" />}
                  onClick={() => syncKolRoleMutation.mutate(inspectProfile.id)}
                  disabled={syncKolRoleMutation.isPending}
                  className="w-full sm:w-auto"
                >
                  Đồng bộ quyền KOL
                </Button>
              ) : <>
              <Button
                variant="outline"
                size="md"
                className="w-full border-red-200 bg-white text-red-700 hover:bg-red-50 sm:w-auto"
                onClick={() => handleReviewKol(inspectProfile.id, 'REJECTED')}
                disabled={reviewKolMutation.isPending || inspectProfile.kycStatus !== 'UNVERIFIED'}
              >
                {showRejectInput ? 'Xác nhận Từ chối' : 'Từ chối hồ sơ'}
              </Button>
              <Button
                variant="gold"
                size="md"
                icon={<ShieldCheck className="w-4 h-4" />}
                onClick={() => handleReviewKol(inspectProfile.id, 'VERIFIED')}
                disabled={reviewKolMutation.isPending || inspectProfile.kycStatus !== 'UNVERIFIED' || inspectProfile.missingRequiredFields.length > 0 || showRejectInput}
                className="w-full sm:w-auto"
              >
                Phê duyệt &amp; Cấp Tích Xanh KOL
              </Button>
              </>}
            </div>
          }
        >
          <div className="kyc-kol-content flex min-h-0 flex-1 flex-col gap-3 text-left text-xs">
            <div className="kyc-kol-scroll min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain pr-1">
              <div className="kyc-kol-person flex flex-wrap items-center gap-3 rounded-2xl border border-[#EAE4D7] bg-white p-3.5 shadow-[0_2px_10px_rgba(35,29,21,0.03)]">
                <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full border border-[#EEDFC6] bg-[#FBF5EB] font-bold text-[#8F682E]">
                  {inspectProfile.avatarUrl ? <img src={inspectProfile.avatarUrl} alt={inspectProfile.fullName} className="h-full w-full object-cover" /> : inspectProfile.avatar}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <strong className="text-sm font-bold text-[#1A1612]">{inspectProfile.fullName}</strong>
                    <span className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${inspectProfile.status === 'active' ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8F682E]' : inspectProfile.status === 'rejected' ? 'border-red-200 bg-red-50 text-red-700' : 'border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E]'}`}>
                      {inspectProfile.kycLabel}
                    </span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-[#7D715E]">
                    <span>{inspectProfile.phone}</span>
                    <span>Ngày nộp: {inspectProfile.createdAt}</span>
                  </div>
                </div>
              </div>

              {inspectProfile.missingRequiredFields.length > 0 && (
                <div role="alert" className="flex gap-2.5 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-2.5 text-[11px] text-[#7D5420]">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <div><strong className="block text-xs">Hồ sơ còn thiếu thông tin bắt buộc</strong><div>{inspectProfile.missingRequiredFields.map((field: string) => <span className="kyc-kol-missing-tag" key={field}>{field}</span>)}</div></div>
                </div>
              )}

              <div className="kyc-kol-columns">
                <div className="kyc-kol-main-column">
                  <section className="kyc-kol-section space-y-3 rounded-2xl border border-[#EAE4D7] bg-white p-3.5 shadow-[0_2px_10px_rgba(35,29,21,0.03)] kyc-kol-disclosure">
                    <header className="flex flex-wrap items-center justify-between gap-2">
                      <span className="kyc-kol-group-icon" aria-hidden="true"><Sparkles size={15} /></span>
                      <div><span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#B88E4F]">01 · Kênh sáng tạo</span><h4 className="m-0 text-sm font-bold text-[#1A1612]">Thông tin truyền thông</h4></div>
                      {inspectProfile.channelPlatform && <span className="rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-2.5 py-1 text-[10px] font-semibold text-[#8F682E]">{inspectProfile.channelPlatform}</span>}
                    </header><div className="kyc-kol-disclosure-body">

                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-[#FAF8F5] p-2.5"><span className="block text-[10px] text-[#7D715E]">Tên kênh / Profile</span><strong className="mt-0.5 block break-words text-sm text-[#1A1612]">{inspectProfile.channelName || 'Chưa cung cấp'}</strong></div>
                      <div className="rounded-xl bg-[#FAF8F5] p-2.5"><span className="block text-[10px] text-[#7D715E]">Người theo dõi</span><strong className="mt-0.5 block text-sm text-[#1A1612]">{Number(inspectProfile.followerCount).toLocaleString('vi-VN')}</strong></div>
                    </div>

                    <div><span className="block text-[10px] text-[#7D715E]">Giới thiệu</span><p className="mb-0 mt-1 whitespace-pre-wrap break-words text-[11px] leading-5 text-[#1A1612]">{inspectProfile.bio || 'Chưa cung cấp'}</p></div>

                    {inspectProfile.channelUrl ? (
                      <a href={inspectProfile.channelUrl} target="_blank" rel="noreferrer" className="flex min-w-0 items-center gap-2 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 py-2 text-[11px] font-semibold text-[#8F682E] hover:bg-[#FBF5EB]">
                        <span className="min-w-0 flex-1 break-all">{inspectProfile.channelUrl}</span><ExternalLink className="h-3.5 w-3.5 shrink-0" />
                      </a>
                    ) : <p className="m-0 rounded-xl border border-dashed border-[#EAE4D7] px-3 py-2 text-[11px] text-[#7D715E]">Chưa cung cấp đường dẫn kênh</p>}

                    {inspectProfile.socialChannels.length > 0 && (
                      <div className="space-y-2 border-t border-[#EAE4D7] pt-3">
                        <span className="block text-[10px] font-bold uppercase tracking-wide text-[#7D715E]">Các kênh đã liên kết</span>
                        <div className="space-y-2">
                          {inspectProfile.socialChannels.map((channel: any) => (
                            <div key={channel.id} className="flex items-center justify-between gap-3 rounded-xl border border-[#EAE4D7] px-2.5 py-2">
                              <div className="min-w-0"><strong className="block truncate text-[11px] text-[#1A1612]">{channel.channelName || channel.platformName}</strong><span className="text-[10px] text-[#7D715E]">{channel.platformName} · {Number(channel.followerCount || 0).toLocaleString('vi-VN')} người theo dõi</span></div>
                              {channel.channelUrl && <a href={channel.channelUrl} target="_blank" rel="noreferrer" aria-label={`Mở kênh ${channel.channelName || channel.platformName}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-[#EAE4D7] text-[#8F682E] hover:bg-[#FBF5EB]"><ExternalLink className="h-3.5 w-3.5" /></a>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div></section>

                  <section className="kyc-kol-section kyc-kol-bank space-y-3 rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] p-3.5 kyc-kol-disclosure">
                    <header className="flex items-center gap-2"><span className="kyc-kol-group-icon" aria-hidden="true"><CreditCard size={15} /></span><div><span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-[#B88E4F]">02 · Đối soát</span><h4 className="m-0 text-sm font-bold text-[#1A1612]">Tài khoản ngân hàng</h4></div></header><div className="kyc-kol-disclosure-body">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-[#EAE4D7] bg-white p-2.5"><span className="block text-[10px] text-[#7D715E]">Ngân hàng</span><strong className="mt-0.5 block break-words text-xs text-[#1A1612]">{inspectProfile.bankName}</strong></div>
                      <div className="rounded-xl border border-[#EAE4D7] bg-white p-2.5"><span className="block text-[10px] text-[#7D715E]">Số tài khoản</span><strong className="mt-0.5 block break-all font-mono text-xs text-[#1A1612]">{inspectProfile.accountNumber}</strong></div>
                      <div className="col-span-2 rounded-xl border border-[#EAE4D7] bg-white p-2.5"><span className="block text-[10px] text-[#7D715E]">Tên chủ tài khoản</span><strong className="mt-0.5 block break-words text-xs uppercase text-[#1A1612]">{inspectProfile.accountHolder}</strong></div>
                    </div>
                  </div></section>
                </div>

                <section className="kyc-kol-section kyc-kol-disclosure">
                  <header><span className="kyc-kol-group-icon" aria-hidden="true"><FileText size={15} /></span><div><span className="mb-1 block text-[10px] font-bold uppercase tracking-[0.12em] text-[#B88E4F]">03 · Định danh</span><h4 className="m-0 text-sm font-bold text-[#1A1612]">Giấy tờ cá nhân &amp; thuế</h4></div></header>
                  <div className="kyc-kol-disclosure-body">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-[#FAF8F5] p-2.5"><span className="block text-[10px] text-[#7D715E]">Số CCCD</span><strong className="mt-0.5 block break-all font-mono text-xs text-[#1A1612]">{inspectProfile.idCardNumber}</strong></div>
                    <div className="rounded-xl bg-[#FAF8F5] p-2.5"><span className="block text-[10px] text-[#7D715E]">Mã số thuế</span><strong className="mt-0.5 block break-all font-mono text-xs text-[#1A1612]">{inspectProfile.taxCode}</strong></div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'CCCD · Mặt trước', url: inspectProfile.frontCardUrl },
                      { label: 'CCCD · Mặt sau', url: inspectProfile.backCardUrl },
                      { label: 'Ảnh xác minh kênh', url: inspectProfile.channelProofUrl },
                    ].map((document) => (
                      <div key={document.label} className="min-w-0 space-y-1.5">
                        <span className="block text-[10px] font-semibold text-[#7D715E]">{document.label}</span>
                        {document.url ? (
                          <button type="button" onClick={() => setPreviewImage(document.url)} title="Nhấn để phóng to" className="kyc-document-image group relative h-32 w-full cursor-zoom-in overflow-hidden rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#C59B58] sm:h-36">
                            <img src={document.url} alt={document.label} loading="lazy" className="h-full w-full object-contain transition-transform group-hover:scale-[1.03]" />
                            <span className="absolute inset-x-0 bottom-0 bg-[#231D15]/65 px-2 py-1.5 text-center text-[10px] font-semibold text-white">Xem ảnh lớn</span>
                          </button>
                        ) : (
                          <div className="kyc-document-empty flex h-32 items-center justify-center rounded-xl border border-dashed border-[#EAE4D7] bg-[#FAF8F5] px-2 text-center text-[10px] text-[#7D715E] sm:h-36">Chưa tải ảnh lên</div>
                        )}
                      </div>
                    ))}
                  </div>
                  </div>
                </section>
              </div>

              {showRejectInput && (
                <div className="space-y-2 rounded-2xl border border-red-200 bg-red-50 p-3">
                  <label className="block text-xs font-bold text-red-800">Lý do từ chối hồ sơ KOL</label>
                  <textarea autoFocus rows={3} maxLength={3000} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Nêu rõ thông tin cần chỉnh sửa để KOL có thể cập nhật hồ sơ." className="w-full resize-y rounded-xl border border-red-200 bg-white p-2.5 text-xs text-[#1A1612] outline-none focus:border-red-400" />
                  <button type="button" onClick={() => { setShowRejectInput(false); setRejectReason(''); }} disabled={reviewKolMutation.isPending} className="rounded-lg border border-red-200 bg-white px-3 py-2 text-xs text-red-700">Hủy từ chối</button>
                </div>
              )}
            </div>


          </div>
        </Modal>
      )}

      {/* MODAL THẨM ĐỊNH CHI TIẾT GIAN HÀNG (SHOP) */}
      {inspectStore && (
        <Modal
          isOpen={true}
          onClose={() => setInspectStore(null)}
          title="Thẩm định hồ sơ gian hàng"
          subtitle={inspectStore.name}
          icon={<Store className="h-4 w-4" />}
          maxWidth="7xl"
          stickyHeader
          className="shop-review-dialog"
          footer={
            <div className="kyc-shop-footer-layout">
              <p className="kyc-shop-footer-hint">{inspectStore.missingRequiredFields.length > 0 ? 'Hồ sơ chưa đủ điều kiện phê duyệt.' : 'Kiểm tra thông tin và giấy tờ trước khi quyết định.'}</p>
              {['PENDING_APPROVAL', 'NEEDS_INFO'].includes(inspectStore.onboardingStatus) ? (
              <div className="kyc-shop-footer grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="md"
                  className="border-rose-300 text-rose-700 hover:bg-rose-50"
                  onClick={() => handleReviewShop(inspectStore.id, 'REJECTED')}
                  disabled={reviewShopMutation.isPending}
                >
                  {shopReviewIntent === 'REJECTED' && showRejectInput ? 'Xác nhận từ chối' : 'Từ chối hồ sơ'}
                </Button>
                <Button
                  variant="gold"
                  size="md"
                  icon={<BadgeCheck className="w-4 h-4" />}
                  onClick={() => handleReviewShop(inspectStore.id, 'VERIFIED')}
                  disabled={reviewShopMutation.isPending || inspectStore.missingRequiredFields.length > 0 || showRejectInput}
                >
                  Duyệt &amp; kích hoạt
                </Button>
              </div>
            ) : (
              <div className="kyc-shop-footer kyc-shop-completed text-sm text-[#7D715E]">
                Hồ sơ đã xử lý. Trạng thái hiện tại: <strong className="text-[#1A1612]">{inspectStore.statusLabel}</strong>.
              </div>
            )}
            </div>
          }
        >
          <div className="kyc-shop-content">
            <div className="kyc-shop-scroll">
            <div className="kyc-shop-status flex flex-wrap items-center gap-2">
              <Badge variant={inspectStore.onboardingStatus === 'VERIFIED' ? 'amber' : inspectStore.onboardingStatus === 'REJECTED' ? 'danger' : 'warning'}>
                {inspectStore.statusLabel}
              </Badge>
              <span className="text-[#7D715E]">Ngày gửi hồ sơ: {inspectStore.createdAt}</span>
            </div>
            {inspectStore.reviewNote && (
              <div className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-xs text-[#7D715E]">
                <strong className="mb-1 block text-[#8F682E]">Ghi chú xử lý trước đó</strong>
                {inspectStore.reviewNote}
              </div>
            )}
            {inspectStore.missingRequiredFields.length > 0 && (
              <div className="kyc-shop-missing" role="alert">
                <AlertCircle size={20} />
                <div>
                  <strong>{inspectStore.hasSavedDetails ? `Hồ sơ còn thiếu ${inspectStore.missingRequiredFields.length} thông tin bắt buộc` : 'Hồ sơ trên máy chủ chưa có thông tin chi tiết và giấy tờ'}</strong>
                  <p>{inspectStore.hasSavedDetails ? 'Người đăng ký cần bổ sung các mục dưới đây trước khi được duyệt.' : 'Hiện chỉ có tên gian hàng được lưu. Người đăng ký cần chọn “Bổ sung thông tin hồ sơ” và gửi cập nhật vào hồ sơ đang chờ duyệt.'}</p>
                  <ul>{inspectStore.missingRequiredFields.map((field: string) => <li key={field}>{field}</li>)}</ul>
                </div>
              </div>
            )}
            {inspectStore.reviewedAt && (
              <div className="rounded-xl border border-[#EAE4D7] bg-white p-3 text-xs text-[#7D715E]">
                Quyết định gần nhất bởi <strong className="text-[#1A1612]">{inspectStore.reviewerName || 'Quản trị viên'}</strong> · {inspectStore.reviewedAt}
              </div>
            )}
            {/* 1. Pháp nhân & Kho hàng (Nghị định 85) */}
            <div className="kyc-shop-section kyc-shop-legal p-3.5 bg-[#FAF8F5] border border-[#EAE4D7] rounded-2xl space-y-3">
              <strong className="text-xs font-black text-[#B88E4F] uppercase tracking-wider block">
                1. Thông tin pháp nhân và kho hàng
              </strong>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[#7D715E] block">Tên Gian Hàng:</span>
                  <strong className="text-[#1A1612] text-sm font-bold block">{inspectStore.name}</strong>
                </div>
                <div>
                  <span className="text-[#7D715E] block">Loại hình kinh doanh:</span>
                  <strong className="text-[#1A1612] text-sm font-bold block">{inspectStore.businessType}</strong>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <span className="text-[#7D715E] block">Chủ sở hữu / Người đại diện:</span>
                  <strong className="text-[#1A1612] font-bold block">{inspectStore.ownerName}</strong>
                  <span className="text-[11px] text-[#7D715E] font-mono">{inspectStore.ownerEmail} - {inspectStore.ownerPhone}</span>
                </div>
                <div>
                  <span className="text-[#7D715E] block">Mã số thuế doanh nghiệp/HKD/Cá nhân:</span>
                  <strong className="font-mono text-[#1A1612] text-sm font-bold block">{inspectStore.taxCode}</strong>
                  {inspectStore.idCardNumber && (
                    <span className="text-[11px] text-[#7D715E] font-mono block mt-0.5">Số CCCD: <strong className="text-[#1A1612]">{inspectStore.idCardNumber}</strong></span>
                  )}
                </div>
              </div>

              <div>
                <span className="text-[#7D715E] block mb-1">Địa chỉ kho xuất hàng thực tế:</span>
                <div className="p-2.5 rounded-xl bg-white border border-[#EAE4D7] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#B88E4F] shrink-0" />
                  <span className="font-bold text-[#1A1612]">{inspectStore.warehouseAddress}</span>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div><span className="text-[#7D715E] block">Điện thoại liên hệ:</span><strong className="block text-[#1A1612]">{inspectStore.contactPhone}</strong></div>
                <div><span className="text-[#7D715E] block">Email nhận đối soát:</span><strong className="block break-all text-[#1A1612]">{inspectStore.contactEmail}</strong></div>
              </div>
            </div>

            {/* 2. Tài liệu chứng từ pháp lý & Định danh */}
            <div className="kyc-shop-section kyc-shop-documents p-3.5 bg-white border border-[#EAE4D7] rounded-2xl space-y-3">
              <strong className="text-xs font-black text-[#B88E4F] uppercase tracking-wider block">
                2. Đối chiếu CCCD người đại diện &amp; giấy phép kinh doanh
              </strong>
              <div className="kyc-shop-document-grid">
                {[
                  { label: 'CCCD — mặt trước', url: inspectStore.frontCardUrl },
                  { label: 'CCCD — mặt sau', url: inspectStore.backCardUrl },
                  { label: 'Giấy phép đăng ký kinh doanh', url: inspectStore.businessLicenseUrl },
                ].map((document) => (
                  <div key={document.label} className="kyc-shop-document p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] space-y-2">
                    <span className="font-bold text-[#1A1612] block">{document.label}</span>
                    {document.url ? (
                      <button
                        type="button"
                        onClick={() => setPreviewImage(document.url)}
                        className="kyc-shop-document-preview w-full bg-white border border-[#EAE4D7] rounded-lg overflow-hidden cursor-zoom-in relative group"
                        title="Mở ảnh lớn để đối chiếu"
                      >
                        <img src={document.url} alt={document.label} className="w-full h-full object-contain group-hover:scale-105 transition" />
                        <span className="absolute inset-x-0 bottom-0 bg-black/55 px-2 py-1 text-center text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition">Mở ảnh lớn</span>
                      </button>
                    ) : (
                      <div className="kyc-shop-document-preview kyc-shop-document-empty"><FileText size={28} /><span>Chưa tải lên</span></div>
                    )}
                  </div>
                ))}
                {inspectStore.brandAuthorizationUrl && (
                  <div className="kyc-shop-document p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] space-y-2">
                    <span className="font-bold text-[#1A1612] block">Ủy quyền thương hiệu / nguồn gốc</span>
                    <button type="button" onClick={() => setPreviewImage(inspectStore.brandAuthorizationUrl)} className="kyc-shop-document-preview w-full bg-white border border-[#EAE4D7] rounded-lg overflow-hidden cursor-zoom-in">
                      <img src={inspectStore.brandAuthorizationUrl} alt="Ủy quyền thương hiệu" className="w-full h-full object-contain" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Tài khoản ngân hàng nhận tiền doanh thu */}
            <div className="kyc-shop-section kyc-shop-bank p-3.5 bg-[#FAF8F5] border border-[#EAE4D7] rounded-2xl space-y-2">
              <strong className="text-xs font-black text-[#B88E4F] uppercase tracking-wider block">
                3. Ngân hàng nhận doanh thu
              </strong>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-[#7D715E] block">Ngân hàng:</span>
                  <strong className="text-[#1A1612] font-bold">{inspectStore.bankName}</strong>
                </div>
                <div>
                  <span className="text-[#7D715E] block">Số tài khoản:</span>
                  <strong className="font-mono text-[#1A1612] font-bold">{inspectStore.accountNumber}</strong>
                </div>
                <div>
                  <span className="text-[#7D715E] block">Chủ tài khoản:</span>
                  <strong className="text-[#1A1612] font-bold">{inspectStore.accountHolder}</strong>
                </div>
              </div>
            </div>

            {/* Ô từ chối */}
            {showRejectInput && shopReviewIntent && (
              <div className={`kyc-shop-rejection p-3 rounded-xl space-y-1.5 ${shopReviewIntent === 'NEEDS_INFO' ? 'bg-[#FBF5EB] border border-[#EEDFC6]' : 'bg-rose-50 border border-rose-200'}`}>
                <label className={`font-bold block ${shopReviewIntent === 'NEEDS_INFO' ? 'text-[#8F682E]' : 'text-rose-800'}`}>
                  {shopReviewIntent === 'NEEDS_INFO' ? 'Nội dung Shop cần bổ sung:' : 'Lý do từ chối cấp phép gian hàng:'}
                </label>
                <textarea
                  ref={shopRejectInput}
                  rows={3}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={shopReviewIntent === 'NEEDS_INFO' ? 'VD: Tải lại CCCD mặt trước rõ nét, bổ sung giấy phép còn hiệu lực...' : 'Ghi rõ lý do hồ sơ không được chấp thuận...'}
                  className="w-full bg-white border border-[#EAE4D7] rounded-lg p-2 text-xs outline-none focus:border-[#C59B58]"
                />
              </div>
            )}

            </div>

          </div>
        </Modal>
      )}
    </div>
  );
}
