import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Download,
  CreditCard,
  Search,
  CheckCircle2,
  Eye,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Clock,
  AlertCircle,
  X,
  Store,
  Sparkles,
  MapPin,
  BadgeCheck,
} from 'lucide-react';
import { kycService } from '../../services/kyc.service';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';

export default function KycApprovalPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'kol' | 'shop'>('kol');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Inspect modals
  const [inspectProfile, setInspectProfile] = useState<any | null>(null);
  const [inspectStore, setInspectStore] = useState<any | null>(null);

  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // TanStack Query: Caching danh sách hồ sơ nâng cấp tổng hợp (KOL + Shop)
  const {
    data: applicationsData,
    isLoading: loading,
    refetch: loadApplications,
  } = useQuery({
    queryKey: ['upgrade-applications'],
    queryFn: async () => {
      const res = await kycService.getUpgradeApplications();
      return res || { kolApplications: [], shopApplications: [] };
    },
    staleTime: 1000 * 60 * 3,
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
      setInspectProfile(null);
      setShowRejectInput(false);
      setRejectReason('');
    },
    onError: (err: any) => {
      showToast(err.message || 'Thao tác phê duyệt thất bại', 'error');
    },
  });

  // Mutation: Duyệt/Từ chối Gian Hàng (Shop)
  const reviewShopMutation = useMutation({
    mutationFn: async ({
      storeId,
      status,
      reason,
    }: {
      storeId: string;
      status: 'VERIFIED' | 'REJECTED';
      reason?: string;
    }) => {
      return kycService.reviewShopApplication(storeId, status, reason);
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['upgrade-applications'] });
      showToast(`Đã ${status === 'VERIFIED' ? 'phê duyệt & cấp Tích Xanh Gian Hàng' : 'từ chối'} thành công!`);
      setInspectStore(null);
      setShowRejectInput(false);
      setRejectReason('');
    },
    onError: (err: any) => {
      showToast(err.message || 'Thao tác phê duyệt gian hàng thất bại', 'error');
    },
  });

  const handleReviewKol = async (profileId: string, status: 'VERIFIED' | 'REJECTED') => {
    if (status === 'REJECTED' && !showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    reviewKolMutation.mutate({ profileId, status, reason: rejectReason.trim() || undefined });
  };

  const handleReviewShop = async (storeId: string, status: 'VERIFIED' | 'REJECTED') => {
    if (status === 'REJECTED' && !showRejectInput) {
      setShowRejectInput(true);
      return;
    }
    reviewShopMutation.mutate({ storeId, status, reason: rejectReason.trim() || undefined });
  };

  // Chuẩn hóa dữ liệu hiển thị KOL
  const rawKols = applicationsData?.kolApplications || [];
  const displayKols = rawKols.map((p: any) => {
    const rawKyc = p.kycStatus || 'UNVERIFIED';
    const isVerified = rawKyc === 'VERIFIED';
    const isRejected = rawKyc === 'REJECTED';
    const fullName = p.fullName || p.user?.fullName || 'Đối tác SCANMS';
    const socialLinks = p.socialLinksJson || {};

    return {
      id: p.id,
      fullName,
      email: p.user?.email || 'kol@scanms.vn',
      phone: p.user?.phoneNumber || 'Chưa cung cấp',
      role: p.user?.role || 'CUSTOMER',
      kycStatus: rawKyc,
      kycLabel: isVerified ? 'Đã xác minh' : isRejected ? 'Từ chối' : 'Chờ thẩm định',
      tier: p.tier?.name || 'KOL Tiêu chuẩn',
      createdAt: new Date(p.createdAt || Date.now()).toLocaleDateString('vi-VN'),
      status: isVerified ? 'active' : isRejected ? 'rejected' : 'pending',
      avatar: fullName[0]?.toUpperCase() || 'K',
      avatarBg: isVerified ? 'bg-[#FBF5EB] text-[#B88E4F] border border-[#EAE4D7]' : isRejected ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800',
      idCardNumber: p.idCardNumber || 'Chưa cung cấp',
      taxCode: p.taxCode || 'Chưa nộp',
      bankName: p.bankName || 'Chưa cung cấp',
      accountNumber: p.bankAccountNumber || 'Chưa cung cấp',
      accountHolder: p.bankAccountName || fullName,
      bio: p.bio || '',
      frontCardUrl: socialLinks.frontCardUrl || null,
      backCardUrl: socialLinks.backCardUrl || null,
      channelProofUrl: socialLinks.channelProofUrl || null,
      channelName: socialLinks.channelName || null,
      channelUrl: socialLinks.channelUrl || null,
      followerCount: socialLinks.followerCount || p.totalFollowers || 0,
      socialChannels: p.user?.socialChannels || [],
    };
  });

  // Chuẩn hóa dữ liệu hiển thị Shop
  const rawShops = applicationsData?.shopApplications || [];
  const displayShops = rawShops.map((s: any) => {
    let legalDocs: any = {};
    try {
      if (s.policyReturn && s.policyReturn.startsWith('{')) {
        legalDocs = JSON.parse(s.policyReturn);
      }
    } catch {
      legalDocs = {};
    }

    return {
      id: s.id,
      name: s.name,
      slug: s.slug,
      ownerName: s.owner?.fullName || 'Chủ gian hàng',
      ownerEmail: s.owner?.email || 'shop@scanms.vn',
      ownerPhone: s.owner?.phoneNumber || legalDocs.contactPhone || 'Chưa cập nhật',
      warehouseAddress: s.policyShipping || 'Chưa cung cấp địa chỉ kho',
      businessType: legalDocs.businessType || 'DOANH NGHIỆP',
      taxCode: legalDocs.taxCode || 'Chưa nộp',
      businessLicenseUrl: legalDocs.businessLicenseUrl || null,
      brandAuthorizationUrl: legalDocs.brandAuthorizationUrl || null,
      isVerified: s.isVerified,
      statusLabel: s.isVerified ? 'Đã xác minh (Tích Xanh)' : 'Chờ thẩm định GPKD',
      createdAt: new Date(s.createdAt || Date.now()).toLocaleDateString('vi-VN'),
    };
  });

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
      (filterStatus === 'VERIFIED' && s.isVerified) ||
      (filterStatus === 'UNVERIFIED' && !s.isVerified);
    return matchSearch && matchStatus;
  });

  const pendingKolCount = displayKols.filter((u: any) => u.kycStatus === 'UNVERIFIED').length;
  const verifiedKolCount = displayKols.filter((u: any) => u.kycStatus === 'VERIFIED').length;
  const pendingShopCount = displayShops.filter((s: any) => !s.isVerified).length;
  const verifiedShopCount = displayShops.filter((s: any) => s.isVerified).length;

  return (
    <div className="flex flex-col gap-6 text-left">
      {toastMsg && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2 border ${
            toastMsg.type === 'error'
              ? 'bg-rose-950 text-rose-200 border-rose-800'
              : 'bg-[#1A1612] text-[#F3EFE6] border-[#B88E4F]'
          }`}
        >
          {toastMsg.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-[#B88E4F]" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Ảnh phóng to Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl bg-white p-2">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-black text-white rounded-full transition"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Chi tiết tài liệu"
              className="max-h-[85vh] w-auto rounded-xl object-contain mx-auto"
            />
          </div>
        </div>
      )}

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#EBD08C] animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#B88E4F]">
              Cổng Quản Trị Thẩm Định Đa Cấp (Two-Tier Compliance)
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-[#1A1612] tracking-tight m-0">
            Xét Duyệt Hồ Sơ Đối Tác (KOL &amp; Gian Hàng)
          </h1>
          <p className="text-xs sm:text-sm text-[#7D715E] mt-1 m-0">
            Thẩm định tính hợp pháp của CCCD, mã số thuế TNCN, kênh truyền thông của KOL và giấy phép kinh doanh, kho hàng theo Nghị định 85/2021/NĐ-CP.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="md"
            icon={<Download className="w-4 h-4 text-[#B88E4F]" />}
            onClick={() => showToast('Đang xuất báo cáo thẩm định...')}
            className="border-[#EAE4D7] text-[#1A1612] hover:bg-[#FAF8F5]"
          >
            Xuất báo cáo
          </Button>
          <Button
            variant="gold"
            size="md"
            icon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => loadApplications()}
          >
            Làm mới
          </Button>
        </div>
      </header>

      {/* TOP TABS: KOL VS SHOP */}
      <div className="flex border-b border-[#EAE4D7] gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('kol')}
          className={`pb-3 px-3 text-xs font-bold transition cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'kol'
              ? 'border-[#B88E4F] text-[#B88E4F]'
              : 'border-transparent text-[#7D715E] hover:text-[#1A1612]'
          }`}
        >
          <Sparkles className="w-4 h-4" />
          <span>Thẩm định Đối tác KOL ({pendingKolCount} chờ duyệt)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shop')}
          className={`pb-3 px-3 text-xs font-bold transition cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'shop'
              ? 'border-[#B88E4F] text-[#B88E4F]'
              : 'border-transparent text-[#7D715E] hover:text-[#1A1612]'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Thẩm định Gian Hàng ({pendingShopCount} chờ duyệt)</span>
        </button>
      </div>

      {/* THẺ THỐNG KÊ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={activeTab === 'kol' ? 'KOL Đã duyệt Tích Xanh' : 'Gian Hàng Đã duyệt Tích Xanh'}
          value={activeTab === 'kol' ? verifiedKolCount.toString() : verifiedShopCount.toString()}
          subText={activeTab === 'kol' ? 'Đủ điều kiện nhận hoa hồng' : 'Đủ điều kiện đăng bán sản phẩm'}
          icon={<ShieldCheck className="w-5 h-5 text-[#B88E4F]" />}
          iconBg="bg-[#FBF5EB] text-[#B88E4F]"
        />

        <StatCard
          title={activeTab === 'kol' ? 'Tổng số hồ sơ KOL' : 'Tổng số gian hàng đăng ký'}
          value={activeTab === 'kol' ? displayKols.length.toString() : displayShops.length.toString()}
          subText="Tổng số đối tác trong hệ thống"
          icon={<CreditCard className="w-5 h-5 text-[#B88E4F]" />}
          iconBg="bg-[#F3EFE6] text-[#7D715E]"
        />

        <StatCard
          title="Hồ sơ chờ thẩm định"
          value={activeTab === 'kol' ? pendingKolCount.toString() : pendingShopCount.toString()}
          trend={
            (activeTab === 'kol' ? pendingKolCount : pendingShopCount) > 0
              ? 'Cần xử lý ngay'
              : 'Đã hoàn tất duyệt'
          }
          trendType={
            (activeTab === 'kol' ? pendingKolCount : pendingShopCount) > 0 ? 'negative' : 'positive'
          }
          icon={<Clock className="w-5 h-5 text-amber-700" />}
          iconBg="bg-amber-100 text-amber-800"
        />
      </div>

      {/* BỘ LỌC TÌM KIẾM */}
      <Card className="p-3.5 flex flex-wrap items-center gap-3 bg-white border border-[#EAE4D7] rounded-2xl">
        <Input
          placeholder={
            activeTab === 'kol'
              ? 'Tìm theo tên KOL, email, CCCD...'
              : 'Tìm theo tên gian hàng, chủ shop, MST...'
          }
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          clearable
          onClear={() => setSearch('')}
          icon={<Search className="w-4 h-4 text-[#7D715E]" />}
          className="flex-1 min-w-[280px]"
        />

        <Select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={[
            { value: 'ALL', label: 'Tất cả trạng thái' },
            { value: 'VERIFIED', label: 'Đã xác minh (Tích Xanh)' },
            { value: 'UNVERIFIED', label: 'Chờ duyệt hồ sơ' },
            { value: 'REJECTED', label: 'Bị từ chối' },
          ]}
        />
      </Card>

      {/* TAB 1: BẢNG DUYỆT KOL */}
      {activeTab === 'kol' && (
        <Card className="overflow-hidden p-0 bg-white border border-[#EAE4D7] rounded-2xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#EAE4D7]">
                  <th className="py-3.5 px-4 text-xs font-bold text-[#7D715E] uppercase tracking-wider">Đối tác KOL</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-[#7D715E] uppercase tracking-wider">Email &amp; SĐT</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-[#7D715E] uppercase tracking-wider">Kênh MXH</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-[#7D715E] uppercase tracking-wider">Followers</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-[#7D715E] uppercase tracking-wider">Trạng thái</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-[#7D715E] uppercase tracking-wider">Ngày nộp</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-[#7D715E] uppercase tracking-wider text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF8F5]">
                {filteredKols.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#7D715E]">
                      <div className="text-3xl mb-2">📋</div>
                      <div className="font-bold text-[#1A1612]">Không tìm thấy hồ sơ KOL nào</div>
                      <div className="text-xs text-[#7D715E] mt-1">Chưa có hồ sơ nào khớp với bộ lọc.</div>
                    </td>
                  </tr>
                ) : (
                  filteredKols.map((u: any) => (
                    <tr key={u.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${u.avatarBg}`}
                          >
                            {u.avatar}
                          </span>
                          <div>
                            <div className="text-xs sm:text-sm font-extrabold text-[#1A1612] flex items-center gap-1.5">
                              {u.fullName}
                              {u.kycStatus === 'VERIFIED' && <CheckCircle2 className="w-3.5 h-3.5 text-[#B88E4F]" />}
                            </div>
                            <div className="text-[11px] text-[#7D715E] font-mono">CCCD: {u.idCardNumber}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#7D715E] font-mono">
                        <div>{u.email}</div>
                        <div className="text-[11px] text-[#1A1612]">{u.phone}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        {u.channelUrl ? (
                          <a
                            href={u.channelUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[#B88E4F] font-bold hover:underline"
                          >
                            <span>{u.channelName || 'Xem kênh'}</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        ) : u.socialChannels.length > 0 ? (
                          <span className="font-bold text-[#1A1612]">{u.socialChannels.length} Kênh liên kết</span>
                        ) : (
                          <span className="text-[#7D715E] italic">Chưa liên kết</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-xs font-bold text-[#1A1612]">
                        {Number(u.followerCount).toLocaleString('vi-VN')}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge
                          variant={u.status === 'active' ? 'success' : u.status === 'rejected' ? 'danger' : 'warning'}
                        >
                          {u.kycLabel}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#7D715E]">{u.createdAt}</td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5 text-[#B88E4F]" />}
                          onClick={() => {
                            setInspectProfile(u);
                            setShowRejectInput(false);
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

      {/* TAB 2: BẢNG DUYỆT SHOP */}
      {activeTab === 'shop' && (
        <Card className="overflow-hidden p-0 bg-white border border-[#EAE4D7] rounded-2xl shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#EAE4D7]">
                  <th className="py-3.5 px-4 text-xs font-bold text-[#7D715E] uppercase tracking-wider">Gian Hàng</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-[#7D715E] uppercase tracking-wider">Chủ Sở Hữu</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-[#7D715E] uppercase tracking-wider">Mã Số Thuế</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-[#7D715E] uppercase tracking-wider">Kho Hàng Xuất Khẩu</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-[#7D715E] uppercase tracking-wider">Trạng Thái</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-[#7D715E] uppercase tracking-wider">Ngày Đăng Ký</th>
                  <th className="py-3.5 px-4 text-xs font-bold text-[#7D715E] uppercase tracking-wider text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#FAF8F5]">
                {filteredShops.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-[#7D715E]">
                      <div className="text-3xl mb-2">🏪</div>
                      <div className="font-bold text-[#1A1612]">Không tìm thấy gian hàng nào</div>
                      <div className="text-xs text-[#7D715E] mt-1">Chưa có gian hàng nào khớp với điều kiện tìm kiếm.</div>
                    </td>
                  </tr>
                ) : (
                  filteredShops.map((s: any) => (
                    <tr key={s.id} className="hover:bg-[#FAF8F5]/60 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#FBF5EB] border border-[#EAE4D7] text-[#B88E4F] flex items-center justify-center font-bold text-xs shrink-0">
                            {s.name.charAt(0)}
                          </div>
                          <div>
                            <strong className="text-xs font-bold text-[#1A1612] block">{s.name}</strong>
                            <span className="text-[10.5px] text-[#7D715E] font-mono">slug: {s.slug}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#7D715E]">
                        <div className="font-bold text-[#1A1612]">{s.ownerName}</div>
                        <div className="font-mono text-[11px]">{s.ownerEmail}</div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-xs font-mono font-bold text-[#1A1612]">
                        {s.taxCode}
                      </td>

                      <td className="py-3.5 px-4 text-xs text-[#7D715E] max-w-[220px] truncate">
                        {s.warehouseAddress}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Badge variant={s.isVerified ? 'success' : 'warning'}>
                          {s.statusLabel}
                        </Badge>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-[#7D715E]">{s.createdAt}</td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Eye className="w-3.5 h-3.5 text-[#B88E4F]" />}
                          onClick={() => {
                            setInspectStore(s);
                            setShowRejectInput(false);
                            setRejectReason('');
                          }}
                        >
                          Thẩm định GPKD
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

      {/* MODAL THẨM ĐỊNH CHI TIẾT KOL */}
      {inspectProfile && (
        <Modal
          isOpen={true}
          onClose={() => setInspectProfile(null)}
          title={`Hồ sơ thẩm định KOL: ${inspectProfile.fullName}`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-left text-xs">
            {/* 1. Kênh sáng tạo & Bằng chứng */}
            <div className="p-3.5 bg-[#FAF8F5] border border-[#EAE4D7] rounded-2xl space-y-3">
              <strong className="text-xs font-black text-[#B88E4F] uppercase tracking-wider block">
                1. Năng lực kênh truyền thông &amp; Bằng chứng chính chủ
              </strong>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[#7D715E] block">Tên kênh / Profile:</span>
                  <strong className="text-[#1A1612] text-sm font-bold block">{inspectProfile.channelName || 'Chưa cung cấp'}</strong>
                </div>
                <div>
                  <span className="text-[#7D715E] block">Lượng Followers:</span>
                  <strong className="text-[#1A1612] text-sm font-bold block">
                    {Number(inspectProfile.followerCount).toLocaleString('vi-VN')} người theo dõi
                  </strong>
                </div>
              </div>

              {inspectProfile.channelUrl && (
                <div>
                  <span className="text-[#7D715E] block mb-1">Đường dẫn liên kết kênh:</span>
                  <a
                    href={inspectProfile.channelUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#EAE4D7] text-[#B88E4F] font-bold hover:underline"
                  >
                    <span>{inspectProfile.channelUrl}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}

              {inspectProfile.channelProofUrl && (
                <div>
                  <span className="text-[#7D715E] block mb-1.5 font-bold">
                    Ảnh chụp màn hình trang quản trị kênh (Studio Proof):
                  </span>
                  <div
                    onClick={() => setPreviewImage(inspectProfile.channelProofUrl)}
                    className="w-full h-36 bg-slate-100 border border-[#EAE4D7] rounded-xl overflow-hidden cursor-pointer relative group"
                  >
                    <img
                      src={inspectProfile.channelProofUrl}
                      alt="Ảnh chứng minh sở hữu kênh"
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white font-bold">
                      Nhấn để phóng to
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Giấy tờ CCCD & Thuế */}
            <div className="grid grid-cols-2 gap-3 p-3.5 bg-white border border-[#EAE4D7] rounded-2xl">
              <div>
                <span className="text-[#7D715E] block">Số CCCD:</span>
                <strong className="font-mono text-[#1A1612] font-bold">{inspectProfile.idCardNumber}</strong>
              </div>
              <div>
                <span className="text-[#7D715E] block">Mã số thuế cá nhân:</span>
                <strong className="font-mono text-[#1A1612] font-bold">{inspectProfile.taxCode}</strong>
              </div>
            </div>

            {/* 3. Tài khoản ngân hàng */}
            <div className="p-3.5 bg-[#FAF8F5] border border-[#EAE4D7] rounded-2xl space-y-1">
              <strong className="text-xs font-black text-[#B88E4F] uppercase tracking-wider block mb-2">
                Tài khoản ngân hàng thụ hưởng đối soát
              </strong>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <span className="text-[#7D715E] block">Ngân hàng:</span>
                  <strong className="text-[#1A1612] font-bold">{inspectProfile.bankName}</strong>
                </div>
                <div>
                  <span className="text-[#7D715E] block">Số tài khoản:</span>
                  <strong className="font-mono text-[#1A1612] font-bold">{inspectProfile.accountNumber}</strong>
                </div>
                <div>
                  <span className="text-[#7D715E] block">Chủ tài khoản:</span>
                  <strong className="text-[#1A1612] font-bold">{inspectProfile.accountHolder}</strong>
                </div>
              </div>
            </div>

            {/* Ô từ chối */}
            {showRejectInput && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
                <label className="font-bold text-rose-800 block">Lý do từ chối hồ sơ KOL:</label>
                <textarea
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="VD: Không xem được link kênh, hoặc tài khoản ngân hàng không chính chủ..."
                  className="w-full bg-white border border-rose-300 rounded-lg p-2 text-xs outline-none"
                />
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#EAE4D7]">
              <Button
                variant="outline"
                size="md"
                className="border-rose-300 text-rose-700 hover:bg-rose-50"
                onClick={() => handleReviewKol(inspectProfile.id, 'REJECTED')}
              >
                {showRejectInput ? 'Xác nhận Từ chối' : 'Từ chối hồ sơ'}
              </Button>
              <Button
                variant="gold"
                size="md"
                icon={<ShieldCheck className="w-4 h-4" />}
                onClick={() => handleReviewKol(inspectProfile.id, 'VERIFIED')}
              >
                Phê duyệt &amp; Cấp Tích Xanh KOL
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* MODAL THẨM ĐỊNH CHI TIẾT GIAN HÀNG (SHOP) */}
      {inspectStore && (
        <Modal
          isOpen={true}
          onClose={() => setInspectStore(null)}
          title={`Thẩm định Gian Hàng: ${inspectStore.name}`}
          maxWidth="lg"
        >
          <div className="space-y-5 text-left text-xs">
            {/* 1. Pháp nhân & Kho hàng (Nghị định 85) */}
            <div className="p-3.5 bg-[#FAF8F5] border border-[#EAE4D7] rounded-2xl space-y-3">
              <strong className="text-xs font-black text-[#B88E4F] uppercase tracking-wider block">
                1. Thông tin pháp nhân &amp; Kho hàng (Nghị định 85/2021/NĐ-CP)
              </strong>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[#7D715E] block">Tên Gian Hàng:</span>
                  <strong className="text-[#1A1612] text-sm font-bold block">{inspectStore.name}</strong>
                </div>
                <div>
                  <span className="text-[#7D715E] block">Loại hình kinh doanh:</span>
                  <strong className="text-[#1A1612] text-sm font-bold block">{inspectStore.businessType}</strong>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[#7D715E] block">Chủ sở hữu / Người đại diện:</span>
                  <strong className="text-[#1A1612] font-bold block">{inspectStore.ownerName}</strong>
                  <span className="text-[11px] text-[#7D715E] font-mono">{inspectStore.ownerEmail} - {inspectStore.ownerPhone}</span>
                </div>
                <div>
                  <span className="text-[#7D715E] block">Mã số thuế doanh nghiệp/HKD:</span>
                  <strong className="font-mono text-[#1A1612] text-sm font-bold block">{inspectStore.taxCode}</strong>
                </div>
              </div>

              <div>
                <span className="text-[#7D715E] block mb-1">Địa chỉ kho xuất hàng thực tế:</span>
                <div className="p-2.5 rounded-xl bg-white border border-[#EAE4D7] flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-[#B88E4F] shrink-0" />
                  <span className="font-bold text-[#1A1612]">{inspectStore.warehouseAddress}</span>
                </div>
              </div>
            </div>

            {/* 2. Tài liệu chứng từ pháp lý */}
            <div className="p-3.5 bg-white border border-[#EAE4D7] rounded-2xl space-y-3">
              <strong className="text-xs font-black text-[#B88E4F] uppercase tracking-wider block">
                2. Chứng từ pháp lý &amp; Giấy phép kinh doanh
              </strong>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] space-y-2">
                  <span className="font-bold text-[#1A1612] block">Giấy phép ĐKKD:</span>
                  {inspectStore.businessLicenseUrl ? (
                    <div
                      onClick={() => setPreviewImage(inspectStore.businessLicenseUrl)}
                      className="w-full h-28 bg-white border border-[#EAE4D7] rounded-lg overflow-hidden cursor-pointer relative group"
                    >
                      <img
                        src={inspectStore.businessLicenseUrl}
                        alt="Giấy phép kinh doanh"
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white font-bold">
                        Xem tài liệu
                      </div>
                    </div>
                  ) : (
                    <span className="text-[#7D715E] italic">Chưa tải lên</span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] space-y-2">
                  <span className="font-bold text-[#1A1612] block">Ủy quyền thương hiệu / Nguồn gốc:</span>
                  {inspectStore.brandAuthorizationUrl ? (
                    <div
                      onClick={() => setPreviewImage(inspectStore.brandAuthorizationUrl)}
                      className="w-full h-28 bg-white border border-[#EAE4D7] rounded-lg overflow-hidden cursor-pointer relative group"
                    >
                      <img
                        src={inspectStore.brandAuthorizationUrl}
                        alt="Ủy quyền thương hiệu"
                        className="w-full h-full object-cover group-hover:scale-105 transition"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white font-bold">
                        Xem tài liệu
                      </div>
                    </div>
                  ) : (
                    <span className="text-[#7D715E] italic">Chưa tải lên</span>
                  )}
                </div>
              </div>
            </div>

            {/* Ô từ chối */}
            {showRejectInput && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5">
                <label className="font-bold text-rose-800 block">Lý do từ chối cấp phép gian hàng:</label>
                <textarea
                  rows={2}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="VD: Giấy phép kinh doanh hết hạn hoặc địa chỉ kho hàng không rõ ràng..."
                  className="w-full bg-white border border-rose-300 rounded-lg p-2 text-xs outline-none"
                />
              </div>
            )}

            {/* Actions */}
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-[#EAE4D7]">
              <Button
                variant="outline"
                size="md"
                className="border-rose-300 text-rose-700 hover:bg-rose-50"
                onClick={() => handleReviewShop(inspectStore.id, 'REJECTED')}
              >
                {showRejectInput ? 'Xác nhận Từ chối' : 'Từ chối gian hàng'}
              </Button>
              <Button
                variant="gold"
                size="md"
                icon={<BadgeCheck className="w-4 h-4" />}
                onClick={() => handleReviewShop(inspectStore.id, 'VERIFIED')}
              >
                Cấp Tích Xanh &amp; Kích Hoạt Gian Hàng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
