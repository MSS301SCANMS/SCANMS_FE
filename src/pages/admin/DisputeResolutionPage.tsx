import React, { useState, useEffect } from 'react';
import {
  Scale,
  CheckCircle2,
  XCircle,
  Video,
  Image as ImageIcon,
  Store,
  User,
  ExternalLink,
  Loader2,
  RefreshCw,
  Search,
} from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../utils/toast';

interface DisputedOrder {
  orderId: string;
  externalOrderSn: string;
  finalAmount: number;
  status: string;
  createdAt: string;
  store: {
    id: string;
    name: string;
    logoUrl?: string;
  };
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  orderItems: Array<{
    id: string;
    quantity: number;
    product: {
      id: string;
      title: string;
      imageUrl?: string;
    };
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

export const DisputeResolutionPage: React.FC = () => {
  const [disputes, setDisputes] = useState<DisputedOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<DisputedOrder | null>(null);
  const [rulingNotes, setRulingNotes] = useState('');
  const [submittingRuling, setSubmittingRuling] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'OPENED' | 'RESOLVED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/orders/admin/disputes');
      const data = res?.data || res || [];
      const list = Array.isArray(data) ? data : [];
      setDisputes(list);
      if (list.length > 0 && !selectedOrder) {
        setSelectedOrder(list[0]);
      } else if (selectedOrder) {
        const updated = list.find((d: DisputedOrder) => d.orderId === selectedOrder.orderId);
        if (updated) setSelectedOrder(updated);
      }
    } catch (err: any) {
      toast.error('Không thể tải danh sách khiếu nại tranh chấp.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDisputes();
  }, []);

  const handleArbitrate = async (ruling: 'REFUND_BUYER' | 'REJECT_BUYER') => {
    if (!selectedOrder) return;
    if (!rulingNotes.trim()) {
      toast.error('Vui lòng nhập căn cứ pháp lý và ghi chú phán quyết của Trọng tài.');
      return;
    }

    setSubmittingRuling(true);
    try {
      const res: any = await api.post(`/orders/${selectedOrder.orderId}/dispute/arbitrate`, {
        ruling,
        notes: rulingNotes.trim(),
      });
      const data = res?.data || res;
      toast.success(data?.message || 'Đã ban hành phán quyết trọng tài thành công!');
      setRulingNotes('');
      await fetchDisputes();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Ban hành phán quyết thất bại.');
    } finally {
      setSubmittingRuling(false);
    }
  };

