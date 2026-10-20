import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
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
  Tag,
  Loader2,
  FolderOpen,
  Video,
  Clock,
  XCircle,
  Trash2,
  FileText,
} from 'lucide-react';
import { authService } from '../../services/auth.service';
import { couponService, type CouponItem } from '../../services/coupon.service';
import { mediaService, type MediaAsset } from '../../services/media.service';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Select } from '../../components/ui/Select';
import { SubmitKolVideoModal } from '../../components/media/SubmitKolVideoModal';
import { ConfirmModal } from '../../components/ui/ConfirmModal';
import { toast } from '../../utils/toast';
import { getSafeProductImageUrl } from '@/utils/marketplace.utils';
import { buildMediaPack, saveMediaPack, MEDIA_USAGE_GUIDE } from '../../utils/media-pack.utils';

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
    const refreshMedia = () => {
      void fetchMedia();
      setViewMode('MY_SUBMISSIONS');
    };
    window.addEventListener('scanms_media_updated', refreshMedia);
    return () => window.removeEventListener('scanms_media_updated', refreshMedia);
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
  const [packProgress, setPackProgress] = useState<{ completed: number; total: number } | null>(null);
  const packController = useRef<AbortController | null>(null);
  const [showUsageGuide, setShowUsageGuide] = useState(false);
  const usageDialog = useRef<HTMLDialogElement>(null);

  useEffect(() => () => packController.current?.abort(), []);

  useEffect(() => {
    const dialog = usageDialog.current;
    if (!showUsageGuide || !dialog) return;
    dialog.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      dialog.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [showUsageGuide]);

  const mySubmissionsCount = useMemo(() => {
    return mediaList.filter((m) => m.collaboratorId === currentUser?.id).length;
  }, [mediaList, currentUser?.id]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };


  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<MediaAsset | null>(null);

  const handleDeleteSubmission = (asset: MediaAsset) => {
    setAssetToDelete(asset);
  };

  const handleConfirmDeleteAsset = async () => {
    if (!assetToDelete) return;
    setDeletingId(assetToDelete.id);
    try {
      await mediaService.deleteMediaAsset(assetToDelete.id);
      setMediaList((prev) => prev.filter((x) => x.id !== assetToDelete.id));
      showToast('Đã xóa video review thành công!');
      if (previewAsset?.id === assetToDelete.id) {
        setPreviewAsset(null);
      }
      setAssetToDelete(null);
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

  const handleDownloadPack = async () => {
    if (packController.current || loading) return;
    if (!filteredMedia.length) {
      toast.info('Không có tài nguyên trong bộ lọc hiện tại.');
      return;
    }
    const controller = new AbortController();
    packController.current = controller;
    setPackProgress({ completed: 0, total: filteredMedia.length });
    try {
      const { blob, downloadedCount, linkedCount, failedCount } = await buildMediaPack(filteredMedia, {
        baseUrl: window.location.href,
        signal: controller.signal,
        onProgress: (completed, total) => setPackProgress({ completed, total }),
      });
      const date = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' });
      saveMediaPack(blob, `SCANMS-Tai-nguyen-${date}.zip`);
      if (linkedCount || failedCount) {
        toast.info(`Gói ZIP gồm ${downloadedCount} tệp và ${linkedCount} liên kết nguồn.${failedCount ? ` ${failedCount} tài nguyên có URL không hợp lệ.` : ''} Xem DANH-SACH.txt để biết chi tiết.`);
      } else {
        toast.success(`Đã chuẩn bị gói ZIP với ${downloadedCount} tài nguyên.`);
      }
    } catch (error) {
      if (!controller.signal.aborted) toast.error(error instanceof Error ? error.message : 'Không thể tạo gói tài nguyên. Vui lòng thử lại.');
    } finally {
      packController.current = null;
      if (!controller.signal.aborted) setPackProgress(null);
    }
  };


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
    <div className="kol-media-browser flex flex-col gap-6 text-left">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 bg-white text-[#1A1612] px-4 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 border border-[#EEDFC6]">
          <Sparkles className="w-4 h-4 text-[#B88E4F]" />
          <span>{toastMsg}</span>
        </div>
      )}

      <div className="kol-media-library-toolbar">
        {!isShopOrAdmin && (
          <div className="kol-media-tabs flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('ALL')}
              aria-pressed={viewMode === 'ALL'}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                viewMode === 'ALL'
                  ? 'bg-[#FBF5EB] text-[#1A1612] shadow-none'
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
              aria-pressed={viewMode === 'MY_SUBMISSIONS'}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                viewMode === 'MY_SUBMISSIONS'
                  ? 'bg-[#FBF5EB] text-[#1A1612] shadow-none'
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
        <div className="kol-media-heading-tools">
          <div className="kol-media-heading-meta">
            <span>Mạng lưới: <strong>Toàn sàn</strong></span>
            <span aria-hidden="true">•</span>
            <span>Tổng số: <strong>{filteredMedia.length} tài nguyên</strong></span>
          </div>
          <div className="kol-media-heading-actions">
            {!isShopOrAdmin && (
              <Button
                className="kol-media-submit"
                variant="gold"
                size="sm"
                icon={<Video className="w-3.5 h-3.5" />}
                onClick={() => setShowSubmitModal(true)}
              >
                Nộp video review
              </Button>
            )}
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
              className="kol-media-pack"
              type="button"
              variant="gold"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              loading={Boolean(packProgress)}
              disabled={loading || !filteredMedia.length}
              aria-busy={Boolean(packProgress)}
              title="Tải gói ZIP gồm tài nguyên theo bộ lọc hiện tại"
              onClick={() => void handleDownloadPack()}
            >
              {packProgress ? `Đang gom ${packProgress.completed}/${packProgress.total}…` : 'Tải trọn bộ Pack'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              type="button"
              aria-haspopup="dialog"
              aria-expanded={showUsageGuide}
              onClick={() => setShowUsageGuide(true)}
            >
              Quy định sử dụng
            </Button>
          </div>
        </div>
      </div>


      <Card className="kol-media-filters p-3.5 bg-white border border-[#EAE4D7] flex flex-wrap gap-3 items-center">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="w-4 h-4 text-[#7D715E] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm theo tiêu đề tài nguyên, tên sản phẩm hoặc gian hàng..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl pl-9 pr-3 py-2 text-xs text-[#1A1612] outline-none hover:border-[#B88E4F]/50 focus:border-[#B88E4F] transition"
          />
        </div>

        {availableProducts.length > 0 && (
          <Select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="w-56 text-xs font-semibold"
          >
            <option value="ALL">Tất cả sản phẩm ({availableProducts.length})</option>
            {availableProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </Select>
        )}

        <Select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="w-48 text-xs font-semibold"
        >
          <option value="ALL">Tất cả định dạng</option>
          <option value="IMAGE">Ảnh chụp / Banner</option>
          <option value="VIDEO">Video Review / Shorts</option>
          <option value="COPYWRITE_TEXT">Kịch bản bài viết mẫu</option>
        </Select>
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
        <div className="p-12 text-center bg-white border border-dashed border-[#EAE4D7] rounded-2xl flex flex-col items-center gap-3">
          {viewMode === 'MY_SUBMISSIONS' ? (
            <>
              <Video className="w-10 h-10 text-[#B88E4F]" />
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
              <FolderOpen className="w-10 h-10 text-[#B88E4F]/60" />
              <p className="text-sm font-bold text-[#1A1612] m-0">Không tìm thấy tài nguyên phù hợp</p>
              <p className="text-xs text-[#7D715E] m-0">
                Hãy thử thay đổi từ khóa tìm kiếm hoặc chọn tất cả danh mục sản phẩm.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="kol-media-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                ? 'bg-[#EBD08C]'
                : isVideo
                ? 'bg-rose-600'
                : 'bg-indigo-600';

            const displayImage =
              isVideo || isText
                ? 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=600&auto=format&fit=crop&q=80'
                : getSafeProductImageUrl(m.urlOrContent, m.title);

            return (
              <Card
                key={m.id}
                className="kol-media-card bg-white border border-[#EAE4D7] overflow-hidden flex flex-col justify-between"
              >

                <div
                  className="kol-media-preview relative h-52 bg-[#F3EFE6] cursor-pointer overflow-hidden group"
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
                        const target = e.currentTarget as HTMLImageElement;
                        if (!target.dataset.hasFallback) {
                          target.dataset.hasFallback = 'true';
                          target.src = getSafeProductImageUrl(null, m.title);
                        }
                      }}
                    />
                  )}


                  <div className="absolute top-2.5 left-2.5 flex gap-1.5">
                    <span className={`kol-media-type text-[10px] font-bold px-2 py-0.5 rounded-md text-white ${badgeBg}`}>
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


                <div className="kol-media-card-body p-4 flex flex-col gap-2.5 flex-1">
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
                        <span className="text-[#B88E4F] bg-[#FBF5EB] border border-[#EAE4D7] px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
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
                    src={getSafeProductImageUrl(previewAsset.urlOrContent, previewAsset.title)}
                    alt={previewAsset.title}
                    className="max-h-80 object-contain"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      if (!target.dataset.hasFallback) {
                        target.dataset.hasFallback = 'true';
                        target.src = getSafeProductImageUrl(null, previewAsset.title);
                      }
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
                    <Select
                      value={selectedCouponId}
                      onChange={(e) => setSelectedCouponId(e.target.value)}
                      className="w-52 text-xs font-bold"
                    >
                      {activeCoupons.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.displayCode} ({c.discountType === 'PERCENTAGE' ? `-${c.discountValue}%` : `-${Number(c.discountValue).toLocaleString('vi-VN')} ₫`})
                        </option>
                      ))}
                    </Select>
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

      {createPortal(
        <dialog
          ref={usageDialog}
          className="kol-media-usage-dialog"
          aria-labelledby="media-usage-title"
          aria-describedby="media-usage-subtitle"
          onCancel={(event) => { event.preventDefault(); setShowUsageGuide(false); }}
          onClose={() => setShowUsageGuide(false)}
          onClick={(event) => { if (event.target === event.currentTarget) setShowUsageGuide(false); }}
        >
          <div className="kol-media-usage-heading">
            <span className="kol-media-usage-icon"><FileText size={19} aria-hidden="true" /></span>
            <div>
              <h3 id="media-usage-title">Quy định sử dụng tài nguyên</h3>
              <p id="media-usage-subtitle">Hướng dẫn dành cho đối tác tiếp thị SCANMS.</p>
            </div>
            <button type="button" aria-label="Đóng hướng dẫn" onClick={() => setShowUsageGuide(false)}><X size={18} /></button>
          </div>
          <div className="kol-media-usage-content">
            {MEDIA_USAGE_GUIDE.map(({ title, content }, index) => (
              <section key={title}>
                <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <div><h4>{title}</h4><p>{content}</p></div>
              </section>
            ))}
          </div>
          <div className="kol-media-usage-footer"><Button variant="outline" size="sm" onClick={() => setShowUsageGuide(false)}>Đã hiểu</Button></div>
        </dialog>,
        document.body,
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

      {/* Modal Xác nhận Xóa video review chuẩn SCANMS */}
      <ConfirmModal
        isOpen={Boolean(assetToDelete)}
        onClose={() => !deletingId && setAssetToDelete(null)}
        onConfirm={handleConfirmDeleteAsset}
        isLoading={Boolean(deletingId)}
        title={assetToDelete?.status === 'PENDING' ? "Hủy nộp & Xóa video review" : "Xóa video review"}
        message={
          assetToDelete?.status === 'PENDING'
            ? `Bạn có chắc chắn muốn hủy nộp và xóa video review "${assetToDelete?.title}" không?`
            : `Bạn có chắc chắn muốn xóa video review "${assetToDelete?.title}" khỏi danh sách tài nguyên không?`
        }
        confirmText="Xác nhận xóa"
        variant="danger"
      />
    </div>
  );
}
