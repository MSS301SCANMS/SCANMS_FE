import { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Video,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Package,
  Loader2,
  Upload,
  Trash2,
  ChevronDown,
  Search,
  Check,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { mediaService } from '../../services/media.service';
import { referralLinksService, type EligibleProduct } from '../../services/referral-links.service';
import api from '../../services/api';

const ALLOWED_DOMAINS = [
  'scanms.vn',
  'cdn.scanms.vn',
  'cloudinary.com',
  'res.cloudinary.com',
  'youtube.com',
  'youtu.be',
  'facebook.com',
  'fb.watch',
  'instagram.com',
  'tiktok.com',
  'vimeo.com',
  'supabase.co',
  'storage.googleapis.com',
  'amazonaws.com',
];

export interface SubmitKolVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialProductId?: string;
  initialProductTitle?: string;
  sampleRequestId?: string;
  onSuccess?: (newAsset: any) => void;
}

export function SubmitKolVideoModal({
  isOpen,
  onClose,
  initialProductId,
  initialProductTitle,
  sampleRequestId,
  onSuccess,
}: SubmitKolVideoModalProps) {
  const [products, setProducts] = useState<EligibleProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>(initialProductId || '');
  const [title, setTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  const [posterPreview, setPosterPreview] = useState<string | null>(null);
  const [posterFileName, setPosterFileName] = useState<string | null>(null);
  const [isUploadingPoster, setIsUploadingPoster] = useState(false);
  const [posterUploadError, setPosterUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileInputRef = useRef<HTMLInputElement>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [videoFileName, setVideoFileName] = useState<string | null>(null);
  const [videoFileSize, setVideoFileSize] = useState<string | null>(null);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoUploadError, setVideoUploadError] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isCampaignVideo, setIsCampaignVideo] = useState(false);
  const [campaignId, setCampaignId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const productDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(e.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    };
    if (isProductDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isProductDropdownOpen]);

  const filteredProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return products;
    const q = productSearchQuery.toLowerCase();
    return products.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.sku?.toLowerCase().includes(q) ||
        p.store?.name?.toLowerCase().includes(q)
    );
  }, [products, productSearchQuery]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.id === selectedProductId),
    [products, selectedProductId]
  );


  const processSelectedVideoFile = async (file: File) => {
    if (!file) return;

    const validVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'];
    if (!validVideoTypes.includes(file.type) && !file.name.match(/\.(mp4|mov|webm|avi)$/i)) {
      setVideoUploadError('Định dạng không hợp lệ. Vui lòng chọn file video MP4, WEBM hoặc MOV.');
      return;
    }

    const maxVideoSize = 100 * 1024 * 1024;
    if (file.size > maxVideoSize) {
      setVideoUploadError('Dung lượng video vượt quá 100 MB. Vui lòng nén video hoặc chọn file nhỏ hơn.');
      return;
    }

    setVideoUploadError(null);
    setVideoFileName(file.name);
    setVideoFileSize((file.size / (1024 * 1024)).toFixed(1) + ' MB');


    const localVideoUrl = URL.createObjectURL(file);
    setVideoPreview(localVideoUrl);

    setIsUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res: any = await api.post('/upload/video?folder=scanms/kol-reviews', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const result = res?.data || res;
      const uploadedUrl = result?.secureUrl || result?.url;
      if (!uploadedUrl) {
        throw new Error('Máy chủ không trả về URL video');
      }
      setVideoUrl(uploadedUrl);
    } catch (err: any) {
      console.error('Upload video error:', err);

      setVideoUrl(localVideoUrl);
      setVideoUploadError(
        'Đã lưu video để kiểm thử.'
      );
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleRemoveVideo = () => {
    if (videoPreview && videoPreview.startsWith('blob:')) {
      URL.revokeObjectURL(videoPreview);
    }
    setVideoPreview(null);
    setVideoFileName(null);
    setVideoFileSize(null);
    setVideoUrl('');
    setVideoUploadError(null);
    if (videoFileInputRef.current) {
      videoFileInputRef.current.value = '';
    }
  };


  const processSelectedFile = async (file: File) => {
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setPosterUploadError('Định dạng không hợp lệ. Chỉ chấp nhận ảnh JPG, PNG, WEBP hoặc GIF.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      setPosterUploadError('Dung lượng ảnh vượt quá 5 MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }

    setPosterUploadError(null);
    setPosterFileName(file.name);


    const localUrl = URL.createObjectURL(file);
    setPosterPreview(localUrl);


    setIsUploadingPoster(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res: any = await api.post('/upload/image?folder=scanms/kol-reviews', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const result = res?.data || res;
      const uploadedUrl = result?.secureUrl || result?.url;
      if (!uploadedUrl) {
        throw new Error('Máy chủ không trả về URL ảnh');
      }
      setPosterUrl(uploadedUrl);
    } catch (err: any) {
      console.error('Upload poster error:', err);
      setPosterUploadError(
        err?.response?.data?.message || err?.message || 'Tải ảnh lên máy chủ thất bại'
      );
    } finally {
      setIsUploadingPoster(false);
    }
  };

  const handlePosterFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleRemovePoster = () => {
    if (posterPreview && posterPreview.startsWith('blob:')) {
      URL.revokeObjectURL(posterPreview);
    }
    setPosterPreview(null);
    setPosterFileName(null);
    setPosterUrl('');
    setPosterUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };


  useEffect(() => {
    if (!isOpen) return;


    setTitle((prev) => prev || 'Trải nghiệm thực tế Serum Vitamin C sau 14 ngày - Da sáng rõ rệt');
    setCaption((prev) => prev || 'Serum mỏng nhẹ thấm nhanh, mùi cam dễ chịu, hiệu quả làm đều màu da rõ rệt sau 2 tuần.');

    if (initialProductId) {
      setSelectedProductId(initialProductId);
    }

    setLoadingProducts(true);
    referralLinksService
      .getEligibleProducts()
      .then((items) => {
        setProducts(items || []);
        if (!initialProductId && items && items.length > 0) {
          setSelectedProductId(items[0].id);
        }
      })
      .catch(() => {
        setProducts([]);
      })
      .finally(() => {
        setLoadingProducts(false);
      });
  }, [isOpen, initialProductId]);

  if (!isOpen) return null;


  const isDomainAllowed = (urlStr: string): boolean => {
    if (!urlStr.trim()) return false;
    if (urlStr.startsWith('blob:') || urlStr.startsWith('/')) return true;
    try {
      const parsed = new URL(urlStr.trim());
      const host = parsed.hostname.toLowerCase();
      if (host === 'localhost' || host === '127.0.0.1') return true;
      return ALLOWED_DOMAINS.some((d) => host === d || host.endsWith('.' + d));
    } catch {
      return false;
    }
  };

  const isUrlValid = sampleRequestId
    ? videoUrl.startsWith('https://') && isDomainAllowed(videoUrl)
    : isDomainAllowed(videoUrl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!selectedProductId) {
      setErrorMsg('Vui lòng chọn sản phẩm bạn muốn nộp video review.');
      return;
    }
    if (isUploadingPoster) {
      setErrorMsg('Ảnh bìa đang được tải lên, vui lòng đợi trong giây lát...');
      return;
    }
    if (!title.trim()) {
      setErrorMsg('Vui lòng nhập tiêu đề video review.');
      return;
    }
    if (!videoUrl.trim()) {
      setErrorMsg('Vui lòng cung cấp URL video review.');
      return;
    }
    if (!isUrlValid) {
      setErrorMsg(
        'Đường dẫn video phải thuộc các nền tảng được hỗ trợ (TikTok, YouTube, Cloudinary, Vimeo, CDN SCANMS).',
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload: any = sampleRequestId
        ? { title: title.trim(), videoUrl: videoUrl.trim(), caption: caption.trim() }
        : { productId: selectedProductId, title: title.trim(), videoUrl: videoUrl.trim() };

      if (posterUrl.trim()) {
        payload.posterUrl = posterUrl.trim();
      }
      if (caption.trim()) {
        payload.caption = caption.trim();
      }
      if (isCampaignVideo && campaignId.trim()) {
        payload.campaignId = campaignId.trim();
        payload.requiresCampaignParticipation = true;
      }

      const res = sampleRequestId
        ? await api.post(`/sample-requests/${sampleRequestId}/video`, payload)
        : await mediaService.submitKolVideo(payload);

      setSuccessMsg(
        res?.message ||
          'Video review đã được nộp thành công! Gian hàng sẽ kiểm duyệt trước khi hiển thị trên landing page.',
      );

      if (onSuccess) {
        onSuccess(res?.asset || res);
      }

      setTimeout(() => {
        onClose();

        setTitle('');
        setVideoUrl('');
        setVideoPreview(null);
        setVideoFileName(null);
        setVideoFileSize(null);
        setPosterUrl('');
        setPosterPreview(null);
        setPosterFileName(null);
        setIsUploadingPoster(false);
        setIsUploadingVideo(false);
        setPosterUploadError(null);
        setVideoUploadError(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        if (videoFileInputRef.current) videoFileInputRef.current.value = '';
        setCaption('');
        setIsCampaignVideo(false);
        setCampaignId('');
        setSuccessMsg(null);
      }, 1800);
    } catch (err: any) {
      setErrorMsg(
        err?.response?.data?.message ||
          'Không thể nộp video review lúc này. Vui lòng kiểm tra lại quyền cộng tác viên của bạn với gian hàng.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl border border-[#EAE4D7] w-full max-w-xl max-h-[90vh] flex flex-col p-6 text-left animate-in zoom-in-95 duration-150">

        <header className="flex items-start justify-between gap-4 border-b border-[#EAE4D7] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FBF5EB] border border-[#EAE4D7] text-[#B88E4F] flex items-center justify-center shrink-0 shadow-xs">
              <Video className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-[#1A1612] m-0">
                Nộp Video Review Sản Phẩm
              </h2>
              <p className="text-xs text-[#7D715E] mt-0.5 m-0">
                Video được Shop phê duyệt sẽ tự động xuất hiện trên Landing Page sàn SCANMS
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[#F3EFE6] text-[#7D715E] hover:text-[#1A1612] transition cursor-pointer"
            aria-label="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </header>


        <form onSubmit={handleSubmit} className="overflow-y-auto py-4 space-y-4 flex-1">

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}


          <div ref={productDropdownRef}>
            <label className="text-xs font-bold text-[#1A1612] block mb-1">
              Sản phẩm review <span className="text-rose-500">*</span>
            </label>
            {initialProductTitle && initialProductId ? (
              <div className="p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs flex items-center justify-between">
                <div className="flex items-center gap-2 min-w-0">
                  <Package className="w-4 h-4 text-[#B88E4F] shrink-0" />
                  <span className="font-semibold text-[#1A1612] truncate">
                    {initialProductTitle}
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FBF5EB] text-[#B88E4F] border border-[#EAE4D7] shrink-0">
                  Đã chọn
                </span>
              </div>
            ) : (
              <div className="relative">
                {/* Trigger button */}
                <button
                  type="button"
                  disabled={loadingProducts || products.length === 0}
                  onClick={() => setIsProductDropdownOpen((prev) => !prev)}
                  className={`w-full p-2.5 sm:p-3 bg-[#FAF8F5] border rounded-xl text-xs text-[#1A1612] outline-none transition flex items-center justify-between gap-2 cursor-pointer text-left shadow-2xs ${
                    isProductDropdownOpen ? 'border-[#B88E4F] ring-2 ring-[#B88E4F]/15 bg-white' : 'border-[#EAE4D7] hover:border-[#C59B58]'
                  } ${loadingProducts || products.length === 0 ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <Package className="w-4 h-4 text-[#B88E4F] shrink-0" />
                    {loadingProducts ? (
                      <span className="text-[#7D715E]">Đang tải danh sách sản phẩm...</span>
                    ) : products.length === 0 ? (
                      <span className="text-[#7D715E]">Bạn chưa có sản phẩm nào được duyệt hợp tác</span>
                    ) : selectedProduct ? (
                      <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                        <span className="font-bold text-[#1A1612] truncate" title={selectedProduct.title}>
                          {selectedProduct.title}
                        </span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#F3EFE6] text-[#7D715E] font-medium">
                            {selectedProduct.sku}
                          </span>
                          <span className="text-xs font-black text-[#B88E4F]">
                            {Number(selectedProduct.price).toLocaleString('vi-VN')} ₫
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-[#7D715E]">Chọn sản phẩm muốn làm video review...</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    {loadingProducts ? (
                      <Loader2 className="w-4 h-4 animate-spin text-[#B88E4F]" />
                    ) : (
                      <ChevronDown
                        className={`w-4 h-4 text-[#7D715E] transition-transform duration-200 ${
                          isProductDropdownOpen ? 'rotate-180 text-[#B88E4F]' : ''
                        }`}
                      />
                    )}
                  </div>
                </button>

                {/* Dropdown popup - Gọn gàng bên trong khung modal, không tràn màn hình */}
                {isProductDropdownOpen && products.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-[#EAE4D7] rounded-2xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col max-h-72 w-full max-w-full">
                    {/* Ô tìm kiếm nhanh */}
                    <div className="p-2 border-b border-[#EAE4D7] bg-[#FAF8F5]">
                      <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white border border-[#EAE4D7]">
                        <Search className="w-3.5 h-3.5 text-[#7D715E] shrink-0" />
                        <input
                          type="text"
                          value={productSearchQuery}
                          onChange={(e) => setProductSearchQuery(e.target.value)}
                          placeholder="Tìm theo tên sản phẩm, mã SKU hoặc Shop..."
                          className="w-full bg-transparent text-xs text-[#1A1612] placeholder:text-[#9C8F7C] outline-none"
                          autoFocus
                        />
                        {productSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setProductSearchQuery('')}
                            className="text-[#7D715E] hover:text-[#1A1612] text-xs p-0.5 cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Danh sách sản phẩm cuộn gọn gàng */}
                    <div className="overflow-y-auto divide-y divide-[#EAE4D7]/50 max-h-56 p-1">
                      {filteredProducts.length === 0 ? (
                        <div className="p-4 text-center text-xs text-[#7D715E]">
                          Không tìm thấy sản phẩm phù hợp với từ khóa "{productSearchQuery}"
                        </div>
                      ) : (
                        filteredProducts.map((p) => {
                          const isSelected = p.id === selectedProductId;
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => {
                                setSelectedProductId(p.id);
                                setIsProductDropdownOpen(false);
                                setProductSearchQuery('');
                              }}
                              className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                                isSelected ? 'bg-[#FBF5EB] border border-[#EEDFC6]' : 'hover:bg-[#FAF8F5] border border-transparent'
                              }`}
                            >
                              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-lg bg-[#F3EFE6] border border-[#EAE4D7] flex items-center justify-center shrink-0">
                                  <Package className="w-4 h-4 text-[#B88E4F]" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-bold text-[#1A1612] truncate" title={p.title}>
                                    {p.title}
                                  </div>
                                  <div className="text-[11px] text-[#7D715E] truncate flex items-center gap-1.5 mt-0.5">
                                    <span className="font-mono text-[#B88E4F]">{p.sku}</span>
                                    <span>·</span>
                                    <span className="truncate">{p.store?.name || 'Shop'}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <div className="text-xs font-black text-[#1A1612]">
                                  {Number(p.price).toLocaleString('vi-VN')} ₫
                                </div>
                                {isSelected ? (
                                  <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-600 mt-0.5">
                                    <Check className="w-3 h-3" /> Đã chọn
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-[#7D715E]">Bấm để chọn</span>
                                )}
                              </div>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
            <p className="text-[11px] text-[#7D715E] mt-1 m-0">
              {sampleRequestId
                ? 'Video sẽ được gắn với yêu cầu nhận mẫu này và Shop sẽ kiểm duyệt.'
                : 'Chỉ nộp được cho sản phẩm thuộc gian hàng bạn đã được phê duyệt làm CTV (StoreCollaborator = APPROVED).'}
            </p>
          </div>


          <div>
            <label className="text-xs font-bold text-[#1A1612] block mb-1">
              Tiêu đề video review <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ví dụ: Trải nghiệm thực tế Serum sau 14 ngày dùng - da căng bóng mờ thâm"
              className="w-full p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] outline-none focus:border-[#B88E4F] transition"
              required
            />
          </div>


          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#1A1612]">
                Video Review Sản phẩm <span className="text-rose-500 font-bold">{sampleRequestId ? '* (Dán link video đã đăng)' : '* (Bắt buộc phải tải video)'}</span>
              </label>
              {videoPreview && (
                <button
                  type="button"
                  onClick={handleRemoveVideo}
                  className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium transition cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Xóa video
                </button>
              )}
            </div>

            {sampleRequestId && (
              <input
                type="url"
                value={videoUrl.startsWith('blob:') ? '' : videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://www.tiktok.com/@kenh/video/..."
                className="w-full mb-3 p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] outline-none focus:border-[#B88E4F]"
                required
              />
            )}

            {!sampleRequestId && (
              <>
            <input
              ref={videoFileInputRef}
              type="file"
              accept="video/mp4,video/webm,video/quicktime"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) processSelectedVideoFile(f);
              }}
              className="hidden"
            />

            {!videoPreview && !videoUrl ? (
              <div
                onClick={() => videoFileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingVideo(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDraggingVideo(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingVideo(false);
                  const f = e.dataTransfer.files?.[0];
                  if (f) processSelectedVideoFile(f);
                }}
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
                  isDraggingVideo
                    ? 'border-[#B88E4F] bg-[#F3EFE6] scale-[0.99]'
                    : 'border-[#B88E4F] bg-[#FBF5EB]/70 hover:border-[#B88E4F] hover:bg-[#FBF5EB]'
                }`}
              >
                <div className="w-12 h-12 mx-auto mb-2.5 rounded-full bg-white border border-[#EAE4D7] flex items-center justify-center text-[#B88E4F] shadow-sm">
                  <Video className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-[#1A1612] m-0">
                  Bấm để tải video từ máy tính <span className="text-[#7D715E] font-normal">hoặc kéo thả file vào đây</span>
                </p>
                <p className="text-[11px] text-[#7D715E] mt-1 m-0">
                  Hỗ trợ: <strong>MP4, WEBM, MOV</strong> (tối đa 100 MB). Khuyên dùng video dọc 9:16 hoặc 16:9.
                </p>
                <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100/90 border border-amber-300 rounded-full text-[11px] font-bold text-amber-900 shadow-xs">
                  ⚠️ Bắt buộc phải tải video lên thì mới bấm gửi duyệt được
                </div>
              </div>
            ) : (
              <div className="bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl p-3 flex items-center gap-3.5">
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-black/10 border border-[#EAE4D7] shrink-0 flex items-center justify-center">
                  {videoPreview ? (
                    <video
                      src={videoPreview}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  ) : (
                    <Video className="w-8 h-8 text-[#B88E4F]" />
                  )}
                  {isUploadingVideo && (
                    <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white">
                      <Loader2 className="w-5 h-5 animate-spin mb-1" />
                      <span className="text-[9px]">Đang tải...</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    {isUploadingVideo ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B88E4F]">
                        <Loader2 className="w-3 h-3 animate-spin" /> Đang tải video lên máy chủ...
                      </span>
                    ) : videoUploadError ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                        <AlertCircle className="w-3 h-3" /> {videoUploadError}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Video đã tải lên thành công - Có thể bấm gửi!
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[#1A1612] truncate m-0">
                    {videoFileName || 'Video review đã chọn'} {videoFileSize ? `(${videoFileSize})` : ''}
                  </p>
                  <p className="text-[11px] text-[#7D715E] mt-0.5 m-0">
                    Video sẽ hiển thị trực tiếp trên Landing Page sản phẩm sau khi Shop duyệt
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => videoFileInputRef.current?.click()}
                      disabled={isUploadingVideo}
                      className="text-[11px] font-semibold text-[#B88E4F] hover:text-[#B88E4F] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Đổi video khác
                    </button>
                  </div>
                </div>
              </div>
            )}
              </>
            )}
          </div>


          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#1A1612]">
                Ảnh bìa Poster <span className="text-[#7D715E] font-normal">(Tải từ máy tính - Tùy chọn)</span>
              </label>
              {posterPreview && (
                <button
                  type="button"
                  onClick={handleRemovePoster}
                  className="text-[11px] text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium transition cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" /> Xóa ảnh
                </button>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handlePosterFileChange}
              className="hidden"
            />

            {!posterPreview ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border border-dashed rounded-xl px-3.5 py-2.5 flex items-center gap-3 cursor-pointer transition-all duration-150 ${
                  isDragging
                    ? 'border-[#B88E4F] bg-[#F3EFE6]'
                    : 'border-[#EAE4D7] bg-[#FAF8F5] hover:border-[#B88E4F] hover:bg-[#FBF5EB]'
                }`}
              >
                <div className="w-8 h-8 rounded-lg bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center text-[#B88E4F] shrink-0">
                  <Upload className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-[#1A1612] m-0 truncate">
                    Bấm để chọn ảnh từ máy tính <span className="text-[#7D715E] font-normal text-[11px]">hoặc kéo thả vào đây</span>
                  </p>
                  <p className="text-[10.5px] text-[#7D715E] mt-0.5 m-0 truncate">
                    Hỗ trợ: JPG, PNG, WEBP (tối đa 5 MB) • Khuyên dùng 9:16 hoặc 16:9
                  </p>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-bold text-[#B88E4F] bg-white border border-[#EEDFC6] rounded-lg shrink-0 hover:bg-[#FAF8F5]">
                  Chọn ảnh
                </span>
              </div>
            ) : (
              <div className="bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl p-3 flex items-center gap-3.5">
                <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-black/5 border border-[#EAE4D7] shrink-0">
                  <img
                    src={posterPreview}
                    alt="Poster preview"
                    className="w-full h-full object-cover"
                  />
                  {isUploadingPoster && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    {isUploadingPoster ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#B88E4F]">
                        <Loader2 className="w-3 h-3 animate-spin" /> Đang tải ảnh lên Cloudinary...
                      </span>
                    ) : posterUploadError ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600">
                        <AlertCircle className="w-3 h-3" /> Lỗi tải ảnh
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Đã sẵn sàng
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-[#1A1612] truncate m-0">
                    {posterFileName || 'Ảnh bìa đã chọn'}
                  </p>
                  {posterUploadError ? (
                    <p className="text-[11px] text-rose-600 mt-0.5 m-0">{posterUploadError}</p>
                  ) : (
                    <p className="text-[11px] text-[#7D715E] mt-0.5 m-0">
                      Ảnh bìa sẽ hiển thị trên khung video review ở landing page
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPoster}
                      className="text-[11px] font-semibold text-[#B88E4F] hover:text-[#B88E4F] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Đổi ảnh khác
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>


          <div>
            <label className="text-xs font-bold text-[#1A1612] block mb-1">
              Mô tả hoặc kịch bản review <span className="text-[#7D715E] font-normal">(Tùy chọn)</span>
            </label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Tóm tắt cảm nhận thực tế, điểm nổi bật của sản phẩm để gian hàng tham khảo khi kiểm duyệt..."
              rows={3}
              className="w-full p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] outline-none focus:border-[#B88E4F] transition resize-none"
            />
          </div>


          {!sampleRequestId && <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE4D7]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isCampaignVideo}
                onChange={(e) => setIsCampaignVideo(e.target.checked)}
                className="w-4 h-4 rounded text-[#B88E4F] focus:ring-[#DEC07A] accent-[#EBD08C]"
              />
              <span className="text-xs font-bold text-[#1A1612]">
                Video nộp cho Chiến dịch cụ thể
              </span>
            </label>

            {isCampaignVideo && (
              <div className="mt-2.5 pt-2.5 border-t border-[#EAE4D7]">
                <label className="text-[11px] font-bold text-[#1A1612] block mb-1">
                  Mã ID Chiến dịch (Campaign UUID)
                </label>
                <input
                  type="text"
                  value={campaignId}
                  onChange={(e) => setCampaignId(e.target.value)}
                  placeholder="Nhập mã UUID chiến dịch bạn đã được duyệt tham gia..."
                  className="w-full p-2.5 bg-white border border-[#EAE4D7] rounded-lg text-xs text-[#1A1612] outline-none focus:border-[#B88E4F]"
                />
                <p className="text-[10px] text-[#7D715E] mt-1 m-0">
                  Nếu là video review thông thường cho Shop, không cần tích chọn mục này.
                </p>
              </div>
            )}
          </div>}


          <div className="p-3 bg-[#FBF5EB] border border-[#EAE4D7] rounded-xl text-xs text-[#7D715E] flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[#B88E4F] shrink-0 mt-0.5" />
            <span>
              Video sau khi nộp sẽ ở trạng thái <strong>Chờ duyệt (PENDING)</strong>. Khi được Shop chấp thuận, video sẽ tự động hiển thị trên Landing Page công khai của sản phẩm và ưu tiên hiển thị cho khách mua hàng qua link tiếp thị của bạn!
            </span>
          </div>


          <div className="flex items-center justify-between pt-3 border-t border-[#EAE4D7]">
            <span className="text-[11px] text-[#7D715E]">
              {!videoUrl.trim() ? (
                <span className="text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> {sampleRequestId ? 'Dán link video để gửi Shop duyệt' : 'Bắt buộc phải tải video để gửi duyệt'}
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Đã có video - Có thể gửi duyệt
                </span>
              )}
            </span>
            <div className="flex items-center gap-2.5">
              <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting || isUploadingPoster || isUploadingVideo}>
                Hủy bỏ
              </Button>
              <Button
                type="submit"
                variant="amber"
                size="sm"
                loading={submitting}
                disabled={submitting || isUploadingPoster || isUploadingVideo || !title.trim() || !videoUrl.trim()}
              >
                {isUploadingPoster
                  ? 'Đang tải ảnh...'
                  : isUploadingVideo
                  ? 'Đang tải video...'
                  : !videoUrl.trim()
                  ? 'Cần tải video để gửi'
                  : sampleRequestId ? 'Gửi link video cho Shop duyệt' : 'Gửi video cho Shop duyệt'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
