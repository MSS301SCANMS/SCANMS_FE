import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Package,
  RefreshCw,
  ShieldCheck,
  Truck,
  Video,
  ExternalLink,
  Copy,
  Search,
  Store,
  MapPin,
  X,
  History,
  Ban,
  ShieldAlert,
} from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../utils/toast';
import { getSafeProductImageUrl } from '../../features/marketplace/marketplaceUtils';
import { Select } from '../../components/ui/Select';

interface StatusConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  icon: typeof Clock3;
}

const STATUS_CONFIGS: Record<string, StatusConfig> = {
  PENDING: {
    label: 'Chờ Shop duyệt',
    badgeBg: 'bg-[#FFFBEB]',
    badgeText: 'text-[#D97706]',
    badgeBorder: 'border-[#FDE68A]',
    icon: Clock3,
  },
  APPROVED: {
    label: 'Shop đã duyệt',
    badgeBg: 'bg-[#FBF5EB]',
    badgeText: 'text-[#8C6226]',
    badgeBorder: 'border-[#EEDFC6]',
    icon: CheckCircle2,
  },
  SHIPPED: {
    label: 'Đang giao mẫu',
    badgeBg: 'bg-[#FBF5EB]',
    badgeText: 'text-[#8C6226]',
    badgeBorder: 'border-[#EEDFC6]',
    icon: Truck,
  },
  RECEIVED: {
    label: 'Đã nhận mẫu',
    badgeBg: 'bg-[#FBF5EB]',
    badgeText: 'text-[#8C6226]',
    badgeBorder: 'border-[#EEDFC6]',
    icon: Package,
  },
  VIDEO_SUBMITTED: {
    label: 'Chờ nghiệm thu video',
    badgeBg: 'bg-[#FBF5EB]',
    badgeText: 'text-[#B88E4F]',
    badgeBorder: 'border-[#EEDFC6]',
    icon: Video,
  },
  REVISION_REQUIRED: {
    label: 'Yêu cầu sửa video',
    badgeBg: 'bg-[#FFF7ED]',
    badgeText: 'text-[#EA580C]',
    badgeBorder: 'border-[#FED7AA]',
    icon: AlertTriangle,
  },
  OVERDUE: {
    label: 'Quá hạn nộp video',
    badgeBg: 'bg-[#FEF2F2]',
    badgeText: 'text-[#DC2626]',
    badgeBorder: 'border-[#FECACA]',
    icon: AlertTriangle,
  },
  DELIVERY_ISSUE: {
    label: 'Sự cố bưu cục',
    badgeBg: 'bg-[#FEF2F2]',
    badgeText: 'text-[#DC2626]',
    badgeBorder: 'border-[#FECACA]',
    icon: AlertTriangle,
  },
  COMPLETED: {
    label: 'Đã hoàn tất',
    badgeBg: 'bg-[#FBF5EB]',
    badgeText: 'text-[#8C6226]',
    badgeBorder: 'border-[#EEDFC6]',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Shop từ chối',
    badgeBg: 'bg-[#FBF5EB]',
    badgeText: 'text-[#8C6226]',
    badgeBorder: 'border-[#EEDFC6]',
    icon: X,
  },
  CANCELLED: {
    label: 'Đã hủy bỏ',
    badgeBg: 'bg-[#FBF5EB]',
    badgeText: 'text-[#8C6226]',
    badgeBorder: 'border-[#EEDFC6]',
    icon: X,
  },
};

type ResolutionAction = 'EXTEND_DEADLINE' | 'CANCEL_OBLIGATION' | 'RESOLVE_DELIVERY_ISSUE';

