import React, { useState, useEffect, useCallback } from 'react';
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

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

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
  const [copiedField, setCopiedField] = useState<string | null>(null);

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
    try {
      const statsRes = await auditService.getAuditStats(selectedTimeframe);
      setStats(statsRes);
    } catch (err: any) {
      console.error('Lỗi khi tải metadata kiểm toán:', err);
    }
  }, [selectedTimeframe]);

  // Load Logs
  const loadLogs = useCallback(async () => {
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
      setLogs(res.items || []);
      setTotalPages(res.pagination?.totalPages || 1);
      setTotalCount(res.pagination?.total || 0);
    } catch (err: any) {
      console.error('Lỗi khi tải danh sách Audit Logs:', err);
      setError(err.response?.data?.message || err.message || 'Không thể tải nhật ký kiểm toán');
    } finally {
      setLoading(false);
    }
  }, [currentPage, selectedCategory, selectedSeverity, debouncedKeyword, selectedTimeframe]);

  useEffect(() => {
    loadStatsAndActions();
  }, [loadStatsAndActions]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // Export CSV Handler
  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const params: any = {};
      if (selectedCategory !== 'ALL') params.category = selectedCategory;
      if (debouncedKeyword.trim()) params.keyword = debouncedKeyword.trim();

      const blob = await auditService.exportAuditLogsCsv(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `scanms_audit_trail_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      toast.error('Xuất file kiểm toán thất bại', {
        description: err.message || 'Lỗi kết nối máy chủ.',
      });
    } finally {
      setExporting(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Severity Badge Helper
  const renderSeverityBadge = (severity: AuditSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#FECACA] bg-[#FEF2F2] px-2.5 py-1 text-[11px] font-semibold text-[#B91C1C]">
            <AlertTriangle className="w-3 h-3" />
            CRITICAL
          </span>
        );
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-2.5 py-1 text-[11px] font-semibold text-[#8A642C]">
            <Clock className="w-3 h-3" />
            WARNING
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-[#EAE4D7] bg-[#F3EFE6] px-2.5 py-1 text-[11px] font-semibold text-[#5F5547]">
            <Info className="w-3 h-3" />
            INFO
          </span>
        );
    }
  };

  // Category Icon & Color
  const getCategoryInfo = (cat: AuditCategory) => {
    switch (cat) {
      case 'AUTH':
        return { label: 'Xác thực & IAM', icon: Lock, color: 'text-[#8A642C] bg-[#FBF5EB] border-[#EEDFC6]' };
      case 'FINANCIAL':
        return { label: 'Tài chính & Payout', icon: DollarSign, color: 'text-[#8A642C] bg-[#FBF5EB] border-[#EEDFC6]' };
      case 'AI_SECURITY':
        return { label: 'An ninh & AI', icon: Sparkles, color: 'text-[#B91C1C] bg-[#FEF2F2] border-[#FECACA]' };
      case 'PRODUCT':
        return { label: 'Sản phẩm & Media', icon: Layers, color: 'text-[#8A642C] bg-[#FBF5EB] border-[#EEDFC6]' };
      case 'SAMPLE_CAMPAIGN':
        return { label: 'Chiến dịch & Hàng mẫu', icon: FileText, color: 'text-[#5F5547] bg-[#F3EFE6] border-[#EAE4D7]' };
      default:
        return { label: 'Hệ thống chung', icon: ShieldCheck, color: 'text-[#5F5547] bg-[#FAF8F5] border-[#EAE4D7]' };
    }
  };

  return (
    <div className="w-full min-w-0 pt-4 text-[#1A1612] sm:pt-5">
      <div className="mb-8 w-full min-w-0">
        {/* 4 KPI Cards - Nhỏ gọn, cân xứng, chuẩn 4 cột trên desktop */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
          {/* Card 1: Total Events */}
          <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-[#EAE4D7] bg-white p-3.5 sm:p-4 shadow-2xs hover:border-[#C59B58]/40 transition">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D715E] truncate">Tổng sự kiện đã ghi</span>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
                <FileText className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-black tracking-tight text-[#1A1612]">
                {stats?.totalEvents?.toLocaleString('vi-VN') || 0}
              </div>
              <div className="mt-0.5 flex items-center gap-1 text-[11.5px] text-[#7D715E]">
                <span className="font-bold text-[#8A642C]">+{stats?.eventsToday || 0}</span> sự kiện trong ngày
              </div>
            </div>
          </div>

          {/* Card 2: Financial Events */}
          <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-[#EAE4D7] bg-white p-3.5 sm:p-4 shadow-2xs hover:border-[#C59B58]/40 transition">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D715E] truncate">Thao tác tài chính</span>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F]">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-black tracking-tight text-[#8A642C]">
                {stats?.financialEventsCount?.toLocaleString('vi-VN') || 0}
              </div>
              <div className="mt-0.5 text-[11.5px] text-[#7D715E] truncate">Duyệt payout, hoa hồng, ví tiền</div>
            </div>
          </div>

          {/* Card 3: Security & AI Flags */}
          <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-[#EAE4D7] bg-white p-3.5 sm:p-4 shadow-2xs hover:border-[#C59B58]/40 transition">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D715E] truncate">An ninh & AI gian lận</span>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626]">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-black tracking-tight text-[#B91C1C]">
                {stats?.securityEventsCount?.toLocaleString('vi-VN') || 0}
              </div>
              <div className="mt-0.5 text-[11.5px] text-[#7D715E] truncate">Cảnh báo traffic, đóng băng ví</div>
            </div>
          </div>

          {/* Card 4: Auth & Identity */}
          <div className="flex flex-col justify-between overflow-hidden rounded-xl border border-[#EAE4D7] bg-white p-3.5 sm:p-4 shadow-2xs hover:border-[#C59B58]/40 transition">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#7D715E] truncate">Xác thực & quản trị</span>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#8A642C]">
                <Lock className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-2.5">
              <div className="text-xl sm:text-2xl font-black tracking-tight text-[#1A1612]">
                {stats?.authEventsCount?.toLocaleString('vi-VN') || 0}
              </div>
              <div className="mt-0.5 text-[11.5px] text-[#7D715E] truncate">Đăng nhập, KYC, đổi quyền</div>
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="mt-5 rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-[0_2px_10px_rgba(35,29,21,0.035)] sm:p-5 xl:mt-6">
          <div className="grid grid-cols-1 items-stretch gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,1fr)_220px] xl:items-center">
            {/* Search Input */}
            <div className="relative min-w-0">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7D715E]" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm theo Action, IP, Email hoặc Tên người thao tác..."
                className="h-11 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] pl-10 pr-10 text-sm text-[#1A1612] outline-none transition focus:border-[#C59B58] focus:bg-white"
              />
              {searchKeyword && (
                <button
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-600 hover:text-stone-800"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Controls */}
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_180px] xl:contents">
              {/* Timeframe Selector */}
              <div className="grid h-11 grid-cols-4 items-center gap-1 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-1">
                <button
                  onClick={() => setSelectedTimeframe('24h')}
                  className={`h-full rounded-lg px-2 text-xs font-semibold transition-all ${
                    selectedTimeframe === '24h'
                      ? 'bg-[#C59B58] text-white shadow-sm'
                      : 'text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  24 Giờ
                </button>
                <button
                  onClick={() => setSelectedTimeframe('7d')}
                  className={`h-full rounded-lg px-2 text-xs font-semibold transition-all ${
                    selectedTimeframe === '7d'
                      ? 'bg-[#C59B58] text-white shadow-sm'
                      : 'text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  7 Ngày
                </button>
                <button
                  onClick={() => setSelectedTimeframe('30d')}
                  className={`h-full rounded-lg px-2 text-xs font-semibold transition-all ${
                    selectedTimeframe === '30d'
                      ? 'bg-[#C59B58] text-white shadow-sm'
                      : 'text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  30 Ngày
                </button>
                <button
                  onClick={() => setSelectedTimeframe('all')}
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
                value={selectedSeverity}
                onChange={(e) => {
                  setSelectedSeverity(e.target.value);
                  setCurrentPage(1);
                }}
                className="h-11 w-full text-sm font-medium"
              >
                <option value="ALL">Mức độ: Tất cả</option>
                <option value="CRITICAL">Critical (Nghiêm trọng)</option>
                <option value="WARN">Warning (Cảnh báo)</option>
                <option value="INFO">Info (Thông tin)</option>
              </Select>
            </div>
          </div>

          {/* Category Tabs & Actions */}
          <div className="mt-4 flex flex-col gap-4 border-t border-[#EAE4D7] pt-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              {[
                { id: 'ALL', label: 'Tất cả danh mục' },
                { id: 'AUTH', label: 'Xác thực & IAM' },
                { id: 'FINANCIAL', label: 'Tài chính & Payout' },
                { id: 'AI_SECURITY', label: 'An ninh & AI' },
                { id: 'PRODUCT', label: 'Sản phẩm & Media' },
                { id: 'SAMPLE_CAMPAIGN', label: 'Chiến dịch & Mẫu' },
                { id: 'SYSTEM', label: 'Hệ thống chung' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSelectedCategory(tab.id);
                    setCurrentPage(1);
                  }}
                  className={`min-h-9 rounded-xl border px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                    selectedCategory === tab.id
                      ? 'border-[#C59B58] bg-[#FBF5EB] text-[#8A642C] shadow-sm'
                      : 'border-[#EAE4D7] bg-[#FAF8F5] text-[#5F5547] hover:border-[#C59B58] hover:text-[#1A1612]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex shrink-0 items-center gap-2 xl:pl-3">
              <button
                onClick={handleExportCsv}
                disabled={exporting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-[#C59B58] px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#B88E4F] disabled:cursor-wait disabled:opacity-50"
              >
                <Download className={`w-3.5 h-3.5 ${exporting ? 'animate-bounce' : ''}`} />
                <span>{exporting ? 'Đang xuất CSV...' : 'Xuất Báo Cáo CSV'}</span>
              </button>
              <button
                onClick={() => {
                  loadStatsAndActions();
                  loadLogs();
                }}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E] shadow-sm transition hover:border-[#C59B58] hover:text-[#1A1612]"
                title="Làm mới dữ liệu"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#B88E4F]' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="mt-5 overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white shadow-[0_2px_12px_rgba(35,29,21,0.04)] xl:mt-6">
          {error && (
            <div className="flex items-center gap-2 border-b border-[#FECACA] bg-[#FEF2F2] p-4 text-sm text-[#B91C1C]">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="overflow-x-auto">
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
                  <th className="px-4 py-4">Thời gian</th>
                  <th className="px-4 py-4">Người thực hiện</th>
                  <th className="px-4 py-4">Hành động & Nghiệp vụ</th>
                  <th className="px-4 py-4">Phân loại</th>
                  <th className="px-4 py-4">Mức độ</th>
                  <th className="px-4 py-4">Địa chỉ IP</th>
                  <th className="px-4 py-4 text-right">Thao tác</th>
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
                        <td className="whitespace-nowrap px-4 py-4">
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
                        <td className="whitespace-nowrap px-4 py-4">
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
                                {log.actor.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Action Name */}
                        <td className="px-4 py-4">
                          <div className="text-xs font-bold text-[#1A1612] flex items-center gap-1.5">
                            <span>{log.actionNameVi}</span>
                          </div>
                          <div className="truncate text-[11px] font-mono tracking-tight text-[#7D715E]">
                            {log.action}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="whitespace-nowrap px-4 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${catInfo.color}`}
                          >
                            <CatIcon className="w-3 h-3" />
                            {catInfo.label}
                          </span>
                        </td>

                        {/* Severity */}
                        <td className="whitespace-nowrap px-4 py-4">
                          {renderSeverityBadge(log.severity)}
                        </td>

                        {/* IP Address */}
                        <td className="whitespace-nowrap px-4 py-4 font-mono text-xs text-[#5F5547]">
                          {log.ipAddress}
                        </td>

                        {/* Actions */}
                        <td className="whitespace-nowrap px-4 py-4 text-right">
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
          <div className="p-4 border-t border-[#EAE4D7] bg-[#FAF8F5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-700">
            <div>
              Hiển thị <span className="font-bold text-[#1A1612]">{logs.length}</span> trên tổng số{' '}
              <span className="font-bold text-[#1A1612]">{totalCount.toLocaleString('vi-VN')}</span> sự kiện
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || loading}
                className="p-1.5 rounded-lg border border-[#EAE4D7] bg-white text-stone-700 hover:border-[#C59B58] disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-semibold text-[#1A1612]">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                className="p-1.5 rounded-lg border border-[#EAE4D7] bg-white text-stone-700 hover:border-[#C59B58] disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Audit Log Inspector (JSON & Diff Details) */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-[#EAE4D7] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#EAE4D7] bg-[#FAF8F5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EBD08C]/15 text-[#B88E4F] border border-[#C59B58]/30 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 text-[#B88E4F]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1612] flex items-center gap-2">
                    {selectedLog.actionNameVi}
                    {renderSeverityBadge(selectedLog.severity)}
                  </h3>
                  <p className="text-xs text-stone-700 font-mono mt-0.5">
                    Mã sự vụ: {selectedLog.id}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
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
                  <span className="text-[11px] font-semibold text-stone-600 uppercase block">Thời gian tạo</span>
                  <span className="text-xs font-bold text-[#1A1612] mt-0.5 block">
                    {new Date(selectedLog.createdAt).toLocaleString('vi-VN')}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-stone-600 uppercase block">Người thực hiện</span>
                  <span className="text-xs font-bold text-[#1A1612] mt-0.5 block">
                    {selectedLog.actor.name} ({selectedLog.actor.role})
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-stone-600 uppercase block">Địa chỉ IP</span>
                  <span className="text-xs font-mono font-bold text-[#1A1612] mt-0.5 block">
                    {selectedLog.ipAddress}
                  </span>
                </div>
                {selectedLog.eventId && (
                  <div className="col-span-2 sm:col-span-3">
                    <span className="text-[11px] font-semibold text-stone-600 uppercase block">Event ID (Bất biến)</span>
                    <span className="text-xs font-mono text-stone-700 mt-0.5 block break-all">
                      {selectedLog.eventId}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide mb-1">
                  Mô Tả Nghiệp Vụ
                </h4>
                <p className="text-xs text-stone-700 leading-relaxed bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE4D7]">
                  {selectedLog.description}
                </p>
              </div>

              {/* JSON Payload Details */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-stone-700 uppercase tracking-wide">
                    Chi Tiết Dữ Liệu (Payload & State Changes)
                  </h4>
                  <button
                    onClick={() =>
                      copyToClipboard(
                        JSON.stringify(selectedLog.details, null, 2),
                        'json',
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FAF8F5] hover:bg-[#EAE4D7] text-stone-700 transition-colors border border-[#EAE4D7]"
                  >
                    {copiedField === 'json' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        Đã chép JSON
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Sao chép JSON
                      </>
                    )}
                  </button>
                </div>
                <div className="bg-[#FAF8F5] text-[#1A1612] p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-60 border border-[#EAE4D7]">
                  <pre>{JSON.stringify(selectedLog.details || {}, null, 2)}</pre>
                </div>
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
