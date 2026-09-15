import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import api from '../../services/api';
import type { SampleRequest, SampleRequestStatus, ShopStats } from '../../types/samples';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  SHIPPED: 'Đang giao hàng',
  DELIVERED: 'Đã nhận',
  COMPLETED: 'Hoàn thành (Đã lên bài)',
  REJECTED: 'Đã từ chối',
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  SHIPPED: 'bg-blue-50 text-blue-700 border border-blue-200',
  DELIVERED: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
  COMPLETED: 'bg-purple-50 text-purple-700 border border-purple-200',
  REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200',
};

const STATUS_ICON: Record<string, string> = {
  PENDING: '⏳',
  APPROVED: '✅',
  SHIPPED: '🚚',
  DELIVERED: '📦',
  COMPLETED: '🎉',
  REJECTED: '❌',
};

function formatDate(d: string) {
  if (!d) return '—';
  return format(new Date(d), 'dd/MM/yyyy HH:mm');
}


function TrackingModal({
  request,
  onClose,
  onSuccess,
}: {
  request: SampleRequest;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [carrier, setCarrier] = useState('GHTK');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingNumber.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.patch(`/sample-requests/${request.id}/ship`, {
        trackingNumber: trackingNumber.trim(),
        carrier,
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Cập nhật thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#EAE4D7] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="px-6 py-4 border-b border-[#EAE4D7] flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#1A1612]">🚚 Nhập Mã Vận Đơn Mẫu</h2>
          <button
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#7D715E] hover:bg-[#F3EFE6] transition cursor-pointer"
            onClick={onClose}
            id="btn-close-tracking-modal"
          >
            ✕
          </button>
        </div>

        <div className="p-4 mx-6 mt-4 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-xs space-y-1">
          <div className="font-extrabold text-[#1A1612]">{request.collaborator.fullName}</div>
          <div className="text-[#7D715E]">{request.product.title}</div>
          <div className="text-[11px] text-[#7D715E] pt-1 border-t border-[#EEDFC6]/60">
            📍 {request.shippingAddress}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="sr-carrier" className="text-xs font-bold text-[#1A1612] block mb-1.5">
              Đơn vị vận chuyển
            </label>
            <select
              id="sr-carrier"
              className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] outline-none focus:border-[#B88E4F]"
              value={carrier}
              onChange={(e) => setCarrier(e.target.value)}
            >
              <option value="GHTK">GHTK — Giao Hàng Tiết Kiệm</option>
              <option value="GHN">GHN — Giao Hàng Nhanh</option>
              <option value="VNPOST">VN Post</option>
              <option value="VIETTELPOST">Viettel Post</option>
              <option value="OTHER">Khác</option>
            </select>
          </div>

          <div>
            <label htmlFor="sr-tracking-number" className="text-xs font-bold text-[#1A1612] block mb-1.5">
              Mã vận đơn
            </label>
            <input
              id="sr-tracking-number"
              type="text"
              className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] font-mono outline-none focus:border-[#B88E4F]"
              placeholder="VD: GHTK123456789 hoặc GHN987654321"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value.toUpperCase())}
              required
            />
          </div>

          {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">{error}</div>}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl border border-[#EAE4D7] text-xs font-bold text-[#7D715E] hover:bg-[#F3EFE6] transition cursor-pointer"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              type="submit"
              id="btn-confirm-ship"
              className="px-5 py-2.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-extrabold transition shadow-xs cursor-pointer disabled:opacity-50"
              disabled={loading || !trackingNumber.trim()}
            >
              {loading ? '⏳ Đang lưu...' : '🚚 Xác nhận giao hàng'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default function ShopSampleRequestsPage() {
  const [requests, setRequests] = useState<SampleRequest[]>([]);
  const [stats, setStats] = useState<ShopStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<SampleRequestStatus | 'ALL'>('ALL');
  const [shippingTarget, setShippingTarget] = useState<SampleRequest | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [reqRes, statsRes]: any[] = await Promise.all([
        api.get('/sample-requests/shop'),
        api.get('/sample-requests/shop/stats'),
      ]);
      const list = Array.isArray(reqRes) ? reqRes : Array.isArray(reqRes?.data) ? reqRes.data : [];
      const statsObj = statsRes?.data || statsRes || null;
      setRequests(list);
      setStats(statsObj);
    } catch (err) {
      console.error(err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleApprove = async (id: string) => {
    setActionLoading(id + '-approve');
    try {
      await api.patch(`/sample-requests/${id}/approve`, {});
      showToast('✅ Đã duyệt yêu cầu xin mẫu');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Bạn chắc chắn muốn từ chối yêu cầu này?')) return;
    setActionLoading(id + '-reject');
    try {
      await api.patch(`/sample-requests/${id}/reject`, {});
      showToast('❌ Đã từ chối yêu cầu xin mẫu');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered =
    filterStatus === 'ALL'
      ? requests
      : requests.filter((r) => r.status === filterStatus);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6" id="shop-sample-requests-page">

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-xl text-xs font-extrabold shadow-lg z-50 border ${
            toast.type === 'success'
              ? 'bg-white border-[#EEDFC6] text-[#B88E4F]'
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}
          role="alert"
        >
          {toast.msg}
        </div>
      )}


      <div className="pb-2 border-b border-[#EAE4D7]">
        <h1 className="text-2xl sm:text-3xl font-black text-[#1A1612] flex items-center gap-2.5">
          <span>📋</span> Quản Lý Yêu Cầu Mẫu Trải Nghiệm
        </h1>
        <p className="text-sm text-[#7D715E] mt-1">
          Duyệt yêu cầu, hỗ trợ sản phẩm dùng thử và cập nhật mã vận đơn cho KOL / Nhà sáng tạo
        </p>
      </div>


      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
          <div className="bg-white border border-[#EAE4D7] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="text-2xl">⏳</div>
            <div>
              <div className="text-xl font-black text-[#B88E4F]">{stats.pending}</div>
              <div className="text-xs font-semibold text-[#7D715E]">Chờ duyệt</div>
            </div>
          </div>
          <div className="bg-white border border-[#EAE4D7] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="text-2xl">✅</div>
            <div>
              <div className="text-xl font-black text-[#1A1612]">{stats.approved}</div>
              <div className="text-xs font-semibold text-[#7D715E]">Đã duyệt</div>
            </div>
          </div>
          <div className="bg-white border border-[#EAE4D7] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="text-2xl">🚚</div>
            <div>
              <div className="text-xl font-black text-[#1A1612]">{stats.shipped}</div>
              <div className="text-xs font-semibold text-[#7D715E]">Đang giao</div>
            </div>
          </div>
          <div className="bg-white border border-[#EAE4D7] rounded-2xl p-4 flex items-center gap-3.5 shadow-xs">
            <div className="text-2xl">❌</div>
            <div>
              <div className="text-xl font-black text-[#1A1612]">{stats.rejected}</div>
              <div className="text-xs font-semibold text-[#7D715E]">Từ chối</div>
            </div>
          </div>
        </div>
      )}


      <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist">
        {(['ALL', 'PENDING', 'APPROVED', 'SHIPPED', 'REJECTED'] as const).map((s) => (
          <button
            key={s}
            id={`shop-tab-${s.toLowerCase()}`}
            type="button"
            role="tab"
            aria-selected={filterStatus === s}
            className={`px-3.5 py-2 rounded-full text-xs font-bold border transition cursor-pointer flex items-center gap-1.5 flex-shrink-0 ${
              filterStatus === s
                ? 'bg-white border-[#EEDFC6] text-[#B88E4F] shadow-xs'
                : 'bg-[#F3EFE6] border-[#EAE4D7] text-[#7D715E] hover:text-[#1A1612]'
            }`}
            onClick={() => setFilterStatus(s)}
          >
            <span>
              {s === 'ALL'
                ? '📋 Tất cả'
                : `${STATUS_ICON[s as SampleRequestStatus]} ${STATUS_LABEL[s as SampleRequestStatus]}`}
            </span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                filterStatus === s ? 'bg-[#FBF5EB] text-[#B88E4F]' : 'bg-[#EAE4D7] text-[#7D715E]'
              }`}
            >
              {s === 'ALL'
                ? requests.length
                : requests.filter((r) => r.status === s).length}
            </span>
          </button>
        ))}
      </div>


      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 p-20 text-[#7D715E]">
          <div className="w-8 h-8 border-3 border-[#C59B58]/20 border-t-[#C59B58] rounded-full animate-spin" />
          <span className="text-sm font-semibold">Đang tải danh sách yêu cầu...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#EAE4D7] rounded-2xl text-[#7D715E] p-8 shadow-xs">
          <div className="text-4xl mb-3">📭</div>
          <h3 className="text-base font-bold text-[#1A1612]">Không có yêu cầu nào</h3>
          <p className="text-xs text-[#7D715E] mt-1 max-w-md mx-auto">
            Chưa có KOL/CTV nào gửi yêu cầu xin mẫu trong mục này.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-[#EAE4D7] rounded-2xl overflow-hidden shadow-xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[700px]" id="shop-requests-table">
            <thead>
              <tr className="bg-[#F3EFE6] border-b border-[#EAE4D7] text-[#7D715E] font-bold">
                <th className="p-3.5">KOL / CTV</th>
                <th className="p-3.5">Sản phẩm mẫu</th>
                <th className="p-3.5">Địa chỉ nhận</th>
                <th className="p-3.5">Ngày gửi</th>
                <th className="p-3.5">Mã vận đơn</th>
                <th className="p-3.5">Trạng thái</th>
                <th className="p-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE4D7]/70">
              {filtered.map((req) => (
                <tr key={req.id} id={`shop-row-${req.id}`} className="hover:bg-[#FAF8F5] transition">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#EEDFC6] text-[#B88E4F] font-bold flex items-center justify-center text-xs flex-shrink-0">
                        {req.collaborator.fullName[0]}
                      </div>
                      <div>
                        <div className="font-bold text-[#1A1612]">{req.collaborator.fullName}</div>
                        <div className="text-[11px] text-[#7D715E]">{req.collaborator.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-2 max-w-xs">
                      {req.product.imageUrl && (
                        <img
                          src={req.product.imageUrl}
                          alt=""
                          className="w-8 h-8 rounded-lg border border-[#EAE4D7] object-cover flex-shrink-0"
                        />
                      )}
                      <div className="min-w-0">
                        <div className="font-bold text-[#1A1612] truncate">{req.product.title}</div>
                        <div className="text-[11px] text-[#7D715E]">SKU: {req.product.sku}</div>
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="text-[#1A1612] line-clamp-2 max-w-[200px]">{req.shippingAddress}</span>
                  </td>
                  <td className="p-3.5 text-[#7D715E] whitespace-nowrap">
                    {formatDate(req.createdAt)}
                  </td>
                  <td className="p-3.5">
                    {req.trackingNumber ? (
                      <code className="font-mono bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] px-2 py-0.5 rounded text-[11px] font-bold">
                        {req.trackingNumber}
                      </code>
                    ) : (
                      <span className="text-[#7D715E]">—</span>
                    )}
                  </td>
                  <td className="p-3.5 whitespace-nowrap">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                        STATUS_CLASS[req.status]
                      }`}
                    >
                      <span>{STATUS_ICON[req.status]}</span>
                      <span>{STATUS_LABEL[req.status]}</span>
                    </span>
                  </td>
                  <td className="p-3.5 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1.5">
                      {req.status === 'PENDING' && (
                        <>
                          <button
                            id={`btn-approve-${req.id}`}
                            type="button"
                            className="px-2.5 py-1.5 rounded-lg bg-[#FBF5EB] text-[#B88E4F] hover:bg-[#F3EFE6] border border-[#EEDFC6] font-extrabold text-xs transition cursor-pointer"
                            onClick={() => handleApprove(req.id)}
                            disabled={!!actionLoading}
                            title="Duyệt"
                          >
                            {actionLoading === req.id + '-approve' ? '⏳' : '✅ Duyệt'}
                          </button>
                          <button
                            id={`btn-reject-${req.id}`}
                            type="button"
                            className="px-2.5 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-extrabold text-xs transition cursor-pointer"
                            onClick={() => handleReject(req.id)}
                            disabled={!!actionLoading}
                            title="Từ chối"
                          >
                            {actionLoading === req.id + '-reject' ? '⏳' : '❌ Từ chối'}
                          </button>
                        </>
                      )}
                      {req.status === 'APPROVED' && (
                        <button
                          id={`btn-ship-${req.id}`}
                          type="button"
                          className="px-3 py-1.5 rounded-lg bg-[#C59B58] text-white hover:bg-[#B88E4F] font-extrabold text-xs transition shadow-xs cursor-pointer"
                          onClick={() => setShippingTarget(req)}
                          title="Nhập mã vận đơn"
                        >
                          🚚 Nhập mã vận đơn
                        </button>
                      )}
                      {req.status === 'SHIPPED' && (
                        <a
                          href={`https://ghtk.vn/tracking?order_code=${req.trackingNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-extrabold text-xs transition inline-block"
                          id={`btn-track-${req.id}`}
                        >
                          🔍 Tra cứu GHTK
                        </a>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {shippingTarget && (
        <TrackingModal
          request={shippingTarget}
          onClose={() => setShippingTarget(null)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
