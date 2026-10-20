import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ShieldCheck,
  Search,
  Download,
  RefreshCw,
  Clock,
  AlertTriangle,
  Info,
  DollarSign,
  Lock,
  Layers,
  FileText,
  Copy,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Eye,
} from 'lucide-react';
import { toast } from '../../utils/toast';
import {
  auditService,
  type AuditLogItem,
  type AuditStats,
  type AuditCategory,
  type AuditSeverity,
} from '../../services/audit.service';
import { Select } from '../../components/ui/Select';
import { PageHeader } from '../../components/ui/PageHeader';
import { StatCard } from '../../components/ui/StatCard';
import { WorkspaceHero } from '@/components/ui/FeatureWorkspace';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [statsError, setStatsError] = useState('');

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('30d');
  const [searchKeyword, setSearchKeyword] = useState<string>('');
  const [debouncedKeyword, setDebouncedKeyword] = useState<string>('');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);
  const pageSize = 15;

  // Selected Log for Modal
  const [selectedLog, setSelectedLog] = useState<AuditLogItem | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showRawJson, setShowRawJson] = useState<boolean>(false);
  const logSequence = useRef(0);
  const statsSequence = useRef(0);
  const exportLock = useRef(false);

  useEffect(() => {
    if (!selectedLog) {
      setShowRawJson(false);
      return;
    }
    setShowRawJson(false);
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    detailRef.current?.focus();
    const dismiss = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedLog(null);
      if (event.key === 'Tab') {
        const controls = detailRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), [tabindex="0"]');
        if (!controls?.length) return;
        const first = controls[0]; const last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === detailRef.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    window.addEventListener('keydown', dismiss);
    return () => { document.body.style.overflow = previousOverflow; window.removeEventListener('keydown', dismiss); previousFocus?.focus(); };
  }, [selectedLog]);

  // Debounce search keyword
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchKeyword);
      setCurrentPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchKeyword]);

  // Load Action metadata & Stats
  const loadStatsAndActions = useCallback(async () => {
    const request = ++statsSequence.current;
    setStats(null); setStatsError('');
    try {
      const statsRes = await auditService.getAuditStats(selectedTimeframe);
      if (request !== statsSequence.current) return;
      setStats(statsRes);
    } catch (err: any) {
      if (request === statsSequence.current) setStatsError('Chưa tải được thống kê kiểm toán. Bảng sự kiện vẫn có thể tra cứu độc lập.');
      console.error('Lỗi khi tải metadata kiểm toán:', err);
    }
  }, [selectedTimeframe]);

  // Load Logs
  const loadLogs = useCallback(async () => {
    const request = ++logSequence.current;
    setLoading(true);
    setError(null);
    try {
      const params: any = {
        page: currentPage,
        limit: pageSize,
      };

      if (selectedCategory !== 'ALL') {
        params.category = selectedCategory as AuditCategory;
      }
      if (selectedSeverity !== 'ALL') {
        params.severity = selectedSeverity as AuditSeverity;
      }
      if (debouncedKeyword.trim()) {
        params.keyword = debouncedKeyword.trim();
      }

      // Timeframe dates
      const now = new Date();
      if (selectedTimeframe === '24h') {
        params.startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      } else if (selectedTimeframe === '7d') {
        params.startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (selectedTimeframe === '30d') {
        params.startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      }

      const res = await auditService.getAuditLogs(params);
      if (request !== logSequence.current) return;
      setLogs(res.items || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (err: any) {
      if (request !== logSequence.current) return;
      console.error('Lỗi khi tải danh sách Audit Logs:', err);
      setError(err.response?.data?.message || err.message || 'Không thể tải nhật ký kiểm toán');
    } finally {
      if (request === logSequence.current) setLoading(false);
    }
  }, [currentPage, selectedCategory, selectedSeverity, debouncedKeyword, selectedTimeframe]);

  useEffect(() => {
    loadStatsAndActions();
    return () => { statsSequence.current += 1; };
  }, [loadStatsAndActions]);

  useEffect(() => {
    loadLogs();
    return () => { logSequence.current += 1; };
  }, [loadLogs]);

  // Export CSV Handler
  const handleExportCsv = async () => {
    if (exportLock.current) return;
    exportLock.current = true;
    setExporting(true);
    try {
      const params: any = {};
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (selectedSeverity !== 'ALL') params.severity = selectedSeverity;
      const days = { '24h': 1, '7d': 7, '30d': 30, all: null }[selectedTimeframe];
      if (days !== null) params.startDate = new Date(Date.now() - days * 86400000).toISOString();
      if (debouncedKeyword.trim()) params.keyword = debouncedKeyword.trim();

      const blob = await auditService.exportAuditLogsCsv(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scanms_nhat_ky_hoat_dong_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      document.body.removeChild(a);
    } catch (err: any) {
      toast.error('Xuất file nhật ký thất bại', {
        description: err.message || 'Lỗi kết nối máy chủ.',
      });
    } finally {
      exportLock.current = false;
      setExporting(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch { toast.error('Không thể sao chép. Vui lòng thử lại.'); }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'SYSTEM_ADMIN':
        return 'Quản trị viên';
      case 'SHOP_MANAGER':
        return 'Chủ gian hàng';
      case 'COLLABORATOR':
        return 'Nhà sáng tạo (KOL)';
      case 'CUSTOMER':
        return 'Khách hàng';
      case 'STAFF':
        return 'Nhân viên';
      default:
        return role || 'Người dùng';
    }
  };

  const ACTION_NAME_VI_FALLBACK: Record<string, string> = {
    ANALYTICS_PAGE_VIEW: 'Xem trang phân tích & báo cáo',
    ANALYTICS_CTA_CLICK: 'Tương tác nút thao tác trên sàn',
    CREATE_REFERRAL_LINK: 'Tạo link tiếp thị liên kết',
    ADMIN_VIEW_TRACKING_EVENTS: 'Xem dữ liệu kỹ thuật chi tiết',
    AI_FRAUD_FLAGGED: 'Cảnh báo gian lận lưu lượng',
    AI_FRAUD_ACTION_APPLIED: 'Xử lý vi phạm gian lận',
    FRAUD_ALERT_DISMISSED: 'Bác bỏ cảnh báo gian lận',
    USER_REGISTER: 'Đăng ký tài khoản',
    USER_LOGIN: 'Đăng nhập hệ thống',
    USER_LOGOUT: 'Đăng xuất hệ thống',
    PASSWORD_CHANGED: 'Đổi mật khẩu',
    KYC_APPROVED: 'Duyệt hồ sơ KYC',
    KYC_REJECTED: 'Từ chối hồ sơ KYC',
    USER_STATUS_UPDATED: 'Khóa / Mở tài khoản',
    PAYOUT_REQUESTED: 'Yêu cầu rút tiền',
    PAYOUT_APPROVED: 'Duyệt lệnh rút tiền',
    PAYOUT_REJECTED: 'Từ chối rút tiền',
    COMMISSION_RULE_CREATED: 'Tạo chính sách thưởng',
    COMMISSION_RULE_UPDATED: 'Sửa chính sách thưởng',
    COMMISSION_FROZEN: 'Đóng băng hoa hồng',
    PRODUCT_CREATED: 'Đăng tải sản phẩm mới',
    PRODUCT_UPDATED: 'Cập nhật sản phẩm',
    PRODUCT_DELETED: 'Xóa sản phẩm khỏi sàn',
    MEDIA_REVIEWED: 'Kiểm duyệt video review',
    SAMPLE_REQUEST_CREATED: 'Gửi yêu cầu mẫu thử',
    SAMPLE_REQUEST_APPROVED: 'Duyệt gửi hàng mẫu',
    SAMPLE_REQUEST_REJECTED: 'Từ chối gửi mẫu thử',
    CAMPAIGN_CREATED: 'Tạo chiến dịch mới',
    CAMPAIGN_INVITE_SENT: 'Gửi thiệp mời chiến dịch',
    CAMPAIGN_INVITE_ACCEPTED: 'Chấp nhận lời mời chiến dịch',
    CAMPAIGN_INVITE_REJECTED: 'Từ chối lời mời chiến dịch',
  };

  const getActionNameVi = (action: string, actionNameVi?: string): string => {
    if (actionNameVi && actionNameVi.trim()) return actionNameVi;
    if (ACTION_NAME_VI_FALLBACK[action]) return ACTION_NAME_VI_FALLBACK[action];
    return action
      .toLowerCase()
      .replace(/_/g, ' ')
      .replace(/^([a-z])/, (m) => m.toUpperCase());
  };

  const renderFriendlyDetails = (details: Record<string, any> | null | undefined) => {
    if (!details || Object.keys(details).length === 0) {
      return (
        <p className="text-xs text-[#7D715E] italic py-1">
          Không có dữ liệu chi tiết kèm theo.
        </p>
      );
    }

    const fieldLabels: Record<string, string> = {
      amount: 'Số tiền giao dịch',
      payoutAmount: 'Số tiền chi trả',
      finalAmount: 'Tổng giá trị đơn hàng',
      commissionAmount: 'Tiền hoa hồng',
      status: 'Trạng thái',
      previousStatus: 'Trạng thái trước',
      newStatus: 'Trạng thái sau cập nhật',
      reason: 'Lý do thực hiện',
      rejectionReason: 'Lý do từ chối',
      note: 'Ghi chú',
      storeName: 'Gian hàng',
      productTitle: 'Sản phẩm',
      productName: 'Tên sản phẩm',
      collaboratorName: 'Đối tác KOL',
      orderId: 'Mã đơn hàng',
      incidentId: 'Mã sự vụ AI',
      role: 'Vai trò tài khoản',
      balance: 'Số dư ví',
    };

    const entries = Object.entries(details).filter(([key]) => {
      return !['userAgent', 'stack', 'headers', 'timestamp', 'token'].includes(key);
    });

    if (entries.length === 0) {
      return (
        <p className="text-xs text-[#7D715E] italic py-1">
          Không có dữ liệu chi tiết kèm theo.
        </p>
      );
    }

    const formatValue = (key: string, val: any): React.ReactNode => {
      if (val === null || val === undefined) return <span className="text-[#7D715E]">—</span>;
      if (typeof val === 'number') {
        if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('price') || key.toLowerCase().includes('balance')) {
          return <span className="font-bold text-[#8A642C]">{val.toLocaleString('vi-VN')} ₫</span>;
        }
        return val.toLocaleString('vi-VN');
      }
      if (typeof val === 'boolean') {
        return val ? 'Bật / Có' : 'Tắt / Không';
      }
      if (typeof val === 'object') {
        if (key === 'previousState' || key === 'newState') {
          return (
            <div className="space-y-0.5 text-right">
              {Object.entries(val).map(([k, v]) => (
                <div key={k} className="text-[11px]">
                  <span className="text-[#7D715E]">{fieldLabels[k] || k}:</span>{' '}
                  <span className="font-semibold text-[#1A1612]">{String(v)}</span>
                </div>
              ))}
            </div>
          );
        }
        return <span className="font-mono text-[11px]">{JSON.stringify(val)}</span>;
      }
      return String(val);
    };

    return (
      <div className="divide-y divide-[#EAE4D7] rounded-xl border border-[#EAE4D7] bg-white overflow-hidden text-xs">
        {entries.map(([key, val]) => (
          <div key={key} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-1 hover:bg-[#FAF8F5]">
            <span className="font-medium text-[#7D715E] min-w-[150px]">
              {fieldLabels[key] || key}
            </span>
            <div className="font-semibold text-[#1A1612] text-left sm:text-right break-words">
              {formatValue(key, val)}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Severity Badge Helper
  const renderSeverityBadge = (severity: AuditSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#FECACA] bg-[#FEF2F2] px-2.5 py-1 text-[11px] font-semibold text-[#B91C1C]">
            <AlertTriangle className="w-3 h-3" />
            Khẩn cấp
          </span>
        );
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-2.5 py-1 text-[11px] font-semibold text-[#8A642C]">
            <Clock className="w-3 h-3" />
            Cần lưu ý
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#EAE4D7] bg-[#F3EFE6] px-2.5 py-1 text-[11px] font-semibold text-[#5F5547]">
            <Info className="w-3 h-3" />
            Thông thường
          </span>
        );
    }
  };

  // Category Icon & Color
  const getCategoryInfo = (cat: AuditCategory) => {
    switch (cat) {
      case 'AUTH':
        return { label: 'Tài khoản & Đăng nhập', icon: Lock, color: 'text-[#8A642C] bg-[#FBF5EB] border-[#EEDFC6]' };
      case 'FINANCIAL':
        return { label: 'Tiền & Hoa hồng', icon: DollarSign, color: 'text-[#8A642C] bg-[#FBF5EB] border-[#EEDFC6]' };
      case 'AI_SECURITY':
        return { label: 'Bảo mật & Cảnh báo', icon: Sparkles, color: 'text-[#B91C1C] bg-[#FEF2F2] border-[#FECACA]' };
      case 'PRODUCT':
        return { label: 'Hàng hóa & Sản phẩm', icon: Layers, color: 'text-[#8A642C] bg-[#FBF5EB] border-[#EEDFC6]' };
      case 'SAMPLE_CAMPAIGN':
        return { label: 'Hàng mẫu & Chiến dịch', icon: FileText, color: 'text-[#5F5547] bg-[#F3EFE6] border-[#EAE4D7]' };
      default:
        return { label: 'Hệ thống', icon: ShieldCheck, color: 'text-[#5F5547] bg-[#FAF8F5] border-[#EAE4D7]' };
    }
  };

  return (
    <div className="w-full min-w-0 text-[#1A1612] flex flex-col gap-4 pb-8">
      <WorkspaceHero eyebrow="SCANMS / Compliance & Traceability" title="Dấu vết vận hành toàn sàn" description="Tra cứu thao tác theo nghiệp vụ, mức độ, thời gian hoặc mã Log/Event ID. Mật khẩu, OTP và token được che khi ghi, đọc và xuất. CSV giữ nguyên bộ lọc; tối đa 2.000 bản ghi mới nhất mỗi lần xuất." />
      {/* 1. Page Header Chuẩn Hóa */}
      <PageHeader
        title="Nhật ký Kiểm toán Toàn sàn"
        description="Theo dõi toàn diện các sự kiện hệ thống, lịch sử dòng tiền tiếp thị và biến động bảo mật"
        icon={<ShieldCheck className="w-5 h-5" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadLogs}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EAE4D7] bg-white text-xs font-semibold text-[#1A1612] hover:bg-[#FBF5EB] hover:border-[#C59B58] transition cursor-pointer disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-[#B88E4F] ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exporting || loading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-[#1A1612] text-xs font-bold transition shadow-xs cursor-pointer disabled:opacity-60"
            >
              <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-bounce' : ''}`} />
              <span>{exporting ? 'Đang xuất CSV...' : 'Xuất file CSV'}</span>
            </button>
          </div>
        }
      />
      {statsError && <p role="alert" className="m-0 text-xs text-[#DC2626]">{statsError}<button className="ml-2 underline" onClick={() => void loadStatsAndActions()}>Thử lại thống kê</button></p>}

      <div className="w-full min-w-0">
        {/* 2. 4 KPI Cards Chuẩn Hóa */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          <StatCard
            title="Tổng hoạt động"
            value={stats?.totalEvents?.toLocaleString('vi-VN') || 0}
            trendText={`+${stats?.eventsToday || 0} hôm nay`}
            icon={<FileText className="w-4 h-4" />}
          />

          <StatCard
            title="Tiền & Hoa hồng"
            value={stats?.financialEventsCount?.toLocaleString('vi-VN') || 0}
            note="Duyệt rút tiền, trả thưởng, ví"
            icon={<DollarSign className="w-4 h-4" />}
          />

          <StatCard
            title="Bảo mật & Cảnh báo"
            value={stats?.securityEventsCount?.toLocaleString('vi-VN') || 0}
            note="Cảnh báo traffic, khóa tài khoản"
            icon={<AlertTriangle className="w-4 h-4" />}
          />

          <StatCard
            title="Tài khoản & Đăng nhập"
            value={stats?.authEventsCount?.toLocaleString('vi-VN') || 0}
            note="Đăng nhập, KYC, đổi quyền"
            icon={<Lock className="w-4 h-4" />}
          />
        </div>

        {/* Filters & Search Toolbar */}
        <div className="mt-5 rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-sm sm:p-5 xl:mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(240px,1fr)_auto] gap-3.5 items-center">
            {/* Search Input */}
            <div className="relative min-w-0">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7D715E]" />
              <input
                aria-label="Tìm nhật ký"
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm hoạt động, người thực hiện, email..."
                className="h-11 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] pl-10 pr-10 text-sm text-[#1A1612] outline-none transition focus:border-[#C59B58] focus:bg-white"
              />
              {searchKeyword && (
                <button
                  aria-label="Xóa từ khóa"
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-800"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-[auto_195px] gap-3 items-center min-w-0">
              {/* Timeframe Selector */}
              <div className="grid grid-cols-4 gap-1 h-11 p-1 border border-[#EAE4D7] rounded-xl bg-white">
                <button
                  aria-pressed={selectedTimeframe === '24h'} onClick={() => { setSelectedTimeframe('24h'); setCurrentPage(1); }}
                  className={`h-full rounded-lg px-2 text-xs font-semibold transition-all ${
                    selectedTimeframe === '24h'
                      ? 'bg-[#C59B58] text-white shadow-sm'
                      : 'text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  24 giờ
                </button>
                <button
                  aria-pressed={selectedTimeframe === '7d'} onClick={() => { setSelectedTimeframe('7d'); setCurrentPage(1); }}
                  className={`h-full rounded-lg px-2 text-xs font-semibold transition-all ${
                    selectedTimeframe === '7d'
                      ? 'bg-[#C59B58] text-white shadow-sm'
                      : 'text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  7 ngày
                </button>
                <button
                  aria-pressed={selectedTimeframe === '30d'} onClick={() => { setSelectedTimeframe('30d'); setCurrentPage(1); }}
                  className={`h-full rounded-lg px-2 text-xs font-semibold transition-all ${
                    selectedTimeframe === '30d'
                      ? 'bg-[#C59B58] text-white shadow-sm'
                      : 'text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  30 ngày
                </button>
                <button
                  aria-pressed={selectedTimeframe === 'all'} onClick={() => { setSelectedTimeframe('all'); setCurrentPage(1); }}
                  className={`h-full rounded-lg px-2 text-xs font-semibold transition-all ${
                    selectedTimeframe === 'all'
                      ? 'bg-[#C59B58] text-white shadow-sm'
                      : 'text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  Tất cả
                </button>
              </div>

              {/* Severity Filter */}
              <Select
                aria-label="Mức độ nhật ký"
                value={selectedSeverity}
                onChange={(e) => {
                  setSelectedSeverity(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 w-full text-sm font-medium"
              >
                <option value="ALL">Mức độ: Tất cả</option>
                <option value="CRITICAL">Khẩn cấp (Quan trọng)</option>
                <option value="WARN">Cần lưu ý</option>
                <option value="INFO">Thông thường</option>
              </Select>
            </div>
          </div>

          {/* Category Tabs & Actions */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 mt-3 pt-3 border-t border-[#EAE4D7]">
            <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto pb-1 scrollbar-thin">
              {[
                { id: 'ALL', label: 'Tất cả' },
                { id: 'AUTH', label: 'Tài khoản & Đăng nhập' },
                { id: 'FINANCIAL', label: 'Tiền & Hoa hồng' },
                { id: 'AI_SECURITY', label: 'Bảo mật & Cảnh báo' },
                { id: 'PRODUCT', label: 'Hàng hóa & Sản phẩm' },
                { id: 'SAMPLE_CAMPAIGN', label: 'Hàng mẫu & Chiến dịch' },
                { id: 'SYSTEM', label: 'Hệ thống' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  aria-pressed={selectedCategory === tab.id}
                  onClick={() => {
                    setSelectedCategory(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`min-h-9 rounded-xl border px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === tab.id
                      ? 'border-[#C59B58] bg-[#FBF5EB] text-[#8A642C] shadow-sm'
                      : 'border-[#EAE4D7] bg-white text-[#5F5547] hover:border-[#C59B58] hover:text-[#1A1612]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center shrink-0 gap-2 self-end lg:self-auto">
              <button
                onClick={handleExportCsv}
                disabled={exporting}
                className="inline-flex items-center justify-center gap-1.5 h-10 px-3.5 border border-[#EEDFC6] rounded-xl bg-[#FBF5EB] text-[#1A1612] text-xs font-semibold hover:border-[#C59B58] transition-colors cursor-pointer"
              >
                <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-bounce' : ''}`} />
                <span>{exporting ? 'Đang xuất CSV...' : 'Xuất CSV'}</span>
              </button>
              <button
                onClick={() => {
                  loadStatsAndActions();
                  loadLogs();
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E] shadow-sm transition hover:border-[#C59B58] hover:text-[#1A1612]"
                aria-label="Làm mới nhật ký" title="Làm mới dữ liệu"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#B88E4F]' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white shadow-sm xl:mt-6">
          {error && (
            <div className="flex items-center gap-2 border-b border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#B91C1C]">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 border-b border-[#EAE4D7] px-4 py-3">
            <h2 className="text-sm font-bold">Nhật ký hoạt động</h2>
            <span className="text-xs text-[#7D715E]">{totalCount.toLocaleString('vi-VN')} sự kiện</span>
          </div>
          <div className="overflow-x-auto" role="region" aria-label="Bảng nhật ký hệ thống, có thể cuộn ngang" tabIndex={0}>
            <table className="w-full min-w-[1180px] table-fixed border-collapse text-left">
              <colgroup>
                <col className="w-[12%]" />
                <col className="w-[20%]" />
                <col className="w-[23%]" />
                <col className="w-[15%]" />
                <col className="w-[11%]" />
                <col className="w-[10%]" />
                <col className="w-[9%]" />
              </colgroup>
              <thead>
                <tr className="border-b border-[#EAE4D7] bg-[#F3EFE6] text-[11px] font-bold uppercase tracking-[0.07em] text-[#5F5547]">
                  <th scope="col" className="px-4 py-4">Thời gian</th>
                  <th scope="col" className="px-4 py-4">Người thực hiện</th>
                  <th scope="col" className="px-4 py-4">Hành động</th>
                  <th scope="col" className="px-4 py-4">Phân loại</th>
                  <th scope="col" className="px-4 py-4">Mức độ</th>
                  <th scope="col" className="px-4 py-4">Địa chỉ IP</th>
                  <th scope="col" className="px-4 py-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE4D7]/60 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-600">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-[#B88E4F]" />
                        <span>Đang truy xuất nhật ký kiểm toán...</span>
                      </div>
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-600">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <ShieldCheck className="w-10 h-10 text-stone-600" />
                        <span className="font-medium text-stone-700">Không tìm thấy bản ghi kiểm toán nào</span>
                        <span className="text-xs text-stone-600">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => {
                    const catInfo = getCategoryInfo(log.category);
                    const CatIcon = catInfo.icon;
                    return (
                      <tr
                        key={log.id}
                        className="group cursor-pointer transition-colors hover:bg-[#FBF5EB]/60"
                        onClick={() => setSelectedLog(log)}
                      >
                        {/* Timestamp */}
                        <td data-label="Thời gian" className="whitespace-nowrap px-4 py-4">
                          <div className="text-xs font-semibold text-[#1A1612]">
                            {new Date(log.createdAt).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </div>
                          <div className="text-[11px] text-stone-600">
                            {new Date(log.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </td>

                        {/* Actor */}
                        <td data-label="Người thực hiện" className="whitespace-nowrap px-4 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#EBD08C]/15 text-[#B88E4F] border border-[#C59B58]/30 flex items-center justify-center font-bold text-xs flex-shrink-0">
                              {log.actor.avatarUrl ? (
                                <img
                                  src={log.actor.avatarUrl}
                                  alt={log.actor.name}
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                log.actor.name?.charAt(0)?.toUpperCase() || 'U'
                              )}
                            </div>
                            <div className="min-w-0">
                              <div className="max-w-[190px] truncate text-xs font-bold text-[#1A1612]">
                                {log.actor.name}
                              </div>
                              <div className="max-w-[190px] truncate text-[11px] text-[#7D715E]">
                                <span className="font-semibold text-[#8A642C]">{getRoleLabel(log.actor.role)}</span> • {log.actor.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Action Name */}
                        <td data-label="Hành động" className="px-4 py-4">
                          <div className="text-xs font-bold text-[#1A1612]">
                            <span className="audit-action-name" title={getActionNameVi(log.action, log.actionNameVi)}>
                              {getActionNameVi(log.action, log.actionNameVi)}
                            </span>
                          </div>
                          {log.description && (
                            <div className="truncate text-[11px] text-[#7D715E] mt-0.5" title={log.description}>
                              {log.description}
                            </div>
                          )}
                        </td>

                        {/* Category */}
                        <td data-label="Phân loại" className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${catInfo.color}`}
                          >
                            <CatIcon className="w-3 h-3" />
                            {catInfo.label}
                          </span>
                        </td>

                        {/* Severity */}
                        <td data-label="Mức độ" className="whitespace-nowrap px-4 py-4">
                          {renderSeverityBadge(log.severity)}
                        </td>

                        {/* IP Address */}
                        <td data-label="Địa chỉ IP" className="whitespace-nowrap px-4 py-4 font-mono text-xs text-[#5F5547]">
                          {log.ipAddress}
                        </td>

                        {/* Actions */}
                        <td data-label="Thao tác" className="whitespace-nowrap px-4 py-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] px-3 py-1.5 text-xs font-semibold text-[#5F5547] transition-all hover:border-[#C59B58] hover:bg-[#FBF5EB] hover:text-[#8A642C]"
                          >
                            <Eye className="w-3 h-3" />
                            Chi tiết
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 p-3.5 border-t border-[#EAE4D7] bg-white text-xs text-[#7D715E]">
            <div>
              Hiển thị <span className="font-bold text-[#1A1612]">{logs.length}</span> trên tổng số{' '}
              <span className="font-bold text-[#1A1612]">{totalCount.toLocaleString('vi-VN')}</span> sự kiện
            </div>

            <div className="flex items-center gap-2">
              <button
                aria-label="Trang trước" onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || loading}
                className="p-1.5 rounded-lg border border-[#EAE4D7] bg-white text-stone-700 hover:border-[#C59B58] disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-semibold text-[#1A1612]">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                aria-label="Trang sau" onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                className="p-1.5 rounded-lg border border-[#EAE4D7] bg-white text-stone-700 hover:border-[#C59B58] disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Audit Log Inspector (Friendly Details & Optional JSON) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-center items-center p-4 bg-[#231D15]/35 backdrop-blur-[3px]">
          <div ref={detailRef} role="dialog" aria-modal="true" aria-labelledby="audit-detail-title" tabIndex={-1} className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-[#EAE4D7] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#EAE4D7] bg-[#FAF8F5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EBD08C]/15 text-[#B88E4F] border border-[#C59B58]/30 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 text-[#B88E4F]" />
                </div>
                <div>
                  <h3 id="audit-detail-title" className="text-base font-bold text-[#1A1612] flex items-center gap-2">
                    {getActionNameVi(selectedLog.action, selectedLog.actionNameVi)}
                    {renderSeverityBadge(selectedLog.severity)}
                  </h3>
                  <p className="text-xs text-[#7D715E] font-mono mt-0.5">
                    Mã hoạt động: #{selectedLog.id.slice(-8).toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                aria-label="Đóng chi tiết nhật ký" onClick={() => setSelectedLog(null)}
                className="p-2 rounded-xl text-stone-600 hover:text-stone-800 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-sm">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7]">
                <div>
                  <span className="text-[11px] font-semibold text-[#7D715E] uppercase block">Thời gian</span>
                  <span className="text-xs font-bold text-[#1A1612] mt-0.5 block">
                    {new Date(selectedLog.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#7D715E] uppercase block">Người thực hiện</span>
                  <span className="text-xs font-bold text-[#1A1612] mt-0.5 block truncate" title={`${selectedLog.actor.name} (${getRoleLabel(selectedLog.actor.role)})`}>
                    {selectedLog.actor.name} ({getRoleLabel(selectedLog.actor.role)})
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-[#7D715E] uppercase block">Địa chỉ mạng IP</span>
                  <span className="text-xs font-mono font-bold text-[#1A1612] mt-0.5 block">
                    {selectedLog.ipAddress}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
                  Mô Tả Hoạt Động
                </h4>
                <p className="text-xs text-stone-700 leading-relaxed bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE4D7]">
                  {selectedLog.description}
                </p>
              </div>

              {/* Friendly Details Table */}
              <div>
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide mb-2">
                  Chi Tiết Dữ Liệu Thay Đổi
                </h4>
                {renderFriendlyDetails(selectedLog.details)}
              </div>

              {/* Raw JSON toggle for technical inquiries */}
              <div className="pt-1 border-t border-[#EAE4D7]/70">
                <button
                  type="button"
                  onClick={() => setShowRawJson(!showRawJson)}
                  className="inline-flex items-center gap-1.5 text-xs text-[#7D715E] hover:text-[#1A1612] transition font-medium"
                >
                  {showRawJson ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  <span>{showRawJson ? 'Thu gọn dữ liệu kỹ thuật' : 'Xem dữ liệu kỹ thuật gốc (JSON)'}</span>
                </button>

                {showRawJson && (
                  <div className="mt-2.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-[#7D715E]">Dữ liệu hệ thống ghi nhận:</span>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(selectedLog.details || {}, null, 2),
                            'json',
                          )
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-white hover:bg-[#FAF8F5] text-stone-700 transition border border-[#EAE4D7]"
                      >
                        {copiedField === 'json' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            Đã chép
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            Sao chép JSON
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-[#FAF8F5] text-[#1A1612] p-3.5 rounded-xl font-mono text-xs overflow-x-auto max-h-52 border border-[#EAE4D7]">
                      <pre>{JSON.stringify(selectedLog.details || {}, null, 2)}</pre>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#EAE4D7] bg-[#FAF8F5] flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#F3EFE6] text-[#1A1612] hover:bg-[#EAE4D7] border border-[#EAE4D7] transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
