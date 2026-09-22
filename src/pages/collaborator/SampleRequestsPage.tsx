import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import api from '../../services/api';
import type { SampleRequest, SampleRequestStatus } from '../../types/samples';
import { SubmitKolVideoModal } from '../../components/media/SubmitKolVideoModal';


const STATUS_LABEL: Record<SampleRequestStatus, string> = {
  PENDING: 'Chờ duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Từ chối',
  SHIPPED: 'Đang giao',
};

const STATUS_CLASS: Record<SampleRequestStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200',
  SHIPPED: 'bg-blue-50 text-blue-700 border border-blue-200',
};

const STATUS_ICON: Record<SampleRequestStatus, string> = {
  PENDING: '⏳',
  APPROVED: '✅',
  REJECTED: '❌',
  SHIPPED: '🚚',
};

function formatDate(d: string) {
  return format(new Date(d), 'dd/MM/yyyy HH:mm');
}


function RequestModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [products, setProducts] = useState<any[]>([]);
  const [fetchingProducts, setFetchingProducts] = useState(false);
  const [productId, setProductId] = useState('');
  const [shippingAddress, setShippingAddress] = useState(
    'Phòng 402, Chung cư Sunrise City, Quận 7, TP.HCM'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFetchingProducts(true);
    api
      .get('/products')
      .then((res: any) => {
        const list = Array.isArray(res)
          ? res
          : Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.data?.items)
          ? res.data.items
          : Array.isArray(res?.items)
          ? res.items
          : [];
        setProducts(list);
        if (list.length > 0) {
          setProductId((prev) => prev || list[0].id);
        }
      })
      .catch(console.error)
      .finally(() => setFetchingProducts(false));
  }, []);

  const selectedProduct = Array.isArray(products)
    ? products.find((p) => p.id === productId)
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId.trim() || !shippingAddress.trim()) return;
    setLoading(true);
    setError('');
    try {
      await api.post('/sample-requests', {
        productId: productId.trim(),
        shippingAddress: shippingAddress.trim(),
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gửi yêu cầu thất bại');
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
        <div className="px-6 py-4 border-b border-[#EAE4D7] flex items-center justify-between bg-stone-50/50">
          <h2 className="text-base font-extrabold text-[#1A1612] flex items-center gap-2">
            <span>📦</span> Xin Sản Phẩm Mẫu Dùng Thử
          </h2>
          <button
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#7D715E] hover:bg-[#F3EFE6] transition cursor-pointer"
            onClick={onClose}
            id="btn-close-modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="sr-product-id" className="text-xs font-bold text-[#1A1612] block mb-1.5">
              Chọn Sản phẩm muốn xin mẫu
            </label>
            {fetchingProducts ? (
              <div className="text-xs text-stone-500 py-2 flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                Đang tải danh sách sản phẩm...
              </div>
            ) : products.length > 0 ? (
              <select
                id="sr-product-id"
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] outline-none focus:border-[#B88E4F]"
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
              >
                {products.map((p: any) => (
                  <option key={p.id} value={p.id}>
                    {p.title} - {p.store?.name || 'Shop'} ({Number(p.price).toLocaleString('vi-VN')} đ)
                  </option>
                ))}
              </select>
            ) : (
              <input
                id="sr-product-id"
                type="text"
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] outline-none focus:border-[#B88E4F]"
                placeholder="Nhập ID sản phẩm..."
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
              />
            )}
          </div>

          {selectedProduct && (
            <div className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-center gap-3">
              {selectedProduct.imageUrl && (
                <img
                  src={selectedProduct.imageUrl}
                  alt={selectedProduct.title}
                  className="w-12 h-12 rounded-lg object-cover bg-white border border-amber-200/60 flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-stone-900 truncate">
                  {selectedProduct.title}
                </div>
                <div className="text-[11px] text-amber-800 font-semibold">
                  {Number(selectedProduct.price).toLocaleString('vi-VN')} đ • SKU: {selectedProduct.sku}
                </div>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="sr-address" className="text-xs font-bold text-[#1A1612] block mb-1.5">
              Địa chỉ nhận hàng mẫu (Kèm SĐT liên hệ)
            </label>
            <textarea
              id="sr-address"
              className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] outline-none focus:border-[#B88E4F] resize-none"
              placeholder="Ví dụ: Phòng 402, Chung cư Sunrise City, Quận 7, TP.HCM - SĐT: 0987654321"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
              rows={3}
              required
              minLength={10}
            />
          </div>

          {error && (
            <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">
              {error}
            </div>
          )}

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
              id="btn-submit-sample"
              className="px-5 py-2.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-extrabold transition shadow-xs cursor-pointer disabled:opacity-50"
              disabled={loading || !productId.trim() || !shippingAddress.trim()}
            >
              {loading ? '⏳ Đang gửi...' : '📤 Gửi yêu cầu xin mẫu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


export default function SampleRequestsPage() {
  const [requests, setRequests] = useState<SampleRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [reviewModalReq, setReviewModalReq] = useState<SampleRequest | null>(null);
  const [receivedIds, setReceivedIds] = useState<Record<string, boolean>>({});
  const [filterStatus, setFilterStatus] = useState<SampleRequestStatus | 'ALL'>('ALL');

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/sample-requests/my');
      const list = Array.isArray(res) ? res : Array.isArray(res?.data) ? res.data : [];
      setRequests(list);
    } catch (err) {
      console.error(err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const filtered =
    filterStatus === 'ALL'
      ? requests
      : requests.filter((r) => r.status === filterStatus);

  const counts = {
    ALL: requests.length,
    PENDING: requests.filter((r) => r.status === 'PENDING').length,
    APPROVED: requests.filter((r) => r.status === 'APPROVED').length,
    SHIPPED: requests.filter((r) => r.status === 'SHIPPED').length,
    REJECTED: requests.filter((r) => r.status === 'REJECTED').length,
  };

  return (
    <div className="max-w-[1520px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6" id="kol-sample-requests-page">

      <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap pb-2 border-b border-[#EAE4D7]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1A1612] flex items-center gap-2.5">
            <span>📦</span> Sản Phẩm Mẫu Trải Nghiệm
          </h1>
          <p className="text-sm text-[#7D715E] mt-1">
            Yêu cầu gian hàng gửi mẫu sản phẩm dùng thử để sáng tạo nội dung review chất lượng
          </p>
        </div>
        <button
          id="btn-new-sample-request"
          type="button"
          className="px-4 py-2.5 rounded-full bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-extrabold transition shadow-xs cursor-pointer flex items-center gap-1.5"
          onClick={() => setShowModal(true)}
        >
          <span>+</span> Xin Mẫu Mới
        </button>
      </div>


      <div className="flex items-center gap-2 overflow-x-auto pb-1" role="tablist">
        {(['ALL', 'PENDING', 'APPROVED', 'SHIPPED', 'REJECTED'] as const).map((s) => (
          <button
            key={s}
            id={`tab-${s.toLowerCase()}`}
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
            <span>{s === 'ALL' ? '📋 Tất cả' : `${STATUS_ICON[s]} ${STATUS_LABEL[s]}`}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                filterStatus === s ? 'bg-[#FBF5EB] text-[#B88E4F]' : 'bg-[#EAE4D7] text-[#7D715E]'
              }`}
            >
              {counts[s]}
            </span>
          </button>
        ))}
      </div>


      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 p-20 text-[#7D715E]">
          <div className="w-8 h-8 border-3 border-[#C59B58]/20 border-t-[#C59B58] rounded-full animate-spin" />
          <span className="text-sm font-semibold">Đang tải danh sách yêu cầu mẫu...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#EAE4D7] rounded-2xl text-[#7D715E] p-8 shadow-xs">
          <div className="text-4xl mb-3">📭</div>
          <h3 className="text-base font-bold text-[#1A1612]">Chưa có yêu cầu nào</h3>
          <p className="text-xs text-[#7D715E] mt-1 max-w-md mx-auto mb-4">
            Nhấn <strong>+ Xin Mẫu Mới</strong> để gửi thông tin sản phẩm và địa chỉ nhận hàng cho gian hàng.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((req) => (
            <div
              key={req.id}
              className="bg-white border border-[#EAE4D7] rounded-2xl p-5 shadow-xs hover:border-[#EEDFC6] transition space-y-4"
              id={`request-${req.id}`}
            >

              <div className="flex items-start justify-between gap-4 flex-wrap pb-3 border-b border-[#EAE4D7]">
                <div className="flex items-center gap-3 min-w-0">
                  {req.product.imageUrl ? (
                    <img
                      src={req.product.imageUrl}
                      alt={req.product.title}
                      className="w-14 h-14 rounded-xl border border-[#EAE4D7] object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-[#F3EFE6] border border-[#EAE4D7] flex items-center justify-center text-2xl flex-shrink-0">
                      🛍️
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-extrabold text-[#1A1612] truncate">
                      {req.product.title}
                    </div>
                    <div className="text-xs text-[#7D715E] mt-0.5">
                      SKU: <code className="font-mono text-[#1A1612]">{req.product.sku}</code> ·{' '}
                      <span className="font-semibold text-[#B88E4F]">{req.product.store.name}</span>
                    </div>
                  </div>
                </div>
                <div
                  className={`px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1 ${
                    STATUS_CLASS[req.status]
                  }`}
                >
                  <span>{STATUS_ICON[req.status]}</span>
                  <span>{STATUS_LABEL[req.status]}</span>
                </div>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[#7D715E] font-semibold block mb-0.5">📍 Địa chỉ nhận mẫu:</span>
                  <span className="text-[#1A1612] font-medium">{req.shippingAddress}</span>
                </div>
                <div>
                  <span className="text-[#7D715E] font-semibold block mb-0.5">📅 Thời gian gửi:</span>
                  <span className="text-[#1A1612] font-medium">{formatDate(req.createdAt)}</span>
                </div>
              </div>


              {req.trackingNumber && (
                <div className="p-3 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-between gap-3 flex-wrap text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🚚</span>
                    <span className="font-semibold text-[#7D715E]">Mã vận đơn:</span>
                    <code className="font-mono font-black text-[#1A1612] bg-white px-2 py-0.5 rounded border border-[#EEDFC6]">
                      {req.trackingNumber}
                    </code>
                  </div>
                  <a
                    href={`https://ghtk.vn/tracking?order_code=${req.trackingNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#B88E4F] font-bold hover:underline"
                    id={`tracking-link-${req.id}`}
                  >
                    Tra cứu tiến độ GHTK →
                  </a>
                </div>
              )}

              {req.status === 'SHIPPED' && (
                <div className="p-3.5 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl flex items-center justify-between gap-3 flex-wrap text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-base">🎁</span>
                    <div>
                      <div className="font-bold text-[#1A1612]">
                        {receivedIds[req.id] ? 'Đã nhận mẫu trải nghiệm thành công' : 'Mẫu sản phẩm đang được bưu cục vận chuyển'}
                      </div>
                      <div className="text-[11px] text-[#7D715E]">
                        Quy chế: Nộp liên kết bài Review trong vòng 7 ngày kể từ khi nhận mẫu
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!receivedIds[req.id] && (
                      <button
                        type="button"
                        onClick={() => setReceivedIds((prev) => ({ ...prev, [req.id]: true }))}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer"
                      >
                        ✓ Đã Nhận Hàng
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setReviewModalReq(req)}
                      className="px-3 py-1.5 rounded-lg bg-[#C59B58] hover:bg-[#B88E4F] text-white font-bold text-xs transition cursor-pointer flex items-center gap-1 shadow-xs"
                    >
                      <span>🎬</span> Nộp Video Review
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-[#EAE4D7] flex items-center justify-between max-w-sm">
                {(['PENDING', 'APPROVED', 'SHIPPED'] as SampleRequestStatus[]).map((s, i) => {
                  const idx = ['PENDING', 'APPROVED', 'SHIPPED'].indexOf(req.status);
                  const done = req.status !== 'REJECTED' && i <= idx;
                  return (
                    <div key={s} className="flex items-center gap-2 text-xs">
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-black ${
                          done ? 'bg-[#059669] text-white' : 'bg-[#EAE4D7] text-[#7D715E]'
                        }`}
                      >
                        {done ? '✓' : i + 1}
                      </div>
                      <span className={done ? 'font-bold text-[#1A1612]' : 'text-[#7D715E]'}>
                        {STATUS_LABEL[s]}
                      </span>
                      {i < 2 && <span className="w-8 h-0.5 bg-[#EAE4D7] mx-1" />}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <RequestModal onClose={() => setShowModal(false)} onSuccess={loadRequests} />
      )}

      {reviewModalReq && (
        <SubmitKolVideoModal
          isOpen={Boolean(reviewModalReq)}
          onClose={() => setReviewModalReq(null)}
          initialProductId={reviewModalReq.product.id}
          initialProductTitle={reviewModalReq.product.title}
          onSuccess={() => {
            setReviewModalReq(null);
            loadRequests();
          }}
        />
      )}
    </div>
  );
}

