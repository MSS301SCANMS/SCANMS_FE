import { useState, useEffect, useMemo } from 'react';
import {
  Download,
  Copy,
  Check,
  Play,
  Search,
  Upload,
  Eye,
  X,
  Sparkles,
  FileCheck,
  ChevronDown,
  Tag,
  Loader2,
  FolderOpen,
  Video,
  Clock,
  XCircle,
  Trash2,
} from 'lucide-react';
import { authService } from '../../services/auth.service';
import { couponService, type CouponItem } from '../../services/coupon.service';
import { mediaService, type MediaAsset } from '../../services/media.service';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SubmitKolVideoModal } from '../../components/media/SubmitKolVideoModal';
import { toast } from '../../utils/toast';

export default function MediaHubBrowserPage() {
  const currentUser = authService.getCurrentUser();
  const userName = currentUser?.fullName || 'Nhà Sáng Tạo';
  const isShopOrAdmin =
    currentUser?.role === 'SHOP_MANAGER' ||
    currentUser?.role === 'SYSTEM_ADMIN' ||
    currentUser?.role === 'SYSTEM_MANAGER';


  const [activeCoupons, setActiveCoupons] = useState<CouponItem[]>([]);
  const [selectedCouponId, setSelectedCouponId] = useState<string>('');

  useEffect(() => {
    if (!isShopOrAdmin) {
      couponService
        .getKolCoupons({ status: 'ACTIVE' })
        .then((res) => {
          const list = res.coupons || [];
          setActiveCoupons(list);
          if (list.length > 0) {
            setSelectedCouponId(list[0].id);
          }
        })
        .catch(() => {
          setActiveCoupons([]);
        });
    }
  }, [isShopOrAdmin]);

  const selectedCoupon = activeCoupons.find((c) => c.id === selectedCouponId) || activeCoupons[0];
  const couponCode = selectedCoupon?.displayCode;
  const discountText = selectedCoupon
    ? selectedCoupon.discountType === 'PERCENTAGE'
      ? `giảm thêm ${selectedCoupon.discountValue}%`
      : `giảm thêm ${Number(selectedCoupon.discountValue).toLocaleString('vi-VN')} ₫`
    : '';


  const [mediaList, setMediaList] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchMedia = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res: any = await mediaService.getMediaAssets({ limit: 100 });
      const items = res?.items || (Array.isArray(res) ? res : []);
      setMediaList(items);
    } catch {
      setFetchError('Không thể tải danh sách tài nguyên lúc này. Vui lòng thử lại.');
      setMediaList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchMedia();
  }, []);

  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('ALL');
  const [selectedType, setSelectedType] = useState('ALL');
  const [viewMode, setViewMode] = useState<'ALL' | 'MY_SUBMISSIONS'>('ALL');
  const [showSubmitModal, setShowSubmitModal] = useState(() => {
    if (typeof window !== 'undefined') {
      const sp = new URLSearchParams(window.location.search);
      return sp.get('action') === 'submit-review' || sp.get('openSubmit') === 'true';
    }
    return false;
  });
  const [previewAsset, setPreviewAsset] = useState<any | null>(null);
  const [activeCaptionTab, setActiveCaptionTab] = useState<'short' | 'review' | 'offer' | 'livestream'>('review');
  const [copiedCaption, setCopiedCaption] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const mySubmissionsCount = useMemo(() => {
    return mediaList.filter((m) => m.collaboratorId === currentUser?.id).length;
  }, [mediaList, currentUser?.id]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };


  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDeleteSubmission = async (asset: MediaAsset) => {
    const isPending = asset.status === 'PENDING';
    const confirmMsg = isPending
      ? `Bạn có chắc chắn muốn hủy nộp và xóa video review "${asset.title}" không?`
      : `Bạn có chắc chắn muốn xóa video review "${asset.title}" khỏi danh sách không?`;

    if (!window.confirm(confirmMsg)) return;

    setDeletingId(asset.id);
    try {
      await mediaService.deleteMediaAsset(asset.id);
      setMediaList((prev) => prev.filter((x) => x.id !== asset.id));
      showToast('Đã xóa video review thành công!');
      if (previewAsset?.id === asset.id) {
        setPreviewAsset(null);
      }
    } catch (err: any) {
      showToast(
        err?.response?.data?.message || err?.message || 'Không thể xóa video lúc này. Vui lòng thử lại.'
      );
    } finally {
      setDeletingId(null);
    }
  };


  const availableProducts = useMemo(() => {
    const map = new Map<string, string>();
    for (const m of mediaList) {
      if (m.product?.id && m.product?.title) {
        map.set(m.product.id, m.product.title);
      }
    }
    return Array.from(map.entries()).map(([id, title]) => ({ id, title }));
  }, [mediaList]);


  const filteredMedia = useMemo(() => {
    return mediaList.filter((m) => {
      if (viewMode === 'MY_SUBMISSIONS' && m.collaboratorId !== currentUser?.id) {
        return false;
      }

      const titleMatch =
        m.title.toLowerCase().includes(search.toLowerCase()) ||
        (m.product?.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.store?.name || '').toLowerCase().includes(search.toLowerCase());

      const productMatch =
        selectedProduct === 'ALL' || m.productId === selectedProduct;

      const typeMatch =
        selectedType === 'ALL' || m.assetType === selectedType;

      return titleMatch && productMatch && typeMatch;
    });
  }, [mediaList, viewMode, currentUser?.id, search, selectedProduct, selectedType]);


  const targetProductName = previewAsset?.product?.title || 'Sản phẩm chính hãng';
  const targetStoreName = previewAsset?.store?.name || 'Gian hàng đối tác';
  const targetProductSlug = previewAsset?.product?.sku || previewAsset?.productId || 'san-pham';

  const captionTemplates = {
    short: couponCode
      ? `Gợi ý chăm sóc & tiêu dùng thông minh cùng ${targetProductName} ✨\n\nSản phẩm chính hãng từ ${targetStoreName}, đạt chuẩn chất lượng sàn SCANMS.\n\n👉 Đặt mua chính hãng qua link: https://scanms.vn/products/${targetProductSlug}\n🎁 Nhập ngay mã ${couponCode} để ${discountText}!\n\n#SCANMS #${targetStoreName.replace(/\s+/g, '')} #ChinhHang #Affiliate`
      : `Gợi ý chăm sóc & tiêu dùng thông minh cùng ${targetProductName} ✨\n\nSản phẩm chính hãng từ ${targetStoreName}, đạt chuẩn chất lượng sàn SCANMS.\n\n👉 Đặt mua chính hãng qua link: https://scanms.vn/products/${targetProductSlug}\n\n#SCANMS #${targetStoreName.replace(/\s+/g, '')} #ChinhHang #Affiliate`,
    review: couponCode
      ? `[GÓC REVIEW TỪ ${userName.toUpperCase()}]\nTrải nghiệm thực tế khi sử dụng ${targetProductName}:\n\n💧 Đánh giá: Sản phẩm chất lượng cao, đóng gói cẩn thận từ ${targetStoreName}.\n🎯 Cảm nhận sau khi dùng: Hoàn toàn đúng như cam kết, an tâm sử dụng hàng ngày.\n\n🛒 Link mua hàng chính hãng: https://scanms.vn/products/${targetProductSlug}\n🏷️ Mã ưu đãi độc quyền: ${couponCode} (${discountText})\n\n#SCANMS #Review #${targetStoreName.replace(/\s+/g, '')}`
      : `[GÓC REVIEW TỪ ${userName.toUpperCase()}]\nTrải nghiệm thực tế khi sử dụng ${targetProductName}:\n\n💧 Đánh giá: Sản phẩm chất lượng cao, đóng gói cẩn thận từ ${targetStoreName}.\n🎯 Cảm nhận sau khi dùng: Hoàn toàn đúng như cam kết, an tâm sử dụng hàng ngày.\n\n🛒 Link mua hàng chính hãng: https://scanms.vn/products/${targetProductSlug}\n\n#SCANMS #Review #${targetStoreName.replace(/\s+/g, '')}`,
    offer: couponCode
      ? `🎁 ƯU ĐÃI ĐẶC BIỆT DÀNH CHO CỘNG ĐỒNG ${userName.toUpperCase()}!\n\nChương trình Flash Sale độc quyền cho ${targetProductName}:\n⚡ Ưu đãi chính hãng từ ${targetStoreName}\n⚡ Nhập mã ${couponCode} tại bước thanh toán để ${discountText}!\n\n👉 Mua ngay tại: https://scanms.vn/products/${targetProductSlug}`
      : `🎁 ƯU ĐÃI ĐẶC BIỆT DÀNH CHO CỘNG ĐỒNG ${userName.toUpperCase()}!\n\nChương trình ưu đãi độc quyền cho ${targetProductName} từ ${targetStoreName}.\n\n👉 Mua ngay tại: https://scanms.vn/products/${targetProductSlug}`,
    livestream: couponCode
      ? `🌟 GỢI Ý KỊCH BẢN CHIA SẺ TRÊN LIVESTREAM:\n\n1. Mở đầu: Cầm sản phẩm ${targetProductName}, giới thiệu thương hiệu ${targetStoreName}.\n2. Trải nghiệm: Chia sẻ cảm nhận chân thật về tính năng và nguồn gốc xuất xứ.\n3. Kêu gọi: Hướng dẫn người xem bấm vào link ghim, nhập mã ${couponCode} để nhận ưu đãi (${discountText})!`
      : `🌟 GỢI Ý KỊCH BẢN CHIA SẺ TRÊN LIVESTREAM:\n\n1. Mở đầu: Cầm sản phẩm ${targetProductName}, giới thiệu thương hiệu ${targetStoreName}.\n2. Trải nghiệm: Chia sẻ cảm nhận chân thật về tính năng và nguồn gốc xuất xứ.\n3. Kêu gọi: Hướng dẫn người xem bấm vào link ghim để nhận ưu đãi chính hãng!`,
  };

  const handleCopyCaption = () => {
    navigator.clipboard.writeText(captionTemplates[activeCaptionTab]);
    setCopiedCaption(true);
    showToast('Đã sao chép kịch bản tiếp thị vào Clipboard!');
    setTimeout(() => setCopiedCaption(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6 text-left">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-[#231D15] text-white px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#B88E4F]" />
          <span>{toastMsg}</span>
        </div>
      )}


      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1A1612] tracking-tight m-0">
            Kho nội dung bán hàng (Media Hub)
          </h1>
          <p className="text-xs sm:text-sm text-[#7D715E] mt-1 m-0 max-w-3xl">
            Tài nguyên hình ảnh, video review và kịch bản tiếp thị do các gian hàng đối tác cung cấp, sẵn sàng quảng bá trên mạng xã hội chỉ với 1 cú click.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {!isShopOrAdmin && (
            <Button
              variant="gold"
              size="sm"
              icon={<Video className="w-3.5 h-3.5" />}
              onClick={() => setShowSubmitModal(true)}
            >
              Nộp video review (FR-15)
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.assign('/products/serum-vitamin-c')}
          >
            Xem Landing Page FR-15
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.assign('/#media')}
          >
            Quay lại Bản vẽ
          </Button>
          {isShopOrAdmin && (
            <Button
              variant="outline"
              size="sm"
              icon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => toast.info('Vui lòng vào Quản lý sản phẩm > Chi tiết để tải lên hình ảnh hoặc video cho sản phẩm của bạn.')}
            >
              Tải tài nguyên mới
            </Button>
          )}
          <Button
            variant="gold"
            size="sm"
            icon={<Download className="w-3.5 h-3.5" />}
            onClick={() => toast.info(`Đang chuẩn bị gói tài nguyên (${filteredMedia.length} tệp)...`)}
          >
            Tải trọn bộ Pack
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.info(
                'Quy định sử dụng: Tài nguyên được cấp quyền thương mại cho các Nhà sáng tạo & Đối tác tiếp thị thuộc mạng lưới SCANMS để quảng bá sản phẩm chính hãng.'
              )
            }
          >
            Quy định sử dụng
          </Button>
        </div>
      </header>


      <Card className="p-4 bg-[#FAF8F5] border border-[#EAE4D7] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#EEDFC6] text-[#B88E4F] font-black flex items-center justify-center text-lg shadow-xs">
            S
          </div>
          <div>
            <div className="flex items-center gap-2">
              <strong className="text-sm sm:text-base font-extrabold text-[#1A1612]">
                Kho tài nguyên tiếp thị đa gian hàng SCANMS
              </strong>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6]">
                Dữ liệu chính hãng đã kiểm duyệt
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-[#7D715E]">
          <span>Mạng lưới: <strong className="text-[#1A1612]">Toàn sàn</strong></span>
          <span>•</span>
          <span>Tổng số: <strong className="text-[#B88E4F]">{filteredMedia.length} tài nguyên</strong></span>
        </div>
      </Card>


      {!isShopOrAdmin && (
        <div className="flex items-center gap-2 border-b border-[#EAE4D7] pb-2">
          <button
            type="button"
            onClick={() => setViewMode('ALL')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              viewMode === 'ALL'
                ? 'bg-[#C59B58] text-white shadow-xs'
                : 'bg-[#F3EFE6] text-[#7D715E] hover:text-[#1A1612] hover:bg-[#EAE4D7]'
            }`}
          >
            <span>Kho tài nguyên sàn</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/10">
              {mediaList.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('MY_SUBMISSIONS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
              viewMode === 'MY_SUBMISSIONS'
                ? 'bg-[#C59B58] text-white shadow-xs'
                : 'bg-[#F3EFE6] text-[#7D715E] hover:text-[#1A1612] hover:bg-[#EAE4D7]'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Video review của tôi</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                viewMode === 'MY_SUBMISSIONS'
                  ? 'bg-black/10 text-white'
                  : 'bg-[#EAE4D7] text-[#1A1612]'
              }`}
            >
              {mySubmissionsCount}
            </span>
          </button>
        </div>
      )}


      <Card className="p-3.5 bg-white border border-[#EAE4D7] flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-[#A49B8B] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề tài nguyên, tên sản phẩm hoặc gian hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1A1612] outline-none hover:border-[#B88E4F]/50 focus:border-[#B88E4F] transition"
          />
        </div>

        {availableProducts.length > 0 && (
          <div className="relative">
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="bg-[#F3EFE6] border border-[#EAE4D7] rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-[#1A1612] appearance-none outline-none cursor-pointer hover:bg-[#EAE4D7] transition"
            >
              <option value="ALL">Tất cả sản phẩm ({availableProducts.length})</option>
              {availableProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[#7D715E] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        )}

        <div className="relative">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-[#F3EFE6] border border-[#EAE4D7] rounded-xl pl-3 pr-8 py-2 text-xs font-semibold text-[#1A1612] appearance-none outline-none cursor-pointer hover:bg-[#EAE4D7] transition"
          >
            <option value="ALL">Tất cả định dạng</option>
            <option value="IMAGE">Ảnh chụp / Banner</option>
            <option value="VIDEO">Video Review / Shorts</option>
            <option value="COPYWRITE_TEXT">Kịch bản bài viết mẫu</option>
          </select>
          <ChevronDown className="w-3.5 h-3.5 text-[#7D715E] absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>
      </Card>


      {loading ? (
        <div className="py-16 text-center text-[#7D715E] flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-[#B88E4F]" />
          <span className="text-xs font-semibold">Đang tải tài nguyên Media Hub từ hệ thống...</span>
        </div>
      ) : fetchError ? (
        <div className="p-8 text-center bg-white border border-red-200 rounded-2xl">
          <p className="text-sm font-semibold text-red-600 mb-3">{fetchError}</p>
          <Button variant="outline" size="sm" onClick={() => void fetchMedia()}>
            Thử tải lại
          </Button>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="p-12 text-center bg-white border border-dashed border-[#EEDFC6] rounded-2xl flex flex-col items-center gap-3">
          {viewMode === 'MY_SUBMISSIONS' ? (
            <>
              <Video className="w-10 h-10 text-[#C59B58]" />
              <p className="text-sm font-bold text-[#1A1612] m-0">Bạn chưa nộp video review nào</p>
              <p className="text-xs text-[#7D715E] m-0 max-w-md">
                Gửi video review sản phẩm để được Shop kiểm duyệt và ưu tiên hiển thị ngay trên Landing Page bán hàng công khai.
              </p>
              <Button
                variant="gold"
                size="sm"
                icon={<Video className="w-3.5 h-3.5" />}
                onClick={() => setShowSubmitModal(true)}
              >
                Nộp video review ngay
              </Button>
            </>
          ) : (
            <>
              <FolderOpen className="w-10 h-10 text-[#C59B58]/60" />
              <p className="text-sm font-bold text-[#1A1612] m-0">Không tìm thấy tài nguyên phù hợp</p>
              <p className="text-xs text-[#7D715E] m-0">
                Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn tất cả danh mục sản phẩm.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredMedia.map((m) => {
            const isVideo = m.assetType === 'VIDEO';
            const isText = m.assetType === 'COPYWRITE_TEXT';
            const displayBadge =
              m.assetType === 'IMAGE'
                ? 'Ảnh PNG/JPG'
                : isVideo
                ? 'Video MP4'
                : 'Kịch bản mẫu';
            const badgeBg =
              m.assetType === 'IMAGE'
                ? 'bg-[#B88E4F]'
                : isVideo
                ? 'bg-rose-600'
                : 'bg-indigo-600';

            const displayImage =
              isVideo || isText
                ? '/assets/product-placeholder.svg'
                : m.urlOrContent || '/assets/product-placeholder.svg';

            return (
              <Card
                key={m.id}
                className="bg-white border border-[#EAE4D7] overflow-hidden flex flex-col justify-between"
              >

                <div
                  className="relative h-52 bg-[#F3EFE6] cursor-pointer overflow-hidden group"
                  onClick={() => setPreviewAsset(m)}
                >
                  {isText ? (
                    <div className="w-full h-full p-4 flex flex-col justify-center items-center text-center bg-[#FAF8F5]">
                      <span className="text-xs font-bold text-[#B88E4F] mb-1">Mẫu kịch bản bài viết</span>
                      <p className="text-xs text-[#7D715E] line-clamp-4 leading-relaxed italic m-0">
                        "{m.urlOrContent}"
                      </p>
                    </div>
                  ) : (
                    <img
                      src={displayImage}
                      alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      onError={(e) => {
                        e.currentTarget.src = '/assets/product-placeholder.svg';
                      }}
                    />
                  )}


                  <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md text-white ${badgeBg}`}>
                      {displayBadge}
                    </span>
                  </div>


                  {m.collaboratorId === currentUser?.id && (
                    <button
                      type="button"
                      title={m.status === 'PENDING' ? 'Hủy nộp & Xóa video này' : 'Xóa video này'}
                      onClick={(e) => {
                        e.stopPropagation();
                        void handleDeleteSubmission(m);
                      }}
                      disabled={deletingId === m.id}
                      className="absolute top-2.5 right-2.5 w-7 h-7 rounded-lg bg-white/90 hover:bg-rose-50 text-rose-600 hover:text-rose-700 flex items-center justify-center shadow-sm transition border border-rose-200 cursor-pointer z-10"
                    >
                      {deletingId === m.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}


                  {isVideo && (
                    <div className="absolute inset-0 grid place-items-center bg-black/20 group-hover:bg-black/30 transition">
                      <div className="w-12 h-12 rounded-full bg-white/90 text-[#1A1612] grid place-items-center shadow-lg">
                        <Play className="w-5 h-5 fill-current ml-0.5" />
                      </div>
                    </div>
                  )}
                </div>


                <div className="p-4 flex flex-col gap-2.5 flex-1">
                  <h3 className="text-xs sm:text-sm font-bold text-[#1A1612] m-0 line-clamp-2 leading-snug">
                    {m.title}
                  </h3>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {m.product?.title && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[#FAF8F5] text-[#B88E4F] border border-[#EAE4D7] line-clamp-1">
                        {m.product.title}
                      </span>
                    )}
                    {m.store?.name && (
                      <span className="text-[10px] font-medium text-[#7D715E]">
                        🏪 {m.store.name}
                      </span>
                    )}
                  </div>

                  <div className="flex justify-between items-center text-[11px] text-[#7D715E] pt-2 border-t border-[#EAE4D7] mt-auto">
                    <span>Cập nhật: {new Date(m.createdAt).toLocaleDateString('vi-VN')}</span>
                    {m.collaboratorId === currentUser?.id ? (
                      m.status === 'PENDING' ? (
                        <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                          <Clock className="w-3 h-3 text-amber-600" /> Chờ duyệt
                        </span>
                      ) : m.status === 'APPROVED' ? (
                        <span className="text-[#B88E4F] bg-[#FBF5EB] border border-[#EEDFC6] px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                          <FileCheck className="w-3 h-3 text-[#B88E4F]" /> Đã duyệt
                        </span>
                      ) : m.status === 'REJECTED' ? (
                        <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                          <XCircle className="w-3 h-3 text-rose-600" /> Từ chối
                        </span>
                      ) : (
                        <span className="text-gray-600 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                          Đã ẩn
                        </span>
                      )
                    ) : (
                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                        <FileCheck className="w-3 h-3" /> Đã duyệt
                      </span>
                    )}
                  </div>

                  {m.collaboratorId === currentUser?.id && m.status === 'REJECTED' && m.rejectionReason && (
                    <div className="p-2 bg-rose-50 border border-rose-200 rounded-lg text-[11px] text-rose-800 leading-snug">
                      <strong className="block font-bold mb-0.5">Lý do Shop từ chối:</strong>
                      <span>{m.rejectionReason}</span>
                    </div>
                  )}


                  <div className="flex flex-col gap-1.5 pt-1">
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        icon={<Eye className="w-3 h-3" />}
                        onClick={() => setPreviewAsset(m)}
                      >
                        Xem trước
                      </Button>
                      <Button
                        variant="gold"
                        size="sm"
                        icon={<Download className="w-3 h-3" />}
                        onClick={() => {
                          if (isText) {
                            navigator.clipboard.writeText(m.urlOrContent);
                            showToast('Đã sao chép nội dung kịch bản!');
                          } else {
                            window.open(m.urlOrContent, '_blank');
                            showToast(`Đang tải tệp: ${m.title}`);
                          }
                        }}
                      >
                        {isText ? 'Sao chép' : 'Tải xuống'}
                      </Button>
                    </div>


                    {m.collaboratorId === currentUser?.id && (
                      <button
                        type="button"
                        onClick={() => void handleDeleteSubmission(m)}
                        disabled={deletingId === m.id}
                        className="w-full py-1.5 px-3 rounded-xl border border-rose-200 bg-rose-50/70 hover:bg-rose-100 text-rose-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-50 active:scale-[0.98]"
                      >
                        {deletingId === m.id ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang xóa...
                          </>
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            {m.status === 'PENDING' ? 'Hủy nộp & Xóa video' : 'Xóa video này'}
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}


      {previewAsset && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-[#EAE4D7] shadow-2xl">
            <div className="flex justify-between items-center p-4 sm:p-5 border-b border-[#EAE4D7]">
              <div>
                <h3 className="text-base font-extrabold text-[#1A1612] m-0">
                  {previewAsset.title}
                </h3>
                <span className="text-xs text-[#7D715E]">
                  {previewAsset.product?.title || 'Tài nguyên tiếp thị'} • {previewAsset.store?.name || 'SCANMS'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewAsset(null)}
                className="text-[#7D715E] hover:text-[#1A1612] p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-5 p-5 sm:p-6">

              <div className="md:col-span-5 rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-80">
                {previewAsset.assetType === 'VIDEO' ? (
                  <video
                    src={previewAsset.urlOrContent}
                    controls
                    className="max-h-80 w-full object-contain"
                  />
                ) : previewAsset.assetType === 'COPYWRITE_TEXT' ? (
                  <div className="p-4 bg-[#FAF8F5] text-xs text-[#1A1612] max-h-80 overflow-y-auto w-full whitespace-pre-wrap leading-relaxed">
                    {previewAsset.urlOrContent}
                  </div>
                ) : (
                  <img
                    src={previewAsset.urlOrContent || '/assets/product-placeholder.svg'}
                    alt={previewAsset.title}
                    className="max-h-80 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = '/assets/product-placeholder.svg';
                    }}
                  />
                )}
              </div>


              <div className="md:col-span-7 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <strong className="text-xs font-bold text-[#1A1612]">
                    Mẫu Caption Tiếp Thị Chuẩn SEO
                  </strong>
                  <Button
                    variant="gold"
                    size="sm"
                    icon={copiedCaption ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    onClick={handleCopyCaption}
                  >
                    {copiedCaption ? 'Đã sao chép' : 'Sao chép Caption'}
                  </Button>
                </div>


                <div className="flex gap-1.5 p-1 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7]">
                  {[
                    { id: 'review', label: 'Review chi tiết' },
                    { id: 'short', label: 'Ngắn gọn' },
                    { id: 'offer', label: 'Ưu đãi Sale' },
                    { id: 'livestream', label: 'Kịch bản Live' },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveCaptionTab(tab.id as any)}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                        activeCaptionTab === tab.id
                          ? 'bg-white text-[#B88E4F] shadow-2xs border border-[#EAE4D7]'
                          : 'text-[#7D715E] hover:text-[#1A1612]'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>


                {activeCoupons.length > 0 ? (
                  <div className="flex items-center justify-between text-xs bg-[#FAF8F5] px-3 py-2 rounded-xl border border-[#EAE4D7]">
                    <span className="flex items-center gap-1.5 font-bold text-[#1A1612]">
                      <Tag className="w-3.5 h-3.5 text-[#B88E4F]" />
                      Mã ưu đãi áp dụng trong kịch bản:
                    </span>
                    <select
                      value={selectedCouponId}
                      onChange={(e) => setSelectedCouponId(e.target.value)}
                      className="bg-white border border-[#EAE4D7] rounded-lg px-2 py-1 text-xs font-bold text-[#B88E4F] outline-none cursor-pointer"
                    >
                      {activeCoupons.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.displayCode} ({c.discountType === 'PERCENTAGE' ? `-${c.discountValue}%` : `-${Number(c.discountValue).toLocaleString('vi-VN')} ₫`})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="text-[11px] text-[#7D715E] bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#EAE4D7]">
                    ℹ️ Chưa có mã giảm giá đang kích hoạt. Kịch bản đang tạo sẵn theo link tiếp thị chuẩn.
                  </div>
                )}


                <textarea
                  readOnly
                  value={captionTemplates[activeCaptionTab]}
                  rows={8}
                  className="w-full p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] leading-relaxed resize-none outline-none font-sans"
                />

                <div className="flex justify-end gap-2 pt-1">
                  {previewAsset.collaboratorId === currentUser?.id && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-rose-300 text-rose-700 hover:bg-rose-50 hover:border-rose-400"
                      icon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
                      onClick={() => {
                        void handleDeleteSubmission(previewAsset);
                      }}
                    >
                      {previewAsset.status === 'PENDING' ? 'Hủy nộp & Xóa' : 'Xóa video'}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPreviewAsset(null)}
                  >
                    Đóng
                  </Button>
                  <Button
                    variant="gold"
                    size="sm"
                    icon={<Download className="w-3.5 h-3.5" />}
                    onClick={() => {
                      if (previewAsset.assetType === 'COPYWRITE_TEXT') {
                        navigator.clipboard.writeText(previewAsset.urlOrContent);
                        showToast('Đã sao chép nội dung kịch bản!');
                      } else {
                        window.open(previewAsset.urlOrContent, '_blank');
                        showToast(`Đã tải xuống: ${previewAsset.title}`);
                      }
                      setPreviewAsset(null);
                    }}
                  >
                    {previewAsset.assetType === 'COPYWRITE_TEXT' ? 'Sao chép' : 'Tải tài nguyên'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <SubmitKolVideoModal
        isOpen={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onSuccess={() => {
          void fetchMedia();
          setViewMode('MY_SUBMISSIONS');
          showToast('Nộp video review thành công! Đang chờ Shop phê duyệt.');
        }}
      />
    </div>
  );
}
