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
import {
  auditService,
  type AuditLogItem,
  type AuditStats,
  type AuditCategory,
  type AuditSeverity,
} from '../../services/audit.service';

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
      alert('Xuất file kiểm toán thất bại: ' + (err.message || 'Lỗi kết nối'));
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
            <AlertTriangle className="w-3 h-3" />
            CRITICAL
          </span>
        );
      case 'WARN':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <Clock className="w-3 h-3" />
            WARNING
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
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
        return { label: 'Xác thực & IAM', icon: Lock, color: 'text-indigo-600 bg-indigo-50 border-indigo-200' };
      case 'FINANCIAL':
        return { label: 'Tài chính & Payout', icon: DollarSign, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
      case 'AI_SECURITY':
        return { label: 'An ninh & AI', icon: Sparkles, color: 'text-rose-700 bg-rose-50 border-rose-200' };
      case 'PRODUCT':
        return { label: 'Sản phẩm & Media', icon: Layers, color: 'text-amber-700 bg-amber-50 border-amber-200' };
      case 'SAMPLE_CAMPAIGN':
        return { label: 'Chiến dịch & Hàng mẫu', icon: FileText, color: 'text-cyan-700 bg-cyan-50 border-cyan-200' };
      default:
        return { label: 'Hệ thống chung', icon: ShieldCheck, color: 'text-stone-700 bg-stone-50 border-stone-200' };
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1612] p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E6DEC9] pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-md text-xs font-bold tracking-wide uppercase bg-[#C59B58]/15 text-[#8C6B2D] border border-[#C59B58]/30">
                FR-32 Enterprise Security
              </span>
              <span className="text-xs text-stone-700 font-medium">Bảo mật bất biến 100%</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-[#1A1612] flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-[#C59B58]" />
              Nhật Ký Kiểm Toán Toàn Diện (Audit Trail)
            </h1>
            <p className="text-sm text-stone-700 mt-1">
              Ghi nhận và đối soát toàn bộ các thao tác nhạy cảm, tài chính, xác thực và an ninh trong toàn hệ thống.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleExportCsv}
              disabled={exporting}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-[#C59B58] text-white hover:bg-[#B88E4F] transition-all shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Download className={`w-4 h-4 ${exporting ? 'animate-bounce' : ''}`} />
              {exporting ? 'Đang xuất CSV...' : 'Xuất Báo Cáo CSV'}
            </button>
            <button
              onClick={() => {
                loadStatsAndActions();
                loadLogs();
              }}
              className="p-2.5 rounded-xl border border-[#E6DEC9] bg-white text-stone-700 hover:text-[#1A1612] hover:border-[#C59B58] transition-all shadow-xs cursor-pointer"
              title="Làm mới dữ liệu"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 4 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Card 1: Total Events */}
          <div className="bg-white rounded-2xl p-5 border border-[#E6DEC9] shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">Tổng Sự Kiện Đã Ghi</span>
              <div className="w-10 h-10 rounded-xl bg-[#C59B58]/10 text-[#C59B58] flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-[#1A1612]">
                {stats?.totalEvents?.toLocaleString('vi-VN') || 0}
              </div>
              <div className="text-xs text-stone-700 mt-1 flex items-center gap-1">
                <span className="font-semibold text-emerald-700">+{stats?.eventsToday || 0}</span> sự kiện trong ngày
              </div>
            </div>
          </div>

          {/* Card 2: Financial Events */}
          <div className="bg-white rounded-2xl p-5 border border-[#E6DEC9] shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">Thao Tác Tài Chính</span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-emerald-800">
                {stats?.financialEventsCount?.toLocaleString('vi-VN') || 0}
              </div>
              <div className="text-xs text-stone-700 mt-1">Duyệt Payout, Hoa hồng, Ví tiền</div>
            </div>
          </div>

          {/* Card 3: Security & AI Flags */}
          <div className="bg-white rounded-2xl p-5 border border-[#E6DEC9] shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">An Ninh & AI Gian Lận</span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-rose-800">
                {stats?.securityEventsCount?.toLocaleString('vi-VN') || 0}
              </div>
              <div className="text-xs text-stone-700 mt-1">Cảnh báo traffic, Đóng băng ví</div>
            </div>
          </div>

          {/* Card 4: Auth & Identity */}
          <div className="bg-white rounded-2xl p-5 border border-[#E6DEC9] shadow-xs relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-700 uppercase tracking-wider">Xác Thực & Quản Trị</span>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-2xl font-black text-indigo-900">
                {stats?.authEventsCount?.toLocaleString('vi-VN') || 0}
              </div>
              <div className="text-xs text-stone-700 mt-1">Đăng nhập, KYC, Đổi quyền</div>
            </div>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="bg-white rounded-2xl p-5 border border-[#E6DEC9] shadow-xs mt-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-stretch lg:items-center">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-4 h-4 text-stone-600 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder="Tìm theo Action, IP, Email hoặc Tên người thao tác..."
                className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-[#E6DEC9] bg-[#FAF8F5] focus:outline-none focus:border-[#C59B58] focus:bg-white transition-all text-[#1A1612]"
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
            <div className="flex flex-wrap items-center gap-3">
              {/* Timeframe Selector */}
              <div className="flex items-center gap-1.5 bg-[#FAF8F5] p-1 rounded-xl border border-[#E6DEC9]">
                <button
                  onClick={() => setSelectedTimeframe('24h')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    selectedTimeframe === '24h'
                      ? 'bg-[#C59B58] text-white shadow-xs'
                      : 'text-stone-700 hover:text-[#1A1612]'
                  }`}
                >
                  24 Giờ
                </button>
                <button
                  onClick={() => setSelectedTimeframe('7d')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    selectedTimeframe === '7d'
                      ? 'bg-[#C59B58] text-white shadow-xs'
                      : 'text-stone-700 hover:text-[#1A1612]'
                  }`}
                >
                  7 Ngày
                </button>
                <button
                  onClick={() => setSelectedTimeframe('30d')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    selectedTimeframe === '30d'
                      ? 'bg-[#C59B58] text-white shadow-xs'
                      : 'text-stone-700 hover:text-[#1A1612]'
                  }`}
                >
                  30 Ngày
                </button>
                <button
                  onClick={() => setSelectedTimeframe('all')}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    selectedTimeframe === 'all'
                      ? 'bg-[#C59B58] text-white shadow-xs'
                      : 'text-stone-700 hover:text-[#1A1612]'
                  }`}
                >
                  Tất cả
                </button>
              </div>

              {/* Severity Filter */}
              <select
                value={selectedSeverity}
                onChange={(e) => {
                  setSelectedSeverity(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-xs font-medium rounded-xl border border-[#E6DEC9] bg-[#FAF8F5] text-stone-700 focus:outline-none focus:border-[#C59B58]"
              >
                <option value="ALL">Mức độ: Tất cả</option>
                <option value="CRITICAL">🔴 Critical (Nghiêm trọng)</option>
                <option value="WARN">🟡 Warning (Cảnh báo)</option>
                <option value="INFO">🔵 Info (Thông tin)</option>
              </select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pt-4 mt-4 border-t border-[#E6DEC9]/60 scrollbar-none">
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
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-[#1A1612] text-[#FAF8F5] shadow-xs'
                    : 'bg-[#FAF8F5] text-stone-700 hover:bg-[#E6DEC9]/50 hover:text-[#1A1612]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Logs Table */}
        <div className="bg-white rounded-2xl border border-[#E6DEC9] shadow-xs mt-6 overflow-hidden">
          {error && (
            <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-800 text-sm flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E6DEC9] text-xs font-bold text-stone-700 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Thời gian</th>
                  <th className="py-3.5 px-4">Người thực hiện</th>
                  <th className="py-3.5 px-4">Hành động & Nghiệp vụ</th>
                  <th className="py-3.5 px-4">Phân loại</th>
                  <th className="py-3.5 px-4">Mức độ</th>
                  <th className="py-3.5 px-4">Địa chỉ IP</th>
                  <th className="py-3.5 px-4 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E6DEC9]/60 text-sm">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-stone-600">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <RefreshCw className="w-6 h-6 animate-spin text-[#C59B58]" />
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
                        className="hover:bg-[#FAF8F5]/60 transition-colors group cursor-pointer"
                        onClick={() => setSelectedLog(log)}
                      >
                        {/* Timestamp */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
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
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-[#C59B58]/15 text-[#8C6B2D] border border-[#C59B58]/30 flex items-center justify-center font-bold text-xs flex-shrink-0">
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
                              <div className="text-xs font-bold text-[#1A1612] truncate max-w-[140px]">
                                {log.actor.name}
                              </div>
                              <div className="text-[11px] text-stone-600 truncate max-w-[140px]">
                                {log.actor.email}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Action Name */}
                        <td className="py-3.5 px-4">
                          <div className="text-xs font-bold text-[#1A1612] flex items-center gap-1.5">
                            <span>{log.actionNameVi}</span>
                          </div>
                          <div className="text-[11px] font-mono text-stone-600 tracking-tight">
                            {log.action}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${catInfo.color}`}
                          >
                            <CatIcon className="w-3 h-3" />
                            {catInfo.label}
                          </span>
                        </td>

                        {/* Severity */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {renderSeverityBadge(log.severity)}
                        </td>

                        {/* IP Address */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-xs font-mono text-stone-700">
                          {log.ipAddress}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLog(log);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#FAF8F5] text-stone-700 hover:bg-[#C59B58] hover:text-white border border-[#E6DEC9] transition-all cursor-pointer"
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
          <div className="p-4 border-t border-[#E6DEC9] bg-[#FAF8F5] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-700">
            <div>
              Hiển thị <span className="font-bold text-[#1A1612]">{logs.length}</span> trên tổng số{' '}
              <span className="font-bold text-[#1A1612]">{totalCount.toLocaleString('vi-VN')}</span> sự kiện
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1 || loading}
                className="p-1.5 rounded-lg border border-[#E6DEC9] bg-white text-stone-700 hover:border-[#C59B58] disabled:opacity-40 transition-all cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 font-semibold text-[#1A1612]">
                Trang {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages || loading}
                className="p-1.5 rounded-lg border border-[#E6DEC9] bg-white text-stone-700 hover:border-[#C59B58] disabled:opacity-40 transition-all cursor-pointer"
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
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl border border-[#E6DEC9] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#E6DEC9] bg-[#FAF8F5] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#C59B58]/15 text-[#8C6B2D] border border-[#C59B58]/30 flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5 text-[#C59B58]" />
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
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-4 rounded-xl bg-[#FAF8F5] border border-[#E6DEC9]">
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
                <p className="text-xs text-stone-700 leading-relaxed bg-[#FAF8F5] p-3 rounded-xl border border-[#E6DEC9]">
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
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-[#FAF8F5] hover:bg-[#E6DEC9] text-stone-700 transition-colors border border-[#E6DEC9]"
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
                <div className="bg-[#1A1612] text-[#FAF8F5] p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-60 border border-stone-800">
                  <pre>{JSON.stringify(selectedLog.details || {}, null, 2)}</pre>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#E6DEC9] bg-[#FAF8F5] flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#1A1612] text-[#FAF8F5] hover:bg-stone-800 transition-colors"
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
