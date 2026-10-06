import React, { useState, useEffect, useCallback } from 'react';
import {
  Scale,
  Video,
  Image as ImageIcon,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Send,
  ChevronRight,
  Play,
  Package,
  User,
  MessageSquare,
  FileText,
  CalendarDays,
  ShieldCheck,
  ExternalLink,
  Camera,
  Loader2,
} from 'lucide-react';
import api from '../../services/api';

// ─── Types ───────────────────────────────────────────────────────────────────
interface DisputeRecord {
  orderId: string;
  externalOrderSn: string;
  finalAmount: number;
  status: string;
  createdAt: string;
  store: { id: string; name: string; logoUrl?: string };
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderItems: Array<{
    id: string;
    quantity: number;
    product: { id: string; title: string; imageUrl?: string };
  }>;
  dispute: {
    status: 'OPENED' | 'RESOLVED_REFUND' | 'RESOLVED_REJECTED';
    openedAt: string;
    reason: string;
    customerProofVideoUrl?: string;
    customerProofImages?: string[];
    customerNotes?: string;
    storeResponse?: string;
    storeProofImages?: string[];
    storeRespondedAt?: string;
    arbitration?: {
      ruling: 'REFUND_BUYER' | 'REJECT_BUYER';
      notes: string;
      ruledAt: string;
      ruledBy: string;
    };
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function daysSinceOpened(openedAt: string) {
  return Math.floor((Date.now() - new Date(openedAt).getTime()) / 86_400_000);
}

function statusLabel(s: string) {
  if (s === 'OPENED') return { text: 'Chờ giải trình', color: 'bg-amber-100 text-amber-700 border-amber-200' };
  if (s === 'RESOLVED_REFUND') return { text: 'Hoàn tiền khách', color: 'bg-rose-100 text-rose-700 border-rose-200' };
  if (s === 'RESOLVED_REJECTED') return { text: 'Từ chối đổi trả', color: 'bg-green-100 text-green-700 border-green-200' };
  return { text: s, color: 'bg-gray-100 text-gray-600 border-gray-200' };
}

// ─── VideoPlayer ─────────────────────────────────────────────────────────────
function VideoPlayer({ url, label }: { url: string; label: string }) {
  const [playing, setPlaying] = useState(false);
  const isYoutube = url.includes('youtube') || url.includes('youtu.be');
  const isVimeo   = url.includes('vimeo');
  const isDirect  = !isYoutube && !isVimeo;

  if (isDirect) {
    return (
      <div className="rounded-xl overflow-hidden bg-black border border-[#EAE4D7]">
        <div className="px-3 py-1.5 bg-[#1A1612] text-[10px] text-[#C59B58] font-bold flex items-center gap-1">
          <Play className="w-3 h-3" /> {label}
        </div>
        <video
          src={url}
          controls
          className="w-full max-h-64 object-contain"
          playsInline
        />
      </div>
    );
  }

  const embedUrl = isYoutube
    ? `https://www.youtube.com/embed/${url.split('v=')[1]?.split('&')[0] || url.split('/').pop()}`
    : `https://player.vimeo.com/video/${url.split('/').pop()}`;

  if (!playing) {
    return (
      <div
        className="relative rounded-xl overflow-hidden bg-black border border-[#EAE4D7] cursor-pointer group"
        onClick={() => setPlaying(true)}
      >
        <div className="px-3 py-1.5 bg-[#1A1612] text-[10px] text-[#C59B58] font-bold flex items-center gap-1">
          <Play className="w-3 h-3" /> {label}
        </div>
        <div className="flex items-center justify-center h-40 bg-gradient-to-b from-[#1A1612] to-[#2D2520]">
          <div className="flex flex-col items-center gap-2 text-white group-hover:scale-110 transition-transform">
            <div className="w-14 h-14 rounded-full bg-[#C59B58]/80 flex items-center justify-center shadow-lg">
              <Play className="w-7 h-7 fill-white text-white ml-1" />
            </div>
            <span className="text-xs text-white/70">Bấm để phát video</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden border border-[#EAE4D7]">
      <div className="px-3 py-1.5 bg-[#1A1612] text-[10px] text-[#C59B58] font-bold flex items-center gap-1">
        <Play className="w-3 h-3" /> {label}
      </div>
      <iframe
        src={embedUrl + '?autoplay=1'}
        className="w-full h-52"
        allowFullScreen
        allow="autoplay; fullscreen"
        title={label}
      />
    </div>
  );
}

// ─── ImageGallery ─────────────────────────────────────────────────────────────
function ImageGallery({ images, label }: { images: string[]; label: string }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  if (!images.length) return null;
  return (
    <div>
      <div className="text-[10px] font-bold text-[#7D715E] uppercase mb-1.5 flex items-center gap-1">
        <Camera className="w-3 h-3" /> {label} ({images.length} ảnh)
      </div>
      <div className="flex flex-wrap gap-2">
        {images.map((src, i) => (
          <img
            key={i}
            src={src}
            alt={`${label} ${i + 1}`}
            onClick={() => setLightbox(src)}
            className="w-20 h-20 object-cover rounded-lg border border-[#EAE4D7] cursor-zoom-in hover:opacity-90 transition"
          />
        ))}
      </div>
      {lightbox && (
        <div
          className="fixed inset-0 z-[80] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="Preview" className="max-w-full max-h-full rounded-xl shadow-2xl" />
        </div>
      )}
    </div>
  );
}

// ─── Timeline ─────────────────────────────────────────────────────────────────
function Timeline({ dispute, orderDate }: { dispute: DisputeRecord['dispute']; orderDate: string }) {
  const events: Array<{ date: string; label: string; color: string; done: boolean }> = [
    { date: orderDate, label: 'Đơn hàng được tạo', color: 'bg-gray-400', done: true },
    { date: dispute.openedAt, label: 'Khách gửi yêu cầu đổi trả', color: 'bg-amber-400', done: true },
    {
      date: dispute.storeRespondedAt || '',
      label: 'Shop gửi giải trình',
      color: dispute.storeRespondedAt ? 'bg-blue-400' : 'bg-gray-200',
      done: !!dispute.storeRespondedAt,
    },
    {
      date: dispute.arbitration?.ruledAt || '',
      label: 'Trọng tài ban hành phán quyết',
      color: dispute.arbitration ? (dispute.arbitration.ruling === 'REFUND_BUYER' ? 'bg-rose-400' : 'bg-green-400') : 'bg-gray-200',
      done: !!dispute.arbitration,
    },
  ];

  return (
    <div className="relative pl-4">
      {events.map((ev, i) => (
        <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
          <div className={`relative z-10 w-3 h-3 rounded-full shrink-0 mt-0.5 border-2 border-white shadow ${ev.color}`} />
          {i < events.length - 1 && (
            <div className="absolute left-[19px] top-4 bottom-0 w-px bg-[#EAE4D7]" style={{ top: `${i * 40 + 14}px`, height: '26px' }} />
          )}
          <div className="flex-1 min-w-0">
            <div className={`text-xs font-semibold ${ev.done ? 'text-[#1A1612]' : 'text-[#B0A898]'}`}>{ev.label}</div>
            {ev.date && (
              <div className="text-[10px] text-[#7D715E]">
                {new Date(ev.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export const ShopReturnRequestsPage: React.FC = () => {
  const [disputes, setDisputes] = useState<DisputeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPENED' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Shop respond form
  const [storeResponse, setStoreResponse] = useState('');
  const [storeProofImages, setStoreProofImages] = useState(''); // comma-separated URLs
  const [submitting, setSubmitting] = useState(false);

  const fetchDisputes = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/orders/admin/disputes');
      const data = res?.data || res || [];
      const list: DisputeRecord[] = Array.isArray(data) ? data : [];
      setDisputes(list);
      if (!selectedId && list.length > 0) setSelectedId(list[0].orderId);
    } catch {
      // silent — shop may have no disputes
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => { fetchDisputes(); }, []);

  const selected = disputes.find((d) => d.orderId === selectedId) ?? null;

  const filtered = disputes.filter((d) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      d.externalOrderSn.toLowerCase().includes(q) ||
      d.customerName.toLowerCase().includes(q);
    if (filterStatus === 'OPENED') return matchSearch && d.dispute?.status === 'OPENED';
    if (filterStatus === 'RESOLVED') return matchSearch && d.dispute?.status !== 'OPENED';
    return matchSearch;
  });

  const handleRespond = async () => {
    if (!selected) return;
    if (!storeResponse.trim()) {
      alert('Vui lòng nhập nội dung giải trình của gian hàng!');
      return;
    }
    setSubmitting(true);
    try {
      const images = storeProofImages
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      await api.post(`/orders/${selected.orderId}/dispute/respond`, {
        storeResponse: storeResponse.trim(),
        storeProofImages: images,
      });
      setStoreResponse('');
      setStoreProofImages('');
      await fetchDisputes();
      alert('✅ Đã gửi giải trình thành công! Trọng tài SCANMS sẽ xem xét trong 24h.');
    } catch (err: any) {
      alert(err?.response?.data?.message || err?.message || 'Gửi giải trình thất bại. Thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const deadline14d = selected
    ? new Date(new Date(selected.createdAt).getTime() + 14 * 86_400_000)
    : null;
  const daysLeft = deadline14d
    ? Math.max(0, Math.ceil((deadline14d.getTime() - Date.now()) / 86_400_000))
    : 0;
  const isExpired = deadline14d ? deadline14d < new Date() : false;

  return (
    <div className="min-h-screen bg-[#FAF8F5] p-4 sm:p-6">
      {/* ── Header ── */}
      <div className="max-w-7xl mx-auto mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-[#EAE4D7]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-xs font-bold text-amber-700 mb-2">
              <Scale className="w-3.5 h-3.5" />
              <span>SCANMS RETURN PORTAL • TIẾP NHẬN ĐỔI TRẢ 14 NGÀY</span>
            </div>
            <h1 className="text-2xl font-black text-[#1A1612]">
              Quản lý Yêu cầu Đổi trả / Hoàn hàng
            </h1>
            <p className="text-xs text-[#7D715E] mt-1">
              Xem xét chứng cứ video mở hộp của khách · Gửi giải trình · Chờ Trọng tài phân xử độc lập
            </p>
          </div>
          <button
            onClick={fetchDisputes}
            disabled={loading}
            className="px-3.5 py-2 bg-white border border-[#EAE4D7] hover:border-[#C59B58] rounded-xl text-xs font-bold text-[#1A1612] flex items-center gap-1.5 shadow-xs transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>

        {/* Stat row */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {[
            { label: 'Tổng khiếu nại', value: disputes.length, color: 'text-[#1A1612]' },
            { label: 'Chờ giải trình', value: disputes.filter((d) => d.dispute?.status === 'OPENED').length, color: 'text-amber-600' },
            { label: 'Đã phân xử', value: disputes.filter((d) => d.dispute?.status !== 'OPENED').length, color: 'text-green-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white border border-[#EAE4D7] rounded-xl p-3 text-center shadow-xs">
              <div className={`text-2xl font-black ${color}`}>{value}</div>
              <div className="text-[10px] text-[#7D715E] font-medium mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── Left: List ── */}
        <div className="lg:col-span-4 space-y-3">
          <div className="bg-white border border-[#EAE4D7] rounded-2xl shadow-xs p-3 space-y-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#7D715E]" />
              <input
                type="text"
                placeholder="Tìm mã đơn, tên khách..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] focus:outline-none focus:border-[#C59B58]"
              />
            </div>
            {/* Filter tabs */}
            <div className="flex gap-1">
              {(['ALL', 'OPENED', 'RESOLVED'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold transition ${filterStatus === tab ? 'bg-[#C59B58] text-white' : 'bg-[#FAF8F5] text-[#7D715E] hover:bg-[#F3EFE6]'}`}
                >
                  {tab === 'ALL' ? 'Tất cả' : tab === 'OPENED' ? 'Chờ XL' : 'Đã xử lý'}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-10 text-[#7D715E] gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-xs">Đang tải...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-10 text-[#7D715E] text-xs">
              <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-green-500" />
              Không có yêu cầu đổi trả nào
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((d) => {
                const ds = statusLabel(d.dispute?.status);
                const days = daysSinceOpened(d.dispute?.openedAt);
                const isSelected = d.orderId === selectedId;
                return (
                  <button
                    key={d.orderId}
                    onClick={() => setSelectedId(d.orderId)}
                    className={`w-full text-left p-3 rounded-xl border transition ${isSelected ? 'border-[#C59B58] bg-[#FBF5EB] shadow-xs' : 'border-[#EAE4D7] bg-white hover:border-[#C59B58]/50 hover:bg-[#FAF8F5]'}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-[#1A1612]">#{d.externalOrderSn}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${ds.color}`}>{ds.text}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-[#7D715E] mb-1">
                      <User className="w-3 h-3" /> {d.customerName}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-[#7D715E]">
                        Ngày mở: {new Date(d.dispute?.openedAt).toLocaleDateString('vi-VN')}
                      </span>
                      <span className={`text-[10px] font-semibold ${days > 10 ? 'text-rose-600' : 'text-[#7D715E]'}`}>
                        +{days} ngày
                      </span>
                    </div>
                    {d.dispute?.customerProofVideoUrl && (
                      <div className="flex items-center gap-1 mt-1">
                        <Video className="w-3 h-3 text-blue-500" />
                        <span className="text-[9px] text-blue-600 font-semibold">Có video mở hộp</span>
                      </div>
                    )}
                    {isSelected && <ChevronRight className="w-3.5 h-3.5 text-[#C59B58] ml-auto -mt-1" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Right: Detail ── */}
        <div className="lg:col-span-8">
          {!selected ? (
            <div className="bg-white border border-[#EAE4D7] rounded-2xl p-10 text-center text-[#7D715E] shadow-xs">
              <Scale className="w-10 h-10 mx-auto mb-3 text-[#EAE4D7]" />
              <p className="text-sm font-medium">Chọn một yêu cầu bên trái để xem chi tiết</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* ── Order Summary ── */}
              <div className="bg-white border border-[#EAE4D7] rounded-2xl shadow-xs p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="text-xs text-[#7D715E]">Đơn hàng</div>
                    <div className="font-mono text-lg font-black text-[#1A1612]">#{selected.externalOrderSn}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusLabel(selected.dispute?.status).color}`}>
                      {statusLabel(selected.dispute?.status).text}
                    </div>
                    <div className="text-[10px] text-[#7D715E] mt-1">
                      Giá trị: <strong>{Number(selected.finalAmount).toLocaleString('vi-VN')} đ</strong>
                    </div>
                  </div>
                </div>

                {/* 14-day policy meter */}
                <div className={`rounded-xl p-3 text-xs flex items-center gap-3 ${isExpired ? 'bg-rose-50 border border-rose-200' : daysLeft <= 3 ? 'bg-amber-50 border border-amber-200' : 'bg-green-50 border border-green-200'}`}>
                  <CalendarDays className={`w-4 h-4 shrink-0 ${isExpired ? 'text-rose-500' : daysLeft <= 3 ? 'text-amber-500' : 'text-green-500'}`} />
                  <div className="flex-1">
                    <div className="font-bold text-[#1A1612]">Chính sách đổi trả 14 ngày</div>
                    {isExpired ? (
                      <div className="text-rose-600">⏰ Đã hết hạn đổi trả (đơn tạo {new Date(selected.createdAt).toLocaleDateString('vi-VN')})</div>
                    ) : (
                      <div className={daysLeft <= 3 ? 'text-amber-700' : 'text-green-700'}>
                        Còn <strong>{daysLeft} ngày</strong> trong cửa sổ đổi trả · Hạn chót: {deadline14d?.toLocaleDateString('vi-VN')}
                      </div>
                    )}
                  </div>
                  {!isExpired && (
                    <div className="w-16 shrink-0">
                      <div className="h-1.5 rounded-full bg-white/50 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${daysLeft <= 3 ? 'bg-rose-400' : 'bg-green-400'}`}
                          style={{ width: `${Math.min(100, (daysLeft / 14) * 100)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Customer info + Items */}
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-[#7D715E] uppercase text-[10px]">Khách hàng</div>
                    <div className="font-semibold text-[#1A1612]">{selected.customerName}</div>
                    <div className="text-[#7D715E]">📞 {selected.customerPhone}</div>
                    {selected.customerEmail && <div className="text-[#7D715E] truncate">✉ {selected.customerEmail}</div>}
                  </div>
                  <div className="text-xs space-y-1">
                    <div className="font-bold text-[#7D715E] uppercase text-[10px]">Sản phẩm</div>
                    {selected.orderItems?.slice(0, 3).map((item) => (
                      <div key={item.id} className="flex items-center gap-1.5">
                        {item.product.imageUrl && (
                          <img src={item.product.imageUrl} alt="" className="w-6 h-6 rounded object-cover border border-[#EAE4D7]" />
                        )}
                        <span className="text-[#1A1612] truncate max-w-[140px]">{item.product.title} <span className="text-[#7D715E]">×{item.quantity}</span></span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Customer Evidence (Video + Images) ── */}
              <div className="bg-white border border-amber-200 rounded-2xl shadow-xs p-4">
                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#EAE4D7]">
                  <div className="w-7 h-7 rounded-full bg-amber-100 flex items-center justify-center">
                    <User className="w-4 h-4 text-amber-600" />
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-[#1A1612]">Bằng chứng từ Khách hàng</div>
                    <div className="text-[10px] text-[#7D715E]">Mở hộp · Ảnh kiểm tra · Ghi chú khiếu nại</div>
                  </div>
                </div>

                {/* Reason */}
                <div className="mb-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                  <div className="text-[10px] font-bold text-amber-700 uppercase mb-1 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> Lý do khiếu nại
                  </div>
                  <div className="text-sm font-semibold text-[#1A1612]">{selected.dispute?.reason}</div>
                  {selected.dispute?.customerNotes && (
                    <div className="text-xs text-[#7D715E] mt-1 italic">"{selected.dispute.customerNotes}"</div>
                  )}
                </div>

                {/* Video */}
                {selected.dispute?.customerProofVideoUrl ? (
                  <div className="mb-3">
                    <VideoPlayer url={selected.dispute.customerProofVideoUrl} label="Video mở hộp của khách" />
                    <a
                      href={selected.dispute.customerProofVideoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[10px] text-blue-600 hover:underline mt-1"
                    >
                      <ExternalLink className="w-3 h-3" /> Mở link gốc
                    </a>
                  </div>
                ) : (
                  <div className="mb-3 flex items-center gap-2 p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] text-xs text-[#7D715E]">
                    <Video className="w-4 h-4 text-[#B0A898]" />
                    Khách chưa cung cấp video mở hộp
                  </div>
                )}

                {/* Images */}
                {selected.dispute?.customerProofImages && selected.dispute.customerProofImages.length > 0 ? (
                  <ImageGallery images={selected.dispute.customerProofImages} label="Ảnh bằng chứng khách" />
                ) : (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] text-xs text-[#7D715E]">
                    <ImageIcon className="w-4 h-4 text-[#B0A898]" />
                    Khách chưa cung cấp ảnh bằng chứng
                  </div>
                )}
              </div>

              {/* ── Shop Response ── */}
              {selected.dispute?.storeResponse ? (
                <div className="bg-white border border-blue-200 rounded-2xl shadow-xs p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                      <Package className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-[#1A1612]">Giải trình của Gian hàng</div>
                      <div className="text-[10px] text-[#7D715E]">
                        Phản hồi lúc {new Date(selected.dispute.storeRespondedAt!).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto" />
                  </div>
                  <div className="text-xs text-[#1A1612] bg-blue-50 rounded-xl p-3 border border-blue-100">
                    {selected.dispute.storeResponse}
                  </div>
                  {selected.dispute.storeProofImages && selected.dispute.storeProofImages.length > 0 && (
                    <div className="mt-3">
                      <ImageGallery images={selected.dispute.storeProofImages} label="Ảnh xuất kho của shop" />
                    </div>
                  )}
                </div>
              ) : selected.dispute?.status === 'OPENED' ? (
                /* Shop response form */
                <div className="bg-white border border-[#EAE4D7] rounded-2xl shadow-xs p-4">
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-[#EAE4D7]">
                    <div className="w-7 h-7 rounded-full bg-[#FBF5EB] flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-[#C59B58]" />
                    </div>
                    <div>
                      <div className="text-xs font-extrabold text-[#1A1612]">Gửi Giải trình &amp; Bằng chứng Xuất kho</div>
                      <div className="text-[10px] text-[#7D715E]">Phản hồi sẽ được chuyển đến Cổng Trọng tài SCANMS</div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#4A3E2D] block mb-1">
                        Nội dung giải trình <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        value={storeResponse}
                        onChange={(e) => setStoreResponse(e.target.value)}
                        rows={5}
                        placeholder={`Mô tả chi tiết:\n• Hàng xuất kho đúng mô tả, đóng gói kỹ\n• Video kiểm tra trước khi giao\n• Bằng chứng giao nhận bưu tá\n• Lý do không chấp nhận đổi trả`}
                        className="w-full px-3 py-2.5 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs text-[#1A1612] focus:outline-none focus:border-[#C59B58] resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#4A3E2D] block mb-1">
                        URL ảnh bằng chứng xuất kho (phân cách bằng dấu phẩy)
                      </label>
                      <input
                        type="text"
                        value={storeProofImages}
                        onChange={(e) => setStoreProofImages(e.target.value)}
                        placeholder="https://cdn.example.com/img1.jpg, https://cdn.example.com/img2.jpg"
                        className="w-full px-3 py-2 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-xs text-[#1A1612] focus:outline-none focus:border-[#C59B58]"
                      />
                    </div>

                    <div className="p-3 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[10px] text-[#7D715E]">
                      <strong className="text-[#4A3E2D]">⚖️ Lưu ý:</strong> Giải trình sẽ được chuyển đến Cổng Trọng tài độc lập SCANMS.
                      Trọng tài sẽ xem xét toàn bộ bằng chứng 2 bên và ban hành phán quyết cuối cùng trong vòng 24h.
                      Phán quyết hoàn tiền sẽ tự động kích hoạt hoàn kho và thu hồi hoa hồng KOL.
                    </div>

                    <button
                      type="button"
                      disabled={submitting || !storeResponse.trim()}
                      onClick={handleRespond}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold transition disabled:opacity-50 shadow-xs"
                    >
                      {submitting ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang gửi...</>
                      ) : (
                        <><Send className="w-3.5 h-3.5" /> Gửi Giải trình lên Trọng tài</>
                      )}
                    </button>
                  </div>
                </div>
              ) : null}

              {/* ── Arbitration Result ── */}
              {selected.dispute?.arbitration && (
                <div className={`rounded-2xl shadow-xs p-4 border ${selected.dispute.arbitration.ruling === 'REFUND_BUYER' ? 'bg-rose-50 border-rose-200' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Scale className={`w-5 h-5 ${selected.dispute.arbitration.ruling === 'REFUND_BUYER' ? 'text-rose-500' : 'text-green-600'}`} />
                    <div>
                      <div className="text-xs font-extrabold text-[#1A1612]">Phán quyết Trọng tài SCANMS</div>
                      <div className="text-[10px] text-[#7D715E]">
                        Lúc {new Date(selected.dispute.arbitration.ruledAt).toLocaleString('vi-VN')} · {selected.dispute.arbitration.ruledBy}
                      </div>
                    </div>
                    {selected.dispute.arbitration.ruling === 'REFUND_BUYER' ? (
                      <div className="ml-auto text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-full border border-rose-200">
                        ↩ Hoàn tiền Khách
                      </div>
                    ) : (
                      <div className="ml-auto text-xs font-bold text-green-700 bg-green-100 px-2.5 py-1 rounded-full border border-green-200">
                        ✓ Từ chối Đổi trả
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-[#1A1612] bg-white/70 rounded-xl p-3 border border-white">
                    {selected.dispute.arbitration.notes}
                  </div>
                </div>
              )}

              {/* ── Timeline ── */}
              <div className="bg-white border border-[#EAE4D7] rounded-2xl shadow-xs p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-4 h-4 text-[#C59B58]" />
                  <div className="text-xs font-extrabold text-[#1A1612]">Timeline Tranh chấp</div>
                </div>
                <Timeline dispute={selected.dispute} orderDate={selected.createdAt} />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopReturnRequestsPage;