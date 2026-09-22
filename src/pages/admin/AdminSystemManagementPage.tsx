import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Server,
  Activity,
  Database,
  RefreshCw,
  Search,
  XCircle,
  AlertTriangle,
  Terminal,
  Copy,
  Check,
  Zap,
  Layers,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import {
  systemService,
  type SystemServiceItem,
  type SystemServicesData,
  type ServiceCategory,
} from '../../services/system.service';
import { Card } from '../../components/ui/Card';
import { Modal } from '../../components/ui/Modal';
import { toast } from '../../utils/toast';

export default function AdminSystemManagementPage() {
  const [data, setData] = useState<SystemServicesData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedService, setSelectedService] = useState<SystemServiceItem | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const fetchStatus = useCallback(async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await systemService.getServicesStatus();
      setData(res);
      if (isManual) {
        toast.success('Đã cập nhật trạng thái các service hệ thống mới nhất');
      }
    } catch {
      toast.error('Lỗi khi làm mới trạng thái hệ thống');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStatus(false);
  }, [fetchStatus]);

  // Auto refresh interval
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchStatus(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchStatus]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    toast.success('Đã sao chép lệnh vào bộ nhớ tạm');
    setTimeout(() => setCopiedText(null), 2000);
  };

  const filteredServices = useMemo(() => {
    if (!data?.services) return [];
    return data.services.filter((svc) => {
      const matchesSearch =
        svc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        svc.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        String(svc.port).includes(searchQuery) ||
        svc.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat =
        selectedCategory === 'ALL' || svc.category === selectedCategory;

      const matchesStatus =
        selectedStatus === 'ALL' || svc.status === selectedStatus;

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [data, searchQuery, selectedCategory, selectedStatus]);

  const categoryLabels: Record<ServiceCategory, { label: string; color: string }> = {
    CORE: { label: 'Hạ tầng cốt lõi', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    BUSINESS: { label: 'Nghiệp vụ sàn', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    DATA: { label: 'Cơ sở dữ liệu', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
    AI: { label: 'Mô hình AI', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  };

  return (
    <div className="w-full space-y-6 text-left">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#EAE4D7] shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F]">
              <Server className="w-5 h-5" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-[#1A1612]">
              Quản lý Hệ thống &amp; Giám sát Microservices
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-[#7D715E]">
            Theo dõi tình trạng hoạt động theo thời gian thực (Health check), kết nối CSDL và phân luồng cổng microservices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
              autoRefresh
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title="Bật/Tắt tự động quét mỗi 10 giây"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                autoRefresh ? 'bg-emerald-500 animate-ping' : 'bg-slate-400'
              }`}
            />
            <span>{autoRefresh ? 'Tự động quét (10s)' : 'Tự động quét: Tắt'}</span>
          </button>

          <button
            type="button"
            onClick={() => fetchStatus(true)}
            disabled={refreshing}
            className="px-4 py-2 rounded-xl bg-[#B88E4F] hover:bg-[#A37B3C] text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Đang quét...' : 'Làm mới ngay'}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <Card className="p-4 bg-white border-[#EAE4D7] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7D715E]">Tổng số Dịch vụ</span>
            <Layers className="w-4 h-4 text-[#B88E4F]" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <strong className="text-2xl font-black text-[#1A1612]">
              {data?.summary.total ?? 0}
            </strong>
            <span className="text-[11px] text-[#7D715E]">cụm services</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border-emerald-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700">Đang hoạt động</span>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <strong className="text-2xl font-black text-emerald-600">
              {data?.summary.online ?? 0}
            </strong>
            <span className="text-[11px] font-semibold text-emerald-600">Online</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border-rose-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-700">Chưa khởi động</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <strong className="text-2xl font-black text-rose-600">
              {data?.summary.offline ?? 0}
            </strong>
            <span className="text-[11px] font-semibold text-rose-600">Offline</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border-[#EAE4D7] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7D715E]">Độ trễ Ping TB</span>
            <Activity className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <strong className="text-2xl font-black text-[#1A1612]">
              {data?.summary.avgLatencyMs ?? 0}
            </strong>
            <span className="text-[11px] text-[#7D715E]">ms (Local TCP)</span>
          </div>
        </Card>

        <Card className="p-4 bg-white border-[#EAE4D7] shadow-xs col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#7D715E]">CSDL PostgreSQL</span>
            <Database className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2 flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                data?.summary.dbStatus === 'CONNECTED' ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <strong
              className={`text-sm font-black ${
                data?.summary.dbStatus === 'CONNECTED' ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              {data?.summary.dbStatus === 'CONNECTED' ? 'Cổng 5432 Sẵn sàng' : 'Mất kết nối'}
            </strong>
          </div>
        </Card>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-[#EAE4D7] shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#7D715E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên, cổng (port), chức năng..."
            className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] focus:bg-white focus:border-[#B88E4F] outline-none transition"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#EAE4D7]">
            {(['ALL', 'UP', 'DOWN'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setSelectedStatus(st)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  selectedStatus === st
                    ? 'bg-[#B88E4F] text-white shadow-2xs'
                    : 'text-[#7D715E] hover:text-[#1A1612]'
                }`}
              >
                {st === 'ALL' ? 'Tất cả' : st === 'UP' ? 'Đang chạy' : 'Chưa chạy'}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-[#FAF8F5] p-1 rounded-xl border border-[#EAE4D7]">
            <span className="text-[11px] font-bold text-[#7D715E] px-2 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              Nhóm:
            </span>
            {[
              { id: 'ALL', label: 'Tất cả' },
              { id: 'CORE', label: 'Core' },
              { id: 'BUSINESS', label: 'Nghiệp vụ' },
              { id: 'DATA', label: 'Data' },
              { id: 'AI', label: 'AI' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-2 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-white text-[#1A1612] font-bold shadow-2xs border border-[#EAE4D7]'
                    : 'text-[#7D715E] hover:text-[#1A1612]'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="py-16 text-center text-sm font-semibold text-[#7D715E] flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-6 h-6 animate-spin text-[#B88E4F]" />
          <span>Đang kiểm tra trạng thái cổng các dịch vụ SCANMS...</span>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="py-12 bg-white rounded-2xl border border-[#EAE4D7] text-center p-8">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <strong className="text-base text-[#1A1612] block">Không tìm thấy dịch vụ phù hợp</strong>
          <span className="text-xs text-[#7D715E] mt-1 block">
            Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh bộ lọc nhóm dịch vụ.
          </span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredServices.map((svc) => {
            const isOnline = svc.status === 'UP';
            const catInfo = categoryLabels[svc.category] || {
              label: svc.category,
              color: 'bg-slate-100 text-slate-700 border-slate-200',
            };

            return (
              <Card
                key={svc.id}
                className={`p-5 bg-white border transition-all duration-200 flex flex-col justify-between hover:shadow-md ${
                  isOnline
                    ? 'border-[#EAE4D7] hover:border-emerald-300'
                    : 'border-rose-100/80 bg-rose-50/15 hover:border-rose-300'
                }`}
              >
                <div>
                  {/* Top row: Name & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 border ${
                          isOnline
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-rose-50 border-rose-200 text-rose-600'
                        }`}
                      >
                        {svc.category === 'DATA' ? (
                          <Database className="w-4 h-4" />
                        ) : svc.category === 'AI' ? (
                          <Zap className="w-4 h-4" />
                        ) : (
                          <Server className="w-4 h-4" />
                        )}
                      </span>
                      <div className="min-w-0">
                        <strong className="text-sm font-extrabold text-[#1A1612] truncate block">
                          {svc.displayName}
                        </strong>
                        <span className="text-[11px] font-mono text-[#7D715E] truncate block">
                          {svc.name}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10.5px] font-extrabold shrink-0 border ${
                        isOnline
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'bg-rose-50 border-rose-200 text-rose-700'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                        }`}
                      />
                      <span>{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-[#7D715E] mt-3 line-clamp-2 leading-relaxed">
                    {svc.description}
                  </p>

                  {/* Metadata Chips */}
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${catInfo.color}`}
                    >
                      {catInfo.label}
                    </span>

                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#EAE4D7] text-[#1A1612]">
                      Port: {svc.port}
                    </span>

                    {svc.database && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 flex items-center gap-1">
                        <Database className="w-2.5 h-2.5" />
                        <span>{svc.database}</span>
                      </span>
                    )}

                    {isOnline && svc.latency != null && (
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-700">
                        {svc.latency}ms
                      </span>
                    )}
                  </div>
                </div>

                {/* Bottom Actions & Metrics */}
                <div className="mt-4 pt-3 border-t border-[#EAE4D7]/70 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3 text-[11px] text-[#7D715E]">
                    <span title="Tỷ lệ hoạt động">
                      Uptime: <strong className="text-[#1A1612] font-mono">{svc.uptime}</strong>
                    </span>
                    {isOnline && (
                      <span title="Bộ nhớ tiêu thụ">
                        RAM: <strong className="text-[#1A1612] font-mono">{svc.memoryUsage}</strong>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedService(svc)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#8A662C] bg-[#FBF5EB] hover:bg-[#F5E7CC] transition cursor-pointer"
                  >
                    <span>Chi tiết</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Terminal Assistant & Startup Scripts Section */}
      <div className="bg-[#FDFBF7] p-6 rounded-2xl border border-[#EAE4D7] shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F]">
              <Terminal className="w-5 h-5" />
            </span>
            <div>
              <strong className="text-base font-extrabold text-[#1A1612] block">
                Trung tâm Điều khiển Khởi động Dịch vụ (CLI Assistant)
              </strong>
              <span className="text-xs text-[#7D715E]">
                Sử dụng PowerShell để khởi động cụm microservices hoặc cấu hình cơ sở dữ liệu.
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5">
          {/* Script 1: Start All Backend */}
          <div className="p-5 bg-white border border-[#EAE4D7] rounded-2xl flex flex-col justify-between gap-3.5 shadow-2xs hover:border-[#C59B58] transition">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-black text-[#1A1612]">Khởi động toàn bộ Backend</span>
                <span className="px-2 py-0.5 rounded-md bg-[#FBF5EB] border border-[#EEDFC6] text-[#8A662C] font-mono text-[10.5px] font-bold">
                  start-backend.ps1
                </span>
              </div>
              <p className="text-xs text-[#7D715E] leading-relaxed">
                Tự động chạy Gateway (8080), 6 Microservices (8081-8086) và Local Dev API Proxy.
              </p>
              <div className="mt-3 p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-[#1A1612] font-mono text-xs select-all overflow-x-auto flex items-center gap-2 shadow-2xs">
                <span className="text-[#B88E4F] font-bold select-none">$</span>
                <span className="font-semibold text-[#1A1612]">cd SCANMS_BE; .\start-backend.ps1</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy('cd SCANMS_BE; .\\start-backend.ps1', 'start-all')}
              className={`w-full py-2 px-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
                copiedText === 'start-all'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-[#FBF5EB] hover:bg-[#F5E7CC] border-[#EEDFC6] text-[#8A662C]'
              }`}
            >
              {copiedText === 'start-all' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã sao chép lệnh</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span>Sao chép lệnh PowerShell</span>
                </>
              )}
            </button>
          </div>

          {/* Script 2: Stop Backend */}
          <div className="p-5 bg-white border border-[#EAE4D7] rounded-2xl flex flex-col justify-between gap-3.5 shadow-2xs hover:border-[#C59B58] transition">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-black text-[#1A1612]">Dừng toàn bộ dịch vụ</span>
                <span className="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 font-mono text-[10.5px] font-bold">
                  stop-backend.ps1
                </span>
              </div>
              <p className="text-xs text-[#7D715E] leading-relaxed">
                Giải phóng nhanh toàn bộ các cổng 8080, 8081-8086 và 3000 đang lắng nghe.
              </p>
              <div className="mt-3 p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-[#1A1612] font-mono text-xs select-all overflow-x-auto flex items-center gap-2 shadow-2xs">
                <span className="text-rose-500 font-bold select-none">$</span>
                <span className="font-semibold text-[#1A1612]">cd SCANMS_BE; .\stop-backend.ps1</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleCopy('cd SCANMS_BE; .\\stop-backend.ps1', 'stop-all')}
              className={`w-full py-2 px-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
                copiedText === 'stop-all'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-[#FBF5EB] hover:bg-[#F5E7CC] border-[#EEDFC6] text-[#8A662C]'
              }`}
            >
              {copiedText === 'stop-all' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã sao chép lệnh</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span>Sao chép lệnh dừng</span>
                </>
              )}
            </button>
          </div>

          {/* Script 3: Start Gateway only */}
          <div className="p-5 bg-white border border-[#EAE4D7] rounded-2xl flex flex-col justify-between gap-3.5 shadow-2xs hover:border-[#C59B58] transition">
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-xs font-black text-[#1A1612]">Chạy riêng 1 service</span>
                <span className="px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 text-blue-700 font-mono text-[10.5px] font-bold">
                  mvnw -pl &lt;service&gt;
                </span>
              </div>
              <p className="text-xs text-[#7D715E] leading-relaxed">
                Ví dụ khởi động riêng scanms-gateway trên cổng 8080:
              </p>
              <div className="mt-3 p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-[#1A1612] font-mono text-xs select-all overflow-x-auto flex items-center gap-2 shadow-2xs">
                <span className="text-[#B88E4F] font-bold select-none">$</span>
                <span className="font-semibold text-[#1A1612]">cd SCANMS_BE; .\mvnw.cmd -pl scanms-gateway spring-boot:run</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                handleCopy(
                  'cd SCANMS_BE; .\\mvnw.cmd -pl scanms-gateway spring-boot:run',
                  'start-gateway'
                )
              }
              className={`w-full py-2 px-3.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs ${
                copiedText === 'start-gateway'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  : 'bg-[#FBF5EB] hover:bg-[#F5E7CC] border-[#EEDFC6] text-[#8A662C]'
              }`}
            >
              {copiedText === 'start-gateway' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Đã sao chép lệnh</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span>Sao chép lệnh Gateway</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Modal Detail & Environment Inspection */}
      {selectedService && (
        <Modal
          isOpen={Boolean(selectedService)}
          onClose={() => setSelectedService(null)}
          title={`Chi tiết Dịch vụ: ${selectedService.displayName}`}
        >
          <div className="space-y-4 text-left">
            <div className="flex items-center justify-between p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE4D7]">
              <div>
                <strong className="text-sm font-extrabold text-[#1A1612] block">
                  {selectedService.name}
                </strong>
                <span className="text-xs text-[#7D715E]">{selectedService.description}</span>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-black border ${
                  selectedService.status === 'UP'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}
              >
                {selectedService.status === 'UP' ? 'ONLINE' : 'OFFLINE'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7]">
                <span className="text-[#7D715E] font-semibold block">Cổng TCP / Port:</span>
                <strong className="text-[#1A1612] font-mono text-sm block mt-0.5">
                  {selectedService.port}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7]">
                <span className="text-[#7D715E] font-semibold block">Cơ sở dữ liệu liên kết:</span>
                <strong className="text-[#1A1612] font-mono text-sm block mt-0.5">
                  {selectedService.database || 'Không sử dụng (Stateless)'}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7]">
                <span className="text-[#7D715E] font-semibold block">Phiên bản Release:</span>
                <strong className="text-[#1A1612] font-mono text-sm block mt-0.5">
                  {selectedService.version}
                </strong>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7]">
                <span className="text-[#7D715E] font-semibold block">Độ trễ phản hồi:</span>
                <strong className="text-[#1A1612] font-mono text-sm block mt-0.5">
                  {selectedService.latency ? `${selectedService.latency} ms` : 'N/A'}
                </strong>
              </div>
            </div>

            {/* Endpoints */}
            <div>
              <span className="text-xs font-bold text-[#1A1612] block mb-1.5">
                Các Endpoints chính:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedService.endpoints.map((ep) => (
                  <code
                    key={ep}
                    className="px-2 py-1 rounded bg-[#FAF8F5] border border-[#EAE4D7] text-[#B88E4F] font-mono text-xs"
                  >
                    {ep}
                  </code>
                ))}
              </div>
            </div>

            {/* Command snippet to run this specific service */}
            {selectedService.name.endsWith('-service') || selectedService.name === 'scanms-gateway' ? (
              <div>
                <span className="text-xs font-bold text-[#1A1612] block mb-1.5">
                  Lệnh khởi động riêng dịch vụ này:
                </span>
                <div className="p-3 rounded-xl bg-[#FAF8F5] text-[#1A1612] font-mono text-xs flex items-center justify-between gap-2 border border-[#EAE4D7]">
                  <span className="truncate">
                    <span className="text-[#B88E4F] font-bold mr-1.5 select-none">$</span>
                    .\mvnw.cmd -pl {selectedService.name} spring-boot:run
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopy(
                        `cd SCANMS_BE; .\\mvnw.cmd -pl ${selectedService.name} spring-boot:run`,
                        'modal-svc-cmd'
                      )
                    }
                    className="px-3 py-1 rounded-lg bg-[#FBF5EB] hover:bg-[#F5E7CC] border border-[#EEDFC6] text-[#8A662C] text-xs font-bold shrink-0 transition cursor-pointer"
                  >
                    {copiedText === 'modal-svc-cmd' ? 'Đã chép' : 'Sao chép'}
                  </button>
                </div>
              </div>
            ) : null}

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedService(null)}
                className="px-4 py-2 rounded-xl bg-[#FAF8F5] hover:bg-[#EAE4D7] text-[#1A1612] text-xs font-bold transition cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
