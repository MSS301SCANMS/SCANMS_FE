import { useState, useEffect, useRef } from 'react';
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
  onSuccess?: (newAsset: any) => void;
}

export function SubmitKolVideoModal({
  isOpen,
  onClose,
  initialProductId,
  initialProductTitle,
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

  const isUrlValid = isDomainAllowed(videoUrl);

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
      const payload: any = {
        productId: selectedProductId,
        title: title.trim(),
        videoUrl: videoUrl.trim(),
      };

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

      const res = await mediaService.submitKolVideo(payload);

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
            <div className="w-10 h-10 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center shrink-0 shadow-xs">
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


          <div>
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
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] shrink-0">
                  Đã chọn
                </span>
              </div>
            ) : (
              <div className="relative">
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  disabled={loadingProducts || products.length === 0}
                  className="w-full p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] outline-none focus:border-[#B88E4F] transition appearance-none cursor-pointer"
                  required
                >
                  {loadingProducts ? (
                    <option value="">Đang tải danh sách sản phẩm...</option>
                  ) : products.length === 0 ? (
                    <option value="">Bạn chưa có sản phẩm nào được duyệt hợp tác</option>
                  ) : (
                    products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title} ({p.sku}) — {p.store?.name} (
                        {Number(p.price).toLocaleString('vi-VN')} ₫)
                      </option>
                    ))
                  )}
                </select>
                {loadingProducts && (
                  <div className="absolute right-3 top-3.5 pointer-events-none">
                    <Loader2 className="w-4 h-4 animate-spin text-[#B88E4F]" />
                  </div>
                )}
              </div>
            )}
            <p className="text-[11px] text-[#7D715E] mt-1 m-0">
              Chỉ nộp được cho sản phẩm thuộc gian hàng bạn đã được phê duyệt làm CTV (StoreCollaborator = APPROVED).
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
                Video Review Sản phẩm <span className="text-rose-500 font-bold">* (Bắt buộc phải tải video)</span>
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
                    : 'border-[#B88E4F] bg-[#FBF5EB]/70 hover:border-[#9A733E] hover:bg-[#FBF5EB]'
                }`}
              >
                <div className="w-12 h-12 mx-auto mb-2.5 rounded-full bg-white border border-[#EEDFC6] flex items-center justify-center text-[#B88E4F] shadow-sm">
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
                      className="text-[11px] font-semibold text-[#B88E4F] hover:text-[#9A733E] hover:underline cursor-pointer disabled:opacity-50"
                    >
                      Đổi video khác
                    </button>
                  </div>
                </div>
              </div>
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
                className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all duration-200 ${
                  isDragging
                    ? 'border-[#B88E4F] bg-[#F3EFE6] scale-[0.99]'
                    : 'border-[#EAE4D7] bg-[#FAF8F5] hover:border-[#B88E4F] hover:bg-[#FBF5EB]'
                }`}
              >
                <div className="w-11 h-11 mx-auto mb-2.5 rounded-full bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-center text-[#B88E4F] shadow-sm">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-semibold text-[#1A1612] m-0">
                  Bấm để chọn ảnh từ máy tính <span className="text-[#7D715E] font-normal">hoặc kéo thả vào đây</span>
                </p>
                <p className="text-[11px] text-[#7D715E] mt-1 m-0">
                  Hỗ trợ: JPG, PNG, WEBP (tối đa 5 MB). Khuyên dùng tỷ lệ 9:16 (video dọc) hoặc 16:9.
                </p>
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
                      className="text-[11px] font-semibold text-[#B88E4F] hover:text-[#9A733E] hover:underline cursor-pointer disabled:opacity-50"
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


          <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#EAE4D7]">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={isCampaignVideo}
                onChange={(e) => setIsCampaignVideo(e.target.checked)}
                className="w-4 h-4 rounded text-[#B88E4F] focus:ring-[#B88E4F] accent-[#B88E4F]"
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
          </div>


          <div className="p-3 bg-[#FBF5EB] border border-[#EEDFC6] rounded-xl text-xs text-[#7D715E] flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-[#B88E4F] shrink-0 mt-0.5" />
            <span>
              Video sau khi nộp sẽ ở trạng thái <strong>Chờ duyệt (PENDING)</strong>. Khi được Shop chấp thuận, video sẽ tự động hiển thị trên Landing Page công khai của sản phẩm và ưu tiên hiển thị cho khách mua hàng qua link tiếp thị của bạn!
            </span>
          </div>


          <div className="flex items-center justify-between pt-3 border-t border-[#EAE4D7]">
            <span className="text-[11px] text-[#7D715E]">
              {!videoUrl.trim() ? (
                <span className="text-rose-600 font-semibold flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" /> Bắt buộc phải tải video để gửi duyệt
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
                  : 'Gửi video cho Shop duyệt'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
