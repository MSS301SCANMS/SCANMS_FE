import { useState, useEffect, useRef, useMemo, useLayoutEffect, type FormEvent, type TextareaHTMLAttributes } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  PlusCircle,
  Search,
  Link2,
  Package,
  Pencil,
  Trash2,
  CheckCircle2,
  ImagePlus,
  X,
  Tag,
  FolderTree,
  Coins,
  Percent,
  Boxes,
  Camera,
  UploadCloud,
  AlertCircle,
  Video,
  Star,
  ExternalLink,
  MessageSquareText,
  Clock3,
  ShieldCheck,
  EyeOff,
  Ban,
  Crown,
  ArrowLeftRight,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import api from '../../services/api';
import { productService, type Product } from '../../services/product.service';
import { authService } from '../../services/auth.service';
import { toast } from '../../utils/toast';
import { getSafeProductImageUrl } from '../../features/marketplace/marketplaceUtils';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import './ProductManagementPage.css';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';

type VariantAttributes = Record<string, string>;
type VariantField = { key: string; label: string; placeholder: string };
type AutoGrowTextareaProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'rows' | 'value'> & {
  minHeight: number;
  value: string;
};

function AutoGrowTextarea({ minHeight, value, className, ...props }: AutoGrowTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = `${minHeight}px`;
    if (!value.trim()) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.max(minHeight, textarea.scrollHeight)}px`;
  }, [minHeight, value]);

  return (
    <textarea
      {...props}
      ref={textareaRef}
      rows={1}
      value={value}
      className={className}
    />
  );
}

type ProductEvidenceEditorProps = {
  title: string;
  description: string;
  required?: boolean;
  inputId: string;
  links: string[];
  images: string[];
  uploading: boolean;
  uploadLabel: string;
  onLinksChange: (links: string[]) => void;
  onImagesChange: (images: string[]) => void;
  onUpload: (files: FileList | null) => void;
};

function ProductEvidenceEditor({
  title, description, required = false, inputId, links, images, uploading, uploadLabel,
  onLinksChange, onImagesChange, onUpload,
}: ProductEvidenceEditorProps) {
  return (
    <section className="group min-w-0 overflow-hidden rounded-2xl border border-[#E7DDCC] bg-white shadow-[0_4px_16px_rgba(35,29,21,0.045)] transition-shadow hover:shadow-[0_8px_24px_rgba(35,29,21,0.075)] lg:row-span-3 lg:grid lg:grid-rows-subgrid">
      <header className="flex items-start gap-3 border-b border-[#EEE6D9] bg-gradient-to-br from-[#FBF5EB] via-[#FFFCF7] to-white px-4 py-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border border-[#EEDFC6] bg-white text-[#B88E4F] shadow-[0_2px_5px_rgba(35,29,21,0.04)]">
          <ShieldCheck className="h-[19px] w-[19px]" strokeWidth={1.8} />
        </span>
        <div className="min-w-0 pt-0.5">
          <h3 className="text-[13px] font-bold leading-5 text-[#231D15] lg:min-h-10">
            {title}{required && <span className="ml-1 text-[#DC2626]">*</span>}
          </h3>
          <p className="mt-1 text-[11px] leading-[1.55] text-[#7D715E]">{description}</p>
        </div>
      </header>

      <div className="flex flex-col gap-3.5 p-3.5 sm:p-4 lg:contents">
        <div className="rounded-xl border border-[#EEE6D9] bg-[#FEFDFB] p-3 lg:mx-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2 text-[11px] font-semibold text-[#5F5445]">
              <Link2 className="h-4 w-4 shrink-0 text-[#B88E4F]" strokeWidth={1.8} />
              <span>Link tài liệu / trang công bố</span>
            </div>
            <button
              type="button"
              disabled={links.length >= 10}
              onClick={() => onLinksChange([...links, ''])}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-[#E8D8BD] bg-white px-2.5 py-1.5 text-[10px] font-semibold text-[#8C6226] shadow-[0_1px_2px_rgba(35,29,21,0.03)] transition hover:border-[#C59B58] hover:bg-[#FBF5EB] disabled:opacity-50"
            >
              <PlusCircle className="h-3.5 w-3.5" strokeWidth={1.8} /> Thêm link
            </button>
          </div>
          {links.length > 0 ? (
            <div className="mt-2.5 space-y-2">
              {links.map((link, index) => (
                <div key={`${inputId}-link-${index}`} className="flex min-w-0 items-center gap-2 rounded-lg border border-[#EAE4D7] bg-white p-1.5 pl-2.5 transition focus-within:border-[#C59B58] focus-within:ring-2 focus-within:ring-[#C59B58]/10">
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-[#FBF5EB] text-[#B88E4F]">
                    <Link2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                  </span>
                  <input
                    type="url"
                    value={link}
                    maxLength={2048}
                    onChange={(event) => onLinksChange(links.map((item, itemIndex) => itemIndex === index ? event.target.value : item))}
                    placeholder="Dán link https://..."
                    className="min-w-0 flex-1 bg-transparent px-1 py-1.5 text-xs text-[#1A1612] outline-none placeholder:text-[#A79B89]"
                  />
                  <button type="button" onClick={() => onLinksChange(links.filter((_, itemIndex) => itemIndex !== index))} aria-label="Xóa link minh chứng" className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-[#8D8272] transition hover:bg-[#F8F1E7] hover:text-[#8C6226]">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2.5 rounded-lg border border-dashed border-[#E9DFD0] px-3 py-2 text-[10px] text-[#9A8E7C]">
              Chưa có link minh chứng
            </p>
          )}
        </div>

        <div className="lg:mx-4 lg:mb-4">
          <input
            id={inputId}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            disabled={uploading || images.length >= 10}
            onChange={(event) => { onUpload(event.target.files); event.target.value = ''; }}
          />
          <div className="mb-2 flex items-center justify-between gap-2 px-0.5">
            <div className="flex min-w-0 items-center gap-2 text-[11px] font-semibold text-[#5F5445]">
              <ImagePlus className="h-4 w-4 shrink-0 text-[#B88E4F]" strokeWidth={1.8} />
              <span>Ảnh chụp nhãn / hóa đơn / chứng từ</span>
            </div>
            {images.length > 0 && <span className="shrink-0 text-[10px] tabular-nums text-[#9A8E7C]">{images.length} ảnh</span>}
          </div>
          <button
            type="button"
            disabled={uploading || images.length >= 10}
            onClick={() => document.getElementById(inputId)?.click()}
            className="flex w-full items-center gap-3 rounded-xl border border-dashed border-[#DCC9A9] bg-[#FCFAF6] px-3 py-2.5 text-left transition hover:border-[#C59B58] hover:bg-[#FBF5EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]/30 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-[#EEDFC6] bg-white text-[#B88E4F] shadow-[0_1px_3px_rgba(35,29,21,0.04)]">
              <UploadCloud className={`h-[17px] w-[17px] ${uploading ? 'animate-pulse' : ''}`} strokeWidth={1.8} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[11px] font-semibold text-[#6F4E20]">{uploading ? 'Đang tải ảnh lên…' : uploadLabel}</span>
              <span className="mt-0.5 block text-[10px] text-[#9A8E7C]">JPG, PNG hoặc WEBP · tối đa 5 MB mỗi ảnh</span>
            </span>
            {!uploading && <Plus className="h-4 w-4 shrink-0 text-[#B88E4F]" strokeWidth={1.8} />}
          </button>
          {images.length > 0 && (
            <div className="mt-2.5 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {images.map((url, index) => (
                <div key={`${url}-${index}`} className="group/image relative aspect-[4/3] overflow-hidden rounded-lg border border-[#EAE4D7] bg-[#F8F5EF]">
                  <a href={url} target="_blank" rel="noreferrer" aria-label={`Mở ảnh minh chứng ${index + 1}`}>
                    <img src={url} alt={`Ảnh minh chứng ${index + 1}`} className="h-full w-full object-cover transition duration-300 group-hover/image:scale-[1.03]" />
                  </a>
                  <button type="button" onClick={() => onImagesChange(images.filter((_, itemIndex) => itemIndex !== index))} aria-label="Xóa ảnh minh chứng" className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-lg border border-white/80 bg-white/95 text-[#6F6251] opacity-100 shadow-sm transition hover:border-[#E8D8BD] hover:bg-[#FBF5EB] hover:text-[#8C6226] sm:opacity-0 sm:group-hover/image:opacity-100 sm:focus-visible:opacity-100">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const VARIANT_FIELDS: Record<string, VariantField[]> = {
  'Mỹ phẩm & Chăm sóc da': [
    { key: 'volume', label: 'Dung tích / khối lượng', placeholder: '30 ml, 50 ml, 100 g...' },
    { key: 'formula', label: 'Dạng / công thức', placeholder: 'Serum lỏng, dạng gel, kem...' },
    { key: 'package', label: 'Quy cách', placeholder: 'Chai nhỏ giọt, tuýp, hũ...' },
  ],
  'Trang điểm & Làm đẹp': [
    { key: 'shade', label: 'Màu / tông', placeholder: 'Đỏ đất, 01 Natural...' },
    { key: 'finish', label: 'Chất / hiệu ứng', placeholder: 'Lì, bóng, satin...' },
    { key: 'volume', label: 'Dung tích / khối lượng', placeholder: '3 g, 30 ml...' },
  ],
  'Chăm sóc cơ thể & Tóc': [
    { key: 'volume', label: 'Dung tích / khối lượng', placeholder: '250 ml, 500 ml...' },
    { key: 'scent', label: 'Mùi hương', placeholder: 'Hoa hồng, không mùi...' },
    { key: 'formula', label: 'Dạng sản phẩm', placeholder: 'Gel, dầu, kem...' },
  ],
  'Thực phẩm chức năng & Sức khỏe': [
    { key: 'weight', label: 'Khối lượng / số lượng', placeholder: '250 g, 60 viên...' },
    { key: 'flavor', label: 'Vị / hương', placeholder: 'Cam, tự nhiên...' },
    { key: 'package', label: 'Quy cách đóng gói', placeholder: 'Hộp, túi, lọ...' },
  ],
  'Thiết bị điện tử & Phụ kiện': [
    { key: 'model', label: 'Mẫu / phiên bản', placeholder: 'Pro, Gen 2...' },
    { key: 'color', label: 'Màu sắc', placeholder: 'Đen, trắng...' },
    { key: 'capacity', label: 'Cấu hình / dung lượng', placeholder: '128 GB, 20 W...' },
  ],
  'Thời trang & Phụ kiện': [
    { key: 'color', label: 'Màu sắc', placeholder: 'Đen, be, xanh...' },
    { key: 'size', label: 'Size', placeholder: 'S, M, L, XL...' },
    { key: 'style', label: 'Kiểu / mẫu', placeholder: 'Cổ tròn, tay dài...' },
  ],
};
const OTHER_VARIANT_FIELDS: VariantField[] = [
  { key: 'type', label: 'Loại / mẫu', placeholder: 'Tên kiểu sản phẩm...' },
  { key: 'specification', label: 'Kích thước / quy cách', placeholder: '20 cm, 500 g...' },
  { key: 'color', label: 'Màu / phiên bản', placeholder: 'Màu hoặc phiên bản...' },
];
const getVariantFields = (category: string) => VARIANT_FIELDS[category] || OTHER_VARIANT_FIELDS;
const variantDisplayName = (attributes: VariantAttributes, fields: VariantField[]) =>
  fields.map((field) => attributes[field.key]?.trim()).filter(Boolean).join(' · ');
const inferCategoryFromTitle = (title: string) => {
  const text = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').toLowerCase();
  if (/\b(ao|quan|vay|dam|giay|dep|tui xach|hoodie|polo|shirt|dress|jeans|sneaker)\b/.test(text)) return 'Thời trang & Phụ kiện';
  if (/\b(son|phan trang diem|kem nen|mascara|makeup)\b/.test(text)) return 'Trang điểm & Làm đẹp';
  if (/\b(serum|tinh chat|kem duong|sua rua mat|chong nang|toner|duong da)\b/.test(text)) return 'Mỹ phẩm & Chăm sóc da';
  if (/\b(dau goi|sua tam|dau xa|duong toc)\b/.test(text)) return 'Chăm sóc cơ thể & Tóc';
  if (/\b(vitamin|thuc pham chuc nang|collagen|vien uong)\b/.test(text)) return 'Thực phẩm chức năng & Sức khỏe';
  if (/\b(tai nghe|dien thoai|may tinh|loa bluetooth|sac du phong)\b/.test(text)) return 'Thiết bị điện tử & Phụ kiện';
  return '';
};

export default function ProductManagementPage() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const isKol = !currentUser?.role || currentUser?.role === 'COLLABORATOR';
  const isAdminOrManager =
    currentUser?.role === 'SYSTEM_ADMIN' ||
    currentUser?.role === 'SYSTEM_MANAGER' ||
    (currentUser?.role as string) === 'ADMIN';
  const currentStoreId = localStorage.getItem('current_store_id') || undefined;

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<any | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [moderatingProduct, setModeratingProduct] = useState<any | null>(null);
  const [moderatingAction, setModeratingAction] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const [moderationReason, setModerationReason] = useState('');
  const [moderationSubmitting, setModerationSubmitting] = useState(false);

  const pendingApprovalCount = useMemo(() => {
    return products.filter((p: any) => (p.moderationStatus || 'APPROVED') === 'DRAFT').length;
  }, [products]);

  const handleApproveProduct = async (product: any) => {
    setModerationSubmitting(true);
    try {
      await productService.moderateProduct(product.id, 'APPROVED');
      toast.success(`Đã phê duyệt sản phẩm "${product.title || product.name}"!`, {
        description: 'Sản phẩm đã được mở bán công khai trên sàn SCANMS cho khách và KOL.',
      });
      setProducts((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...item, moderationStatus: 'APPROVED', status: 'active', isActive: true }
            : item
        )
      );
      setModeratingProduct(null);
      setModeratingAction(null);
      void loadProducts();
    } catch (err: any) {
      toast.error('Không thể phê duyệt sản phẩm', {
        description: err?.response?.data?.message || err?.message || 'Lỗi hệ thống.',
      });
    } finally {
      setModerationSubmitting(false);
    }
  };

  const handleRejectProduct = async () => {
    if (!moderatingProduct) return;
    if (!moderationReason.trim() || moderationReason.trim().length < 3) {
      toast.warning('Vui lòng nhập lý do từ chối kiểm duyệt (tối thiểu 3 ký tự).');
      return;
    }
    setModerationSubmitting(true);
    try {
      await productService.moderateProduct(moderatingProduct.id, 'REJECTED', moderationReason.trim());
      toast.error(`Đã từ chối kiểm duyệt "${moderatingProduct.title || moderatingProduct.name}"`, {
        description: `Lý do: "${moderationReason.trim()}". Shop sẽ nhận được thông báo phản hồi.`,
      });
      setProducts((prev) =>
        prev.map((item) =>
          item.id === moderatingProduct.id
            ? { ...item, moderationStatus: 'REJECTED', moderationReason: moderationReason.trim() }
            : item
        )
      );
      setModeratingProduct(null);
      setModeratingAction(null);
      setModerationReason('');
      void loadProducts();
    } catch (err: any) {
      toast.error('Không thể từ chối sản phẩm', {
        description: err?.response?.data?.message || err?.message || 'Lỗi hệ thống.',
      });
    } finally {
      setModerationSubmitting(false);
    }
  };


  const [selectedVideoProduct, setSelectedVideoProduct] = useState<Product | null>(null);
  const [productVideos, setProductVideos] = useState<any[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [reviewingMediaId, setReviewingMediaId] = useState<string | null>(null);
  const [rejectionModalMedia, setRejectionModalMedia] = useState<any | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [rejectionActionType, setRejectionActionType] = useState<'REJECTED' | 'HIDDEN'>('REJECTED');

  const localKolVideoStorageKey = 'scanms_kol_video_submissions';
  const readLocalKolVideos = () => {
    try {
      const parsed = JSON.parse(localStorage.getItem(localKolVideoStorageKey) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };
  const saveLocalKolVideoStatus = (
    mediaId: string,
    status: 'APPROVED' | 'REJECTED' | 'HIDDEN',
    options?: { isFeatured?: boolean; rejectionReason?: string | null },
  ) => {
    const localVideos = readLocalKolVideos();
    const targetProductId = localVideos.find((video: any) => video.id === mediaId)?.productId;
    const updated = localVideos.map((video: any) =>
      video.id === mediaId
        ? {
            ...video,
            status,
            isApproved: status === 'APPROVED',
            isFeatured: Boolean(options?.isFeatured),
            rejectionReason: options?.rejectionReason || null,
          }
        : options?.isFeatured && video.productId === targetProductId
          ? { ...video, isFeatured: false }
          : video,
    );
    localStorage.setItem(localKolVideoStorageKey, JSON.stringify(updated));
  };

  const normalizeLocalKolVideo = (video: any, matchedProduct?: Product) => ({
    ...video,
    _localPrototype: true,
    assetType: 'VIDEO',
    urlOrContent: video.videoUrl?.startsWith('./assets/')
      ? `/reference/${video.videoUrl.slice(2)}`
      : video.videoUrl,
    posterUrl: video.image?.startsWith('./assets/')
      ? `/reference/${video.image.slice(2)}`
      : video.image,
    caption: video.caption || null,
    collaborator: video.collaborator || { fullName: 'Trần Văn Nhật' },
    product: matchedProduct
      ? {
          id: matchedProduct.id,
          sku: matchedProduct.sku,
          title: matchedProduct.title || (matchedProduct as any).name,
        }
      : video.product || {
          id: video.productId,
          sku: video.productId,
          title: video.productName || 'Sản phẩm KOL đã chọn',
        },
  });

  const pendingKolVideoCount = new Set(
    [...readLocalKolVideos(), ...productVideos]
      .filter((video: any) => video.status === 'PENDING')
      .map((video: any) => video.id),
  ).size;


  const [showReviewModeration, setShowReviewModeration] = useState(false);
  const [customerReviews, setCustomerReviews] = useState<any[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [reviewActionId, setReviewActionId] = useState<string | null>(null);
  const [reviewFilterStatus, setReviewFilterStatus] = useState<
    'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN'
  >('ALL');
  const [rejectionModalReview, setRejectionModalReview] = useState<any | null>(null);
  const [reviewRejectionActionType, setReviewRejectionActionType] = useState<
    'REJECTED' | 'HIDDEN'
  >('REJECTED');
  const [reviewRejectionReasonInput, setReviewRejectionReasonInput] = useState('');

  const getReviewStatus = (review: any): 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN' => {
    if (review?.status) return review.status;
    return review?.isApproved ? 'APPROVED' : 'PENDING';
  };

  const openReviewModeration = async () => {
    setShowReviewModeration(true);
    setLoadingReviews(true);
    try {
      const res = await api.get('/products/reviews/moderation');
      setCustomerReviews(res.data?.items || res.data || []);
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Không thể tải đánh giá khách hàng');
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleApproveCustomerReview = async (review: any) => {
    setReviewActionId(review.id);
    try {
      const res = await api.patch(`/products/reviews/${review.id}/moderation`, {
        status: 'APPROVED',
      });
      const updated = res.data?.review;
      setCustomerReviews((items) =>
        items.map((item) =>
          item.id === review.id
            ? {
                ...item,
                status: 'APPROVED',
                isApproved: true,
                rejectionReason: null,
                reviewedAt: updated?.reviewedAt || new Date().toISOString(),
              }
            : item,
        ),
      );
      showToast('Đã phê duyệt và công khai đánh giá khách hàng');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Không thể cập nhật đánh giá');
    } finally {
      setReviewActionId(null);
    }
  };

  const openReviewRejectionModal = (review: any, actionType: 'REJECTED' | 'HIDDEN') => {
    setRejectionModalReview(review);
    setReviewRejectionActionType(actionType);
    setReviewRejectionReasonInput('');
  };

  const handleConfirmReviewRejection = async () => {
    if (!rejectionModalReview) return;
    const reason = reviewRejectionReasonInput.trim();
    if (!reason || reason.length < 3) {
      toast.warning('Vui lòng nhập lý do kiểm duyệt (tối thiểu 3 ký tự)!');
      return;
    }

    const reviewId = rejectionModalReview.id;
    setReviewActionId(reviewId);
    try {
      const res = await api.patch(`/products/reviews/${reviewId}/moderation`, {
        status: reviewRejectionActionType,
        reason,
      });
      const updated = res.data?.review;
      setCustomerReviews((items) =>
        items.map((item) =>
          item.id === reviewId
            ? {
                ...item,
                status: reviewRejectionActionType,
                isApproved: false,
                rejectionReason: reason,
                reviewedAt: updated?.reviewedAt || new Date().toISOString(),
              }
            : item,
        ),
      );
      showToast(
        reviewRejectionActionType === 'REJECTED'
          ? 'Đã từ chối đánh giá khách hàng'
          : 'Đã ẩn đánh giá khỏi trang sản phẩm',
      );
      setRejectionModalReview(null);
      setReviewRejectionReasonInput('');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Không thể kiểm duyệt đánh giá');
    } finally {
      setReviewActionId(null);
    }
  };


  const STANDARD_CATEGORIES = [
    { id: 'skincare', name: 'Mỹ phẩm & Chăm sóc da', prefix: 'SKIN', icon: '🧴' },
    { id: 'makeup', name: 'Trang điểm & Làm đẹp', prefix: 'MAKEUP', icon: '💄' },
    { id: 'bodycare', name: 'Chăm sóc cơ thể & Tóc', prefix: 'BODY', icon: '🌿' },
    { id: 'health', name: 'Thực phẩm chức năng & Sức khỏe', prefix: 'HEALTH', icon: '💊' },
    { id: 'tech', name: 'Thiết bị điện tử & Phụ kiện', prefix: 'TECH', icon: '🎧' },
    { id: 'fashion', name: 'Thời trang & Phụ kiện', prefix: 'FASHION', icon: '👗' },
    { id: 'other', name: 'Danh mục khác (Tự nhập)', prefix: 'PROD', icon: '📦' },
  ];

  const [formSku, setFormSku] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formCustomCategory, setFormCustomCategory] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIngredients, setFormIngredients] = useState('');
  const [formOrigin, setFormOrigin] = useState('');
  const [formLabelInfo, setFormLabelInfo] = useState('');
  const [formOriginProofLinks, setFormOriginProofLinks] = useState<string[]>([]);
  const [formOriginProofImages, setFormOriginProofImages] = useState<string[]>([]);
  const [formLabelProofLinks, setFormLabelProofLinks] = useState<string[]>([]);
  const [formLabelProofImages, setFormLabelProofImages] = useState<string[]>([]);
  const [formPrice, setFormPrice] = useState<number | ''>('');
  const [formCommission, setFormCommission] = useState<number | ''>('');
  const [formCommissionAmount, setFormCommissionAmount] = useState<number | ''>('');
  const [formAffiliateEnabled, setFormAffiliateEnabled] = useState(false);
  const [formStock, setFormStock] = useState<number | ''>('');
  const [formSampleEnabled, setFormSampleEnabled] = useState(false);
  const [formSampleQuota, setFormSampleQuota] = useState<number | ''>('');
  const [variantSamplePolicies, setVariantSamplePolicies] = useState<Record<string, {
    inheritProductPolicy: boolean;
    sampleEnabled: boolean;
    sampleQuota: number;
  }>>({});
  const [formImage, setFormImage] = useState('');
  const [formSubImages, setFormSubImages] = useState<string[]>([]);
  const [formVariants, setFormVariants] = useState<Array<{
    id?: string;
    sku: string;
    name: string;
    attributes: VariantAttributes;
    price: number;
    stockQuantity: number;
    imageUrl: string;
  }>>([]);
  const [variantOptionLists, setVariantOptionLists] = useState<Record<string, string>>({});
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingSlot, setUploadingSlot] = useState<string | null>(null);

  const loadProductsRef = useRef<() => Promise<void>>(() => Promise.resolve());

  useEffect(() => {
    loadProductsRef.current();
  }, []);

  const openProductLanding = (product: Product) => {
    const productSlug = product.sku || product.id;
    window.open(
      `/products/${encodeURIComponent(productSlug)}`,
      '_blank',
      'noopener,noreferrer',
    );
  };

  const openAllVideoModeration = async () => {
    setSelectedVideoProduct({
      id: '__ALL__',
      sku: 'TẤT CẢ',
      title: 'Tất cả sản phẩm trong gian hàng',
    } as Product);
    setLoadingVideos(true);

    const localVideos = readLocalKolVideos().map((video: any) => {
      const matchedProduct = products.find((product) => {
        const aliases = new Set([
          product.id,
          product.sku,
          ...(product.sku === 'SR-VTC-15' ? ['SKIN-C15'] : []),
        ]);
        return aliases.has(video.productId);
      });
      return normalizeLocalKolVideo(video, matchedProduct);
    });

    try {
      const res = await api.get('/media', {
        params: { assetType: 'VIDEO', limit: 100 },
      });
      const merged = [...(res.data?.items || [])];
      localVideos.forEach((video: any) => {
        if (!merged.some((item: any) => item.id === video.id)) merged.push(video);
      });
      merged.sort((a: any, b: any) => {
        if (a.status === 'PENDING' && b.status !== 'PENDING') return -1;
        if (a.status !== 'PENDING' && b.status === 'PENDING') return 1;
        return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
      });
      setProductVideos(merged);
    } catch (err) {
      console.error('Lỗi khi tải toàn bộ video KOL:', err);
      setProductVideos(localVideos);
    } finally {
      setLoadingVideos(false);
    }
  };

  const handleApproveVideo = async (mediaId: string, isFeatured: boolean) => {
    setReviewingMediaId(mediaId);
    try {
      const isLocalVideo = Boolean(
        productVideos.find((video) => video.id === mediaId)?._localPrototype,
      );
      if (isLocalVideo) {
        saveLocalKolVideoStatus(mediaId, 'APPROVED', { isFeatured });
      } else {
        await api.patch(`/media/${mediaId}/review`, {
          status: 'APPROVED',
          isFeatured,
        });
      }
      showToast(
        isFeatured
          ? 'Đã duyệt và ghim video làm nổi bật Landing!'
          : 'Đã phê duyệt video review thành công!',
      );
      setProductVideos((prev) =>
        prev.map((v) => {
          const target = prev.find((item) => item.id === mediaId);
          const targetProductId = target?.product?.id || target?.productId;
          if (v.id === mediaId) {
            return {
              ...v,
              status: 'APPROVED',
              isFeatured,
              rejectionReason: null,
            };
          }
          if (isFeatured && (v.product?.id || v.productId) === targetProductId) {
            return { ...v, isFeatured: false };
          }
          return v;
        }),
      );
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Không thể phê duyệt video');
    } finally {
      setReviewingMediaId(null);
    }
  };

  const openRejectionModal = (media: any, actionType: 'REJECTED' | 'HIDDEN') => {
    setRejectionModalMedia(media);
    setRejectionActionType(actionType);
    setRejectionReasonInput('');
  };

  const handleConfirmRejection = async () => {
    if (!rejectionModalMedia) return;
    if (!rejectionReasonInput.trim()) {
      toast.warning('Bắt buộc phải nhập lý do khi từ chối hoặc ẩn video review!');
      return;
    }

    const mediaId = rejectionModalMedia.id;
    setReviewingMediaId(mediaId);
    try {
      if (rejectionModalMedia._localPrototype) {
        saveLocalKolVideoStatus(mediaId, rejectionActionType, {
          rejectionReason: rejectionReasonInput.trim(),
        });
      } else {
        await api.patch(`/media/${mediaId}/review`, {
          status: rejectionActionType,
          rejectionReason: rejectionReasonInput.trim(),
        });
      }
      showToast(
        rejectionActionType === 'REJECTED'
          ? 'Đã từ chối video review và lưu lý do kiểm duyệt.'
          : 'Đã ẩn video khỏi Landing Page thành công.',
      );
      setProductVideos((prev) =>
        prev.map((v) =>
          v.id === mediaId
            ? {
                ...v,
                status: rejectionActionType,
                rejectionReason: rejectionReasonInput.trim(),
                isFeatured: false,
              }
            : v,
        ),
      );
      setRejectionModalMedia(null);
      setRejectionReasonInput('');
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Thao tác kiểm duyệt thất bại');
    } finally {
      setReviewingMediaId(null);
    }
  };


  useEffect(() => {
    if (typeof window === 'undefined' || window.self === window.top) return;

    window.parent.postMessage(
      { type: 'SCANMS_PRODUCT_MODAL_STATE', open: showModal },
      window.location.origin,
    );

    return () => {
      if (showModal) {
        window.parent.postMessage(
          { type: 'SCANMS_PRODUCT_MODAL_STATE', open: false },
          window.location.origin,
        );
      }
    };
  }, [showModal]);

  const loadProducts = async () => {
    try {
      const res: any = await productService.getProducts({
        search: search || undefined,
        storeId: currentStoreId,
      });
      setProducts(res.items || []);
    } catch (err) {
      console.error('Lỗi tải sản phẩm:', err);
    }
  };
  loadProductsRef.current = loadProducts;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(displayProducts.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    }
  };

  const handlePriceChange = (newPrice: number | '') => {
    setFormPrice(newPrice);
    if (newPrice === '') {
      setFormCommissionAmount('');
    } else if (newPrice > 0 && formCommission !== '') {
      setFormCommissionAmount(Math.round((newPrice * formCommission) / 100));
    } else if (newPrice > 0 && formCommissionAmount !== '') {
      setFormCommission(Math.min(100, Number(((formCommissionAmount / newPrice) * 100).toFixed(1))));
    }
  };

  const handleCommissionRateChange = (newPercent: number | '') => {
    if (newPercent === '') {
      setFormCommission('');
      setFormCommissionAmount('');
      return;
    }
    const cleanPercent = Math.max(0, Math.min(100, newPercent));
    setFormCommission(cleanPercent);
    if (Number(formPrice) > 0) {
      setFormCommissionAmount(Math.round((Number(formPrice) * cleanPercent) / 100));
    }
  };

  const handleCommissionAmountChange = (newAmount: number | '') => {
    if (newAmount === '') {
      setFormCommissionAmount('');
      setFormCommission('');
      return;
    }
    const cleanAmount = Math.max(0, newAmount);
    setFormCommissionAmount(cleanAmount);
    if (Number(formPrice) > 0) {
      const calculatedPercent = Number(((cleanAmount / Number(formPrice)) * 100).toFixed(1));
      setFormCommission(Math.min(100, calculatedPercent));
    }
  };

  const handleCategoryChange = (categoryName: string) => {
    setFormCategory(categoryName);
    setVariantOptionLists({});
    const nextFields = getVariantFields(categoryName);
    setFormVariants((current) => current.map((variant) => {
      const attributes = Object.fromEntries(nextFields
        .filter((field) => variant.attributes[field.key])
        .map((field) => [field.key, variant.attributes[field.key]]));
      return { ...variant, attributes, name: variantDisplayName(attributes, nextFields) || variant.name };
    }));
    const cat = STANDARD_CATEGORIES.find((c) => c.name === categoryName);
    if (!editingProduct && (!formSku || STANDARD_CATEGORIES.some((c) => formSku.startsWith(c.prefix)))) {
      const prefix = cat?.prefix || 'PROD';
      const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
      setFormSku(`${prefix}-${randomCode}`);
    }
  };

  const addVariant = (preset?: { key: string; value: string }) => {
    setFormVariants((current) => {
      if (preset && current.some((item) => item.attributes[preset.key]?.toLowerCase() === preset.value.toLowerCase())) return current;
      const suffix = preset
        ? preset.value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/gi, '').toUpperCase()
        : Math.random().toString(36).slice(2, 6).toUpperCase();
      const baseSku = `${(formSku || 'SKU').slice(0, 70)}-${suffix || 'VAR'}`;
      const sku = current.some((item) => item.sku === baseSku)
        ? `${baseSku}-${Math.random().toString(36).slice(2, 5).toUpperCase()}` : baseSku;
      const attributes = preset ? { [preset.key]: preset.value } : {};
      return [...current, {
        sku, name: variantDisplayName(attributes, getVariantFields(formCategory)), attributes,
        price: Number(formPrice) || 0, stockQuantity: 0, imageUrl: '',
      }];
    });
  };

  const generateVariantCombinations = () => {
    const fields = getVariantFields(formCategory);
    const choices = fields.map((field) => ({
      key: field.key,
      values: [...new Set((variantOptionLists[field.key] || '')
        .split(/[,;\n]/).map((value) => value.trim()).filter(Boolean))],
    })).filter((entry) => entry.values.length);
    if (!choices.length) {
      showToast('Nhập ít nhất một màu, size, dung tích hoặc đặc điểm để tạo phân loại.');
      return;
    }
    const count = choices.reduce((total, entry) => total * entry.values.length, 1);
    if (count + formVariants.length > 100) {
      showToast('Tối đa 100 phân loại cho mỗi sản phẩm. Hãy rút gọn số lựa chọn.');
      return;
    }
    const combinations = choices.reduce<VariantAttributes[]>((rows, entry) =>
      rows.flatMap((row) => entry.values.map((value) => ({ ...row, [entry.key]: value }))), [{}]);
    const signature = (attributes: VariantAttributes) => fields.map((field) =>
      attributes[field.key]?.trim().toLocaleLowerCase('vi-VN') || '').join('|');
    setFormVariants((current) => {
      const seen = new Set(current.map((item) => signature(item.attributes)));
      const next = [...current];
      for (const attributes of combinations) {
        const key = signature(attributes);
        if (seen.has(key)) continue;
        seen.add(key);
        const suffix = fields.map((field) => attributes[field.key] || '')
          .join('-').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9-]/gi, '').toUpperCase().slice(0, 40);
        const baseSku = `${(formSku || 'SKU').slice(0, 45)}-${suffix || 'VAR'}`;
        const sku = next.some((item) => item.sku === baseSku)
          ? `${baseSku}-${Math.random().toString(36).slice(2, 6).toUpperCase()}` : baseSku;
        next.push({ sku, name: variantDisplayName(attributes, fields), attributes,
          price: Number(formPrice) || 0, stockQuantity: 0, imageUrl: '' });
      }
      return next;
    });
  };

  const openCreateModal = () => {
    setSaveError(null);
    setEditingProduct(null);
    setFormSku('PROD-' + Math.random().toString(36).substring(2, 7).toUpperCase());
    setFormTitle('');
    setFormCategory('');
    setFormCustomCategory('');
    setFormDescription('');
    setFormIngredients('');
    setFormOrigin('');
    setFormLabelInfo('');
    setFormOriginProofLinks([]);
    setFormOriginProofImages([]);
    setFormLabelProofLinks([]);
    setFormLabelProofImages([]);
    setFormPrice('');
    setFormCommission('');
    setFormCommissionAmount('');
    setFormAffiliateEnabled(false);
    setFormStock('');
    setFormSampleEnabled(false);
    setFormSampleQuota('');
    setVariantSamplePolicies({});
    setFormImage('');
    setFormSubImages([]);
    setFormVariants([]);
    setVariantOptionLists({});
    setShowModal(true);
  };

  const openEditModal = (p: any) => {
    setSaveError(null);
    setEditingProduct(p);
    setFormSku(p.sku || '');
    setFormTitle(p.title || p.name);
    setVariantOptionLists({});
    const matchedCat = STANDARD_CATEGORIES.find((c) => c.name === (p.categoryName || p.category));
    if (matchedCat) {
      setFormCategory(matchedCat.name);
      setFormCustomCategory('');
    } else {
      setFormCategory('Danh mục khác (Tự nhập)');
      setFormCustomCategory(p.categoryName || p.category || '');
    }
    setFormDescription(p.description || '');
    setFormIngredients(p.ingredients || '');
    setFormOrigin(p.origin || '');
    setFormLabelInfo(p.labelInfo || '');
    setFormOriginProofLinks(Array.isArray(p.originProofLinks) ? p.originProofLinks : []);
    setFormOriginProofImages(Array.isArray(p.originProofImages) ? p.originProofImages : []);
    setFormLabelProofLinks(Array.isArray(p.labelProofLinks) ? p.labelProofLinks : []);
    setFormLabelProofImages(Array.isArray(p.labelProofImages) ? p.labelProofImages : []);
    const currentPrice = Number(p.price) || 0;
    setFormPrice(currentPrice);
    const savedCommissionRate = p.customCommissionRate ?? p.commissionRate;
    const commRate = savedCommissionRate == null ? '' : Number(savedCommissionRate);
    setFormCommission(commRate);
    setFormCommissionAmount(commRate === '' ? '' : Math.round((currentPrice * commRate) / 100));
    setFormAffiliateEnabled(p.isAffiliateEnabled !== false);
    setFormStock(p.stockQuantity ?? p.stock ?? 0);
    setFormSampleEnabled(p.sampleEnabled === true);
    setFormSampleQuota(Number(p.sampleQuota) || 0);
    setVariantSamplePolicies(Object.fromEntries(
      (Array.isArray(p.variants) ? p.variants : []).map((variant: any) => [variant.id, {
        inheritProductPolicy: variant.sampleEnabled == null && variant.sampleQuota == null,
        sampleEnabled: variant.sampleEnabled ?? (p.sampleEnabled === true),
        sampleQuota: Number(variant.sampleQuota ?? p.sampleQuota) || 0,
      }]),
    ));
    setFormImage(p.imageUrl || '');
    const existingVariants = Array.isArray(p.variants) ? p.variants : [];
    setFormVariants(existingVariants.map((variant: any) => ({
      id: variant.id,
      sku: variant.sku || '',
      name: variant.name || '',
      attributes: variant.attributes && typeof variant.attributes === 'object' && !Array.isArray(variant.attributes) ? variant.attributes : {},
      price: Number(variant.price ?? p.price) || 0,
      stockQuantity: Number(variant.stockQuantity) || 0,
      imageUrl: variant.imageUrl || '',
    })));

    // Thu thập danh sách ảnh phụ từ mediaAssets hoặc images
    const subs: string[] = [];
    if (Array.isArray(p.mediaAssets) && p.mediaAssets.length > 0) {
      p.mediaAssets.forEach((m: any) => {
        const u = m.urlOrContent || m.url;
        if (u && u !== p.imageUrl && !subs.includes(u)) {
          subs.push(u);
        }
      });
    } else if (Array.isArray(p.images) && p.images.length > 0) {
      p.images.forEach((u: string) => {
        if (u && u !== p.imageUrl && !subs.includes(u)) {
          subs.push(u);
        }
      });
    }
    setFormSubImages(subs.slice(0, 4));
    setShowModal(true);
  };

  const handleUploadSingleImage = async (file: File, isMain: boolean, subIndex?: number) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WEBP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Dung lượng ảnh tối đa là 5 MB');
      return;
    }
    if (isMain && !formCategory) {
      const suggestedCategory = inferCategoryFromTitle(file.name.replace(/[_-]/g, ' '));
      if (suggestedCategory) handleCategoryChange(suggestedCategory);
    }
    setUploadingImage(true);
    setUploadingSlot(isMain ? 'main' : subIndex !== undefined ? `sub-${subIndex}` : 'sub-new');
    try {
      const body = new FormData();
      body.append('file', file);
      const res: any = await api.post('/upload/image?folder=scanms/products', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const result = res?.data || res;
      const imageUrl = result?.secureUrl || result?.url;
      if (!imageUrl) throw new Error('Máy chủ không trả về URL ảnh');

      if (isMain) {
        setFormImage(imageUrl);
        showToast('Đã tải ảnh chính (ảnh bìa) thành công!');
      } else if (subIndex !== undefined && subIndex < formSubImages.length) {
        const nextSubs = [...formSubImages];
        nextSubs[subIndex] = imageUrl;
        setFormSubImages(nextSubs);
        showToast(`Đã thay thế ảnh phụ ${subIndex + 1} thành công!`);
      } else {
        if (formSubImages.length < 4) {
          setFormSubImages([...formSubImages, imageUrl]);
          showToast(`Đã thêm ảnh phụ ${formSubImages.length + 1} thành công!`);
        }
      }
    } catch (err: any) {
      showToast(err.message || 'Không thể tải ảnh');
    } finally {
      setUploadingImage(false);
      setUploadingSlot(null);
    }
  };

  const handleUploadProofImages = async (files: FileList | null, section: 'origin' | 'label') => {
    if (!files?.length) return;
    const currentImages = section === 'origin' ? formOriginProofImages : formLabelProofImages;
    const remaining = Math.max(0, 10 - currentImages.length);
    if (!remaining) {
      showToast('Mỗi mục có thể tải tối đa 10 ảnh minh chứng.');
      return;
    }
    const selected = Array.from(files).slice(0, remaining);
    const validFiles = selected.filter((file) => {
      const validType = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const validSize = file.size <= 5 * 1024 * 1024;
      if (!validType) showToast(`Bỏ qua ${file.name}: chỉ nhận ảnh JPG, PNG hoặc WEBP.`);
      else if (!validSize) showToast(`Bỏ qua ${file.name}: dung lượng tối đa 5 MB.`);
      return validType && validSize;
    });
    if (!validFiles.length) return;

    setUploadingImage(true);
    setUploadingSlot(`${section}-proof`);
    const uploadedUrls: string[] = [];
    try {
      for (const file of validFiles) {
        const body = new FormData();
        body.append('file', file);
        const response: any = await api.post('/upload/image?folder=scanms/products/proofs', body, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const result = response?.data || response;
        const imageUrl = result?.secureUrl || result?.url;
        if (imageUrl) uploadedUrls.push(imageUrl);
      }
      if (!uploadedUrls.length) throw new Error('Máy chủ không trả về ảnh minh chứng');
      if (section === 'origin') setFormOriginProofImages((current) => [...current, ...uploadedUrls].slice(0, 10));
      else setFormLabelProofImages((current) => [...current, ...uploadedUrls].slice(0, 10));
      showToast(`Đã tải ${uploadedUrls.length} ảnh minh chứng lên hệ thống.`);
    } catch (error: any) {
      if (uploadedUrls.length) {
        if (section === 'origin') setFormOriginProofImages((current) => [...current, ...uploadedUrls].slice(0, 10));
        else setFormLabelProofImages((current) => [...current, ...uploadedUrls].slice(0, 10));
        showToast(`Đã tải được ${uploadedUrls.length} ảnh; một số ảnh còn lại chưa tải được.`);
      } else {
        showToast(error?.response?.data?.message || error?.message || 'Không thể tải ảnh minh chứng.');
      }
    } finally {
      setUploadingImage(false);
      setUploadingSlot(null);
    }
  };

  const handleBulkUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileList = Array.from(files).slice(0, 5);
    setUploadingImage(true);
    setUploadingSlot('bulk');
    showToast(`Đang tải lên ${fileList.length} ảnh lên hệ thống...`);
    try {
      let mainImg = formImage;
      const subs = [...formSubImages];

      for (const file of fileList) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) continue;
        if (file.size > 5 * 1024 * 1024) continue;

        const body = new FormData();
        body.append('file', file);
        const res: any = await api.post('/upload/image?folder=scanms/products', body, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const result = res?.data || res;
        const uploadedUrl = result?.secureUrl || result?.url;
        if (!uploadedUrl) continue;

        if (!mainImg) {
          mainImg = uploadedUrl;
        } else if (subs.length < 4 && !subs.includes(uploadedUrl)) {
          subs.push(uploadedUrl);
        }
      }

      setFormImage(mainImg);
      setFormSubImages(subs.slice(0, 4));
      showToast('Đã hoàn tất tải và sắp xếp thư viện ảnh sản phẩm!');
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi tải ảnh hàng loạt');
    } finally {
      setUploadingImage(false);
      setUploadingSlot(null);
    }
  };

  const handleSetAsMain = (subIndex: number) => {
    const targetSub = formSubImages[subIndex];
    if (!targetSub) return;
    const nextSubs = [...formSubImages];
    if (formImage) {
      nextSubs[subIndex] = formImage;
    } else {
      nextSubs.splice(subIndex, 1);
    }
    setFormImage(targetSub);
    setFormSubImages(nextSubs);
    showToast('Đã đặt làm Ảnh chính đại diện!');
  };

  const handleRemoveSubImage = (subIndex: number) => {
    setFormSubImages(formSubImages.filter((_, idx) => idx !== subIndex));
    showToast('Đã xóa ảnh phụ');
  };

  const handleUploadVariantImage = async (variantIndex: number, file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WEBP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Dung lượng ảnh tối đa là 5 MB');
      return;
    }
    setUploadingImage(true);
    setUploadingSlot(`variant-${variantIndex}`);
    try {
      const body = new FormData();
      body.append('file', file);
      const res: any = await api.post('/upload/image?folder=scanms/products/variants', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const result = res?.data || res;
      const imageUrl = result?.secureUrl || result?.url;
      if (!imageUrl) throw new Error('Máy chủ không trả về URL ảnh');
      setFormVariants((current) => current.map((variant, index) =>
        index === variantIndex ? { ...variant, imageUrl } : variant,
      ));
      showToast(`Đã tải ảnh riêng cho SKU ${formVariants[variantIndex]?.sku || ''}`);
    } catch (err: any) {
      showToast(err?.response?.data?.message || err.message || 'Không thể tải ảnh phân loại');
    } finally {
      setUploadingImage(false);
      setUploadingSlot(null);
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (savingProduct) return;
    setSaveError(null);

    if (!editingProduct) {
      const issues: string[] = [];
      if (!formCategory.trim()) issues.push('Chọn danh mục sản phẩm.');
      if (formCategory === 'Danh mục khác (Tự nhập)' && !formCustomCategory.trim()) {
        issues.push('Nhập tên danh mục tùy chỉnh.');
      }
      if (!formSku.trim()) issues.push('Nhập mã SKU quản lý.');
      if (!formTitle.trim()) issues.push('Nhập tên sản phẩm.');
      if (!formImage.trim()) issues.push('Tải ảnh bìa chính của sản phẩm.');
      if (!Number.isFinite(Number(formPrice)) || Number(formPrice) <= 0) {
        issues.push('Nhập giá bán sản phẩm lớn hơn 0.');
      }
      if (formStock === '' || !Number.isInteger(Number(formStock)) || Number(formStock) < 0) {
        issues.push('Nhập tồn kho là số nguyên từ 0 trở lên.');
      }
      if (formSampleEnabled && (formSampleQuota === '' || !Number.isInteger(Number(formSampleQuota)) || Number(formSampleQuota) <= 0)) {
        issues.push('Nếu bật cấp sản phẩm mẫu, hãy nhập tổng suất mẫu lớn hơn 0.');
      }

      if (!formVariants.length) {
        issues.push('Thêm ít nhất một phân loại SKU.');
      } else {
        const fields = getVariantFields(formCategory);
        formVariants.forEach((variant, index) => {
          const missingAttributes = fields
            .filter((field) => !variant.attributes[field.key]?.trim())
            .map((field) => field.label);
          if (missingAttributes.length) {
            issues.push(`Phân loại ${index + 1}: nhập ${missingAttributes.join(', ')}.`);
          }
          if (!variant.name.trim()) issues.push(`Phân loại ${index + 1}: nhập tên hiển thị.`);
          if (!variant.sku.trim()) issues.push(`Phân loại ${index + 1}: nhập mã SKU.`);
          if (!variant.imageUrl.trim()) issues.push(`Phân loại ${index + 1}: tải ảnh riêng.`);
          if (!Number.isFinite(variant.price) || variant.price <= 0) {
            issues.push(`Phân loại ${index + 1}: nhập giá bán lớn hơn 0.`);
          }
          if (!Number.isInteger(variant.stockQuantity) || variant.stockQuantity < 0) {
            issues.push(`Phân loại ${index + 1}: nhập tồn kho là số nguyên từ 0 trở lên.`);
          }
        });
        const variantSkus = formVariants.map((variant) => variant.sku.trim().toLocaleUpperCase('vi-VN')).filter(Boolean);
        if (new Set(variantSkus).size !== variantSkus.length) {
          issues.push('Mã SKU của các phân loại phải khác nhau.');
        }
      }

      if (!formIngredients.trim()) issues.push('Nhập thành phần sản phẩm.');
      if (!formOrigin.trim()) issues.push('Nhập xuất xứ sản phẩm.');
      if (!formLabelInfo.trim()) issues.push('Nhập thông tin nhãn mác, cảnh báo và hướng dẫn sử dụng.');
      if (!formDescription.trim()) issues.push('Nhập mô tả chi tiết sản phẩm và điểm nổi bật.');

      const originProof = [...formOriginProofLinks, ...formOriginProofImages]
        .some((value) => value.trim());
      if (!originProof) issues.push('Thêm ít nhất một link hoặc ảnh minh chứng nguồn gốc.');
      const labelProof = [...formLabelProofLinks, ...formLabelProofImages]
        .some((value) => value.trim());
      if (!labelProof) issues.push('Thêm ít nhất một link hoặc ảnh minh chứng nhãn mác.');

      const proofLinks = [...formOriginProofLinks, ...formLabelProofLinks]
        .map((url) => url.trim()).filter(Boolean);
      if (proofLinks.some((url) => {
        try { return !['http:', 'https:'].includes(new URL(url).protocol); }
        catch { return true; }
      })) {
        issues.push('Link minh chứng phải là địa chỉ hợp lệ bắt đầu bằng http:// hoặc https://.');
      }

      if (issues.length) {
        setSaveError(`Hoàn thiện thông tin bắt buộc trước khi gửi duyệt:\n${issues.map((issue) => `• ${issue}`).join('\n')}`);
        showToast('Chưa gửi sản phẩm. Vui lòng kiểm tra danh sách thông tin còn thiếu.');
        window.requestAnimationFrame(() => {
          document.getElementById('product-save-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
        return;
      }
    }

    if (!formImage) {
      const message = 'Vui lòng tải lên ảnh chính (ảnh bìa) cho sản phẩm.';
      setSaveError(message);
      showToast(message);
      return;
    }

    if (!formTitle.trim()) {
      const message = 'Vui lòng nhập tên sản phẩm.';
      setSaveError(message);
      showToast(message);
      return;
    }

    if (!formCategory) {
      const message = 'Chọn loại sản phẩm để hiện đúng màu, size, dung tích hoặc quy cách phân loại.';
      setSaveError(message); showToast(message); return;
    }

    if (!formSku.trim()) {
      const message = 'Vui lòng nhập mã SKU sản phẩm.';
      setSaveError(message);
      showToast(message);
      return;
    }

    if (Number(formPrice) <= 0) {
      const message = 'Giá bán lẻ phải lớn hơn 0 ₫.';
      setSaveError(message);
      showToast(message);
      return;
    }

    if (formStock === '') {
      const message = 'Vui lòng nhập số lượng tồn kho.';
      setSaveError(message);
      showToast(message);
      return;
    }

    if (formVariants.some((variant) => !variant.name.trim() || !variant.sku.trim() || !variant.imageUrl.trim())) {
      const message = 'Mỗi phân loại cần có tên, SKU và ảnh riêng để ảnh hiển thị đúng khi khách chọn.';
      setSaveError(message);
      showToast(message);
      return;
    }
    if (formVariants.some((variant) => variant.name.trim().length > 150 || variant.sku.trim().length > 100)) {
      const message = 'Tên phân loại tối đa 150 ký tự và SKU tối đa 100 ký tự.';
      setSaveError(message); showToast(message); return;
    }
    if (formVariants.some((variant) => !variant.id && !getVariantFields(formCategory).some((field) => variant.attributes[field.key]?.trim()))) {
      const message = 'Mỗi phân loại mới cần ít nhất một thuộc tính phù hợp với danh mục.';
      setSaveError(message); showToast(message); return;
    }
    const optionKeys = formVariants.map((variant) => getVariantFields(formCategory)
      .map((field) => variant.attributes[field.key]?.trim().toLocaleLowerCase('vi-VN') || '').join('|'));
    const filledKeys = optionKeys.filter((key) => key.replace(/\|/g, '').trim());
    if (new Set(filledKeys).size !== filledKeys.length) {
      const message = 'Có phân loại trùng tổ hợp thuộc tính. Hãy nhập màu, size hoặc quy cách khác nhau cho từng SKU.';
      setSaveError(message); showToast(message); return;
    }

    const proofLinks = [...formOriginProofLinks, ...formLabelProofLinks].map((url) => url.trim()).filter(Boolean);
    if (proofLinks.some((url) => {
      try { return !['http:', 'https:'].includes(new URL(url).protocol); }
      catch { return true; }
    })) {
      const message = 'Link minh chứng cần là địa chỉ bắt đầu bằng http:// hoặc https://.';
      setSaveError(message); showToast(message); return;
    }

    const effectiveCategory =
      formCategory === 'Danh mục khác (Tự nhập)'
        ? formCustomCategory.trim() || 'Khác'
        : formCategory;

    setSavingProduct(true);
    try {
      if (editingProduct) {
        const productUpdate = await productService.updateProduct(editingProduct.id, {
          title: formTitle.trim(),
          categoryName: effectiveCategory,
          description: formDescription.trim() || undefined,
          ingredients: formIngredients.trim() || undefined,
          origin: formOrigin.trim() || undefined,
          labelInfo: formLabelInfo.trim() || undefined,
          originProofLinks: formOriginProofLinks.map((url) => url.trim()).filter(Boolean),
          originProofImages: formOriginProofImages,
          labelProofLinks: formLabelProofLinks.map((url) => url.trim()).filter(Boolean),
          labelProofImages: formLabelProofImages,
          price: Number(formPrice),
          customCommissionRate: formCommission === '' ? undefined : Number(formCommission),
          isAffiliateEnabled: formAffiliateEnabled,
          stockQuantity: Number(formStock),
          sampleEnabled: formSampleEnabled,
          sampleQuota: Number(formSampleQuota),
          imageUrl: formImage,
          subImages: formSubImages.filter(Boolean),
        });
        const variantUpdate = await productService.syncProductVariants(editingProduct.id, formVariants);
        for (const variant of editingProduct.variants || []) {
          const policy = variantSamplePolicies[variant.id];
          if (policy && formVariants.some((item) => item.id === variant.id)) {
            await productService.updateVariantSamplePolicy(editingProduct.id, variant.id, policy);
          }
        }
        showToast(productUpdate?.requiresModeration || variantUpdate?.requiresModeration
          ? 'Đã lưu thay đổi. Sản phẩm tạm ẩn và chờ Ban Quản Trị kiểm duyệt lại.'
          : 'Cập nhật sản phẩm & hoa hồng thành công!');
      } else {
        const created = await productService.createProduct({
          storeId: currentStoreId,
          sku: formSku.trim().toUpperCase(),
          title: formTitle.trim(),
          categoryName: effectiveCategory,
          description: formDescription.trim() || undefined,
          ingredients: formIngredients.trim() || undefined,
          origin: formOrigin.trim() || undefined,
          labelInfo: formLabelInfo.trim() || undefined,
          originProofLinks: formOriginProofLinks.map((url) => url.trim()).filter(Boolean),
          originProofImages: formOriginProofImages,
          labelProofLinks: formLabelProofLinks.map((url) => url.trim()).filter(Boolean),
          labelProofImages: formLabelProofImages,
          price: Number(formPrice),
          customCommissionRate: formCommission === '' ? undefined : Number(formCommission),
          isAffiliateEnabled: formAffiliateEnabled,
          stockQuantity: Number(formStock),
          sampleEnabled: formSampleEnabled,
          sampleQuota: Number(formSampleQuota),
          imageUrl: formImage,
          subImages: formSubImages.filter(Boolean),
          variants: formVariants,
        });
        if (!created?.product?.id && !created?.id) throw new Error('Không nhận được mã sản phẩm đã tạo');
        showToast('Đã thêm sản phẩm mới vào danh mục gian hàng!');
      }
      setSaveError(null);
      setShowModal(false);
      loadProducts();
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Lỗi khi lưu sản phẩm.';
      const readableMessage = Array.isArray(message) ? message.join(', ') : String(message);
      setSaveError(readableMessage);
      showToast(readableMessage);
    } finally {
      setSavingProduct(false);
    }
  };



  const demoProducts =
    products.length > 0
      ? products
      : [
          {
            id: 'p-1',
            sku: 'SR-VTC-15',
            title: 'Serum Vitamin C 15% Dưỡng Sáng Đều Màu Da',
            category: 'Chăm sóc da',
            price: 459000,
            commissionRate: 8,
            stockQuantity: 120,
            status: 'active',
            images: ['/assets/products/real/vitamin-c-15-serum.jpg'],
          },
          {
            id: 'p-2',
            sku: 'SUN-SPF50-PA',
            title: 'Kem Chống Nắng Phổ Rộng SPF50+ PA++++ Kiểm Dầu',
            category: 'Chống nắng',
            price: 389000,
            commissionRate: 10,
            stockQuantity: 84,
            status: 'active',
            images: ['/assets/products/real/spf50-oil-control.jpg'],
          },
          {
            id: 'p-3',
            sku: 'CL-GEL-TEA',
            title: 'Gel Rửa Mặt Tràm Trà Trị Mụn Dịu Nhẹ',
            category: 'Làm sạch',
            price: 219000,
            commissionRate: 12,
            stockQuantity: 0,
            status: 'out_of_stock',
            images: ['/assets/products/real/tea-tree-cleanser.jpg'],
          },
          {
            id: 'p-4',
            sku: 'TN-BHA-2',
            title: 'Toner BHA 2% Thu Nhỏ Lỗ Chân Lông & Tẩy Tế Bào Chết',
            category: 'Toner & Nước hoa hồng',
            price: 349000,
            commissionRate: 7,
            stockQuantity: 45,
            status: 'active',
            images: ['/assets/products/real/bha-toner-2pct.png'],
          },
          {
            id: 'p-5',
            sku: 'MSK-HYA-5X',
            title: 'Mặt Nạ Cấp Ẩm Chuyên Sâu Hyaluronic Acid 5X',
            category: 'Mặt nạ',
            price: 199000,
            commissionRate: 15,
            stockQuantity: 15,
            status: 'paused',
            images: ['/assets/products/real/centella-sheet-mask.jpg'],
          },
        ];

  void demoProducts;

  const displayProducts = products;

  const filtered = displayProducts.filter((p: any) => {
    const title = p.title || p.name || '';
    const sku = p.sku || '';
    const matchSearch =
      title.toLowerCase().includes(search.toLowerCase()) ||
      sku.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'DRAFT' && p.moderationStatus === 'DRAFT') ||
      (filterStatus === 'REJECTED' && p.moderationStatus === 'REJECTED') ||
      (filterStatus === 'APPROVED' && p.moderationStatus === 'APPROVED') ||
      (filterStatus === 'active' && (p.status === 'active' || p.isActive)) ||
      (filterStatus === 'out_of_stock' && (p.status === 'out_of_stock' || p.stockQuantity === 0)) ||
      (filterStatus === 'paused' && (p.status === 'paused' || p.isActive === false)) ||
      (filterStatus === 'low_stock' && Number(p.stockQuantity ?? p.stock ?? 0) > 0 && Number(p.stockQuantity ?? p.stock ?? 0) <= 5);
    return matchSearch && matchStatus;
  });

  return (
    <div className="product-management space-y-4 text-left w-full min-w-0 pt-4">
            {toastMsg && (
        <div className="fixed top-5 right-5 z-[100] p-3.5 bg-white text-[#1A1612] border border-[#EEDFC6] rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ────── BANNER CẢNH BÁO TỒN KHO THẤP ────── */}
      {(() => {
        if (isKol) return null;
        const LOW = 5;
        const lowStockProducts = products.filter((p: any) => {
          const s = p.stockQuantity ?? p.stock ?? 0;
          return s > 0 && s <= LOW;
        });
        const outOfStockProducts = products.filter((p: any) => {
          const s = p.stockQuantity ?? p.stock ?? 0;
          return s === 0 && (p.isActive !== false);
        });
        if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) return null;
        return (
          <div className="rounded-xl border border-[#EEDFC6] bg-white px-3 py-3 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <AlertCircle className="h-4 w-4 text-[#B88E4F]" />
              <span className="font-semibold text-[#1A1612] text-xs">Lưu ý tồn kho</span>
            </div>
            <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-1 flex-1 text-xs text-[#7D715E]">
              {outOfStockProducts.length > 0 && (
                <span>
                  <strong className="text-red-700">{outOfStockProducts.length} sản phẩm đã hết hàng</strong>
                </span>
              )}
              {lowStockProducts.length > 0 && (
                <span>
                  <strong className="font-medium text-[#8C6226]">{lowStockProducts.length} sản phẩm tồn thấp (1–5)</strong>
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setFilterStatus(outOfStockProducts.length > 0 ? 'out_of_stock' : 'low_stock')}
              className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#FBF5EB] hover:bg-[#F3EFE6] text-[#8C6226] transition cursor-pointer"
            >
              {outOfStockProducts.length > 0 ? 'Xem hàng đã hết' : 'Xem tồn thấp'}
            </button>
          </div>
        );
      })()}

      {/* Unified Toolbar: Compact Search, Filters & Action Buttons in One Row */}
      <Card className="product-toolbar p-3 bg-white border border-[#EAE4D7] rounded-xl shadow-none">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left: Compact search input & filter controls */}
          <div className="product-filter-controls flex min-w-0 flex-wrap items-center gap-2.5">
            <div className="product-search flex items-center gap-2 bg-white border border-[#EAE4D7] rounded-lg px-3 h-9 text-xs text-[#1A1612] w-full sm:w-64 focus-within:border-[#C59B58] transition">
              <Search className="w-3.5 h-3.5 text-[#7D715E] shrink-0" />
              <input
                type="text"
                aria-label="Tìm tên hoặc SKU sản phẩm"
                placeholder="Tìm tên hoặc SKU sản phẩm..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-transparent border-none outline-none text-xs text-[#1A1612] placeholder-[#7D715E]/60"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="text-[#7D715E] hover:text-[#1A1612] text-xs font-bold cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              aria-label="Lọc trạng thái sản phẩm" className="h-9 min-w-[160px] rounded-lg text-xs"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="DRAFT">Chờ kiểm duyệt</option>
              <option value="REJECTED">Bị từ chối</option>
              <option value="APPROVED">Đã được duyệt</option>
              <option value="active">Đang bán</option>
              <option value="out_of_stock">Hết hàng</option>
              <option value="low_stock">Tồn thấp (1–5)</option>
              <option value="paused">Tạm dừng</option>
            </Select>

          </div>

          {/* Right: Action Buttons (Duyệt video KOL, Duyệt đánh giá, Thêm sản phẩm) - Borderless Icon & Text */}
          <div className="product-toolbar-actions flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3">
            {!isKol ? (
              <>
                {isAdminOrManager && (
                  <button
                    type="button"
                    onClick={() => navigate('/admin/product-moderation')}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#C59B58] hover:text-[#B88E4F] transition cursor-pointer bg-transparent border-0 p-0"
                    title="Mở cổng kiểm duyệt sản phẩm chuyên sâu"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C59B58]" />
                    <span>Cổng duyệt sản phẩm</span>
                    {pendingApprovalCount > 0 && (
                      <span className="min-w-4.5 h-4.5 px-1.5 rounded-full bg-[#FAF0DD] border border-[#E8D4B0] text-[#B88E4F] text-[10px] font-extrabold inline-flex items-center justify-center">
                        {pendingApprovalCount}
                      </span>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={openAllVideoModeration}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B88E4F] hover:text-[#1A1612] transition cursor-pointer bg-transparent border-0 p-0"
                  title="Duyệt video nghiệm thu từ KOL"
                >
                  <Video className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span>Duyệt video KOL</span>
                  {pendingKolVideoCount > 0 && (
                    <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-[#FAF0DD] border border-[#E8D4B0] text-[#B88E4F] text-[10px] font-extrabold inline-flex items-center justify-center">
                      {pendingKolVideoCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={openReviewModeration}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#7D715E] hover:text-[#1A1612] transition cursor-pointer bg-transparent border-0 p-0"
                  title="Duyệt đánh giá từ khách hàng"
                >
                  <MessageSquareText className="w-3.5 h-3.5 text-[#7D715E]" />
                  <span>Duyệt đánh giá</span>
                </button>

                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-1 text-xs font-bold text-[#B88E4F] hover:text-[#1A1612] transition cursor-pointer bg-transparent border-0 p-0"
                  title="Thêm sản phẩm mới vào kho"
                >
                  <Plus className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span>Thêm sản phẩm</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/collaborator/links')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#B88E4F] hover:text-[#1A1612] transition cursor-pointer bg-transparent border-0 p-0"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#B88E4F]" />
                <span>Tạo link tiếp thị</span>
              </button>
            )}
          </div>
        </div>
      </Card>


      <Card className="product-table-card p-0 min-w-0 shadow-none">
        <Table className="product-table">
          <colgroup><col style={{width:40}} /><col /><col style={{width:120}} /><col style={{width:85}} /><col style={{width:85}} /><col style={{width:140}} /><col style={{width:270}} /></colgroup>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <input
                  type="checkbox"
                  checked={selectedIds.length === filtered.length && filtered.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                />
              </TableHead>
              <TableHead>Sản phẩm</TableHead>
              <TableHead>Giá bán</TableHead>
              <TableHead>Hoa hồng</TableHead>
              <TableHead>Tồn kho</TableHead>
              <TableHead>Trạng thái</TableHead>
              <TableHead className="text-right">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((p: any) => {
              const title = p.title || p.name;
              const sku = p.sku || 'SKU';
              const price = p.price || 0;
              const rate = p.customCommissionRate ?? p.commissionRate ?? 10;
              const stock = p.stockQuantity ?? p.stock ?? 0;
              const img = getSafeProductImageUrl(p.imageUrl || p.images?.[0] || p.image, title, p.categoryName);
              const status =
                p.status || (p.isActive === false ? 'paused' : stock === 0 ? 'out_of_stock' : 'active');
              const moderationStatus = p.moderationStatus || 'APPROVED';

              return (
                <TableRow key={p.id}>
                  <TableCell data-label="Chọn" className="product-selection">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={(e) => handleSelectOne(p.id, e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                  </TableCell>
                  <TableCell data-label="Sản phẩm" className="product-identity">
                    <div className="flex min-w-0 items-center gap-3">
                      {img ? (
                        <img
                          src={img}
                          alt={title}
                          className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-xl border border-slate-200 bg-slate-50 shrink-0 flex items-center justify-center text-slate-400">
                          <ImagePlus size={17} />
                        </div>
                      )}
                      <div className="min-w-0">
                        <strong title={title} className="text-sm font-semibold text-[#1A1612] block line-clamp-2 break-words">
                          {title}
                        </strong>
                        <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                          {sku}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell data-label="Giá bán" className="font-semibold text-[#1A1612] whitespace-nowrap tabular-nums">
                    {Number(price).toLocaleString('vi-VN')} ₫
                  </TableCell>
                  <TableCell data-label="Hoa hồng">
                    <Badge variant="amber" className="font-extrabold text-xs">
                      {rate}%
                    </Badge>
                  </TableCell>
                  <TableCell data-label="Tồn kho">
                    {(() => {
                      const LOW = 5;
                      if (stock === 0) {
                        return (
                          <span className="inline-flex items-center gap-1 font-bold text-rose-600 text-xs">
                            0 — Hết hàng
                          </span>
                        );
                      }
                      if (stock <= LOW) {
                        return (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-600 text-xs">
                            {stock} <span className="text-[#8C6226]">· Thấp</span>
                          </span>
                        );
                      }
                      return (
                        <span className="font-semibold text-slate-700 text-xs">
                          {stock}
                        </span>
                      );
                    })()}
                  </TableCell>
                  <TableCell data-label="Trạng thái">
                    <div className="flex flex-col items-start gap-1">
                      {moderationStatus === 'DRAFT' && <Badge variant="warning">Chờ kiểm duyệt</Badge>}
                      {moderationStatus === 'REJECTED' && <Badge variant="danger">Bị từ chối</Badge>}
                      {moderationStatus === 'APPROVED' && status === 'active' && <Badge variant="amber">Đang bán</Badge>}
                      {moderationStatus === 'APPROVED' && status === 'out_of_stock' && <Badge variant="danger">Hết hàng</Badge>}
                      {moderationStatus === 'APPROVED' && status === 'paused' && <Badge variant="neutral">Tạm dừng</Badge>}
                      {moderationStatus === 'REJECTED' && p.moderationReason && (
                        <span className="max-w-56 text-left text-[10px] leading-relaxed text-rose-700" title={p.moderationReason}>
                          {p.moderationReason}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell data-label="Thao tác" className="product-row-actions text-right">
                    {isKol ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="amber"
                          size="sm"
                          icon={<Link2 className="w-3.5 h-3.5" />}
                          onClick={() => navigate('/collaborator/links')}
                        >
                          Lấy Link
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          icon={<Package className="w-3.5 h-3.5" />}
                          onClick={() => navigate('/collaborator/samples')}
                        >
                          Xin mẫu
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Nút hành động Kiểm duyệt dành riêng cho Quản trị viên / Vận hành */}
                        {isAdminOrManager && (
                          <>
                            {moderationStatus === 'DRAFT' && (
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setModeratingProduct(p);
                                    setModeratingAction('APPROVED');
                                  }}
                                  disabled={moderationSubmitting}
                                  className="h-8 px-2.5 rounded-lg bg-[#C59B58] hover:bg-[#B88E4F] text-[#231D15] text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                                  title="Phê duyệt sản phẩm lên sàn ngay"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Duyệt</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setModeratingProduct(p);
                                    setModeratingAction('REJECTED');
                                    setModerationReason('');
                                  }}
                                  disabled={moderationSubmitting}
                                  className="h-8 px-2 rounded-lg border border-[#DC2626] text-[#DC2626] hover:bg-[#FEF2F2] text-[11px] font-bold flex items-center gap-1 transition cursor-pointer active:scale-95 disabled:opacity-50"
                                  title="Từ chối duyệt và ghi lý do vi phạm"
                                >
                                  <Ban className="w-3.5 h-3.5" />
                                  <span>Từ chối</span>
                                </button>
                              </div>
                            )}

                            {moderationStatus === 'APPROVED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setModeratingProduct(p);
                                  setModeratingAction('REJECTED');
                                  setModerationReason('Phát hiện nội dung vi phạm quy chế hoặc thuộc danh mục hàng cấm');
                                }}
                                className="w-8 h-8 rounded-lg border border-[#EAE4D7] text-[#7D715E] hover:text-[#DC2626] hover:bg-[#FEF2F2] flex items-center justify-center transition cursor-pointer"
                                title="Thu hồi duyệt / Khóa sản phẩm vi phạm"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {moderationStatus === 'REJECTED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  setModeratingProduct(p);
                                  setModeratingAction('APPROVED');
                                }}
                                className="h-8 px-2 rounded-lg border border-[#EEDFC6] text-[#8C6226] hover:bg-[#FBF5EB] text-[11px] font-semibold flex items-center gap-1 transition cursor-pointer"
                                title="Xem xét và duyệt lại sản phẩm này"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>Duyệt lại</span>
                              </button>
                            )}
                          </>
                        )}

                        <button
                          type="button"
                          onClick={() => openProductLanding(p)}
                          className="w-8 h-8 rounded-lg border border-[#EAE4D7] text-[#B88E4F] hover:bg-[#FBF5EB] flex items-center justify-center transition cursor-pointer"
                          title="Xem Landing Page công khai của sản phẩm"
                          aria-label={`Xem trang mua hàng của ${p.title}`}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditModal(p)}
                          className="w-8 h-8 rounded-lg border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 flex items-center justify-center transition cursor-pointer"
                          title="Chỉnh sửa sản phẩm"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmProduct(p)}
                          className="w-8 h-8 rounded-lg border border-slate-200 text-rose-500 hover:text-rose-700 hover:bg-rose-50 flex items-center justify-center transition cursor-pointer"
                          title="Tạm dừng / Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>


      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        icon={<Package className="h-4 w-4" />}
        title={editingProduct ? 'Cập Nhật Sản Phẩm & Hoa Hồng' : 'Thêm Sản Phẩm Mới'}
        subtitle="Hoàn thiện hồ sơ sản phẩm để gửi Ban Quản Trị kiểm duyệt"
        maxWidth="3xl"
        stickyHeader
        className="max-h-[90vh] overflow-y-auto rounded-3xl border-[#EAE4D7] shadow-[0_24px_80px_rgba(35,29,21,0.18)]"
      >
        <form noValidate onSubmit={handleSave} className="flex flex-col gap-5">
          {saveError && (
            (() => {
              const missingItems = saveError.split('\n').slice(1)
                .map((item) => item.replace(/^•\s*/, '').trim()).filter(Boolean);
              return (
                <div id="product-save-error" role="alert" className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50/80 px-4 py-3 text-rose-900">
                  <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-rose-600 ring-1 ring-rose-200">
                    <AlertCircle className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    {missingItems.length ? (
                      <>
                        <p className="text-sm font-semibold leading-5">Chưa thể gửi duyệt</p>
                        <p className="mt-0.5 text-xs leading-5 text-rose-800">
                          Còn <strong>{missingItems.length} mục</strong> bắt buộc cần hoàn thiện.
                        </p>
                        <details className="mt-1.5">
                          <summary className="w-fit cursor-pointer text-xs font-semibold text-[#8C6226] marker:text-[#B88E4F] hover:underline">
                            Xem danh sách cần bổ sung
                          </summary>
                          <ul className="mt-2 grid list-disc gap-x-6 gap-y-1 border-t border-rose-200/80 pt-2 pl-5 text-xs leading-5 text-[#6B5142] sm:grid-cols-2">
                            {missingItems.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}
                          </ul>
                        </details>
                      </>
                    ) : (
                      <p className="whitespace-pre-line text-sm font-medium leading-5">{saveError}</p>
                    )}
                  </div>
                </div>
              );
            })()
          )}
          {!editingProduct && (
            <div className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-3.5 py-3 text-xs leading-relaxed text-[#6F4E20]">
              Hoàn tất thông tin sản phẩm và minh chứng có dấu <span className="font-bold text-[#DC2626]">*</span> trước khi gửi duyệt. Cấp mẫu và hoa hồng là tùy chọn, có thể thiết lập sau.
            </div>
          )}
          {editingProduct?.moderationStatus === 'REJECTED' && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-800">
              <strong className="block">Sản phẩm chưa được duyệt</strong>
              <span>{editingProduct.moderationReason || 'Hãy chỉnh sửa thông tin sản phẩm theo yêu cầu của Ban Quản Trị.'}</span>
              <span className="mt-1 block font-semibold">Lưu thay đổi sẽ gửi lại sản phẩm vào hàng đợi kiểm duyệt.</span>
            </div>
          )}
          {/* SECTION 1: THÔNG TIN CƠ BẢN SẢN PHẨM */}
          <div className="flex flex-col gap-4 rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-[0_2px_10px_rgba(35,29,21,0.035)] sm:p-5">
            <div className="flex items-center gap-3 border-b border-[#EAE4D7] pb-3">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#1A1612]">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB]">
                  <FolderTree className="h-4 w-4 text-[#B88E4F]" />
                </span>
                1. Thông tin cơ bản sản phẩm
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Danh mục sản phẩm <span className="text-rose-500">*</span>
                </label>
                <div>
                  <Select
                    value={formCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                    required
                    className="w-full"
                  >
                    <option value="" disabled>Chọn loại sản phẩm</option>
                    {STANDARD_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.name}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </Select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Mã SKU quản lý <span className="text-rose-500">*</span>
                  </label>
                  {!editingProduct && (
                    <button
                      type="button"
                      onClick={() => {
                        const cat = STANDARD_CATEGORIES.find((c) => c.name === formCategory);
                        const prefix = cat?.prefix || 'PROD';
                        const randomCode = Math.random().toString(36).substring(2, 7).toUpperCase();
                        setFormSku(`${prefix}-${randomCode}`);
                      }}
                      className="text-[10.5px] font-bold text-[#B88E4F] hover:underline cursor-pointer"
                    >
                      Tạo ngẫu nhiên
                    </button>
                  )}
                </div>
                <div className="relative flex items-center">
                  <Tag className="w-4 h-4 text-[#B88E4F] absolute left-3 pointer-events-none" />
                  <input
                    type="text"
                    value={formSku}
                    onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                    placeholder="VD: SKIN-A109"
                    required
                    className="w-full bg-white border border-[#EAE4D7] rounded-xl pl-9 pr-3 py-2 text-sm text-[#1A1612] font-semibold focus:border-[#B88E4F] focus:ring-2 focus:ring-[#B88E4F]/20 outline-none transition font-mono"
                  />
                </div>
              </div>
            </div>

            {formCategory === 'Danh mục khác (Tự nhập)' && (
              <div className="pt-1">
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nhập tên danh mục tùy chỉnh <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formCustomCategory}
                  onChange={(e) => setFormCustomCategory(e.target.value)}
                  placeholder="VD: Mẹ & Bé, Đồ gia dụng thông minh..."
                  required
                  className="w-full bg-white border border-[#EAE4D7] rounded-xl px-3 py-2 text-sm text-[#1A1612] font-medium focus:border-[#B88E4F] focus:ring-2 focus:ring-[#B88E4F]/20 outline-none transition"
                />
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Tên sản phẩm <span className="text-rose-500">*</span>
              </label>
              <div className="relative flex items-center">
                <Package className="w-4 h-4 text-[#B88E4F] absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => {
                    const title = e.target.value;
                    setFormTitle(title);
                    if (!formCategory) {
                      const suggestedCategory = inferCategoryFromTitle(title);
                      if (suggestedCategory) handleCategoryChange(suggestedCategory);
                    }
                  }}
                  placeholder="VD: Áo polo nam, serum dưỡng da, tai nghe Bluetooth..."
                  required
                  className="w-full bg-white border border-[#EAE4D7] rounded-xl pl-9 pr-3 py-2 text-sm text-[#1A1612] font-semibold focus:border-[#B88E4F] focus:ring-2 focus:ring-[#B88E4F]/20 outline-none transition"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: BỘ SƯU TẬP 5 ẢNH (1 CHÍNH + 4 PHỤ) */}
          <div className="bg-[#FAF8F5] border border-[#EAE4D7] rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-[#1A1612] uppercase tracking-wider flex items-center gap-1.5">
                  <Camera className="w-3.5 h-3.5 text-[#B88E4F]" />
                  2. Thư viện hình ảnh sản phẩm (Tối đa 5 ảnh)
                </span>
                <p className="text-[11px] text-[#7D715E] mt-0.5">
                  Gồm 1 ảnh chính bắt buộc (ảnh bìa marketplace) và tối đa 4 ảnh phụ cho gallery.
                </p>
              </div>

              <div>
                <input
                  id="bulk-images-input"
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={(e) => {
                    void handleBulkUpload(e.target.files);
                    e.target.value = '';
                  }}
                />
                <button
                  type="button"
                  onClick={() => document.getElementById('bulk-images-input')?.click()}
                  disabled={uploadingImage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-[#1A1612] bg-white hover:bg-[#F3EFE6] border border-[#EAE4D7] shadow-2xs transition cursor-pointer disabled:opacity-50"
                >
                  <UploadCloud size={13} className="text-[#B88E4F]" />
                  <span>{uploadingSlot === 'bulk' ? 'Đang tải hàng loạt...' : 'Tải lên nhiều ảnh'}</span>
                </button>
              </div>
            </div>

            {/* 5 IMAGE SLOTS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
              {/* SLOT 0: MAIN IMAGE (REQUIRED) */}
              <div className="flex flex-col gap-1.5">
                <input
                  id="main-image-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleUploadSingleImage(f, true);
                    e.target.value = '';
                  }}
                />

                <div
                  className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all flex flex-col items-center justify-center text-center p-2 group ${
                    formImage
                      ? 'border-[#C59B58] bg-white shadow-xs'
                      : 'border-dashed border-[#C59B58] bg-[#FFFBF4] hover:bg-[#FFF8EB] cursor-pointer'
                  }`}
                  onClick={() => {
                    if (!formImage && !uploadingImage) {
                      document.getElementById('main-image-input')?.click();
                    }
                  }}
                >
                  {formImage ? (
                    <>
                      <img
                        src={formImage}
                        alt="Ảnh chính sản phẩm"
                        className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                      />
                      <div className="absolute top-1.5 left-1.5 bg-[#EBD08C] text-white text-[9.5px] font-extrabold px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-1">
                        <span>⭐</span>
                        <span>CHÍNH</span>
                      </div>
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1 backdrop-blur-xs">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            document.getElementById('main-image-input')?.click();
                          }}
                          className="px-2 py-1 rounded-lg bg-white/90 hover:bg-white text-[10px] font-bold text-[#1A1612] shadow-xs cursor-pointer"
                        >
                          Đổi ảnh
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFormImage('');
                          }}
                          className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-[10px] font-bold text-white shadow-xs cursor-pointer"
                        >
                          Gỡ ảnh
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center gap-1">
                      <div className="w-8 h-8 rounded-xl bg-[#EBD08C]/60 flex items-center justify-center text-[#991B1B]">
                        <ImagePlus size={16} />
                      </div>
                      <span className="text-[10px] font-extrabold text-[#991B1B] leading-tight">
                        ⭐ ẢNH CHÍNH
                      </span>
                      <span className="text-[9px] text-[#A89066] font-medium leading-tight">
                        {uploadingSlot === 'main' ? 'Đang tải...' : 'Bắt buộc'}
                      </span>
                    </div>
                  )}
                </div>
                <span className="text-[10.5px] font-bold text-center text-[#B88E4F]">Ảnh bìa chính</span>
              </div>

              {/* SLOTS 1 TO 4: SUB IMAGES */}
              {[0, 1, 2, 3].map((subIdx) => {
                const subUrl = formSubImages[subIdx];
                const inputId = `sub-image-input-${subIdx}`;
                const isCurrentUploading = uploadingSlot === `sub-${subIdx}`;

                return (
                  <div key={subIdx} className="flex flex-col gap-1.5">
                    <input
                      id={inputId}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) void handleUploadSingleImage(f, false, subIdx);
                        e.target.value = '';
                      }}
                    />

                    <div
                      className={`relative aspect-square rounded-2xl overflow-hidden border-2 transition-all flex flex-col items-center justify-center text-center p-2 group ${
                        subUrl
                          ? 'border-[#EAE4D7] bg-white shadow-xs hover:border-[#C59B58]'
                          : 'border-dashed border-slate-200 bg-white hover:border-[#C59B58]/60 hover:bg-[#FAF8F5] cursor-pointer'
                      }`}
                      onClick={() => {
                        if (!subUrl && !uploadingImage) {
                          document.getElementById(inputId)?.click();
                        }
                      }}
                    >
                      {subUrl ? (
                        <>
                          <img
                            src={subUrl}
                            alt={`Ảnh phụ ${subIdx + 1}`}
                            className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                          />
                          <div className="absolute top-1.5 left-1.5 bg-slate-800/80 text-white text-[9.5px] font-bold px-1.5 py-0.5 rounded-md shadow-xs">
                            Phụ {subIdx + 1}
                          </div>
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-1 backdrop-blur-xs">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSetAsMain(subIdx);
                              }}
                              className="w-full py-1 rounded-lg bg-[#EBD08C] hover:bg-[#DEC07A] text-[9.5px] font-bold text-white shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                              title="Chuyển ảnh này thành ảnh bìa chính"
                            >
                              <Crown size={11} />
                              <span>Đặt làm chính</span>
                            </button>
                            <div className="flex items-center gap-1 w-full">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  document.getElementById(inputId)?.click();
                                }}
                                className="flex-1 py-1 rounded-lg bg-white/90 hover:bg-white text-[9.5px] font-bold text-[#1A1612] shadow-xs cursor-pointer"
                              >
                                Đổi
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveSubImage(subIdx);
                                }}
                                className="px-2 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-[9.5px] font-bold text-white shadow-xs cursor-pointer"
                                title="Xóa ảnh này"
                              >
                                <X size={11} />
                              </button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 text-slate-400 group-hover:text-[#B88E4F]">
                          <Plus size={18} strokeWidth={2.5} />
                          <span className="text-[10px] font-bold">
                            {isCurrentUploading ? 'Đang tải...' : `Ảnh phụ ${subIdx + 1}`}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-[10.5px] font-medium text-center text-slate-500">
                      Ảnh phụ {subIdx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-5 rounded-[22px] border border-[#EAE4D7] bg-[#FAF8F5] p-4 shadow-[0_2px_12px_rgba(35,29,21,0.03)] sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#EAE4D7] pb-4">
              <div className="flex min-w-0 items-start gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB]">
                  <Package className="h-4 w-4 text-[#B88E4F]" />
                </span>
                <div>
                <span className="text-xs font-bold text-[#1A1612] uppercase tracking-wide">
                  3. Phân loại sản phẩm và ảnh riêng theo SKU <span className="text-[#DC2626]">*</span>
                </span>
                <p className="mt-1.5 text-xs leading-relaxed text-[#7D715E]">
                  {formCategory
                    ? `Tạo ít nhất một SKU. Mỗi phân loại cần đủ ${getVariantFields(formCategory).map((field) => field.label.toLowerCase()).join(' · ')}, ảnh, giá và tồn kho.`
                    : 'Chọn loại sản phẩm bên dưới để hiện đúng trường phân loại, ví dụ quần áo có màu, size và kiểu mẫu.'}
                </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!formCategory) {
                    showToast('Vui lòng chọn loại sản phẩm trước khi thêm phân loại.');
                    document.getElementById('variant-product-category')?.focus();
                    return;
                  }
                  const newVariantIndex = formVariants.length;
                  addVariant();
                  window.setTimeout(() => {
                    const newVariantCard = document.getElementById(`variant-card-${newVariantIndex}`);
                    newVariantCard?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                    newVariantCard?.querySelector<HTMLInputElement>('input:not([type="file"])')?.focus({ preventScroll: true });
                  }, 0);
                }}
                className="shrink-0 border-[#EEDFC6] bg-white text-[#6F4E20] shadow-sm hover:border-[#C59B58] hover:bg-[#FBF5EB]"
              >
                <PlusCircle size={14} /> Thêm phân loại
              </Button>
            </div>

            <label className="grid gap-2 text-xs font-bold text-[#1A1612] sm:max-w-lg">
              <span>Loại sản phẩm cần phân loại <span className="text-[#DC2626]">*</span></span>
              <Select id="variant-product-category" value={formCategory} onChange={(event) => handleCategoryChange(event.target.value)} required className="w-full bg-white font-normal shadow-sm">
                <option value="" disabled>Chọn thời trang, mỹ phẩm, điện tử...</option>
                {STANDARD_CATEGORIES.map((category) => <option key={category.id} value={category.name}>{category.icon} {category.name}</option>)}
              </Select>
              <span className="font-normal text-[#7D715E]">Đồng bộ với danh mục sản phẩm ở mục 1.</span>
            </label>

            {formCategory && (
              <div className="rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-[0_2px_8px_rgba(35,29,21,0.03)] sm:p-5">
                <p className="text-sm font-bold text-[#1A1612]">Nhập các lựa chọn để tạo tổ hợp phân loại</p>
                <p className="mt-1 text-xs leading-relaxed text-[#7D715E]">Ngăn cách nhiều giá trị bằng dấu phẩy. Ví dụ màu Đen, Trắng và size S, M sẽ tạo 4 SKU. Giá, tồn kho và ảnh điền riêng sau khi tạo.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {getVariantFields(formCategory).map((field) => (
                    <label key={field.key} className="grid gap-1.5 text-xs font-semibold text-[#7D715E]">
                      {field.label}
                      <input
                        value={variantOptionLists[field.key] || ''}
                        onChange={(event) => setVariantOptionLists((current) => ({ ...current, [field.key]: event.target.value }))}
                        placeholder={field.placeholder}
                        className="min-w-0 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 py-2.5 text-sm font-normal text-[#1A1612] outline-none transition focus:border-[#B88E4F] focus:ring-2 focus:ring-[#C59B58]/15"
                      />
                    </label>
                  ))}
                </div>
                <button type="button" onClick={generateVariantCombinations} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#C59B58] px-4 py-2.5 text-xs font-bold text-[#231D15] shadow-sm transition hover:bg-[#B88E4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B88E4F] focus-visible:ring-offset-2">
                  <PlusCircle size={14} /> Tạo tổ hợp SKU
                </button>
              </div>
            )}

            {formCategory === 'Mỹ phẩm & Chăm sóc da' && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#EAE4D7] bg-white px-4 py-3 text-xs">
                <span className="mr-1 font-medium text-[#7D715E]">Tạo nhanh dung tích:</span>
                {['30 ml', '50 ml', '100 ml'].map((value) => <button key={value} type="button" onClick={() => addVariant({ key: 'volume', value })} className="rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-1.5 font-semibold text-[#8C6226] transition hover:border-[#C59B58] hover:bg-white">+ {value}</button>)}
              </div>
            )}
            {formCategory === 'Thời trang & Phụ kiện' && (
              <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[#EAE4D7] bg-white px-4 py-3 text-xs">
                <span className="mr-1 font-medium text-[#7D715E]">Tạo nhanh size:</span>
                {['S', 'M', 'L', 'XL'].map((value) => <button key={value} type="button" onClick={() => addVariant({ key: 'size', value })} className="rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-1.5 font-semibold text-[#8C6226] transition hover:border-[#C59B58] hover:bg-white">+ {value}</button>)}
              </div>
            )}

            {formVariants.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#D8C7A8] bg-white p-6 text-center text-xs leading-relaxed text-[#7D715E]">
                {formCategory
                  ? 'Chưa có phân loại. Thêm từng màu, size, dung tích hoặc quy cách thực tế của sản phẩm.'
                  : 'Chọn loại sản phẩm trước để tạo các phân loại phù hợp.'}
              </div>
            ) : (
              <div className="space-y-4 border-t border-[#EAE4D7] pt-4">
                {formVariants.map((variant, index) => (
                  <div id={`variant-card-${index}`} key={variant.id || `new-${index}`} className="grid min-w-0 grid-cols-1 items-start gap-4 rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-[0_2px_8px_rgba(35,29,21,0.03)] md:grid-cols-[112px_minmax(0,1fr)_auto] sm:p-5">
                    <div className="flex items-center gap-3 md:flex-col md:items-stretch">
                      <input
                        id={`variant-image-input-${index}`}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingImage}
                        onChange={(event) => {
                          void handleUploadVariantImage(index, event.target.files?.[0]);
                          event.target.value = '';
                        }}
                      />
                      <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] md:w-full">
                        {variant.imageUrl ? (
                          <img src={variant.imageUrl} alt={`Ảnh ${variant.name || `phân loại ${index + 1}`}`} className="w-full h-full object-cover" />
                        ) : (
                          <ImagePlus size={22} className="text-[#B88E4F]" />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById(`variant-image-input-${index}`)?.click()}
                        disabled={uploadingImage}
                        className="border-[#EEDFC6] bg-white text-[#6F4E20] hover:bg-[#FBF5EB]"
                      >
                        {uploadingSlot === `variant-${index}` ? 'Đang tải…' : 'Tải ảnh SKU'} <span className="text-[#DC2626]">*</span>
                      </Button>
                    </div>

                    <div className="grid min-w-0 grid-cols-1 gap-x-3 gap-y-3 sm:grid-cols-2">
                      {getVariantFields(formCategory).map((field) => (
                        <label key={field.key} className="min-w-0 text-xs font-semibold text-[#7D715E]">
                          {field.label} <span className="text-[#DC2626]">*</span>
                          <input
                            value={variant.attributes[field.key] || ''}
                            maxLength={80}
                            onChange={(event) => setFormVariants((current) => current.map((item, itemIndex) => {
                              if (itemIndex !== index) return item;
                              const attributes = { ...item.attributes, [field.key]: event.target.value };
                              return { ...item, attributes, name: variantDisplayName(attributes, getVariantFields(formCategory)) || item.name };
                            }))}
                            placeholder={field.placeholder}
                            className="mt-1.5 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 py-2.5 text-sm text-[#1A1612] outline-none transition focus:border-[#B88E4F] focus:ring-2 focus:ring-[#C59B58]/15"
                          />
                        </label>
                      ))}
                      <label className="min-w-0 text-xs font-semibold text-[#7D715E]">
                        Tên hiển thị trên sàn <span className="text-[#DC2626]">*</span>
                        <input
                          value={variant.name}
                          onChange={(event) => setFormVariants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))}
                          placeholder="Ví dụ: 30 ml · serum lỏng"
                          className="mt-1.5 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 py-2.5 text-sm text-[#1A1612] outline-none transition focus:border-[#B88E4F] focus:ring-2 focus:ring-[#C59B58]/15"
                        />
                      </label>
                      <label className="min-w-0 text-xs font-semibold text-[#7D715E]">
                        SKU phân loại <span className="text-[#DC2626]">*</span>
                        <input
                          value={variant.sku}
                          onChange={(event) => setFormVariants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, sku: event.target.value.toUpperCase() } : item))}
                          placeholder="SERUM-30ML"
                          className="mt-1.5 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 py-2.5 text-sm font-mono text-[#1A1612] outline-none transition focus:border-[#B88E4F] focus:ring-2 focus:ring-[#C59B58]/15"
                        />
                      </label>
                      <label className="min-w-0 text-xs font-semibold text-[#7D715E]">
                        Giá bán (₫) <span className="text-[#DC2626]">*</span>
                        <input
                          type="number"
                          min={0}
                          value={variant.price}
                          onChange={(event) => setFormVariants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, price: Math.max(0, Number(event.target.value) || 0) } : item))}
                          className="mt-1.5 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 py-2.5 text-sm text-[#1A1612] outline-none transition focus:border-[#B88E4F] focus:ring-2 focus:ring-[#C59B58]/15"
                        />
                      </label>
                      <label className="min-w-0 text-xs font-semibold text-[#7D715E]">
                        Tồn kho <span className="text-[#DC2626]">*</span>
                        <input
                          type="number"
                          min={0}
                          value={variant.stockQuantity}
                          onChange={(event) => setFormVariants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, stockQuantity: Math.max(0, Number(event.target.value) || 0) } : item))}
                          className="mt-1.5 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 py-2.5 text-sm text-[#1A1612] outline-none transition focus:border-[#B88E4F] focus:ring-2 focus:ring-[#C59B58]/15"
                        />
                      </label>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      aria-label={`Xóa phân loại ${variant.name || index + 1}`}
                      onClick={() => setFormVariants((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                      className="justify-self-end rounded-lg text-[#7D715E] hover:bg-red-50 hover:text-red-600 md:justify-self-auto"
                    >
                      <Trash2 size={15} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* SECTION 4: ĐỊNH GIÁ BÁN SẢN PHẨM & TỒN KHO */}
          <div className="flex flex-col gap-4 rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-[0_2px_10px_rgba(35,29,21,0.035)] sm:p-5">
            <span className="flex items-center gap-2 border-b border-[#EAE4D7] pb-3 text-xs font-bold uppercase tracking-wide text-[#1A1612]">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB]">
                <Coins className="h-4 w-4 text-[#B88E4F]" />
              </span>
              4. Giá bán sản phẩm & Số lượng kho
            </span>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-xs font-semibold text-[#1A1612]">
                  Giá bán sản phẩm (₫) <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Coins className="w-4 h-4 text-[#B88E4F] absolute left-3 pointer-events-none" />
                  <input
                    type="number"
                    min={1000}
                    step={1000}
                    value={formPrice}
                    onChange={(e) => handlePriceChange(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    placeholder="Ví dụ: 350000"
                    className="h-12 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] pl-9 pr-3 text-sm font-bold text-[#1A1612] outline-none transition placeholder:text-[#9A8E7C] hover:border-[#D8C7A8] focus:border-[#B88E4F] focus:bg-white focus:ring-2 focus:ring-[#C59B58]/15"
                  />
                </div>
                <span className="mt-1.5 block min-h-4 text-xs font-semibold text-[#B88E4F]">
                  {formPrice === '' ? null : `${Number(formPrice).toLocaleString('vi-VN')} ₫`}
                </span>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#1A1612]">
                  Số lượng tồn kho <span className="text-rose-500">*</span>
                </label>
                <div className="relative flex items-center">
                  <Boxes className="w-4 h-4 text-[#B88E4F] absolute left-3 pointer-events-none" />
                  <input
                    type="number"
                    min={0}
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value === '' ? '' : Number(e.target.value))}
                    required
                    placeholder="Ví dụ: 100"
                    className="h-12 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] pl-9 pr-3 text-sm font-semibold text-[#1A1612] outline-none transition placeholder:text-[#9A8E7C] hover:border-[#D8C7A8] focus:border-[#B88E4F] focus:bg-white focus:ring-2 focus:ring-[#C59B58]/15"
                  />
                </div>
                <span className="mt-1.5 block text-xs text-[#7D715E]">Số lượng sản phẩm sẵn sàng cung ứng</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#1A1612]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EEDFC6] bg-white">
                    <Package className="h-4 w-4 text-[#B88E4F]" />
                  </span>
                  Cấp sản phẩm mẫu cho KOL
                </span>
                <p className="mb-0 mt-2 text-xs leading-relaxed text-[#7D715E]">
                  Hạn mức được giữ ngay khi Shop duyệt; KOL chỉ xin được sản phẩm đang bật và còn suất.
                </p>
              </div>
              <label className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-[#EEDFC6] bg-white px-3 py-2 text-xs font-semibold text-[#1A1612]">
                <input
                  type="checkbox"
                  checked={formSampleEnabled}
                  onChange={(event) => setFormSampleEnabled(event.target.checked)}
                  className="accent-[#C59B58]"
                />
                Cho phép xin mẫu
              </label>
            </div>
              <div className="max-w-xs">
              <div className="mb-2 w-fit rounded-full border border-[#EEDFC6] bg-white px-2.5 py-1 text-[10px] font-semibold text-[#8C6226]">Tùy chọn</div>
              <div className="mb-1.5">
                <label className="block text-xs font-semibold text-[#1A1612]">Tổng suất mẫu được duyệt</label>
              </div>
              <div className="relative">
                <input
                  type="number"
                  min={editingProduct?.sampleGrantedCount || 0}
                  value={formSampleQuota}
                  placeholder="Ví dụ: 10"
                  onChange={(event) => {
                    const input = event.currentTarget;
                    const normalizedValue = input.value.replace(/^0+(?=\d)/, '');
                    if (input.value !== normalizedValue) input.value = normalizedValue;
                    setFormSampleQuota(normalizedValue === '' ? '' : Math.max(0, Number(normalizedValue) || 0));
                  }}
                  disabled={!formSampleEnabled}
                  className="h-10 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 text-sm font-semibold text-[#1A1612] outline-none transition placeholder:text-[#9A8E7C] focus:border-[#B88E4F] focus:ring-2 focus:ring-[#C59B58]/15 disabled:bg-[#FAF8F5] disabled:text-[#7D715E] disabled:opacity-80"
                />
              </div>
              <span className="mt-1.5 block text-xs text-[#7D715E]">
                Đã duyệt: {editingProduct?.sampleGrantedCount || 0} / {formSampleQuota === '' ? 0 : formSampleQuota} suất
              </span>
            </div>
            {!!editingProduct?.variants?.length && (
              <div className="border-t border-[#EEDFC6] pt-3 space-y-2.5">
                <div>
                  <p className="text-xs font-bold text-[#1A1612]">Hạn mức riêng theo SKU</p>
                  <p className="text-[11px] text-[#7D715E]">Mỗi SKU dùng hạn mức riêng hoặc kế thừa hạn mức của sản phẩm.</p>
                </div>
                {editingProduct.variants.map((variant) => {
                  const policy = variantSamplePolicies[variant.id] || {
                    inheritProductPolicy: variant.sampleEnabled == null && variant.sampleQuota == null,
                    sampleEnabled: variant.sampleEnabled ?? formSampleEnabled,
                    sampleQuota: Number(variant.sampleQuota ?? formSampleQuota) || 0,
                  };
                  return (
                    <div key={variant.id} className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_auto_8rem] gap-2 items-center rounded-xl bg-white border border-[#EEDFC6] px-3 py-2.5">
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-[#1A1612] truncate">{variant.name || variant.sku}</div>
                        <div className="text-[10px] text-[#7D715E]">{variant.sku} · Đã duyệt {variant.sampleGrantedCount} mẫu</div>
                      </div>
                      <label className="inline-flex items-center gap-1.5 text-[11px] text-[#7D715E] whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={policy.inheritProductPolicy}
                          onChange={(event) => setVariantSamplePolicies((current) => ({
                            ...current,
                            [variant.id]: {
                              ...policy,
                              inheritProductPolicy: event.target.checked,
                              sampleEnabled: variant.sampleEnabled ?? formSampleEnabled,
                              sampleQuota: Number(variant.sampleQuota ?? formSampleQuota) || 0,
                            },
                          }))}
                          className="accent-[#C59B58]"
                        />
                        Kế thừa sản phẩm
                      </label>
                      <div className="flex items-center gap-2">
                        <label className="inline-flex items-center gap-1 text-[10px] text-[#7D715E]">
                          <input
                            type="checkbox"
                            checked={policy.sampleEnabled}
                            disabled={policy.inheritProductPolicy}
                            onChange={(event) => setVariantSamplePolicies((current) => ({ ...current, [variant.id]: { ...policy, sampleEnabled: event.target.checked } }))}
                            className="accent-[#C59B58]"
                          />
                          Bật
                        </label>
                        <input
                          aria-label={`Hạn mức mẫu ${variant.sku}`}
                          type="number"
                          min={variant.sampleGrantedCount}
                          value={policy.sampleQuota}
                          disabled={policy.inheritProductPolicy || !policy.sampleEnabled}
                          onChange={(event) => setVariantSamplePolicies((current) => ({ ...current, [variant.id]: { ...policy, sampleQuota: Math.max(variant.sampleGrantedCount, Number(event.target.value) || 0) } }))}
                          className="w-20 bg-white border border-[#EAE4D7] rounded-lg px-2 py-1.5 text-xs text-[#1A1612] disabled:opacity-50"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 5: THIẾT LẬP HOA HỒNG KOL/CTV (QUY ĐỔI 2 CHIỀU % ⇄ VNĐ) */}
          <div className="flex flex-col gap-4 rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-[0_3px_14px_rgba(35,29,21,0.045)] sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE4D7] pb-3">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#1A1612]">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB]">
                  <Percent className="h-4 w-4 text-[#B88E4F]" />
                </span>
                5. Chính sách hoa hồng cho KOL/CTV (Quy đổi 2 chiều)
              </span>
              <span className="rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-1.5 text-[11px] font-semibold text-[#8C6226]">
                Tùy chọn · Có thể bổ sung sau khi duyệt
              </span>
            </div>

            {/* PRESET SHORTCUT BUTTONS */}
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-[#FAF8F5] p-2.5">
              <span className="mr-1 text-xs font-semibold text-[#7D715E]">Mẫu nhanh:</span>
              {[10, 15, 20, 25, 30].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleCommissionRateChange(pct)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    formCommission === pct
                      ? 'border-[#C59B58] bg-[#C59B58] text-[#231D15] shadow-sm'
                      : 'border-[#EAE4D7] bg-white text-[#1A1612] hover:border-[#C59B58] hover:bg-[#FBF5EB]'
                  }`}
                >
                  {pct}%
                </button>
              ))}
              <div className="mx-1 hidden h-5 w-px bg-[#D8C7A8] sm:block" />
              {[50000, 100000, 150000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleCommissionAmountChange(amt)}
                  className={`rounded-lg border px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                    formCommissionAmount === amt
                      ? 'border-[#C59B58] bg-[#C59B58] text-[#231D15] shadow-sm'
                      : 'border-[#EAE4D7] bg-white text-[#1A1612] hover:border-[#C59B58] hover:bg-[#FBF5EB]'
                  }`}
                >
                  {(amt / 1000).toLocaleString()}k
                </button>
              ))}
            </div>

            {/* TWO-WAY BINDING INPUTS */}
            <div className="grid grid-cols-1 items-end gap-3 sm:grid-cols-[minmax(0,1fr)_2.5rem_minmax(0,1fr)]">
              <div>
                <label className="mb-2 block text-xs font-semibold text-[#1A1612]">
                  Tỷ lệ hoa hồng (%)
                </label>
                <div className="relative flex items-center">
                  <Percent className="w-4 h-4 text-[#B88E4F] absolute left-3 pointer-events-none" />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={0.5}
                    value={formCommission}
                    onChange={(e) => handleCommissionRateChange(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ví dụ: 10"
                    className="h-12 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] pl-9 pr-3 text-sm font-semibold text-[#1A1612] outline-none transition hover:border-[#D8C7A8] focus:border-[#B88E4F] focus:bg-white focus:ring-2 focus:ring-[#C59B58]/15"
                  />
                </div>
              </div>

              <div className="hidden items-center justify-center sm:flex">
                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-[#EEDFC6] bg-[#FBF5EB] text-[#8C6226]">
                  <ArrowLeftRight size={14} />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-xs font-semibold text-[#1A1612]">
                  Hoa hồng cụ thể nhận được (₫ / sản phẩm)
                </label>
                <div className="relative flex items-center">
                  <Coins className="w-4 h-4 text-[#B88E4F] absolute left-3 pointer-events-none" />
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={formCommissionAmount}
                    onChange={(e) => handleCommissionAmountChange(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="Ví dụ: 50000"
                    className="h-12 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] pl-9 pr-3 text-sm font-semibold text-[#1A1612] outline-none transition hover:border-[#D8C7A8] focus:border-[#B88E4F] focus:bg-white focus:ring-2 focus:ring-[#C59B58]/15"
                  />
                </div>
              </div>
            </div>

            {/* REAL-TIME COMMISSIONS SUMMARY BANNER */}
            <div className="flex flex-col justify-between gap-3 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3.5 text-xs sm:flex-row sm:items-center">
              <div className="flex items-center gap-2">
                <span className="text-base">💰</span>
                <div>
                  <span className="font-bold text-[#1A1612]">KOL/CTV nhận được: </span>
                  <span className="font-extrabold text-[#B88E4F] text-sm">
                    {formCommissionAmount === '' ? '—' : `${Number(formCommissionAmount).toLocaleString('vi-VN')} ₫`}
                  </span>
                  <span className="text-[#7D715E] text-[11px] ml-1">
                    ({formCommission === '' ? '—' : formCommission}% giá trị đơn)
                  </span>
                </div>
              </div>
              <div className="border-t border-[#EEDFC6] pt-2 text-[11.5px] text-[#7D715E] sm:border-0 sm:pt-0 sm:text-right">
                <span>Gian hàng thu về: </span>
                <span className="font-bold text-[#1A1612]">
                  {formPrice === '' || formCommissionAmount === ''
                    ? '—'
                    : `${Math.max(0, Number(formPrice) - Number(formCommissionAmount)).toLocaleString('vi-VN')} ₫`}
                </span>
              </div>
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[#EAE4D7] bg-white p-3.5">
            <input
              type="checkbox"
              checked={formAffiliateEnabled}
              onChange={(event) => setFormAffiliateEnabled(event.target.checked)}
              className="mt-0.5 h-4 w-4 accent-[#C59B58]"
            />
            <span>
              <span className="block text-sm font-bold text-[#1A1612]">Mở Open Offer cho KOL/CTV</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-[#7D715E]">
                Khi bật, KOL đã xác thực có thể lấy link theo tỷ lệ công khai ở trên. Khi tắt, link hiện tại ngừng nhận đơn mới; đơn đã ghi nhận vẫn giữ nguyên.
              </span>
            </span>
          </label>

          <div className="rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-[0_2px_8px_rgba(35,29,21,0.03)] sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="min-w-0">
              <label className="mb-2 block text-xs font-semibold text-[#1A1612]">Thành phần <span className="text-[#DC2626]">*</span></label>
              <AutoGrowTextarea
                minHeight={60}
                value={formIngredients}
                onChange={(event) => setFormIngredients(event.target.value)}
                placeholder="Khai báo thành phần, hoạt chất và hàm lượng liên quan"
                className="min-h-[60px] w-full resize-none overflow-hidden rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 py-2 text-sm leading-5 text-[#1A1612] outline-none transition placeholder:text-[#9A8E7C] focus:border-[#B88E4F] focus:bg-white focus:ring-2 focus:ring-[#C59B58]/15"
              />
            </div>
            <div className="min-w-0">
              <label className="mb-2 block text-xs font-semibold text-[#1A1612]">Xuất xứ <span className="text-[#DC2626]">*</span></label>
              <AutoGrowTextarea
                minHeight={60}
                value={formOrigin}
                onChange={(event) => setFormOrigin(event.target.value)}
                placeholder="VD: Việt Nam, Hàn Quốc"
                className="min-h-[60px] w-full resize-none overflow-hidden rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 py-2 text-sm leading-5 text-[#1A1612] outline-none transition placeholder:text-[#9A8E7C] focus:border-[#B88E4F] focus:bg-white focus:ring-2 focus:ring-[#C59B58]/15"
              />
            </div>
            <div className="min-w-0 sm:col-span-2">
              <label className="mb-2 block text-xs font-semibold text-[#1A1612]">Nhãn mác, cảnh báo và hướng dẫn sử dụng <span className="text-[#DC2626]">*</span></label>
              <AutoGrowTextarea
                minHeight={56}
                value={formLabelInfo}
                onChange={(event) => setFormLabelInfo(event.target.value)}
                placeholder="Thông tin thể hiện trên bao bì/nhãn sản phẩm để Ban Quản Trị đối chiếu"
                className="min-h-14 w-full resize-none overflow-hidden rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3 text-sm leading-relaxed text-[#1A1612] outline-none transition placeholder:text-[#9A8E7C] focus:border-[#B88E4F] focus:bg-white focus:ring-2 focus:ring-[#C59B58]/15"
              />
            </div>
            </div>
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2 lg:grid-rows-[auto_auto_auto]">
              <ProductEvidenceEditor
                title="Minh chứng nguồn gốc / xuất xứ"
                description="Thêm link tra cứu nguồn gốc hoặc tải ảnh hóa đơn, chứng từ xuất xứ để Shop và Ban Quản Trị đối chiếu."
                required
                inputId="origin-proof-images"
                links={formOriginProofLinks}
                images={formOriginProofImages}
                uploading={uploadingImage}
                uploadLabel={uploadingSlot === 'origin-proof' ? 'Đang tải…' : 'Tải ảnh minh chứng'}
                onLinksChange={setFormOriginProofLinks}
                onImagesChange={setFormOriginProofImages}
                onUpload={(files) => { void handleUploadProofImages(files, 'origin'); }}
              />
              <ProductEvidenceEditor
                title="Minh chứng nhãn mác / thông tin công bố"
                description="Thêm trang công bố hoặc tải ảnh rõ phần nhãn, cảnh báo, thành phần và hướng dẫn sử dụng."
                required
                inputId="label-proof-images"
                links={formLabelProofLinks}
                images={formLabelProofImages}
                uploading={uploadingImage}
                uploadLabel={uploadingSlot === 'label-proof' ? 'Đang tải…' : 'Tải ảnh minh chứng'}
                onLinksChange={setFormLabelProofLinks}
                onImagesChange={setFormLabelProofImages}
                onUpload={(files) => { void handleUploadProofImages(files, 'label'); }}
              />
            </div>
          </div>

          {/* SECTION 6: MÔ TẢ CHI TIẾT SẢN PHẨM */}
          <div className="rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] p-4 sm:p-5">
            <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <label className="text-sm font-bold text-[#1A1612]">
                Mô tả chi tiết sản phẩm & Điểm nổi bật (KOL Sales Brief) <span className="text-[#DC2626]">*</span>
              </label>
              <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#EEDFC6] bg-white px-2.5 py-1 text-[11px] font-medium text-[#7D715E]">
                <Sparkles className="h-3.5 w-3.5 text-[#B88E4F]" />
                Hỗ trợ KOL hiểu rõ để quảng bá tốt hơn
              </span>
            </div>
            <AutoGrowTextarea
              minHeight={80}
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="Giới thiệu công dụng chính, thành phần nổi bật, loại da phù hợp, hướng dẫn sử dụng và thông điệp truyền thông chính để KOL dễ dàng sáng tạo nội dung và chốt đơn..."
              className="min-h-20 w-full resize-none overflow-hidden rounded-xl border border-[#EAE4D7] bg-white p-3.5 text-sm leading-relaxed text-[#1A1612] outline-none transition placeholder:text-[#9A8E7C] focus:border-[#B88E4F] focus:ring-2 focus:ring-[#C59B58]/15"
            />
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAE4D7]/60">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#7D715E] bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={uploadingImage || savingProduct}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#231D15] bg-gradient-to-r from-[#EBD08C] to-[#DEC07A] hover:from-[#DEC07A] hover:to-[#D4B26F] shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {savingProduct ? (
                <span>Đang lưu sản phẩm...</span>
              ) : uploadingImage ? (
                <>
                  <UploadCloud size={14} className="animate-spin" />
                  <span>Đang xử lý ảnh...</span>
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  <span>{editingProduct ? 'Lưu thay đổi sản phẩm' : 'Đăng bán sản phẩm mới'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>


      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-[1.5px] animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-[#EAE4D7] w-full max-w-sm p-5 sm:p-6 text-left animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3.5">
              <div className="w-10 h-10 bg-rose-50 border border-rose-200/60 rounded-xl flex items-center justify-center flex-shrink-0 text-rose-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#1A1612] m-0">Xác nhận tạm dừng sản phẩm</h3>
                <p className="text-[11px] text-[#7D715E] m-0 mt-0.5">Sản phẩm sẽ chuyển sang trạng thái ngừng bán</p>
              </div>
            </div>

            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE4D7] text-xs text-[#7D715E] space-y-1.5 mb-5">
              <div className="truncate">• <strong>Tên:</strong> {deleteConfirmProduct.title || deleteConfirmProduct.name}</div>
              <div>• <strong>Mã SKU:</strong> <span className="font-mono font-bold text-[#B88E4F]">{deleteConfirmProduct.sku}</span></div>
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmProduct(null)}
                className="px-4 py-2 text-xs font-bold text-[#7D715E] bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = deleteConfirmProduct.id;
                  setDeleteConfirmProduct(null);
                  try {
                    await productService.softDeleteProduct(id);
                    showToast('Đã cập nhật trạng thái tạm dừng sản phẩm');
                    loadProducts();
                  } catch (err: any) {
                    showToast(err.message || 'Lỗi khi xóa sản phẩm');
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Modal Xác nhận Phê duyệt sản phẩm dành cho Admin & Vận hành */}
      {moderatingProduct && moderatingAction === 'APPROVED' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EAE4D7] w-full max-w-md p-5 sm:p-6 text-left animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3.5 pb-3 border-b border-[#EAE4D7]">
              <div className="w-10 h-10 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center shrink-0 text-emerald-600">
                <CheckCircle2 className="w-5 h-5 text-[#059669]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1A1612] m-0">Phê duyệt sản phẩm lên sàn</h3>
                <p className="text-xs text-[#7D715E] m-0 mt-0.5">Sản phẩm sẽ được hiển thị công khai trên SCANMS</p>
              </div>
            </div>

            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE4D7] text-xs text-[#7D715E] space-y-1 mb-4">
              <div className="truncate">• <strong>Sản phẩm:</strong> <span className="text-[#1A1612] font-semibold">{moderatingProduct.title || moderatingProduct.name}</span></div>
              <div>• <strong>Mã SKU:</strong> <span className="font-mono font-bold text-[#B88E4F]">{moderatingProduct.sku}</span></div>
              <div>• <strong>Giá bán:</strong> <span className="font-bold text-[#1A1612]">{Number(moderatingProduct.price || 0).toLocaleString('vi-VN')} ₫</span></div>
            </div>

            <p className="text-xs text-[#7D715E] leading-relaxed mb-4">
              Sau khi phê duyệt, sản phẩm sẽ được mở bán chính thức trên sàn SCANMS, khách hàng có thể đặt mua và KOL có thể lấy link tiếp thị liên kết để nhận hoa hồng.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EAE4D7]">
              <button
                type="button"
                onClick={() => {
                  setModeratingProduct(null);
                  setModeratingAction(null);
                }}
                className="px-4 py-2 text-xs font-bold text-[#7D715E] bg-white border border-[#EAE4D7] hover:bg-[#F3EFE6] rounded-xl transition cursor-pointer active:scale-95"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={moderationSubmitting}
                onClick={() => handleApproveProduct(moderatingProduct)}
                className="px-5 py-2 bg-[#059669] hover:bg-[#047857] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50 active:scale-95 flex items-center gap-1.5"
              >
                {moderationSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang duyệt...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Xác nhận phê duyệt</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Từ chối duyệt sản phẩm dành cho Admin & Vận hành */}
      {moderatingProduct && moderatingAction === 'REJECTED' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EAE4D7] w-full max-w-md p-5 sm:p-6 text-left animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 mb-3.5 pb-3 border-b border-[#EAE4D7]">
              <div className="w-10 h-10 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-center shrink-0 text-rose-600">
                <Ban className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1A1612] m-0">Từ chối kiểm duyệt sản phẩm</h3>
                <p className="text-xs text-[#7D715E] m-0 mt-0.5">Sản phẩm sẽ bị chặn bán và gửi lý do cho Shop</p>
              </div>
            </div>

            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#EAE4D7] text-xs text-[#7D715E] space-y-1 mb-3.5">
              <div className="truncate">• <strong>Sản phẩm:</strong> <span className="text-[#1A1612] font-semibold">{moderatingProduct.title || moderatingProduct.name}</span></div>
              <div>• <strong>Mã SKU:</strong> <span className="font-mono font-bold text-[#B88E4F]">{moderatingProduct.sku}</span></div>
            </div>

            <div className="space-y-2 mb-4">
              <label className="text-xs font-bold text-[#1A1612] block">
                Lý do từ chối kiểm duyệt <span className="text-rose-500">*</span>
              </label>

              {/* Quick suggestions */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {[
                  'Sản phẩm thuộc danh mục cấm / chất kích thích / vi phạm pháp luật',
                  'Hình ảnh không đạt chuẩn hoặc có yếu tố phản cảm',
                  'Chưa cung cấp đủ giấy phép lưu hành / công bố mỹ phẩm',
                  'Thông tin công dụng không đúng thực tế, quảng cáo sai lệch',
                ].map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setModerationReason(reason)}
                    className="text-[10px] px-2 py-1 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E] hover:text-[#1A1612] hover:border-[#C59B58] transition text-left cursor-pointer"
                  >
                    + {reason}
                  </button>
                ))}
              </div>

              <textarea
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                placeholder="Nhập lý do cụ thể để Shop nắm rõ và khắc phục..."
                rows={3}
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl p-2.5 text-xs text-[#1A1612] outline-none focus:border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 transition resize-none font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#EAE4D7]">
              <button
                type="button"
                onClick={() => {
                  setModeratingProduct(null);
                  setModeratingAction(null);
                  setModerationReason('');
                }}
                className="px-4 py-2 text-xs font-bold text-[#7D715E] bg-white border border-[#EAE4D7] hover:bg-[#F3EFE6] rounded-xl transition cursor-pointer active:scale-95"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={moderationSubmitting || moderationReason.trim().length < 3}
                onClick={handleRejectProduct}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50 active:scale-95 flex items-center gap-1.5"
              >
                {moderationSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Đang xử lý...</span>
                  </>
                ) : (
                  <>
                    <Ban className="w-3.5 h-3.5" />
                    <span>Xác nhận từ chối</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedVideoProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-[2px] animate-fadeIn"
          onClick={() => setSelectedVideoProduct(null)}
        >
          <div
            className="bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#EAE4D7] w-full max-w-4xl text-left animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-white border-b border-[#EAE4D7]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FBF5EB] border border-[#EAE4D7] rounded-xl flex items-center justify-center text-[#B88E4F] shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1A1612] m-0 flex items-center gap-2">
                    {selectedVideoProduct.id === '__ALL__'
                      ? 'Duyệt video KOL gửi đến Shop'
                      : 'Kiểm duyệt Video KOL Review'}
                    <Badge variant="amber" className="text-[10px] font-mono">
                      {selectedVideoProduct.sku}
                    </Badge>
                  </h3>
                  <p className="text-xs text-[#7D715E] m-0 mt-0.5 truncate max-w-md">
                    {selectedVideoProduct.id === '__ALL__'
                      ? 'Xem và xử lý toàn bộ video theo từng sản phẩm trong gian hàng.'
                      : `Sản phẩm: ${selectedVideoProduct.title || (selectedVideoProduct as any).name}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVideoProduct(null)}
                className="w-8 h-8 rounded-lg text-[#7D715E] hover:text-[#1A1612] hover:bg-[#FAF8F5] flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {loadingVideos ? (
                <div className="text-center py-10 text-xs text-[#7D715E]">
                  Đang tải danh sách video review từ máy chủ...
                </div>
              ) : productVideos.length === 0 ? (
                <div className="text-center py-10 bg-[#FAF8F5] rounded-xl border border-dashed border-[#EAE4D7] p-6">
                  <Video className="w-8 h-8 text-[#7D715E]/40 mx-auto mb-2" />
                  <p className="text-xs font-bold text-[#1A1612] m-0">Chưa có video review nào</p>
                  <p className="text-[11px] text-[#7D715E] mt-1 m-0">
                    {selectedVideoProduct.id === '__ALL__'
                      ? 'Hiện chưa có video KOL nào được gửi đến gian hàng.'
                      : 'Khi KOL/CTV nộp video review cho sản phẩm này qua Media Hub, video sẽ xuất hiện tại đây để bạn kiểm duyệt.'}
                  </p>
                </div>
              ) : (
                productVideos.map((v: any) => {
                  const isPending = v.status === 'PENDING';
                  const isApproved = v.status === 'APPROVED';
                  const isRejected = v.status === 'REJECTED';
                  const isHidden = v.status === 'HIDDEN';

                  return (
                    <article
                      key={v.id}
                      className="overflow-hidden bg-white rounded-2xl border border-[#EAE4D7] shadow-[0_5px_18px_rgba(95,74,43,0.06)] text-xs"
                    >
                      <div className="grid lg:grid-cols-[minmax(300px,1.05fr)_minmax(0,1fr)]">
                        <div className="bg-[#1A1612] min-h-[210px] flex items-center justify-center relative">
                          <video
                            src={v.urlOrContent}
                            poster={v.posterUrl || undefined}
                            controls
                            playsInline
                            preload="metadata"
                            className="w-full aspect-video max-h-[330px] bg-black object-contain"
                            aria-label={`Video review ${v.title || 'của KOL'}`}
                          >
                            Trình duyệt của bạn không hỗ trợ phát video này.
                          </video>
                          <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/70 text-white text-[10px] font-bold backdrop-blur-sm pointer-events-none">
                            <Video className="w-3 h-3" /> Video KOL gửi
                          </span>
                        </div>

                        <div className="p-4 sm:p-5 flex flex-col min-w-0">
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="text-sm font-bold text-[#1A1612] truncate">
                            {v.title}
                          </strong>
                          {isPending && <Badge variant="amber">Chờ duyệt</Badge>}
                          {isApproved && <Badge variant="success">Đã duyệt</Badge>}
                          {isRejected && <Badge variant="danger">Bị từ chối</Badge>}
                          {isHidden && <Badge variant="neutral">Đã ẩn</Badge>}
                          {v.isFeatured && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#EBD08C] text-white">
                              <Star className="w-2.5 h-2.5 fill-current" /> Nổi bật Landing
                            </span>
                          )}
                        </div>

                        <div className="text-[11px] text-[#7D715E] flex items-center gap-2 flex-wrap">
                          <span>KOL: <strong>{v.collaborator?.fullName || 'Nhà sáng tạo'}</strong></span>
                          <span>•</span>
                          <span>
                            Sản phẩm:{' '}
                            <strong className="text-[#1A1612]">
                              {v.product?.title || v.productName || selectedVideoProduct.title}
                            </strong>
                            {v.product?.sku ? ` (${v.product.sku})` : ''}
                          </span>
                          <span>•</span>
                          <a
                            href={v.urlOrContent}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#B88E4F] hover:underline flex items-center gap-1 font-semibold"
                          >
                            <ExternalLink className="w-3 h-3" /> Mở video trong tab mới
                          </a>
                        </div>

                        {v.caption && (
                          <p className="text-[11px] text-[#7D715E] bg-white p-2 rounded-lg border border-[#EAE4D7] italic m-0">
                            "{v.caption}"
                          </p>
                        )}

                        {v.rejectionReason && (
                          <p className="text-[11px] text-rose-600 font-semibold m-0">
                            Lý do từ chối/ẩn: {v.rejectionReason}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 mt-4 pt-4 border-t border-[#EAE4D7]">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              disabled={reviewingMediaId === v.id}
                              onClick={() => handleApproveVideo(v.id, false)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#EBD08C] text-white font-bold text-xs hover:bg-[#DEC07A] transition cursor-pointer disabled:opacity-50"
                            >
                              Duyệt
                            </button>
                            <button
                              type="button"
                              disabled={reviewingMediaId === v.id}
                              onClick={() => handleApproveVideo(v.id, true)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#FBF5EB] border border-[#EAE4D7] text-[#B88E4F] font-bold text-xs hover:bg-[#F3EFE6] transition cursor-pointer disabled:opacity-50"
                              title="Duyệt và đặt làm video nổi bật nhất trên Landing"
                            >
                              ⭐ Duyệt & Ghim
                            </button>
                            <button
                              type="button"
                              disabled={reviewingMediaId === v.id}
                              onClick={() => openRejectionModal(v, 'REJECTED')}
                              className="px-2.5 py-1.5 rounded-lg bg-white border border-rose-200 text-rose-600 font-bold text-xs hover:bg-rose-50 transition cursor-pointer"
                            >
                              Từ chối
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <>
                            {!v.isFeatured && (
                              <button
                                type="button"
                                disabled={reviewingMediaId === v.id}
                                onClick={() => handleApproveVideo(v.id, true)}
                                className="px-2.5 py-1.5 rounded-lg bg-[#FBF5EB] border border-[#EAE4D7] text-[#B88E4F] font-bold text-xs hover:bg-[#F3EFE6] transition cursor-pointer"
                              >
                                Ghim nổi bật
                              </button>
                            )}
                            <button
                              type="button"
                              disabled={reviewingMediaId === v.id}
                              onClick={() => openRejectionModal(v, 'HIDDEN')}
                              className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-[#7D715E] font-bold text-xs hover:bg-slate-100 transition cursor-pointer"
                            >
                              Ẩn video
                            </button>
                          </>
                        )}

                        {(isRejected || isHidden) && (
                          <button
                            type="button"
                            disabled={reviewingMediaId === v.id}
                            onClick={() => handleApproveVideo(v.id, false)}
                            className="px-2.5 py-1.5 rounded-lg bg-[#FAF8F5] border border-[#EAE4D7] text-[#1A1612] font-bold text-xs hover:bg-white transition cursor-pointer"
                          >
                            Phục hồi duyệt
                          </button>
                        )}
                      </div>
                      </div>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            <div className="px-5 sm:px-6 py-3.5 bg-white border-t border-[#EAE4D7] flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVideoProduct(null)}
              >
                Đóng
              </Button>
            </div>
          </div>
        </div>
      )}


      {rejectionModalMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-[2px] animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EAE4D7] w-full max-w-md p-6 text-left animate-in zoom-in-95 duration-150 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1A1612] m-0">
                  {rejectionActionType === 'REJECTED' ? 'Từ chối video review' : 'Ẩn video review khỏi sàn'}
                </h3>
                <p className="text-xs text-[#7D715E] m-0 mt-0.5">
                  Bắt buộc cung cấp lý do kiểm duyệt để lưu AuditLog
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1">
                Lý do kiểm duyệt <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="Ví dụ: Nội dung video chưa rõ nguồn gốc sản phẩm, âm thanh bị rè, hoặc vi phạm bản quyền..."
                rows={3}
                className="w-full p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] outline-none focus:border-[#B88E4F] resize-none"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE4D7]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRejectionModalMedia(null)}
              >
                Hủy bỏ
              </Button>
              <button
                type="button"
                onClick={handleConfirmRejection}
                disabled={!rejectionReasonInput.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}


      {showReviewModeration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1A1612]/45 p-2 backdrop-blur-[3px] animate-fadeIn sm:p-5">
          <section className="flex max-h-[92dvh] w-full max-w-6xl flex-col overflow-hidden rounded-3xl border border-[#EAE4D7] bg-[#FAF8F5] shadow-[0_24px_80px_rgba(77,57,31,0.24)]">
            <header className="flex items-start justify-between gap-4 border-b border-[#EAE4D7] bg-white px-4 py-4 sm:px-7 sm:py-5">
              <div className="flex min-w-0 items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F] sm:h-12 sm:w-12">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div className="min-w-0 pt-0.5">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#B88E4F]">Quản lý nội dung khách hàng</p>
                  <h2 className="m-0 text-lg font-extrabold tracking-tight text-[#1A1612] sm:text-xl">Kiểm duyệt đánh giá</h2>
                  <p className="mb-0 mt-1 max-w-2xl text-xs leading-relaxed text-[#7D715E] sm:text-sm">
                    Đánh giá được duyệt mới hiển thị công khai trên trang sản phẩm.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModeration(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EAE4D7] bg-white text-[#7D715E] transition hover:border-[#C59B58] hover:bg-[#FBF5EB] hover:text-[#1A1612]"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="border-b border-[#EAE4D7] bg-white px-4 py-3 sm:px-7">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {[
                { key: 'ALL', label: 'Tất cả', count: customerReviews.length, icon: MessageSquareText },
                {
                  key: 'PENDING',
                  label: 'Chờ duyệt',
                  count: customerReviews.filter((r) => getReviewStatus(r) === 'PENDING').length,
                  icon: Clock3,
                },
                {
                  key: 'APPROVED',
                  label: 'Đã duyệt',
                  count: customerReviews.filter((r) => getReviewStatus(r) === 'APPROVED').length,
                  icon: ShieldCheck,
                },
                {
                  key: 'REJECTED',
                  label: 'Bị từ chối',
                  count: customerReviews.filter((r) => getReviewStatus(r) === 'REJECTED').length,
                  icon: Ban,
                },
                {
                  key: 'HIDDEN',
                  label: 'Đã ẩn',
                  count: customerReviews.filter((r) => getReviewStatus(r) === 'HIDDEN').length,
                  icon: EyeOff,
                },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setReviewFilterStatus(tab.key as any)}
                    className={`flex min-w-0 min-h-10 items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-xs font-bold transition sm:px-3 ${
                      reviewFilterStatus === tab.key
                        ? 'border-[#C59B58] bg-[#C59B58] text-[#231D15] shadow-sm'
                        : 'border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E] hover:border-[#EEDFC6] hover:bg-[#FBF5EB] hover:text-[#1A1612]'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2"><tab.icon className="h-4 w-4 shrink-0" /><span className="truncate">{tab.label}</span></span>
                    <span className={`flex h-6 min-w-6 shrink-0 items-center justify-center rounded-lg border px-1.5 text-[10px] ${reviewFilterStatus === tab.key ? 'border-[#231D15]/10 bg-white/50 text-[#231D15]' : 'border-[#EAE4D7] bg-white text-[#7D715E]'}`}>{tab.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:px-7 sm:py-5">
              {loadingReviews ? (
                <p className="rounded-2xl border border-[#EAE4D7] bg-white py-12 text-center text-sm text-[#7D715E]">Đang tải danh sách đánh giá...</p>
              ) : customerReviews.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#EAE4D7] bg-white px-5 py-12 text-center text-sm text-[#7D715E]">
                  <MessageSquareText className="mx-auto mb-3 h-8 w-8 text-[#C59B58]" />
                  <p className="m-0 font-semibold text-[#1A1612]">Chưa có đánh giá nào</p>
                  <p className="mb-0 mt-1">Đánh giá của khách hàng sẽ xuất hiện ở đây.</p>
                </div>
              ) : (
                (() => {
                  const filtered = customerReviews.filter((review) => {
                    if (reviewFilterStatus === 'ALL') return true;
                    return getReviewStatus(review) === reviewFilterStatus;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="rounded-2xl border border-dashed border-[#EAE4D7] bg-white px-5 py-12 text-center text-sm text-[#7D715E]">
                        <MessageSquareText className="mx-auto mb-3 h-8 w-8 text-[#C59B58]" />
                        <p className="m-0 font-semibold text-[#1A1612]">Chưa có đánh giá trong mục này</p>
                        <p className="mb-0 mt-1">Không có đánh giá nào ở trạng thái này.</p>
                      </div>
                    );
                  }

                  return filtered.map((review) => {
                    const currentStatus = getReviewStatus(review);
                    return (
                      <article
                        key={review.id}
                        className="grid min-w-0 gap-4 rounded-2xl border border-[#EAE4D7] bg-white p-4 shadow-[0_3px_12px_rgba(35,29,21,0.035)] transition-colors hover:border-[#DCC69F] sm:p-5 lg:grid-cols-[minmax(0,1fr)_148px] lg:gap-6 lg:p-5"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
                            <strong className="min-w-0 text-sm font-bold leading-snug text-[#1A1612] sm:text-base">
                              {review.product?.title || 'Sản phẩm'}
                            </strong>
                            {review.product?.sku && (
                              <span className="rounded-md bg-[#FAF8F5] px-1.5 py-0.5 text-[11px] text-[#7D715E] font-mono">
                                ({review.product.sku})
                              </span>
                            )}
                            <span className="text-sm font-bold text-[#B88E4F] tracking-[1px]" aria-label={`${review.rating || 5} trên 5 sao`}>
                              {'★'.repeat(Math.max(1, Math.min(5, review.rating || 5)))}
                            </span>
                            {currentStatus === 'APPROVED' && <Badge variant="amber">Đã duyệt</Badge>}
                            {currentStatus === 'REJECTED' && <Badge variant="danger">Bị từ chối</Badge>}
                            {currentStatus === 'HIDDEN' && <Badge variant="neutral">Đã ẩn</Badge>}
                            {currentStatus === 'PENDING' && <Badge variant="amber">Chờ duyệt</Badge>}
                          </div>

                          <p className="my-3 max-w-[76ch] rounded-xl bg-[#FAF8F5] px-3.5 py-3 text-sm leading-6 text-[#3B3127]">
                            {review.comment || 'Khách không để lại nội dung bình luận.'}
                          </p>

                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-[#7D715E]">
                            <span className="font-semibold text-[#1A1612]">
                              {review.customerName || 'Khách hàng ẩn danh'}
                            </span>
                            {review.createdAt && (
                              <span>• {new Date(review.createdAt).toLocaleDateString('vi-VN')}</span>
                            )}
                            {review.reviewedAt && (
                              <span>
                                • Xử lý lúc {new Date(review.reviewedAt).toLocaleDateString('vi-VN')}
                              </span>
                            )}
                          </div>


                          {(currentStatus === 'REJECTED' || currentStatus === 'HIDDEN') &&
                            review.rejectionReason && (
                              <div className="mt-3 flex items-start gap-2 rounded-xl border border-rose-200/80 bg-rose-50 p-3 text-xs text-rose-800">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold">Lý do kiểm duyệt: </span>
                                  <span>{review.rejectionReason}</span>
                                </div>
                              </div>
                            )}
                        </div>

                        <div className="flex flex-row gap-2 border-t border-[#F0EAE0] pt-3 sm:justify-end lg:flex-col lg:items-stretch lg:justify-center lg:border-l lg:border-t-0 lg:pl-5 lg:pt-0">
                          {currentStatus === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="amber"
                                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                                className="min-w-0 flex-1 justify-center lg:w-full lg:flex-none"
                                disabled={reviewActionId === review.id}
                                onClick={() => handleApproveCustomerReview(review)}
                              >
                                Duyệt
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                icon={<Ban className="w-3.5 h-3.5" />}
                                className="min-w-0 flex-1 justify-center text-rose-600 hover:bg-rose-50 hover:border-rose-300 lg:w-full lg:flex-none"
                                disabled={reviewActionId === review.id}
                                onClick={() => openReviewRejectionModal(review, 'REJECTED')}
                              >
                                Từ chối
                              </Button>
                            </>
                          )}

                          {currentStatus === 'APPROVED' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                icon={<EyeOff className="w-3.5 h-3.5" />}
                                className="min-w-0 flex-1 justify-center lg:w-full lg:flex-none"
                                disabled={reviewActionId === review.id}
                                onClick={() => openReviewRejectionModal(review, 'HIDDEN')}
                              >
                                Ẩn
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                icon={<Ban className="w-3.5 h-3.5" />}
                                className="min-w-0 flex-1 justify-center text-rose-600 hover:bg-rose-50 hover:border-rose-300 lg:w-full lg:flex-none"
                                disabled={reviewActionId === review.id}
                                onClick={() => openReviewRejectionModal(review, 'REJECTED')}
                              >
                                Từ chối
                              </Button>
                            </>
                          )}

                          {currentStatus === 'REJECTED' && (
                            <Button
                              size="sm"
                              variant="amber"
                              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              className="w-full justify-center"
                              disabled={reviewActionId === review.id}
                              onClick={() => handleApproveCustomerReview(review)}
                            >
                              Duyệt lại
                            </Button>
                          )}

                          {currentStatus === 'HIDDEN' && (
                            <Button
                              size="sm"
                              variant="amber"
                              icon={<ShieldCheck className="w-3.5 h-3.5" />}
                              className="w-full justify-center"
                              disabled={reviewActionId === review.id}
                              onClick={() => handleApproveCustomerReview(review)}
                            >
                              Công khai lại
                            </Button>
                          )}
                        </div>
                      </article>
                    );
                  });
                })()
              )}
            </div>
          </section>
        </div>
      )}


      {rejectionModalReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-[2px] animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-[#EAE4D7] w-full max-w-md p-6 text-left animate-in zoom-in-95 duration-150 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1A1612] m-0">
                  {reviewRejectionActionType === 'REJECTED'
                    ? 'Từ chối đánh giá khách hàng'
                    : 'Ẩn đánh giá khỏi landing sản phẩm'}
                </h3>
                <p className="text-xs text-[#7D715E] m-0 mt-0.5">
                  Bắt buộc cung cấp lý do kiểm duyệt để lưu AuditLog
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1">
                Lý do kiểm duyệt <span className="text-rose-500">*</span>
              </label>
              <textarea
                value={reviewRejectionReasonInput}
                onChange={(e) => setReviewRejectionReasonInput(e.target.value)}
                placeholder="Ví dụ: Đánh giá có ngôn từ khiếm nhã, sai thông tin sản phẩm, hoặc spam..."
                rows={3}
                className="w-full p-3 bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl text-xs text-[#1A1612] outline-none focus:border-[#B88E4F] resize-none"
                required
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#EAE4D7]">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setRejectionModalReview(null)}
              >
                Hủy bỏ
              </Button>
              <button
                type="button"
                onClick={handleConfirmReviewRejection}
                disabled={!reviewRejectionReasonInput.trim()}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