function localDateAfter(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function formatMoney(amount?: number | string | null): string {
  const num = Number(amount || 0);
  return num.toLocaleString('vi-VN') + ' ₫';
}

function getPlatformBadge(platform?: string) {
  const p = (platform || '').toUpperCase();
  if (p.includes('TIKTOK')) {
    return { name: 'TikTok', bg: 'bg-[#000000] text-white', icon: '🎵' };
  }
  if (p.includes('YOUTUBE')) {
    return { name: 'YouTube', bg: 'bg-[#FF0000] text-white', icon: '▶' };
  }
  if (p.includes('FACEBOOK')) {
    return { name: 'Facebook', bg: 'bg-[#1877F2] text-white', icon: 'f' };
  }
  if (p.includes('INSTAGRAM')) {
    return { name: 'Instagram', bg: 'bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#FCB045] text-white', icon: '📷' };
  }
  return { name: platform || 'Mạng xã hội', bg: 'bg-[#231D15] text-white', icon: '🌐' };
}

export default function AdminSampleRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [blockedCreators, setBlockedCreators] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'requests' | 'blocked'>('requests');
  const [loading, setLoading] = useState(true);

  // Resolution modal state
  const [resolution, setResolution] = useState<{ request: any; action: ResolutionAction } | null>(null);
  const [reason, setReason] = useState('');
  const [deadlineDate, setDeadlineDate] = useState(localDateAfter(7));
  const [saving, setSaving] = useState(false);

  // Unblock creator modal state
  const [unblockingCreator, setUnblockingCreator] = useState<any | null>(null);
  const [unblockReason, setUnblockReason] = useState('');
  const [unblockSubmitting, setUnblockSubmitting] = useState(false);

  // History timeline modal
  const [selectedHistoryRequest, setSelectedHistoryRequest] = useState<any | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [requestResponse, blockedResponse] = await Promise.all([
        api.get('/sample-requests/admin', { headers: { 'x-skip-cache': 'true' } }),
        api.get('/sample-requests/admin/blocked', { headers: { 'x-skip-cache': 'true' } }),
      ]);
      const requestData = requestResponse?.data || requestResponse;
      const blockedData = blockedResponse?.data || blockedResponse;
      setRequests(Array.isArray(requestData) ? requestData : []);
      setBlockedCreators(Array.isArray(blockedData) ? blockedData : []);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không tải được dữ liệu yêu cầu mẫu.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  // Statistics calculation for Executive Bar
  const stats = useMemo(() => {
    const total = requests.length;
    const shipping = requests.filter((r) => ['APPROVED', 'SHIPPED', 'RECEIVED'].includes(r.status)).length;
    const videoReview = requests.filter((r) => r.status === 'VIDEO_SUBMITTED').length;
    const risk = requests.filter((r) => ['OVERDUE', 'DELIVERY_ISSUE', 'REVISION_REQUIRED'].includes(r.status)).length;
    const completed = requests.filter((r) => r.status === 'COMPLETED').length;
    const blocked = blockedCreators.length;
    return { total, shipping, videoReview, risk, completed, blocked };
  }, [requests, blockedCreators]);

  // Filtered requests
  const filteredRequests = useMemo(() => {
    let list = requests;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'RISK_GROUP') {
        list = list.filter((r) => ['OVERDUE', 'DELIVERY_ISSUE', 'REVISION_REQUIRED'].includes(r.status));
      } else if (statusFilter === 'IN_PROGRESS') {
        list = list.filter((r) => ['APPROVED', 'SHIPPED', 'RECEIVED'].includes(r.status));
      } else {
        list = list.filter((r) => r.status === statusFilter);
      }
    }

    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter((r) => {
        const prodTitle = (r.product?.title || '').toLowerCase();
        const prodSku = (r.product?.sku || '').toLowerCase();
        const shopName = (r.product?.store?.name || '').toLowerCase();
        const kolName = (r.collaborator?.fullName || '').toLowerCase();
        const kolEmail = (r.collaborator?.email || '').toLowerCase();
        const recipientName = (r.recipientName || '').toLowerCase();
        const recipientPhone = (r.recipientPhone || '').toLowerCase();
        const tracking = (r.trackingNumber || '').toLowerCase();
        const channel = (r.socialChannelNameSnapshot || r.socialChannel?.channelName || '').toLowerCase();

        return (
          prodTitle.includes(q) ||
          prodSku.includes(q) ||
          shopName.includes(q) ||
          kolName.includes(q) ||
          kolEmail.includes(q) ||
          recipientName.includes(q) ||
          recipientPhone.includes(q) ||
          tracking.includes(q) ||
          channel.includes(q)
        );
      });
    }

    return list;
  }, [requests, statusFilter, searchQuery]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Đã sao chép ${label}!`, { description: text });
  };

  const openResolution = (request: any, action: ResolutionAction) => {
    setResolution({ request, action });
    setReason('');
    setDeadlineDate(localDateAfter(7));
  };

  const submitResolution = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!resolution || !reason.trim()) return;
    if (resolution.action === 'EXTEND_DEADLINE' && !deadlineDate) return;
    setSaving(true);
    try {
      await api.patch(`/sample-requests/admin/${resolution.request.id}/resolve`, {
        action: resolution.action,
        reason: reason.trim(),
        ...(resolution.action === 'EXTEND_DEADLINE'
          ? { deadlineAt: new Date(`${deadlineDate}T23:59:00`).toISOString() }
          : {}),
      });
      toast.success('Đã lưu quyết định xử lý và cập nhật hồ sơ yêu cầu.');
      setResolution(null);
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không thể xử lý yêu cầu mẫu.');
    } finally {
      setSaving(false);
    }
  };

  const submitUnblock = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!unblockingCreator || !unblockReason.trim()) return;
    setUnblockSubmitting(true);
    try {
      await api.patch(`/sample-requests/admin/${unblockingCreator.id}/unblock`, {
        reason: unblockReason.trim(),
      });
      toast.success(`Đã mở khóa quyền nhận mẫu cho KOL ${unblockingCreator.fullName || ''}!`);
      setUnblockingCreator(null);
      setUnblockReason('');
      await loadData();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không thể mở khóa KOL.');
    } finally {
      setUnblockSubmitting(false);
    }
  };

  const resolutionTitle =
    resolution?.action === 'EXTEND_DEADLINE'
      ? 'Gia hạn thời hạn nộp video cam kết'
      : resolution?.action === 'CANCEL_OBLIGATION'
      ? 'Miễn nghĩa vụ video mẫu (Đóng tranh chấp)'
      : 'Mở lại xuất gửi bù hàng mẫu';

  return (
    <main className="min-h-[calc(100vh-80px)] bg-[#FAF8F5] px-0 py-5 text-[#1A1612]">
      <div className="mx-0 w-full min-w-0 max-w-none space-y-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {[
            {label:'Tổng yêu cầu',value:stats.total,filter:'ALL',icon:Package},
            {label:'Đang xử lý',value:stats.shipping,filter:'IN_PROGRESS',icon:Truck},
            {label:'Chờ duyệt video',value:stats.videoReview,filter:'VIDEO_SUBMITTED',icon:Video},
            {label:'Cần xử lý',value:stats.risk,filter:'RISK_GROUP',icon:AlertTriangle},
            {label:'Hoàn tất',value:stats.completed,filter:'COMPLETED',icon:CheckCircle2},
            {label:'KOL bị khóa',value:stats.blocked,filter:'BLOCKED',icon:Ban},
          ].map((item) => {
            const Icon = item.icon;
            const active = item.filter === 'BLOCKED' ? view === 'blocked' : view === 'requests' && statusFilter === item.filter;
            return <button key={item.filter} type="button" aria-pressed={active} onClick={() => { setView(item.filter === 'BLOCKED' ? 'blocked' : 'requests'); if(item.filter !== 'BLOCKED')setStatusFilter(item.filter); }} className={'rounded-xl border bg-white px-3 py-3 text-left transition cursor-pointer ' + (active ? 'border-[#C59B58] ring-1 ring-[#EEDFC6]' : 'border-[#EAE4D7] hover:border-[#C59B58]')}>
              <div className="flex items-center justify-between gap-2 text-[11px] text-[#7D715E]"><span>{item.label}</span><Icon className={'h-3.5 w-3.5 ' + (['RISK_GROUP','BLOCKED'].includes(item.filter) && item.value > 0 ? 'text-[#DC2626]' : 'text-[#B88E4F]')} /></div>
              <div className="mt-2 text-xl font-semibold text-[#1A1612]">{item.value}</div>
            </button>;
          })}
        </div>

        {/* Toolbar: Tabs, Search & Status Dropdown */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#EAE4D7] bg-white p-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setView('requests')}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${view === 'requests' ? 'bg-[#FBF5EB] text-[#8C6226] ring-1 ring-[#EEDFC6]' : 'text-[#7D715E] hover:bg-[#FAF8F5]'}`}
            >
              <Package className="h-4 w-4" />
              <span>Yêu cầu hàng mẫu</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-extrabold ${view === 'requests' ? 'bg-white text-[#8C6226]' : 'bg-[#F3EFE6] text-[#7D715E]'}`}>
                {requests.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setView('blocked')}
              className={`rounded-lg px-3 py-2 text-xs font-semibold transition flex items-center gap-2 cursor-pointer ${view === 'blocked' ? 'bg-[#FBF5EB] text-[#8C6226] ring-1 ring-[#EEDFC6]' : 'text-[#7D715E] hover:bg-[#FAF8F5]'}`}
            >
              <ShieldAlert className="h-4 w-4" />
              <span>KOL bị khóa</span>
              {blockedCreators.length > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[11px] font-extrabold ${view === 'blocked' ? 'bg-white text-[#DC2626]' : 'bg-rose-100 text-[#DC2626]'}`}>
                  {blockedCreators.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex w-full min-w-0 flex-wrap items-center gap-2.5 lg:w-auto lg:justify-end">
            {view === 'requests' && (
              <>
                {/* Search input */}
                <div className="relative w-full min-w-0 sm:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7D715E]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Tìm yêu cầu hàng mẫu" placeholder="Tìm sản phẩm, KOL, Shop, vận đơn…"
                    className="h-9 w-full pl-9 pr-8 py-1.5 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] text-xs font-semibold text-[#1A1612] outline-none focus:border-[#C59B58] focus:bg-white transition"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-[#7D715E] hover:text-[#1A1612]"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Status filter dropdown */}
                <div className="w-full min-w-0 sm:w-52">
                  <Select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    aria-label="Lọc trạng thái hàng mẫu" className="h-9 w-full text-xs font-medium"
                  >
                    <option value="ALL">Tất cả trạng thái ({requests.length})</option>
                    <option value="IN_PROGRESS">Đang xử lý ({stats.shipping})</option>
                    <option value="VIDEO_SUBMITTED">Chờ duyệt video ({stats.videoReview})</option>
                    <option value="RISK_GROUP">Cảnh báo rủi ro &amp; Quá hạn ({stats.risk})</option>
                    {Object.entries(STATUS_CONFIGS).map(([status, config]) => (
                      <option key={status} value={status}>
                        {config.label}
                      </option>
                    ))}
                  </Select>
                </div>
              </>
            )}

            <button
              type="button"
              onClick={() => void loadData()}
              disabled={loading}
              className="inline-flex h-9 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-[#7D715E] transition hover:text-[#8C6226] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]/40 disabled:cursor-wait disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={'h-3.5 w-3.5 text-[#B88E4F] ' + (loading ? 'animate-spin' : '')} />
              {loading ? 'Đang tải…' : 'Làm mới'}
            </button>
          </div>
        </div>

        {/* Content View */}
        {loading ? (
          <div className="rounded-2xl border border-[#EAE4D7] bg-white p-16 text-center text-sm text-[#7D715E] flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-[#C59B58] animate-spin" />
            <span className="font-semibold">Đang tổng hợp dữ liệu hàng mẫu và cam kết KOL...</span>
          </div>
        ) : view === 'blocked' ? (
          /* BLOCKED CREATORS VIEW */
          <div className="space-y-3.5">
            {blockedCreators.length === 0 ? (
              <div className="rounded-2xl border border-[#EAE4D7] bg-white p-14 text-center">
                <ShieldCheck className="w-12 h-12 text-[#059669] mx-auto mb-2" />
                <h3 className="text-sm font-semibold text-[#1A1612]">Không có KOL nào bị khóa</h3>
                <p className="text-xs text-[#7D715E] mt-1 max-w-md mx-auto">
                  Hiện không có nhà sáng tạo nào bị khóa quyền nhận hàng mẫu.
                </p>
              </div>
            ) : (
              blockedCreators.map((entry) => {
                const creator = entry.user;
                return (
                  <article
                    key={creator.id}
                    className="rounded-xl border border-[#EAE4D7] bg-white p-4 shadow-[0_2px_8px_rgba(35,29,21,0.025)]"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="flex items-start gap-3.5">
                        <div className="w-9 h-9 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center shrink-0 text-rose-600 font-bold text-base">
                          {(creator.fullName || 'K')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h2 className="text-sm font-semibold text-[#1A1612]">
                              {creator.fullName || 'Nhà sáng tạo'}
                            </h2>
                            <span className="text-[11px] font-bold text-[#DC2626] bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Ban className="w-3 h-3" />
                              Bị khóa nhận mẫu
                            </span>
                          </div>
                          <div className="text-xs text-[#7D715E] mt-0.5 flex items-center gap-2 flex-wrap">
                            <span>📧 {creator.email}</span>
                            {creator.phoneNumber && <span>📞 {creator.phoneNumber}</span>}
                          </div>
                          <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50/70 border border-rose-100 text-xs text-rose-800">
                            <strong>Lý do hệ thống khóa:</strong> {entry.sampleRequestsBlockReason || 'Quá hạn nộp video cam kết nhiều lần mà không hoàn thành nghĩa vụ.'}
                          </div>
                          <p className="mt-1.5 text-[11px] text-[#7D715E]">
                            Thời điểm khóa: {entry.sampleRequestsBlockedAt ? new Date(entry.sampleRequestsBlockedAt).toLocaleString('vi-VN') : '—'} • {creator.sampleProductRequests?.length || 0} yêu cầu mẫu bị quá hạn liên quan
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setUnblockingCreator(creator);
                          setUnblockReason('');
                        }}
                        className="self-start px-4 py-2 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-[#231D15] text-xs font-bold transition shadow-xs cursor-pointer active:scale-95 flex items-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Mở khóa quyền nhận mẫu</span>
                      </button>
                    </div>

                    {creator.sampleProductRequests?.length > 0 && (
                      <div className="mt-4 pt-3.5 border-t border-[#EAE4D7]">
                        <p className="text-xs font-bold text-[#1A1612] mb-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-[#DC2626]" />
                          Các đơn mẫu quá hạn gây khóa tài khoản:
                        </p>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {creator.sampleProductRequests.map((req: any) => (
                            <div key={req.id} className="p-2 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] text-xs">
                              <div className="font-bold text-[#1A1612] truncate">{req.product?.title || 'Sản phẩm mẫu'}</div>
                              <div className="text-[11px] text-[#7D715E] flex justify-between mt-0.5">
                                <span>Shop: {req.product?.store?.name || '—'}</span>
                                <span className="text-[#DC2626] font-semibold">Hạn: {req.deadlineAt ? new Date(req.deadlineAt).toLocaleDateString('vi-VN') : '—'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
        ) : filteredRequests.length === 0 ? (
          /* EMPTY STATE */
          <div className="rounded-2xl border border-[#EAE4D7] bg-white p-14 text-center">
            <Package className="w-12 h-12 text-[#C59B58] mx-auto mb-2 opacity-60" />
            <h3 className="text-sm font-semibold text-[#1A1612]">Không tìm thấy yêu cầu phù hợp</h3>
            <p className="text-xs text-[#7D715E] mt-1 max-w-md mx-auto">
              Không có yêu cầu hàng mẫu nào khớp với bộ lọc trạng thái hoặc từ khóa tìm kiếm của bạn.
            </p>
          </div>
        ) : (
          /* RICH SAMPLE REQUEST CARDS LIST */
          <div className="space-y-4">
            {filteredRequests.map((request) => {
              const statusCfg = STATUS_CONFIGS[request.status] || {
                label: request.status,
                badgeBg: 'bg-[#FBF5EB]',
                badgeText: 'text-[#8C6226]',
                badgeBorder: 'border-[#EEDFC6]',
                icon: Clock3,
              };
              const StatusIcon = statusCfg.icon;

              const revisionStage =
                Boolean(request.revisionDeadlineAt) && ['REVISION_REQUIRED', 'OVERDUE'].includes(request.status);
              const activeDeadline = revisionStage ? request.revisionDeadlineAt : request.deadlineAt;
              const canExtend = ['RECEIVED', 'REVISION_REQUIRED', 'OVERDUE'].includes(request.status);

              const prodImage = getSafeProductImageUrl(
                request.product?.imageUrl,
                request.product?.title || 'Sản phẩm mẫu'
              );

              const platformBadge = getPlatformBadge(
                request.socialPlatformSnapshot || request.socialChannel?.platformName
              );

              const kolProfile = request.collaborator?.collaboratorProfile;
              const tierName = kolProfile?.tier?.name || 'KOL Tiếp thị';

              return (
                <article key={request.id} className="min-w-0 rounded-xl border border-[#EAE4D7] bg-white p-4 text-left shadow-[0_2px_8px_rgba(35,29,21,0.025)]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={'inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ' + statusCfg.badgeBg + ' ' + statusCfg.badgeText + ' ' + statusCfg.badgeBorder}><StatusIcon className="h-3 w-3" />{statusCfg.label}</span>
                      <span className="text-[11px] text-[#7D715E]">{new Date(request.createdAt).toLocaleDateString('vi-VN')}</span>
                      <code className="text-[10px] text-[#7D715E]" title={request.id}>#{request.id.slice(0,8).toUpperCase()}</code>
                    </div>
                    <span className="text-xs text-[#7D715E]">Giá mẫu <strong className="ml-1 text-sm font-semibold text-[#1A1612]">{formatMoney(request.productVariant?.price ?? request.product?.price)}</strong></span>
                  </div>
                  <div className="mt-3 grid min-w-0 grid-cols-1 gap-4 border-t border-[#EAE4D7] pt-3 md:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#EAE4D7] bg-[#FAF8F5]"><Package className="absolute inset-0 m-auto h-5 w-5 text-[#C59B58]" /><img src={prodImage} alt={request.product?.title || 'Sản phẩm mẫu'} className="relative h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} /></div>
                      <div className="min-w-0"><h2 className="text-sm font-semibold leading-5 text-[#1A1612] line-clamp-2" title={request.product?.title}>{request.product?.title || 'Sản phẩm mẫu'}</h2>{request.productVariant?.name && <p className="mt-1 text-[11px] text-[#8C6226]">{request.productVariant.name}</p>}<p className="mt-1 flex items-center gap-1 text-[11px] text-[#7D715E]"><Store className="h-3 w-3 shrink-0" /><span className="truncate" title={request.product?.store?.name}>{request.product?.store?.name || 'Gian hàng SCANMS'}</span></p></div>
                    </div>
                    <div className="min-w-0 lg:border-l lg:border-[#EAE4D7] lg:pl-4"><p className="text-[11px] text-[#7D715E]">Nhà sáng tạo</p><p className="mt-1 text-xs font-semibold leading-5 text-[#1A1612]">{request.collaborator?.fullName || 'KOL tiếp thị'}</p><p className="mt-0.5 truncate text-[11px] text-[#7D715E]" title={request.collaborator?.email}>{request.collaborator?.email || 'Chưa có email'}</p><span className="mt-1 inline-block text-[10px] text-[#8C6226]">{tierName}</span></div>
                    <div className="min-w-0 md:col-span-2 lg:col-span-1 lg:border-l lg:border-[#EAE4D7] lg:pl-4">
                      <dl className="space-y-1.5 text-xs"><div className="flex flex-wrap justify-between gap-2"><dt className="text-[#7D715E]">Dự kiến đăng</dt><dd className="font-medium">{request.expectedVideoAt ? new Date(request.expectedVideoAt).toLocaleDateString('vi-VN') : 'Chưa thiết lập'}</dd></div><div className="flex flex-wrap justify-between gap-2"><dt className="text-[#7D715E]">{revisionStage ? 'Hạn sửa video' : 'Hạn nộp video'}</dt><dd className={request.status === 'OVERDUE' ? 'font-semibold text-[#DC2626]' : 'font-medium'}>{activeDeadline ? new Date(activeDeadline).toLocaleDateString('vi-VN') : 'Chưa xác lập'}</dd></div></dl>
                      {request.videoUrl && <a href={request.videoUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-[#8C6226] hover:underline"><Video className="h-3.5 w-3.5" />Xem video<ExternalLink className="h-3 w-3" /></a>}
                      {request.status === 'OVERDUE' && <p className="mt-2 text-[11px] text-[#DC2626]">Quá hạn nộp video · Cần xử lý</p>}
                    </div>
                  </div>
                  {(request.rejectedReason || request.videoRejectionReason) && <div className="mt-3 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-2 text-xs leading-5 text-[#7D715E]">{request.rejectedReason && <p>Ghi chú xử lý: {request.rejectedReason}</p>}{request.videoRejectionReason && <p>Yêu cầu sửa video: {request.videoRejectionReason}</p>}</div>}
                  <details className="mt-3 border-t border-[#EAE4D7] pt-2.5 text-xs">
                    <summary className="w-fit cursor-pointer font-medium text-[#8C6226]">Thông tin giao nhận & kênh cam kết</summary>
                    <div className="mt-3 grid gap-3 rounded-lg bg-[#FAF8F5] p-3 sm:grid-cols-2 text-[#7D715E] leading-5">
                      <div><p className="flex items-start gap-1"><MapPin className="mt-1 h-3 w-3 shrink-0" /><span>{request.recipientName || 'Người nhận'} · {request.recipientPhone || 'Chưa có số điện thoại'}</span></p><p>{request.shippingAddress || 'Chưa cung cấp địa chỉ'}</p>{request.trackingNumber && <div className="mt-1 flex flex-wrap items-center gap-2"><span className="break-all">{request.carrier || 'Vận chuyển'}: {request.trackingNumber}</span><button type="button" onClick={() => copyToClipboard(request.trackingNumber, 'mã vận đơn')} className="inline-flex items-center gap-1 text-[#8C6226]"><Copy className="h-3 w-3" />Sao chép</button></div>}</div>
                      <div><p className="font-medium text-[#1A1612]">{platformBadge.name} · {request.socialChannelNameSnapshot || request.socialChannel?.channelName || 'Chưa định danh kênh'}</p><p>{Number(request.socialFollowerSnapshot ?? request.socialChannel?.followerCount ?? 0).toLocaleString('vi-VN')} người theo dõi</p><p>Tạo lúc: {new Date(request.createdAt).toLocaleString('vi-VN')}</p>{activeDeadline && <p>Hạn nộp: {new Date(activeDeadline).toLocaleString('vi-VN')}</p>}</div>
                    </div>
                  </details>
                      {/* Admin Resolution Action Buttons */}
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedHistoryRequest(request)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#8C6226] hover:underline cursor-pointer"
                        >
                          <History className="w-3.5 h-3.5" />
                          <span>Lịch sử ({request.events?.length || 0})</span>
                        </button>

                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {canExtend && (
                            <button
                              type="button"
                              onClick={() => openResolution(request, 'EXTEND_DEADLINE')}
                              className="px-2.5 py-1.5 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] hover:bg-[#F3EFE6] text-xs font-bold text-[#8C6226] flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-2xs"
                              title="Gia hạn thời hạn nộp video cho KOL"
                            >
                              <CalendarClock className="w-3.5 h-3.5" />
                              <span>Gia hạn</span>
                            </button>
                          )}

                          {request.status === 'DELIVERY_ISSUE' && (
                            <button
                              type="button"
                              onClick={() => openResolution(request, 'RESOLVE_DELIVERY_ISSUE')}
                              className="px-2.5 py-1.5 rounded-lg bg-[#C59B58] hover:bg-[#B88E4F] text-[#231D15] text-xs font-bold flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-2xs"
                              title="Giải quyết sự cố giao hàng và mở lại cho Shop gửi bù"
                            >
                              <Truck className="w-3.5 h-3.5" />
                              <span>Mở gửi bù</span>
                            </button>
                          )}

                          {['APPROVED', 'SHIPPED', 'RECEIVED', 'REVISION_REQUIRED', 'OVERDUE', 'DELIVERY_ISSUE'].includes(
                            request.status
                          ) && (
                            <button
                              type="button"
                              onClick={() => openResolution(request, 'CANCEL_OBLIGATION')}
                              className="px-2.5 py-1.5 rounded-lg border border-[#EAE4D7] bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#7D715E] hover:text-[#DC2626] transition active:scale-95 cursor-pointer"
                              title="Miễn nghĩa vụ video mẫu do sự cố bất khả kháng"
                            >
                              <span>Miễn nghĩa vụ</span>
                            </button>
                          )}

                          {request.status === 'COMPLETED' && (
                            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#059669] bg-white px-2.5 py-1 rounded-lg border border-[#EAE4D7]">
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Hoàn tất</span>
                            </span>
                          )}
                        </div>
                      </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* RESOLUTION MODAL (GIA HẠN / MIỄN NGHĨA VỤ / GỬI BÙ) */}
      {resolution && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={submitResolution}
            className="w-full max-w-lg space-y-4 rounded-2xl border border-[#EAE4D7] bg-white p-6 shadow-2xl text-left animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE4D7]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center shrink-0 text-[#B88E4F]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#1A1612] m-0">{resolutionTitle}</h2>
                  <p className="text-xs text-[#7D715E] mt-0.5 m-0">
                    Quyết định can thiệp sẽ được lưu vết kiểm toán và gửi thông báo cho hai bên
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResolution(null)}
                className="p-1 rounded-lg text-[#7D715E] hover:bg-[#FAF8F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] text-xs text-[#7D715E] space-y-1">
              <div className="truncate">• <strong>Sản phẩm:</strong> <span className="text-[#1A1612] font-semibold">{resolution.request.product?.title}</span></div>
              <div>• <strong>KOL tiếp thị:</strong> <span className="text-[#1A1612] font-semibold">{resolution.request.collaborator?.fullName} ({resolution.request.collaborator?.email})</span></div>
              <div>• <strong>Gian hàng:</strong> <span className="text-[#1A1612] font-semibold">{resolution.request.product?.store?.name}</span></div>
            </div>

            {resolution.action === 'EXTEND_DEADLINE' && (
              <div>
                <label className="block text-xs font-bold text-[#1A1612] mb-1">
                  Thời hạn nộp video mới <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="date"
                  min={localDateAfter(1)}
                  value={deadlineDate}
                  onChange={(event) => setDeadlineDate(event.target.value)}
                  required
                  className="w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 py-2 text-xs font-semibold text-[#1A1612] outline-none focus:border-[#C59B58]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-[#1A1612] mb-1">
                Căn cứ / Lý do can thiệp của Quản trị viên <span className="text-[#DC2626]">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={500}
                required
                rows={3}
                className="w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3 text-xs text-[#1A1612] outline-none focus:border-[#C59B58] transition resize-none font-medium"
                placeholder="Ghi nhận khiếu nại, thỏa thuận giữa hai bên hoặc bằng chứng bất khả kháng..."
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-[#EAE4D7]">
              <button
                type="button"
                onClick={() => setResolution(null)}
                className="rounded-xl border border-[#EAE4D7] bg-white px-4 py-2 text-xs font-bold text-[#7D715E] hover:bg-[#FAF8F5] transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={saving || !reason.trim()}
                className="rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] px-5 py-2 text-xs font-bold text-[#231D15] disabled:opacity-50 transition shadow-xs flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <span>Lưu quyết định</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* UNBLOCK CREATOR MODAL */}
      {unblockingCreator && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <form
            onSubmit={submitUnblock}
            className="w-full max-w-md space-y-4 rounded-2xl border border-[#EAE4D7] bg-white p-6 shadow-2xl text-left animate-in zoom-in-95 duration-150"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE4D7]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center shrink-0 text-[#059669]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#1A1612] m-0">Mở khóa quyền nhận mẫu</h2>
                  <p className="text-xs text-[#7D715E] mt-0.5 m-0">KOL: {unblockingCreator.fullName}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUnblockingCreator(null)}
                className="p-1 rounded-lg text-[#7D715E] hover:bg-[#FAF8F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-[#7D715E] leading-relaxed">
              Sau khi mở khóa, KOL sẽ được khôi phục quyền gửi yêu cầu xin sản phẩm mẫu tới các gian hàng đối tác trên sàn SCANMS.
            </p>

            <div>
              <label className="block text-xs font-bold text-[#1A1612] mb-1">
                Lý do phê duyệt mở khóa <span className="text-[#DC2626]">*</span>
              </label>
              <textarea
                value={unblockReason}
                onChange={(e) => setUnblockReason(e.target.value)}
                maxLength={400}
                required
                rows={3}
                className="w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3 text-xs text-[#1A1612] outline-none focus:border-[#C59B58] transition resize-none font-medium"
                placeholder="VD: KOL đã bổ sung video giải trình hợp lệ / Đã thanh toán bồi hoàn chi phí mẫu..."
              />
            </div>

            <div className="flex justify-end gap-2.5 pt-2 border-t border-[#EAE4D7]">
              <button
                type="button"
                onClick={() => setUnblockingCreator(null)}
                className="rounded-xl border border-[#EAE4D7] bg-white px-4 py-2 text-xs font-bold text-[#7D715E] hover:bg-[#FAF8F5] transition"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                disabled={unblockSubmitting || !unblockReason.trim()}
                className="rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] px-5 py-2 text-xs font-bold text-[#231D15] disabled:opacity-50 transition shadow-xs flex items-center gap-1.5"
              >
                {unblockSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang mở khóa...</span>
                  </>
                ) : (
                  <span>Xác nhận mở khóa</span>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* HISTORY TIMELINE DRAWER / MODAL */}
      {selectedHistoryRequest && (
        <div
          className="fixed inset-0 z-[100] grid place-items-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-2xl border border-[#EAE4D7] bg-white shadow-2xl text-left animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between p-5 border-b border-[#EAE4D7]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center shrink-0 text-[#B88E4F]">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-[#1A1612] m-0">Lịch sử sự kiện & Video nộp</h2>
                  <p className="text-xs text-[#7D715E] mt-0.5 m-0">
                    Đơn mẫu #{selectedHistoryRequest.id.slice(0, 8).toUpperCase()} • {selectedHistoryRequest.product?.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHistoryRequest(null)}
                className="p-1 rounded-lg text-[#7D715E] hover:bg-[#FAF8F5]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4">
              {/* Video Assets section */}
              {selectedHistoryRequest.videoAssets?.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#B88E4F] mb-2 flex items-center gap-1.5">
                    <Video className="w-3.5 h-3.5" />
                    Các phiên bản video đã gửi ({selectedHistoryRequest.videoAssets.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedHistoryRequest.videoAssets.map((asset: any) => (
                      <div key={asset.id} className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <a
                            href={asset.urlOrContent}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold text-[#8C6226] hover:underline flex items-center gap-1 truncate"
                          >
                            <span>{asset.title || 'Video nghiệm thu'}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-white border border-[#EAE4D7]">
                            {asset.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#7D715E] mt-1">
                          Nộp lúc: {new Date(asset.createdAt).toLocaleString('vi-VN')}
                        </div>
                        {asset.rejectionReason && (
                          <div className="mt-1.5 text-[11px] text-[#DC2626] bg-rose-50 p-2 rounded-lg border border-rose-200">
                            <strong>Lý do từ chối:</strong> {asset.rejectionReason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Events Timeline */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#7D715E] mb-2 flex items-center gap-1.5">
                  <Clock3 className="w-3.5 h-3.5 text-[#B88E4F]" />
                  Dòng thời gian sự kiện ({selectedHistoryRequest.events?.length || 0})
                </h4>

                {(!selectedHistoryRequest.events || selectedHistoryRequest.events.length === 0) ? (
                  <p className="text-xs text-[#7D715E] italic">Chưa có sự kiện bổ sung.</p>
                ) : (
                  <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#EAE4D7]">
                    {selectedHistoryRequest.events.map((event: any) => (
                      <div key={event.id} className="relative text-xs">
                        <div className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-[#C59B58] ring-4 ring-white" />
                        <div className="font-bold text-[#1A1612]">{event.action}</div>
                        <div className="text-[10px] text-[#7D715E]">{new Date(event.createdAt).toLocaleString('vi-VN')}</div>
                        {event.details?.reason && (
                          <div className="mt-1 text-[11px] text-[#7D715E] bg-[#FAF8F5] p-2 rounded-lg border border-[#EAE4D7]">
                            <strong>Căn cứ:</strong> {event.details.reason}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-[#EAE4D7] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedHistoryRequest(null)}
                className="px-4 py-2 rounded-xl border border-[#EAE4D7] text-xs font-bold text-[#7D715E] hover:bg-[#FAF8F5]"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