  const filteredDisputes = disputes.filter((d) => {
    const matchesSearch =
      d.externalOrderSn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.store.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterStatus === 'OPENED') return matchesSearch && d.dispute?.status === 'OPENED';
    if (filterStatus === 'RESOLVED') return matchesSearch && d.dispute?.status !== 'OPENED';
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1612] p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#EAE4D7]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] text-xs font-bold text-[#B88E4F] mb-2">
              <Scale className="w-3.5 h-3.5" />
              <span>SCANMS ARBITRATION PORTAL • PHÂN XỬ ĐỘC LẬP</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#1A1612]">
              Cổng Phân Xử Trọng Tài Khiếu Nại Đổi Trả
            </h1>
            <p className="text-xs sm:text-sm text-[#7D715E] mt-1">
              Thẩm định bằng chứng đối lập (Split-View) giữa Người mua và Gian hàng đối tác. Phán quyết độc lập bảo vệ Quỹ Escrow.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchDisputes}
              className="px-3.5 py-2 bg-white border border-[#EAE4D7] hover:border-[#C59B58] rounded-xl text-xs font-bold text-[#1A1612] flex items-center gap-1.5 shadow-xs transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of Disputes (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-4 bg-white border border-[#EAE4D7] rounded-2xl shadow-xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#7D715E]" />
              <input
                type="text"
                placeholder="Tìm mã đơn, tên khách, shop..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] focus:outline-hidden focus:border-[#C59B58]"
              />
            </div>

            <div className="flex gap-1.5">
              {(['ALL', 'OPENED', 'RESOLVED'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilterStatus(tab)}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterStatus === tab
                      ? 'bg-[#C59B58] text-white shadow-xs'
                      : 'bg-[#F3EFE6] text-[#7D715E] hover:text-[#1A1612]'
                  }`}
                >
                  {tab === 'ALL' ? 'Tất cả' : tab === 'OPENED' ? 'Chờ xử lý' : 'Đã phân xử'}
                </button>
              ))}
            </div>
          </div>

          {/* List items */}
          <div className="space-y-2.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
            {loading ? (
              <div className="p-8 text-center text-[#7D715E]">
                <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#C59B58]" />
                <span className="text-xs">Đang tải hồ sơ khiếu nại...</span>
              </div>
            ) : filteredDisputes.length === 0 ? (
              <div className="p-8 text-center bg-white border border-[#EAE4D7] rounded-2xl text-[#7D715E]">
                <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-[#059669]" />
                <p className="text-xs font-bold text-[#1A1612]">Không có hồ sơ tranh chấp</p>
                <p className="text-[11px] mt-1">Toàn bộ đơn hàng hiện đang vận hành ổn định.</p>
              </div>
            ) : (
              filteredDisputes.map((d) => {
                const isSelected = selectedOrder?.orderId === d.orderId;
                const isPending = d.dispute?.status === 'OPENED';
                return (
                  <div
                    key={d.orderId}
                    onClick={() => setSelectedOrder(d)}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-[#FBF5EB] border-[#C59B58] shadow-sm'
                        : 'bg-white border-[#EAE4D7] hover:border-[#C59B58]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-black text-[#1A1612]">
                        {d.externalOrderSn}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          isPending
                            ? 'bg-[#DC2626]/10 text-[#DC2626] border border-[#DC2626]/30'
                            : 'bg-[#059669]/10 text-[#059669] border border-[#059669]/30'
                        }`}
                      >
                        {isPending ? 'Đang tranh chấp' : 'Đã phân xử'}
                      </span>
                    </div>

                    <div className="text-xs text-[#1A1612] font-semibold line-clamp-1 mb-1">
                      {d.dispute?.reason || 'Yêu cầu trả hàng & hoàn tiền'}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#7D715E]">
                      <span>Shop: {d.store.name}</span>
                      <span className="font-bold text-[#B88E4F]">
                        {d.finalAmount.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Split-View Arbitration Dossier (8 cols) */}
        <div className="lg:col-span-8">
          {selectedOrder ? (
            <div className="space-y-6 text-left">
              {/* Top Banner: Order Meta */}
              <div className="p-4 sm:p-5 bg-white border border-[#EAE4D7] rounded-2xl shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div>
                  <div className="text-[11px] text-[#7D715E]">HỒ SƠ TRANH CHẤP ĐƠN HÀNG</div>
                  <h2 className="text-lg font-black text-[#1A1612] font-mono">
                    {selectedOrder.externalOrderSn}
                  </h2>
                  <div className="text-xs text-[#7D715E] mt-0.5">
                    Giá trị đơn:{' '}
                    <strong className="text-[#1A1612]">
                      {selectedOrder.finalAmount.toLocaleString('vi-VN')} ₫
                    </strong>{' '}
                    • Ngày đặt: {new Date(selectedOrder.createdAt).toLocaleDateString('vi-VN')}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] text-xs">
                    <span className="text-[#7D715E]">Trạng thái Escrow: </span>
                    <strong className="text-[#DC2626]">Đóng băng bảo chứng</strong>
                  </div>
                </div>
              </div>

              {/* SPLIT-VIEW CONTAINER */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* 1. Bên Trái: Bằng chứng Khách hàng (Buyer Dossier) */}
                <div className="p-4 sm:p-5 bg-white border-2 border-[#EAE4D7] hover:border-[#C59B58] rounded-2xl space-y-3 transition">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-[#EAE4D7]">
                    <div className="w-7 h-7 rounded-lg bg-[#C59B58]/10 text-[#C59B58] flex items-center justify-center font-black text-xs">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-[#1A1612] uppercase">
                        Bằng Chứng Người Mua (Khách Hàng)
                      </h3>
                      <p className="text-[11px] text-[#7D715E]">
                        {selectedOrder.customerName} • {selectedOrder.customerPhone}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#7D715E] uppercase block">
                      Lý do khiếu nại của khách
                    </label>
                    <div className="p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] leading-relaxed font-medium">
                      "{selectedOrder.dispute?.reason || 'Hàng hóa bị vỡ hỏng trong quá trình vận chuyển, không giống mô tả của gian hàng.'}"
                    </div>
                  </div>

                  {/* Video Unbox */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#7D715E] uppercase flex items-center gap-1">
                      <Video className="w-3.5 h-3.5 text-[#C59B58]" />
                      Video Mở Hàng (Unbox Video Evidence)
                    </label>
                    {selectedOrder.dispute?.customerProofVideoUrl ? (
                      <div className="p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl flex items-center justify-between">
                        <span className="text-xs text-[#1A1612] font-mono truncate max-w-[200px]">
                          {selectedOrder.dispute.customerProofVideoUrl}
                        </span>
                        <a
                          href={selectedOrder.dispute.customerProofVideoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 bg-[#C59B58] text-white text-[11px] font-bold rounded-lg flex items-center gap-1 hover:bg-[#B88E4F]"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Xem video
                        </a>
                      </div>
                    ) : (
                      <div className="p-4 bg-[#FAF8F5] border border-dashed border-[#EAE4D7] rounded-xl text-center text-xs text-[#7D715E]">
                        Khách hàng không đính kèm file video mở kiện.
                      </div>
                    )}
                  </div>

                  {/* Ảnh bằng chứng */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#7D715E] uppercase flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-[#C59B58]" />
                      Ảnh Chụp Thiệt Hại (Photos)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedOrder.dispute?.customerProofImages &&
                      selectedOrder.dispute.customerProofImages.length > 0 ? (
                        selectedOrder.dispute.customerProofImages.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-lg overflow-hidden border border-[#EAE4D7] hover:border-[#C59B58]"
                          >
                            <img src={url} alt={`Bằng chứng ${idx}`} className="w-full h-24 object-cover" />
                          </a>
                        ))
                      ) : (
                        <div className="col-span-2 p-3 bg-[#FAF8F5] border border-dashed border-[#EAE4D7] rounded-xl text-center text-xs text-[#7D715E]">
                          Không có hình ảnh đính kèm.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 2. Bên Phải: Bằng chứng Gian hàng (Merchant Dossier) */}
                <div className="p-4 sm:p-5 bg-white border-2 border-[#EAE4D7] hover:border-[#C59B58] rounded-2xl space-y-3 transition">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-[#EAE4D7]">
                    <div className="w-7 h-7 rounded-lg bg-[#C59B58]/10 text-[#C59B58] flex items-center justify-center font-black text-xs">
                      <Store className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-[#1A1612] uppercase">
                        Giải Trình Gian Hàng (Merchant)
                      </h3>
                      <p className="text-[11px] text-[#7D715E]">{selectedOrder.store.name}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[11px] font-bold text-[#7D715E] uppercase block">
                      Văn bản giải trình của shop
                    </label>
                    <div className="p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] leading-relaxed font-medium min-h-[70px]">
                      {selectedOrder.dispute?.storeResponse ? (
                        `"${selectedOrder.dispute.storeResponse}"`
                      ) : (
                        <span className="text-[#D97706] italic">
                          ⚠️ Gian hàng chưa gửi văn bản giải trình. Trọng tài có quyền xử vắng mặt theo quy chế sàn.
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ảnh đóng hàng xuất kho */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#7D715E] uppercase flex items-center gap-1">
                      <ImageIcon className="w-3.5 h-3.5 text-[#C59B58]" />
                      Biên Bản Đóng Gói Xuất Kho
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedOrder.dispute?.storeProofImages &&
                      selectedOrder.dispute.storeProofImages.length > 0 ? (
                        selectedOrder.dispute.storeProofImages.map((url, idx) => (
                          <a
                            key={idx}
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block rounded-lg overflow-hidden border border-[#EAE4D7] hover:border-[#C59B58]"
                          >
                            <img src={url} alt={`Chứng từ xuất kho ${idx}`} className="w-full h-24 object-cover" />
                          </a>
                        ))
                      ) : (
                        <div className="col-span-2 p-3 bg-[#FAF8F5] border border-dashed border-[#EAE4D7] rounded-xl text-center text-xs text-[#7D715E]">
                          Chưa tải lên chứng từ xuất kho.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Phán Quyết Hiện Tại (Nếu đã phán quyết) */}
              {selectedOrder.dispute?.arbitration && (
                <div className="p-4 sm:p-5 bg-[#FBF5EB] border-2 border-[#C59B58] rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-black text-[#1A1612]">
                    <Scale className="w-4 h-4 text-[#C59B58]" />
                    <span>PHÁN QUYẾT TRỌNG TÀI ĐÃ BAN HÀNH</span>
                    <span
                      className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-black ${
                        selectedOrder.dispute.arbitration.ruling === 'REFUND_BUYER'
                          ? 'bg-[#059669] text-white'
                          : 'bg-[#DC2626] text-white'
                      }`}
                    >
                      {selectedOrder.dispute.arbitration.ruling === 'REFUND_BUYER'
                        ? 'CHẤP THUẬN HOÀN TIỀN KHÁCH HÀNG'
                        : 'BÁC BỎ KHIẾU NẠI (BẢO VỆ SHOP)'}
                    </span>
                  </div>
                  <p className="text-xs text-[#1A1612] bg-white p-3 rounded-xl border border-[#EEDFC6] font-medium leading-relaxed">
                    <strong>Căn cứ phán quyết:</strong> "{selectedOrder.dispute.arbitration.notes}"
                  </p>
                  <div className="text-[11px] text-[#7D715E] flex justify-between">
                    <span>Trọng tài viên: {selectedOrder.dispute.arbitration.ruledBy}</span>
                    <span>
                      Thời điểm: {new Date(selectedOrder.dispute.arbitration.ruledAt).toLocaleString('vi-VN')}
                    </span>
                  </div>
                </div>
              )}

              {/* 4. Console Ban Hành Phán Quyết (Arbitration Ruling Console) */}
              {selectedOrder.dispute?.status === 'OPENED' && (
                <div className="p-5 bg-white border-2 border-[#C59B58] rounded-2xl shadow-sm space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-[#EAE4D7]">
                    <Scale className="w-4 h-4 text-[#C59B58]" />
                    <h3 className="text-xs sm:text-sm font-black text-[#1A1612] uppercase">
                      Hội đồng Trọng Tài Ban Hành Phán Quyết Pháp Lý
                    </h3>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#1A1612] mb-1.5">
                      Căn cứ phán quyết & Nhận định đối soát <span className="text-[#DC2626]">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={rulingNotes}
                      onChange={(e) => setRulingNotes(e.target.value)}
                      placeholder="Căn cứ video mở kiện và biên bản bưu cục, hàng hóa thực tế đã bị hư hỏng do vận chuyển..."
                      className="w-full p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] focus:outline-hidden focus:border-[#C59B58]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <button
                      type="button"
                      disabled={submittingRuling}
                      onClick={() => handleArbitrate('REFUND_BUYER')}
                      className="py-3 px-4 bg-[#059669] hover:bg-[#047857] text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submittingRuling ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4" />
                      )}
                      <span>Chấp Thuận Hoàn Tiền (Thu Hồi Escrow)</span>
                    </button>

                    <button
                      type="button"
                      disabled={submittingRuling}
                      onClick={() => handleArbitrate('REJECT_BUYER')}
                      className="py-3 px-4 bg-[#DC2626] hover:bg-[#B91C1C] text-white font-extrabold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submittingRuling ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      <span>Bác Bỏ Khiếu Nại (Giải Ngân Cho Shop)</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-[#7D715E] text-center">
                    ⚖️ Phán quyết có hiệu lực ràng buộc ngay lập tức đối với Sổ cái tài chính của SCANMS và gửi thông báo điện tử đến hai bên.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-[#EAE4D7] rounded-2xl text-[#7D715E]">
              <Scale className="w-10 h-10 mx-auto mb-2 text-[#C59B58]" />
              <p className="text-sm font-bold text-[#1A1612]">Chọn hồ sơ khiếu nại để bắt đầu phân xử</p>
              <p className="text-xs mt-1">Danh sách hồ sơ cần phân xử hiển thị ở cột bên trái.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
