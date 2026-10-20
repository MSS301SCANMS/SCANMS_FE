import { useState, useEffect, useRef, useMemo, useLayoutEffect, type FormEvent, type TextareaHTMLAttributes } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  ChevronDown,
  ShieldCheck,
  EyeOff,
  Ban,
  Sparkles,
  RefreshCw,
  Truck,
} from 'lucide-react';
import api from '../../services/api';
import { productService, type Product } from '../../services/product.service';
import { productPackageInput } from '../../utils/product-package.utils';
import { authService } from '../../services/auth.service';
import { toast } from '../../utils/toast';
import { getSafeProductImageUrl } from '@/utils/marketplace.utils';
import { useAiAnalyzeProduct, type AiAnalyzeProductResult } from '../../hooks/useProducts';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Select } from '../../components/ui/Select';
import { PageHeader } from '../../components/ui/PageHeader';
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
    <section className="product-evidence-editor group min-w-0 overflow-hidden rounded-2xl border border-[#E7DDCC] bg-white shadow-[0_4px_16px_rgba(35,29,21,0.045)] transition-shadow hover:shadow-[0_8px_24px_rgba(35,29,21,0.075)] lg:row-span-3 lg:grid lg:grid-rows-subgrid">
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

export interface ProductSpecificationItem {
  id: string;
  key: string;
  value: string;
}

const getDefaultSpecsForCategory = (cat: string): ProductSpecificationItem[] => {
  if (cat === 'Thời trang & Phụ kiện') {
    return [
      { id: 'spec-1', key: 'Chất liệu vải', value: '' },
      { id: 'spec-2', key: 'Kiểu dáng / Form dáng', value: '' },
      { id: 'spec-3', key: 'Độ co giãn', value: '' },
      { id: 'spec-4', key: 'Hướng dẫn giặt ủi', value: '' },
    ];
  }
  if (cat === 'Mỹ phẩm & Chăm sóc da' || cat === 'Trang điểm & Làm đẹp') {
    return [
      { id: 'spec-1', key: 'Loại da phù hợp', value: '' },
      { id: 'spec-2', key: 'Kết cấu (Texture)', value: '' },
      { id: 'spec-3', key: 'Dung tích / Trọng lượng', value: '' },
      { id: 'spec-4', key: 'Hạn sử dụng sau mở nắp', value: '' },
    ];
  }
  if (cat === 'Thiết bị điện tử & Phụ kiện') {
    return [
      { id: 'spec-1', key: 'Cổng kết nối / Chuẩn sạc', value: '' },
      { id: 'spec-2', key: 'Thời lượng pin / Nguồn điện', value: '' },
      { id: 'spec-3', key: 'Thời gian bảo hành chính hãng', value: '' },
    ];
  }
  return [
    { id: 'spec-1', key: 'Chất liệu / Thành phần chính', value: '' },
    { id: 'spec-2', key: 'Quy cách đóng gói', value: '' },
  ];
};

export default function ProductManagementPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [returnToDashboard, setReturnToDashboard] = useState(
    () => searchParams.get('returnTo') === 'dashboard',
  );
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
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);
  useEffect(() => { setActiveVideoId(null); }, [selectedVideoProduct?.id]);
  const activeReviewVideo = productVideos.find(video => video.id === activeVideoId) || productVideos[0];
  const [loadingVideos, setLoadingVideos] = useState(false);
  const [reviewingMediaId, setReviewingMediaId] = useState<string | null>(null);
  const [rejectionModalMedia, setRejectionModalMedia] = useState<any | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = useState('');
  const [rejectionActionType, setRejectionActionType] = useState<'REJECTED' | 'HIDDEN'>('REJECTED');

  useEffect(() => {
    if (!selectedVideoProduct) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (rejectionModalMedia) setRejectionModalMedia(null);
      else setSelectedVideoProduct(null);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedVideoProduct, rejectionModalMedia]);

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

  useEffect(() => {
    if (!showReviewModeration) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (rejectionModalReview) setRejectionModalReview(null);
      else setShowReviewModeration(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [showReviewModeration, rejectionModalReview]);

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
  const [formBarcode, setFormBarcode] = useState('');
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
  const [formOriginalPrice, setFormOriginalPrice] = useState<number | ''>('');
  const [formCommission, setFormCommission] = useState<number | ''>('');
  const [formCommissionAmount, setFormCommissionAmount] = useState<number | ''>('');
  const [formAffiliateEnabled, setFormAffiliateEnabled] = useState(false);
  const [formStock, setFormStock] = useState<number | ''>('');
  const [formPackageWeight, setFormPackageWeight] = useState<number | ''>('');
  const [formPackageLength, setFormPackageLength] = useState<number | ''>('');
  const [formPackageWidth, setFormPackageWidth] = useState<number | ''>('');
  const [formPackageHeight, setFormPackageHeight] = useState<number | ''>('');
  const [formSampleEnabled, setFormSampleEnabled] = useState(false);
  const [formSampleQuota, setFormSampleQuota] = useState<number | ''>('');
  const [formSpecifications, setFormSpecifications] = useState<ProductSpecificationItem[]>([
    { id: 'spec-1', key: 'Chất liệu vải', value: '' },
    { id: 'spec-2', key: 'Kiểu dáng / Form dáng', value: '' },
  ]);
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
  const [aiResult, setAiResult] = useState<AiAnalyzeProductResult | null>(null);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const aiAnalyze = useAiAnalyzeProduct();

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
    } else if (newPrice > 0) {
      setFormCommission(10);
      setFormCommissionAmount(Math.round((newPrice * 10) / 100));
    }
  };

  const handleCategoryChange = (categoryName: string) => {
    setFormCategory(categoryName);
    setVariantOptionLists({});
    setFormSpecifications(getDefaultSpecsForCategory(categoryName));
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
    setFormBarcode('');
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
    setFormOriginalPrice('');
    setFormCommission(10);
    setFormCommissionAmount('');
    setFormAffiliateEnabled(true);
    setFormStock('');
    setFormPackageWeight('');
    setFormPackageLength('');
    setFormPackageWidth('');
    setFormPackageHeight('');
    setFormSampleEnabled(false);
    setFormSampleQuota('');
    setFormSpecifications(getDefaultSpecsForCategory(''));
    setVariantSamplePolicies({});
    setFormImage('');
    setAiResult(null);
    setFormSubImages([]);
    setFormVariants([]);
    setVariantOptionLists({});
    setShowModal(true);
  };

  const closeProductModal = () => {
    setShowModal(false);
    if (returnToDashboard) {
      setReturnToDashboard(false);
      navigate('/merchant/dashboard', { replace: true });
    }
  };

  useEffect(() => {
    const shouldReturnToDashboard = searchParams.get('returnTo') === 'dashboard';
    const shouldOpenCreate = searchParams.get('create') === '1' && !isKol;
    if (shouldReturnToDashboard) setReturnToDashboard(true);
    if (shouldOpenCreate) openCreateModal();
    if (!searchParams.has('create') && !searchParams.has('returnTo')) return;
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      next.delete('create');
      next.delete('returnTo');
      return next;
    }, { replace: true });
  }, [searchParams, isKol, setSearchParams]);

  const openEditModal = (p: any) => {
    setSaveError(null);
    setEditingProduct(p);
    setFormSku(p.sku || '');
    setFormBarcode(p.barcode || '');
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
    setFormSpecifications(getDefaultSpecsForCategory(matchedCat ? matchedCat.name : ''));
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
    setFormOriginalPrice(p.originalPrice ? Number(p.originalPrice) : '');
    setFormCommission(10);
    setFormCommissionAmount(currentPrice > 0 ? Math.round((currentPrice * 10) / 100) : '');
    setFormAffiliateEnabled(p.isAffiliateEnabled !== false);
    setFormStock(p.stockQuantity ?? p.stock ?? 0);
    setFormPackageWeight(p.packageWeight ?? '');
    setFormPackageLength(p.packageLength ?? '');
    setFormPackageWidth(p.packageWidth ?? '');
    setFormPackageHeight(p.packageHeight ?? '');
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
    setFormSubImages(subs);
    setShowModal(true);
  };

  const applyAiHints = (result: AiAnalyzeProductResult) => {
    setAiResult(result);
    const label = result.topPrediction?.className || result.detections?.[0]?.className || '';
    if (label && !formCategory) {
      const suggested = inferCategoryFromTitle(label.replace(/[_-]/g, ' '));
      if (suggested) handleCategoryChange(suggested);
    }
    if (label && !formTitle.trim()) {
      setFormTitle(label.replace(/[_-]/g, ' '));
    }
    const style = result.stylePrediction?.style;
    if (style) {
      setFormSpecifications((prev) => {
        const next = [...prev];
        const idx = next.findIndex((s) => /kiểu dáng|form|style/i.test(s.key));
        if (idx >= 0 && !next[idx].value) {
          next[idx] = { ...next[idx], value: style };
          return next;
        }
        if (!next.some((s) => s.key === 'Phong cách (AI)')) {
          return [...next, { id: `ai-style-${Date.now()}`, key: 'Phong cách (AI)', value: style }];
        }
        return next;
      });
    }
    const color = result.dominantColors?.[0]?.name;
    if (color) {
      setFormSpecifications((prev) => {
        if (prev.some((s) => /màu/i.test(s.key) && s.value)) return prev;
        const idx = prev.findIndex((s) => /màu/i.test(s.key));
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = { ...next[idx], value: color };
          return next;
        }
        return [...prev, { id: `ai-color-${Date.now()}`, key: 'Màu chủ đạo (AI)', value: color }];
      });
    }
  };

  const runAiAnalyze = async (file: File) => {
    setAiAnalyzing(true);
    try {
      const result = await aiAnalyze.mutateAsync(file);
      applyAiHints(result);
      showToast(
        result.topPrediction
          ? `AI: ${result.topPrediction.className} (${Math.round(result.topPrediction.confidence * 100)}%)`
          : 'AI đã phân tích ảnh (không có prediction chính).',
      );
    } catch (err: any) {
      showToast(err?.response?.data?.message || err?.message || 'AI analyze tạm không khả dụng — tiếp tục nhập tay.');
    } finally {
      setAiAnalyzing(false);
    }
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
        void runAiAnalyze(file);
      } else if (subIndex !== undefined && subIndex < formSubImages.length) {
        const nextSubs = [...formSubImages];
        nextSubs[subIndex] = imageUrl;
        setFormSubImages(nextSubs);
        showToast(`Đã thay thế ảnh phụ ${subIndex + 1} thành công!`);
      } else {
        setFormSubImages([...formSubImages, imageUrl]);
        showToast(`Đã thêm ảnh phụ ${formSubImages.length + 1} thành công!`);
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
    const fileList = Array.from(files);
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
        } else if (!subs.includes(uploadedUrl)) {
          subs.push(uploadedUrl);
        }
      }

      setFormImage(mainImg);
      setFormSubImages(subs);
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

    let packageData: ReturnType<typeof productPackageInput>;
    try {
      packageData = productPackageInput({ barcode: formBarcode, packageWeight: formPackageWeight,
        packageLength: formPackageLength, packageWidth: formPackageWidth, packageHeight: formPackageHeight }, editingProduct);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Thông số đóng gói không hợp lệ.');
      return;
    }

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

    const validSpecs = [...formSpecifications.filter((s) => s.key.trim() && s.value.trim())];
    let combinedDescription = formDescription.trim();
    const descriptionInputsChanged = !editingProduct ||
      combinedDescription !== (editingProduct.description || '').trim() ||
      formSpecifications.some(spec => spec.key.trim() && spec.value.trim());
    // Changing sample policy must not silently rewrite approved product content.
    if (descriptionInputsChanged && validSpecs.length > 0 && !/📌 THÔNG SỐ KỸ THUẬT(?: SẢN PHẨM)?:/.test(combinedDescription)) {
      const specsBlock = `📌 THÔNG SỐ KỸ THUẬT SẢN PHẨM:\n` +
        validSpecs.map((s) => `• ${s.key.trim()}: ${s.value.trim()}`).join('\n') +
        `\n\n`;
      combinedDescription = specsBlock + combinedDescription;
    }

    setSavingProduct(true);
    try {
      if (editingProduct) {
        const productUpdate = await productService.updateProduct(editingProduct.id, {
          ...packageData,
          title: formTitle.trim(),
          categoryName: effectiveCategory,
          description: combinedDescription || undefined,
          ingredients: formIngredients.trim() || undefined,
          origin: formOrigin.trim() || undefined,
          labelInfo: formLabelInfo.trim() || undefined,
          originProofLinks: formOriginProofLinks.map((url) => url.trim()).filter(Boolean),
          originProofImages: formOriginProofImages,
          labelProofLinks: formLabelProofLinks.map((url) => url.trim()).filter(Boolean),
          labelProofImages: formLabelProofImages,
          price: Number(formPrice),
          originalPrice: formOriginalPrice !== '' ? Number(formOriginalPrice) : undefined,
          customCommissionRate: 10,
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
          ...packageData,
          storeId: currentStoreId,
          sku: formSku.trim().toUpperCase(),
          title: formTitle.trim(),
          categoryName: effectiveCategory,
          description: combinedDescription || undefined,
          ingredients: formIngredients.trim() || undefined,
          origin: formOrigin.trim() || undefined,
          labelInfo: formLabelInfo.trim() || undefined,
          originProofLinks: formOriginProofLinks.map((url) => url.trim()).filter(Boolean),
          originProofImages: formOriginProofImages,
          labelProofLinks: formLabelProofLinks.map((url) => url.trim()).filter(Boolean),
          labelProofImages: formLabelProofImages,
          price: Number(formPrice),
          originalPrice: formOriginalPrice !== '' ? Number(formOriginalPrice) : undefined,
          customCommissionRate: 10,
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
      closeProductModal();
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
            commissionRate: 10,
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
            commissionRate: 10,
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
            commissionRate: 10,
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
            commissionRate: 10,
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
    <div className="product-management @container/product-management space-y-4 text-left w-full min-w-0 text-[#1A1612]">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-[100] p-3.5 bg-white text-[#1A1612] border border-[#EEDFC6] rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-[#059669] shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* 1. Page Header Chuẩn Hóa */}
      <PageHeader
        title={isKol ? "Sản phẩm Tiếp thị Liên kết" : "Danh mục Sản phẩm"}
        description={isKol ? "Khám phá danh sách sản phẩm hợp tác và hoa hồng trên sàn" : "Quản lý kho SKU, biến thể đa tầng và chính sách hoa hồng tiếp thị liên kết"}
        icon={<Boxes className="w-5 h-5" />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void loadProducts()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EAE4D7] bg-white text-xs font-semibold text-[#1A1612] hover:bg-[#FBF5EB] hover:border-[#C59B58] transition cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-[#B88E4F]" />
              <span>Làm mới</span>
            </button>
            {!isKol && (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-[#1A1612] text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm sản phẩm</span>
              </button>
            )}
          </div>
        }
      />

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
        <div className="product-toolbar-layout grid grid-cols-[minmax(280px,1fr)_minmax(0,1.3fr)] @max-[900px]/product-management:grid-cols-1 items-stretch gap-3 @max-[900px]/product-management:gap-2.5">
          {/* Left: Compact search input & filter controls */}
          <div className="product-filter-controls grid grid-cols-[minmax(0,1fr)_160px] items-stretch min-w-0 gap-2">
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
              aria-label="Lọc trạng thái sản phẩm" className="product-status-filter"
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

          {/* Actions share the search/filter toolbar and equal-sized columns. */}
          <div className="product-toolbar-actions grid grid-flow-col auto-cols-[minmax(0,1fr)] @max-[900px]/product-management:w-full items-stretch min-w-0 gap-2" role="group" aria-label="Thao tác quản lý sản phẩm">
            {!isKol ? (
              <>
                {isAdminOrManager && (
                  <button
                    type="button"
                    onClick={() => navigate('/admin/product-moderation')}
                    className="flex items-center justify-center w-full min-w-0 min-h-10 p-2 border border-[#EEDFC6] rounded-lg bg-[#FBF5EB] hover:bg-[#F3EFE6] hover:border-[#C59B58] text-[#1A1612] text-xs font-semibold leading-[1.4] transition cursor-pointer gap-1.5"
                    title="Mở cổng kiểm duyệt sản phẩm chuyên sâu"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-[#B88E4F] shrink-0" />
                    <span>Cổng duyệt</span>
                    {pendingApprovalCount > 0 && (
                      <span className="min-w-4.5 h-4.5 px-1.5 rounded-full bg-[#FAF0DD] border border-[#E8D4B0] text-[#B88E4F] text-[10px] font-extrabold inline-flex items-center justify-center shrink-0">
                        {pendingApprovalCount}
                      </span>
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={openAllVideoModeration}
                  className="flex items-center justify-center w-full min-w-0 min-h-10 p-2 border border-[#EEDFC6] rounded-lg bg-[#FBF5EB] hover:bg-[#F3EFE6] hover:border-[#C59B58] text-[#1A1612] text-xs font-semibold leading-[1.4] transition cursor-pointer gap-1.5"
                  title="Duyệt video nghiệm thu từ KOL"
                >
                  <Video className="w-3.5 h-3.5 text-[#B88E4F] shrink-0" />
                  <span>Duyệt video</span>
                  {pendingKolVideoCount > 0 && (
                    <span className="min-w-4.5 h-4.5 px-1 rounded-full bg-[#FAF0DD] border border-[#E8D4B0] text-[#B88E4F] text-[10px] font-extrabold inline-flex items-center justify-center shrink-0">
                      {pendingKolVideoCount}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={openReviewModeration}
                  className="flex items-center justify-center w-full min-w-0 min-h-10 p-2 border border-[#EEDFC6] rounded-lg bg-[#FBF5EB] hover:bg-[#F3EFE6] hover:border-[#C59B58] text-[#1A1612] text-xs font-semibold leading-[1.4] transition cursor-pointer gap-1.5"
                  title="Duyệt đánh giá từ khách hàng"
                >
                  <MessageSquareText className="w-3.5 h-3.5 text-[#B88E4F] shrink-0" />
                  <span>Duyệt review</span>
                </button>

                <button
                  type="button"
                  id="btn-open-create-product"
                  onClick={openCreateModal}
                  className="flex items-center justify-center w-full min-w-0 min-h-10 p-2 border border-[#C59B58] rounded-lg bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-semibold leading-[1.4] transition cursor-pointer gap-1.5 shadow-2xs"
                  title="Thêm sản phẩm mới vào kho"
                >
                  <Plus className="w-3.5 h-3.5 text-white shrink-0" />
                  <span>Thêm sản phẩm</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => navigate('/collaborator/links')}
                className="flex items-center justify-center w-full min-w-0 min-h-10 p-2 border border-[#C59B58] rounded-lg bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-semibold leading-[1.4] transition cursor-pointer gap-1.5 shadow-2xs"
              >
                <PlusCircle className="w-3.5 h-3.5 text-white shrink-0" />
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
              <TableHead>Hoa hồng nền</TableHead>
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
              const rate = 10;
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
        onClose={closeProductModal}
        icon={<Package className="h-4 w-4" />}
        title={editingProduct ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        maxWidth="full"
        stickyHeader
        className="!max-w-[min(92vw,1200px)] !w-[min(92vw,1200px)] max-h-[min(88dvh,820px)] rounded-3xl border border-[#EAE4D7] bg-white text-[#1A1612] shadow-[0_24px_80px_rgba(35,29,21,0.18)]"
        footer={(<div className="product-editor-actions flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={closeProductModal}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#7D715E] bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              form="product-editor-form"
              disabled={uploadingImage || savingProduct}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#231D15] bg-[#C59B58] hover:bg-[#B88E4F] shadow-sm transition cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
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
                  <span>{editingProduct ? 'Lưu thay đổi sản phẩm' : 'Gửi duyệt sản phẩm'}</span>
                </>
              )}
            </button>
          </div>)}
      >
        <form id="product-editor-form" noValidate onSubmit={handleSave} className="product-editor-form flex flex-col gap-5">
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
            <div className="border-l-2 border-[#EEDFC6] px-2.5 py-1 text-[11px] leading-relaxed text-[#7D715E]">
              Điền các mục có dấu <span className="text-[#DC2626]">*</span> để gửi duyệt. Cấp mẫu và hoa hồng có thể thiết lập sau.
            </div>
          )}
          {editingProduct?.moderationStatus === 'REJECTED' && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs text-rose-800">
              <strong className="block">Sản phẩm chưa được duyệt</strong>
              <span>{editingProduct.moderationReason || 'Hãy chỉnh sửa thông tin sản phẩm theo yêu cầu của Ban Quản Trị.'}</span>
              <span className="mt-1 block font-semibold">Lưu thay đổi sẽ gửi lại sản phẩm vào hàng đợi kiểm duyệt.</span>
            </div>
          )}
          {/* Quick anchor navigation */}
          <div className="product-editor-navigation mb-1 bg-[#FAF8F5] px-3 py-2 rounded-xl border border-[#EAE4D7] flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0" aria-label="Các phần thông tin sản phẩm">
            {[
              { id: 'product-section-basic', label: '1. Thông tin cơ bản' },
              { id: 'product-section-media', label: '2. Hình ảnh' },
              { id: 'product-section-pricing', label: '3. Giá & Vận chuyển' },
              { id: 'product-section-affiliate', label: '4. Hoa hồng KOL' },
              { id: 'product-section-legal-origin', label: '5. Xuất xứ & Nguồn gốc' },
              { id: 'product-section-legal-evidence', label: '6. Nhãn mác & Công bố' },
              { id: 'product-section-variants', label: '7. Biến thể SKU' },
            ].map((sec) => (
              <button
                key={sec.id}
                type="button"
                onClick={() => {
                  const el = document.getElementById(sec.id);
                  const scrollBody = document.getElementById('product-editor-form')?.parentElement;
                  if (el && scrollBody) {
                    scrollBody.scrollTo({
                      top: scrollBody.scrollTop + el.getBoundingClientRect().top - scrollBody.getBoundingClientRect().top - 14,
                      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
                    });
                  }
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white hover:bg-[#FBF5EB] border border-[#EAE4D7] hover:border-[#C59B58] text-[#7D715E] hover:text-[#B88E4F] whitespace-nowrap transition cursor-pointer shrink-0"
              >
                {sec.label}
              </button>
            ))}
          </div>

          {/* PERFECTLY BALANCED 2-COLUMN GRID (ROW BY ROW) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
            
            {/* ===================== HÀNG 1: THÔNG TIN CƠ BẢN ↔ HÌNH ẢNH ===================== */}
<div id="product-section-basic" className="product-editor-section flex flex-col gap-3.5 rounded-2xl border border-[#EAE4D7] bg-white p-5 shadow-[0_2px_12px_rgba(35,29,21,0.035)]">
              <div>
                <div className="flex items-center gap-2.5 border-b border-[#EAE4D7] pb-3 mb-3.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB]">
                    <FolderTree className="h-4 w-4 text-[#B88E4F]" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-[#1A1612]">1. Thông tin cơ bản</h4>
                    <p className="text-[11px] text-[#7D715E]">Tên, danh mục, mã định danh và mô tả sản phẩm</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                  <div>
                    <label className="text-xs font-semibold text-[#1A1612] block mb-1.5">
                      Danh mục sản phẩm <span className="text-rose-500">*</span>
                    </label>
                    <Select
                      id="form-category-select"
                      value={formCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      required
                      className="w-full text-xs"
                    >
                      <option value="" disabled>Chọn danh mục</option>
                      {STANDARD_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.name}>
                          {cat.icon} {cat.name}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <div className="flex items-center mb-1.5">
                      <label className="text-xs font-semibold text-[#1A1612]">
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
                      <Tag className="w-3.5 h-3.5 text-[#B88E4F] absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        value={formSku}
                        onChange={(e) => setFormSku(e.target.value.toUpperCase())}
                        placeholder="VD: SKIN-A109"
                        required
                        className="w-full bg-white border border-[#EAE4D7] rounded-xl pl-8 pr-3 py-2 text-xs text-[#1A1612] font-semibold focus:border-[#B88E4F] focus:ring-1 focus:ring-[#B88E4F]/20 outline-none transition font-mono"
                      />
                    </div>
                  </div>
                </div>

                {formCategory === 'Danh mục khác (Tự nhập)' && (
                  <div className="mb-3.5">
                    <label className="text-xs font-semibold text-[#1A1612] block mb-1.5">
                      Tên danh mục tùy chỉnh <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formCustomCategory}
                      onChange={(e) => setFormCustomCategory(e.target.value)}
                      placeholder="VD: Mẹ & Bé, Đồ gia dụng thông minh..."
                      required
                      className="w-full bg-white border border-[#EAE4D7] rounded-xl px-3 py-2 text-xs text-[#1A1612] font-medium focus:border-[#B88E4F] outline-none transition"
                    />
                  </div>
                )}

                <div className="mb-3.5">
                  <label className="text-xs font-semibold text-[#1A1612] block mb-1.5">
                    Tên sản phẩm <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative flex items-center">
                    <Package className="w-3.5 h-3.5 text-[#B88E4F] absolute left-3 pointer-events-none" />
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
                      placeholder="VD: Serum Dưỡng Trắng Mờ Thâm Vitamin C 15%"
                      required
                      className="w-full bg-white border border-[#EAE4D7] rounded-xl pl-8 pr-3 py-2 text-xs text-[#1A1612] font-semibold focus:border-[#B88E4F] outline-none transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#1A1612] block mb-1.5">
                    Mô tả chi tiết sản phẩm <span className="text-rose-500">*</span>
                  </label>
                  <AutoGrowTextarea
                    minHeight={86}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="Giới thiệu công dụng chính, thành phần nổi bật, đối tượng phù hợp và cách dùng..."
                    className="min-h-[86px] w-full resize-none overflow-hidden rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3 text-xs leading-relaxed text-[#1A1612] outline-none transition focus:border-[#B88E4F] focus:bg-white"
                  />
                </div>
              </div>
            </div>

<div id="product-section-media" className="product-editor-section flex flex-col gap-3.5 rounded-2xl border border-[#EAE4D7] bg-white p-5 shadow-[0_2px_12px_rgba(35,29,21,0.035)]">
              <div>
                <div className="flex items-center border-b border-[#EAE4D7] pb-3 mb-3.5">
                  <div>
                    <h4 className="text-sm font-bold text-[#1A1612] flex items-center gap-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB]">
                        <Camera className="h-4 w-4 text-[#B88E4F]" />
                      </span>
                      2. Hình ảnh sản phẩm
                    </h4>
                    <p className="text-[11px] text-[#7D715E] mt-0.5">1 ảnh bìa chính (bắt buộc) · Thêm ảnh phụ tùy chọn</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="bulk-images-input"
                      type="file"
                      multiple
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={(event) => { void handleBulkUpload(event.target.files); event.target.value = ''; }}
                    />
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => document.getElementById('bulk-images-input')?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-[#EAE4D7] hover:border-[#C59B58] bg-[#FAF8F5] text-[#574C3D] hover:text-[#B88E4F] transition cursor-pointer"
                    >
                      <UploadCloud size={14} />
                      {uploadingSlot === 'bulk' ? 'Đang tải…' : 'Tải nhiều ảnh'}
                    </button>
                  </div>
                </div>

                {/* Ảnh chính 1:1 */}
                <div className="mb-3.5">
                  <label className="text-xs font-bold text-[#1A1612] block mb-1.5">
                    Ảnh bìa chính (1:1) <span className="text-rose-500">*</span>
                  </label>

                  <input
                    id="main-image-input"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    disabled={uploadingImage}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void handleUploadSingleImage(file, true);
                      event.target.value = '';
                    }}
                  />

                  <div className="relative group w-full h-44 rounded-2xl border-2 border-dashed border-[#EEDFC6] bg-[#FBF5EB] overflow-hidden flex flex-col items-center justify-center transition hover:border-[#C59B58]">
                    {formImage ? (
                      <>
                        <img src={formImage} alt="Ảnh bìa chính" className="w-full h-full object-contain bg-white" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => document.getElementById('main-image-input')?.click()}
                            className="px-3 py-1.5 rounded-xl bg-white text-xs font-bold text-[#1A1612] hover:bg-slate-100 shadow transition cursor-pointer"
                          >
                            Đổi ảnh
                          </button>
                          <button
                            type="button"
                            onClick={() => { setFormImage(''); setAiResult(null); }}
                            className="p-1.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 shadow transition cursor-pointer"
                            title="Xóa ảnh chính"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </>
                    ) : (
                      <button
                        type="button"
                        disabled={uploadingImage}
                        onClick={() => document.getElementById('main-image-input')?.click()}
                        className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-[#7D715E] hover:text-[#B88E4F] cursor-pointer"
                      >
                        <ImagePlus size={28} className="text-[#B88E4F]" />
                        <span className="text-xs font-bold">
                          {uploadingSlot === 'main' ? 'Đang tải lên…' : 'Bấm để tải Ảnh bìa chính'}
                        </span>
                        <span className="text-[10.5px] text-[#7D715E]">Định dạng JPG, PNG, WEBP (Tối đa 5MB)</span>
                      </button>
                    )}
                  </div>
                  {(aiAnalyzing || aiResult) && (
                    <div className="mt-2 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-2 text-[11px] text-[#574C3D]">
                      <div className="flex items-center gap-1.5 font-semibold text-[#6F4E20]">
                        <Sparkles className="h-3.5 w-3.5" />
                        {aiAnalyzing ? 'AI đang phân tích ảnh…' : 'Gợi ý từ AI'}
                      </div>
                      {aiResult && !aiAnalyzing && (
                        <p className="mt-1 leading-relaxed">
                          {aiResult.topPrediction
                            ? `${aiResult.topPrediction.className} · ${Math.round(aiResult.topPrediction.confidence * 100)}%`
                            : 'Không có prediction chính'}
                          {aiResult.stylePrediction?.style ? ` · Style: ${aiResult.stylePrediction.style}` : ''}
                          {aiResult.dominantColors?.[0]?.name ? ` · Màu: ${aiResult.dominantColors[0].name}` : ''}
                          {aiResult.inferenceTimeMs ? ` · ${Math.round(aiResult.inferenceTimeMs)}ms` : ''}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Danh sách ảnh phụ */}
                <div>
                  <div className="flex items-center mb-1.5">
                    <label className="text-xs font-semibold text-[#1A1612]">
                      Thư viện ảnh phụ ({formSubImages.length})
                    </label>
                    <span className="text-[10.5px] text-[#7D715E]">Không giới hạn số lượng</span>
                  </div>

                  <div className="flex flex-wrap gap-2.5 items-center">
                    {formSubImages.map((subUrl, idx) => (
                      <div key={idx} className="relative group w-16 h-16 rounded-xl border border-[#EAE4D7] bg-white overflow-hidden shrink-0 shadow-2xs">
                        <img src={subUrl} alt={`Ảnh phụ ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1">
                          <button
                            type="button"
                            title="Đặt làm ảnh chính"
                            onClick={() => handleSetAsMain(idx)}
                            className="p-1 rounded-md bg-white text-[#B88E4F] hover:bg-[#FBF5EB]"
                          >
                            <Star size={11} />
                          </button>
                          <button
                            type="button"
                            title="Xóa ảnh"
                            onClick={() => handleRemoveSubImage(idx)}
                            className="p-1 rounded-md bg-rose-600 text-white hover:bg-rose-700"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    ))}

                    <input
                      id="sub-image-new-input"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      disabled={uploadingImage}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handleUploadSingleImage(file, false);
                        event.target.value = '';
                      }}
                    />
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => document.getElementById('sub-image-new-input')?.click()}
                      className="w-16 h-16 rounded-xl border-2 border-dashed border-[#EAE4D7] hover:border-[#C59B58] bg-[#FAF8F5] hover:bg-[#FBF5EB] flex flex-col items-center justify-center gap-1 text-[#7D715E] hover:text-[#B88E4F] transition cursor-pointer shrink-0"
                    >
                      <Plus size={16} />
                      <span className="text-[9.5px] font-bold">Thêm ảnh</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* ===================== HÀNG 2: GIÁ & VẬN CHUYỂN ↔ HOA HỒNG KOL ===================== */}
<div id="product-section-pricing" className="product-editor-section flex flex-col gap-4 rounded-2xl border border-[#EAE4D7] bg-white p-5 shadow-[0_2px_12px_rgba(35,29,21,0.035)]">
              <div>
                <div className="flex items-center border-b border-[#EAE4D7] pb-3 mb-3.5">
                  <span className="flex items-center gap-2.5 text-sm font-bold text-[#1A1612]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB]">
                      <Coins className="h-4 w-4 text-[#B88E4F]" />
                    </span>
                    3. Giá bán, Tồn kho & Vận chuyển
                  </span>
                  {formOriginalPrice && formPrice && Number(formOriginalPrice) > Number(formPrice) && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                      Giảm {Math.round(((Number(formOriginalPrice) - Number(formPrice)) / Number(formOriginalPrice)) * 100)}%
                      <span className="font-normal text-rose-500">
                        (-{(Number(formOriginalPrice) - Number(formPrice)).toLocaleString('vi-VN')} ₫)
                      </span>
                    </span>
                  )}
                </div>

                {/* 3 ô Giá & Tồn kho */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-4">
                  <div>
                    <label className="text-xs font-semibold text-[#7D715E] block mb-1.5">
                      Giá gốc niêm yết (₫)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={formOriginalPrice}
                      onChange={(e) => setFormOriginalPrice(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                      placeholder="VD: 350.000"
                      className="h-10 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 text-xs font-semibold text-[#7D715E] line-through outline-none transition focus:border-[#B88E4F] focus:bg-white"
                    />
                    <span className="mt-1 block text-[10.5px] text-[#7D715E]">
                      {formOriginalPrice ? `${Number(formOriginalPrice).toLocaleString('vi-VN')} ₫` : 'Bỏ trống nếu không giảm giá'}
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#1A1612] block mb-1.5">
                      Giá bán thực tế (₫) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Coins className="w-3.5 h-3.5 text-[#B88E4F] absolute left-3 pointer-events-none" />
                      <input
                        type="number"
                        min={1000}
                        step={1000}
                        value={formPrice}
                        onChange={(e) => handlePriceChange(e.target.value === '' ? '' : Number(e.target.value))}
                        required
                        placeholder="VD: 280.000"
                        className="h-10 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] pl-8 pr-3 text-xs font-bold text-[#1A1612] outline-none transition focus:border-[#B88E4F] focus:bg-white"
                      />
                    </div>
                    <span className="mt-1 block text-[10.5px] font-bold text-[#B88E4F]">
                      {formPrice === '' ? '—' : `${Number(formPrice).toLocaleString('vi-VN')} ₫`}
                    </span>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#1A1612] block mb-1.5">
                      Tồn kho sẵn có <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative flex items-center">
                      <Boxes className="w-3.5 h-3.5 text-[#B88E4F] absolute left-3 pointer-events-none" />
                      <input
                        type="number"
                        min={0}
                        value={formStock}
                        onChange={(e) => setFormStock(e.target.value === '' ? '' : Number(e.target.value))}
                        required
                        placeholder="VD: 100"
                        className="h-10 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] pl-8 pr-3 text-xs font-semibold text-[#1A1612] outline-none transition focus:border-[#B88E4F] focus:bg-white"
                      />
                    </div>
                    <span className="mt-1 block text-[10.5px] text-[#7D715E]">
                      Số lượng sẵn sàng cung ứng
                    </span>
                  </div>
                </div>

                <div className="mt-3 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3">
                  <label htmlFor="product-ean13" className="mb-1.5 block text-xs font-semibold text-[#1A1612]">Barcode EAN-13 {!editingProduct && '*'}</label>
                  <input id="product-ean13" value={formBarcode} inputMode="numeric" maxLength={13}
                    onChange={(event) => setFormBarcode(event.target.value.replace(/\D/g, ''))}
                    placeholder="13 chữ số trên bao bì" required={!editingProduct}
                    className="h-10 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 text-sm text-[#1A1612] outline-none focus:border-[#B88E4F]" />
                  <p className="mt-1 text-xs text-[#7D715E]">Dữ liệu đóng gói bên dưới được lưu riêng và dùng để báo giá GHN. Không tự điền số đo mẫu.</p>
                </div>
                {/* 4 ô Đóng gói & Vận chuyển (GHN / GHTK) */}
                <div id="product-section-shipping" className="rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3.5 mb-3.5">
                  <div className="flex items-center border-b border-[#EAE4D7] pb-2 mb-2.5">
                    <span className="flex items-center gap-1.5 text-xs font-bold text-[#1A1612]">
                      <Truck className="h-3.5 w-3.5 text-[#B88E4F]" />
                      Quy cách đóng gói giao vận (GHN / GHTK)
                    </span>
                    <span className="text-[11px] font-semibold text-[#8C6226] bg-[#FBF5EB] px-2 py-0.5 rounded-md border border-[#EEDFC6]">
                      Quy đổi cước: {formPackageLength && formPackageWidth && formPackageHeight
                        ? `${((Number(formPackageLength) * Number(formPackageWidth) * Number(formPackageHeight)) / 5000).toFixed(2)} kg`
                        : '0.00 kg'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-[#1A1612] block mb-1">
                        Cân nặng <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min={1}
                          value={formPackageWeight}
                          onChange={(e) => setFormPackageWeight(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                          placeholder="250"
                          required
                          className="h-8 w-full rounded-lg border border-[#EAE4D7] bg-white px-2.5 pr-6 text-xs font-bold text-[#1A1612] outline-none focus:border-[#B88E4F]"
                        />
                        <span className="absolute right-2 text-xs font-semibold text-[#7D715E]">g</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#1A1612] block mb-1">
                        Chiều Dài <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min={1}
                          value={formPackageLength}
                          onChange={(e) => setFormPackageLength(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                          placeholder="15"
                          required
                          className="h-8 w-full rounded-lg border border-[#EAE4D7] bg-white px-2.5 pr-7 text-xs font-semibold text-[#1A1612] outline-none focus:border-[#B88E4F]"
                        />
                        <span className="absolute right-2 text-xs font-semibold text-[#7D715E]">cm</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#1A1612] block mb-1">
                        Chiều Rộng <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min={1}
                          value={formPackageWidth}
                          onChange={(e) => setFormPackageWidth(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                          placeholder="10"
                          required
                          className="h-8 w-full rounded-lg border border-[#EAE4D7] bg-white px-2.5 pr-7 text-xs font-semibold text-[#1A1612] outline-none focus:border-[#B88E4F]"
                        />
                        <span className="absolute right-2 text-xs font-semibold text-[#7D715E]">cm</span>
                      </div>
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-[#1A1612] block mb-1">
                        Chiều Cao <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative flex items-center">
                        <input
                          type="number"
                          min={1}
                          value={formPackageHeight}
                          onChange={(e) => setFormPackageHeight(e.target.value === '' ? '' : Math.max(1, Number(e.target.value)))}
                          placeholder="5"
                          required
                          className="h-8 w-full rounded-lg border border-[#EAE4D7] bg-white px-2.5 pr-7 text-xs font-semibold text-[#1A1612] outline-none focus:border-[#B88E4F]"
                        />
                        <span className="absolute right-2 text-xs font-semibold text-[#7D715E]">cm</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thông số kỹ thuật */}
                <div className="border-t border-[#EAE4D7] pt-2.5">
                  <div className="flex items-center mb-2">
                    <span className="text-xs font-bold text-[#1A1612]">
                      Thông số kỹ thuật sản phẩm (Tùy chọn)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setFormSpecifications((current) => [
                          ...current,
                          { id: `spec-${Date.now()}`, key: '', value: '' },
                        ]);
                      }}
                      className="text-xs font-bold text-[#B88E4F] hover:underline cursor-pointer"
                    >
                      + Thêm thông số
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {formSpecifications.map((spec, specIdx) => (
                      <div key={spec.id || specIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={spec.key}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormSpecifications((current) =>
                              current.map((item, idx) => (idx === specIdx ? { ...item, key: val } : item))
                            );
                          }}
                          placeholder="Thuộc tính (VD: Chất liệu)"
                          className="h-8 w-1/3 rounded-lg border border-[#EAE4D7] bg-white px-2.5 text-xs font-semibold text-[#1A1612] outline-none focus:border-[#B88E4F]"
                        />
                        <input
                          type="text"
                          value={spec.value}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormSpecifications((current) =>
                              current.map((item, idx) => (idx === specIdx ? { ...item, value: val } : item))
                            );
                          }}
                          placeholder="Giá trị (VD: 100% Cotton)"
                          className="h-8 flex-1 rounded-lg border border-[#EAE4D7] bg-white px-2.5 text-xs text-[#1A1612] outline-none focus:border-[#B88E4F]"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (formSpecifications.length <= 1) {
                              setFormSpecifications([{ id: `spec-${Date.now()}`, key: '', value: '' }]);
                              return;
                            }
                            setFormSpecifications((current) => current.filter((_, idx) => idx !== specIdx));
                          }}
                          className="h-8 w-8 rounded-lg text-[#7D715E] hover:text-rose-600 flex items-center justify-center shrink-0 cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

<div id="product-section-affiliate" className="product-editor-section flex flex-col gap-4 rounded-2xl border border-[#EAE4D7] bg-white p-5 shadow-[0_2px_12px_rgba(35,29,21,0.035)]">
              <div>
                <div className="flex items-center border-b border-[#EAE4D7] pb-3 mb-3.5">
                  <span className="flex items-center gap-2.5 text-sm font-bold text-[#1A1612]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB]">
                      <Percent className="h-4 w-4 text-[#B88E4F]" />
                    </span>
                    4. Hoa hồng KOL & Mẫu thử
                  </span>
                  <span className="rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-1 text-xs font-bold text-[#8C6226]">
                    {formCommission ? `${Number(formCommission).toFixed(1)}%` : '10.0%'} Chuẩn sàn
                  </span>
                </div>

                <div className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-xs flex items-center mb-3.5">
                  <div className="flex items-center gap-2">
                    <Coins className="h-4 w-4 text-[#B88E4F]" />
                    <span className="text-[#1A1612]">KOL nhận:</span>
                    <strong className="text-[#B88E4F] text-sm">
                      {formCommissionAmount === '' ? '—' : `${Number(formCommissionAmount).toLocaleString('vi-VN')} ₫`}
                    </strong>
                  </div>
                  <div className="text-xs text-[#7D715E]">
                    Gian hàng thu về: <strong className="text-[#1A1612]">{formPrice === '' || formCommissionAmount === '' ? '—' : `${Math.max(0, Number(formPrice) - Number(formCommissionAmount)).toLocaleString('vi-VN')} ₫`}</strong>
                  </div>
                </div>

                <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3 mb-3.5">
                  <input
                    type="checkbox"
                    checked={formAffiliateEnabled}
                    onChange={(event) => setFormAffiliateEnabled(event.target.checked)}
                    className="h-4 w-4 accent-[#C59B58]"
                  />
                  <span className="text-xs font-bold text-[#1A1612]">
                    Mở Open Offer cho KOL/CTV toàn sàn (10% hoa hồng)
                  </span>
                </label>

                {/* Cấp mẫu thử */}
                <div className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3.5 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-[#1A1612]">
                        Chương trình sản phẩm mẫu cho KOL
                      </span>
                      <p className="text-[11px] text-[#7D715E] mt-0.5">KOL chỉ có thể xin mẫu khi gian hàng bật tính năng này</p>
                    </div>
                    <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#1A1612]">
                      <input
                        type="checkbox"
                        checked={formSampleEnabled}
                        onChange={(event) => setFormSampleEnabled(event.target.checked)}
                        className="accent-[#C59B58]"
                      />
                      Cho phép xin mẫu
                    </label>
                  </div>
                  {formSampleEnabled && (
                    <div className="flex items-center gap-3 mt-1 pt-2 border-t border-[#EEDFC6]">
                      <label className="text-xs text-[#7D715E]">Hạn mức suất mẫu duyệt:</label>
                      <input
                        type="number"
                        min={0}
                        value={formSampleQuota}
                        placeholder="10"
                        onChange={(e) => setFormSampleQuota(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                        className="h-8 w-24 rounded-lg border border-[#EAE4D7] bg-white px-2.5 text-xs font-bold text-[#1A1612] outline-none"
                      />
                    </div>
                  )}
                </div>
      
                <div className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-[11px] text-[#7D715E] flex flex-col gap-1.5 mt-3.5">
                  <div className="flex items-center gap-1.5 font-bold text-[#8C6226]">
                    <Sparkles size={13} className="text-[#B88E4F]" />
                    Chính sách tiếp thị liên kết SCANMS
                  </div>
                  <p className="leading-relaxed">
                    Tỷ lệ hoa hồng tối thiểu 10% theo tiêu chuẩn sàn. Gian hàng có thể nâng mức chiết khấu độc quyền riêng cho từng KOL trong mục Quản lý Cộng tác.
                  </p>
                </div>
              </div>
            </div>

            {/* ===================== HÀNG 3: XUẤT XỨ & HÓA ĐƠN ↔ NHÃN MÁC & CÔNG BỐ ===================== */}
<div id="product-section-legal-origin" className="product-editor-section flex flex-col justify-between gap-3.5 rounded-2xl border border-[#EAE4D7] bg-white p-5 shadow-[0_2px_12px_rgba(35,29,21,0.035)]">
              <div>
                <div className="flex items-center gap-2.5 border-b border-[#EAE4D7] pb-3 mb-3.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB]">
                    <ShieldCheck className="h-4 w-4 text-[#B88E4F]" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-[#1A1612]">5. Xuất xứ & Nguồn gốc</h4>
                    <p className="text-[11px] text-[#7D715E]">Khai báo thành phần, nơi sản xuất và hóa đơn chứng từ</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mb-3.5">
                  <div>
                    <label className="text-xs font-semibold text-[#1A1612] block mb-1.5">
                      Xuất xứ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formOrigin}
                      onChange={(e) => setFormOrigin(e.target.value)}
                      placeholder="VD: Việt Nam, Hàn Quốc..."
                      required
                      className="h-10 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 text-xs font-semibold text-[#1A1612] outline-none transition focus:border-[#B88E4F] focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#1A1612] block mb-1.5">
                      Thành phần chính <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formIngredients}
                      onChange={(e) => setFormIngredients(e.target.value)}
                      placeholder="VD: Nước tinh khiết, Vitamin C..."
                      required
                      className="h-10 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 text-xs font-semibold text-[#1A1612] outline-none transition focus:border-[#B88E4F] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <ProductEvidenceEditor
                    title="Minh chứng xuất xứ & Hóa đơn"
                    description="Link tra cứu hoặc ảnh hóa đơn chứng từ nguồn gốc"
                    required
                    inputId="origin-proof-images"
                    links={formOriginProofLinks}
                    images={formOriginProofImages}
                    uploading={uploadingImage}
                    uploadLabel={uploadingSlot === 'origin-proof' ? 'Đang tải…' : 'Tải ảnh'}
                    onLinksChange={setFormOriginProofLinks}
                    onImagesChange={setFormOriginProofImages}
                    onUpload={(files) => { void handleUploadProofImages(files, 'origin'); }}
                  />
                </div>
              </div>
            </div>

<div id="product-section-legal-evidence" className="product-editor-section flex flex-col justify-between gap-3.5 rounded-2xl border border-[#EAE4D7] bg-white p-5 shadow-[0_2px_12px_rgba(35,29,21,0.035)]">
              <div>
                <div className="flex items-center gap-2.5 border-b border-[#EAE4D7] pb-3 mb-3.5">
                  <span className="flex h-8 w-8 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB]">
                    <ShieldCheck className="h-4 w-4 text-[#B88E4F]" />
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-[#1A1612]">6. Nhãn mác & Giấy phép công bố</h4>
                    <p className="text-[11px] text-[#7D715E]">Khai báo nhãn phụ, cảnh báo và số công bố lưu hành</p>
                  </div>
                </div>

                <div className="mb-3.5">
                  <label className="text-xs font-semibold text-[#1A1612] block mb-1.5">
                    Nhãn mác, Cảnh báo & Hướng dẫn sử dụng <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formLabelInfo}
                    onChange={(e) => setFormLabelInfo(e.target.value)}
                    placeholder="Thông tin thể hiện trên bao bì, nhãn phụ, cách bảo quản..."
                    required
                    className="h-10 w-full rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3 text-xs font-semibold text-[#1A1612] outline-none transition focus:border-[#B88E4F] focus:bg-white"
                  />
                </div>

                <div>
                  <ProductEvidenceEditor
                    title="Minh chứng công bố lưu hành"
                    description="Link trang công bố hoặc ảnh nhãn phụ rõ nét"
                    required
                    inputId="label-proof-images"
                    links={formLabelProofLinks}
                    images={formLabelProofImages}
                    uploading={uploadingImage}
                    uploadLabel={uploadingSlot === 'label-proof' ? 'Đang tải…' : 'Tải ảnh'}
                    onLinksChange={setFormLabelProofLinks}
                    onImagesChange={setFormLabelProofImages}
                    onUpload={(files) => { void handleUploadProofImages(files, 'label'); }}
                  />
                </div>
              </div>
            </div>

            {/* ===================== HÀNG 4 (TOÀN CHIỀU RỘNG): PHÂN LOẠI & BIẾN THỂ SKU ===================== */}
            <div className="lg:col-span-2">
<div id="product-section-variants" className="product-editor-section product-editor-variants flex flex-col gap-4 rounded-2xl border border-[#EAE4D7] bg-[#FAF8F5] p-5 shadow-[0_2px_12px_rgba(35,29,21,0.03)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE4D7] pb-3">
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[#EEDFC6] bg-[#FBF5EB]">
                    <Package className="h-4 w-4 text-[#B88E4F]" />
                  </span>
                  <div>
                    <span className="text-sm font-bold text-[#1A1612]">
                      7. Phân loại & Biến thể SKU <span className="text-rose-500">*</span>
                    </span>
                    <span className="ml-2 text-xs text-[#7D715E]">
                      Tạo các biến thể màu sắc, kích cỡ, dung tích kèm ảnh và giá riêng
                    </span>
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (!formCategory) {
                      showToast('Vui lòng chọn danh mục ở Mục 1 trước khi thêm phân loại.');
                      document.getElementById('form-category-select')?.focus();
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
                  className="border-[#EEDFC6] bg-white text-[#6F4E20] hover:border-[#C59B58] hover:bg-[#FBF5EB] text-xs font-bold"
                >
                  <PlusCircle size={14} /> Thêm phân loại mới
                </Button>
              </div>

              {/* THÔNG TIN DANH MỤC ĐỒNG BỘ */}
              <div className="flex items-center justify-between gap-3 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-4 py-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-[#8C6226]">Thuộc tính theo danh mục:</span>
                  <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#EEDFC6] bg-white px-2.5 py-1 font-bold text-[#1A1612] text-xs">
                    {STANDARD_CATEGORIES.find((c) => c.name === formCategory)?.icon || '📦'}{' '}
                    {formCategory === 'Danh mục khác (Tự nhập)'
                      ? (formCustomCategory || 'Danh mục tự nhập')
                      : (formCategory || 'Chưa chọn danh mục')}
                  </span>
                </div>
              </div>

              {formCategory && (
                <div className="rounded-xl border border-[#EAE4D7] bg-white p-4">
                  <p className="text-xs font-bold text-[#1A1612]">Tạo nhanh tổ hợp phân loại tự động</p>
                  <p className="text-[11px] text-[#7D715E] mt-0.5">Nhập các giá trị ngăn cách bằng dấu phẩy (VD: Đen, Trắng và Size S, M)</p>
                  <div className="mt-3 grid gap-3 sm:grid-cols-3">
                    {getVariantFields(formCategory).map((field) => (
                      <label key={field.key} className="grid gap-1 text-xs font-semibold text-[#7D715E]">
                        {field.label}
                        <input
                          value={variantOptionLists[field.key] || ''}
                          onChange={(event) => setVariantOptionLists((current) => ({ ...current, [field.key]: event.target.value }))}
                          placeholder={field.placeholder}
                          className="w-full rounded-xl border border-[#EAE4D7] bg-white px-3 py-2 text-xs text-[#1A1612] outline-none focus:border-[#B88E4F]"
                        />
                      </label>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={generateVariantCombinations}
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#C59B58] px-4 py-2 text-xs font-bold text-[#231D15] hover:bg-[#B88E4F] transition cursor-pointer"
                  >
                    <PlusCircle size={14} /> Tạo tổ hợp SKU tự động
                  </button>
                </div>
              )}

              {formVariants.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#D8C7A8] bg-white p-6 text-center text-xs text-[#7D715E]">
                  Chưa có phân loại. Bấm "Thêm phân loại mới" để tạo các biến thể (màu sắc, kích cỡ, dung tích...).
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {formVariants.map((variant, index) => (
                    <div
                      id={`variant-card-${index}`}
                      key={variant.id || `new-${index}`}
                      className="grid grid-cols-1 items-start gap-3 rounded-2xl border border-[#EAE4D7] bg-white p-4 sm:grid-cols-[88px_minmax(0,1fr)_auto] shadow-2xs"
                    >
                      <div className="flex flex-col items-center gap-2">
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
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#EAE4D7] bg-[#FAF8F5]">
                          {variant.imageUrl ? (
                            <img src={variant.imageUrl} alt="Ảnh SKU" className="w-full h-full object-cover" />
                          ) : (
                            <ImagePlus size={22} className="text-[#B88E4F]" />
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => document.getElementById(`variant-image-input-${index}`)?.click()}
                          disabled={uploadingImage}
                          className="text-[11px] font-bold text-[#B88E4F] hover:underline cursor-pointer"
                        >
                          {uploadingSlot === `variant-${index}` ? 'Đang tải…' : 'Đổi ảnh'}
                        </button>
                      </div>

                      <div className="grid min-w-0 grid-cols-1 gap-2.5 sm:grid-cols-2">
                        {getVariantFields(formCategory).map((field) => (
                          <label key={field.key} className="min-w-0 text-xs font-semibold text-[#7D715E]">
                            {field.label}
                            <input
                              value={variant.attributes[field.key] || ''}
                              maxLength={80}
                              onChange={(event) => setFormVariants((current) => current.map((item, itemIndex) => {
                                if (itemIndex !== index) return item;
                                const attributes = { ...item.attributes, [field.key]: event.target.value };
                                return { ...item, attributes, name: variantDisplayName(attributes, getVariantFields(formCategory)) || item.name };
                              }))}
                              placeholder={field.placeholder}
                              className="mt-1 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 py-1.5 text-xs text-[#1A1612] outline-none focus:border-[#B88E4F]"
                            />
                          </label>
                        ))}
                        <label className="min-w-0 text-xs font-semibold text-[#7D715E]">
                          Tên hiển thị <span className="text-rose-500">*</span>
                          <input
                            value={variant.name}
                            onChange={(event) => setFormVariants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value } : item))}
                            placeholder="30 ml · serum lỏng"
                            className="mt-1 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 py-1.5 text-xs text-[#1A1612] outline-none focus:border-[#B88E4F]"
                          />
                        </label>
                        <label className="min-w-0 text-xs font-semibold text-[#7D715E]">
                          Mã SKU con <span className="text-rose-500">*</span>
                          <input
                            value={variant.sku}
                            onChange={(event) => setFormVariants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, sku: event.target.value.toUpperCase() } : item))}
                            placeholder="SERUM-30ML"
                            className="mt-1 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 py-1.5 text-xs font-mono text-[#1A1612] outline-none focus:border-[#B88E4F]"
                          />
                        </label>
                        <label className="min-w-0 text-xs font-semibold text-[#7D715E]">
                          Giá bán (₫) <span className="text-rose-500">*</span>
                          <input
                            type="number"
                            min={0}
                            value={variant.price}
                            onChange={(event) => setFormVariants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, price: Math.max(0, Number(event.target.value) || 0) } : item))}
                            className="mt-1 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 py-1.5 text-xs text-[#1A1612] outline-none focus:border-[#B88E4F]"
                          />
                        </label>
                        <label className="min-w-0 text-xs font-semibold text-[#7D715E]">
                          Tồn kho <span className="text-rose-500">*</span>
                          <input
                            type="number"
                            min={0}
                            value={variant.stockQuantity}
                            onChange={(event) => setFormVariants((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, stockQuantity: Math.max(0, Number(event.target.value) || 0) } : item))}
                            className="mt-1 w-full rounded-xl border border-[#EAE4D7] bg-white px-3 py-1.5 text-xs text-[#1A1612] outline-none focus:border-[#B88E4F]"
                          />
                        </label>
                      </div>

                      <button
                        type="button"
                        onClick={() => setFormVariants((current) => current.filter((_, itemIndex) => itemIndex !== index))}
                        className="text-[#7D715E] hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                        title="Xóa phân loại này"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

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
            className="kol-video-review-modal bg-white rounded-2xl shadow-2xl border border-[#EAE4D7] w-full max-w-[900px] max-h-[calc(100dvh-32px)] text-left animate-in zoom-in-95 duration-150 overflow-hidden flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-labelledby="kol-video-review-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kol-video-review-header flex items-center justify-between bg-white border-b border-[#EAE4D7] p-3 sm:p-[14px_18px] shrink-0">
              <div className="flex min-w-0 items-center gap-3">
                <div className="w-10 h-10 bg-[#FBF5EB] border border-[#EAE4D7] rounded-xl flex items-center justify-center text-[#B88E4F] shrink-0">
                  <Video className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 id="kol-video-review-title" className="text-base font-semibold text-[#1A1612] m-0 flex flex-wrap items-center gap-2">
                    Duyệt video KOL
                    <span className="kol-video-scope border border-[#EAE4D7] rounded-md px-1.5 py-0.5 text-[#7D715E] bg-white text-[10px] font-medium tracking-normal">{selectedVideoProduct.id === '__ALL__' ? 'Tất cả sản phẩm' : selectedVideoProduct.sku}</span>
                  </h3>
                  <p className="text-xs text-[#7D715E] m-0 mt-0.5">
                    {selectedVideoProduct.id === '__ALL__'
                      ? 'Xem video và phản hồi cho nhà sáng tạo.'
                      : `Sản phẩm: ${selectedVideoProduct.title || (selectedVideoProduct as any).name}`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                aria-label="Đóng cửa sổ duyệt video"
                onClick={() => setSelectedVideoProduct(null)}
                className="w-8 h-8 rounded-lg text-[#7D715E] hover:text-[#1A1612] hover:bg-[#FAF8F5] flex items-center justify-center cursor-pointer transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="kol-video-review-list flex-1 overflow-y-auto p-3 sm:p-[14px_16px] space-y-3 overscroll-contain [scrollbar-color:#EEDFC6_#FFFFFF]">
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
                <div className="kol-video-workspace">
                  <nav className="kol-video-picker" aria-label="Danh sách video cần xem">
                    <p className="kol-video-picker-count"><span>Danh sách video</span><strong>{productVideos.length}</strong></p>
                    {productVideos.map((video: any, index: number) => (
                      <button key={video.id} type="button" className="kol-video-picker-item" data-status={video.status} aria-pressed={activeReviewVideo?.id === video.id} onClick={() => setActiveVideoId(video.id)}>
                        <span className="kol-video-picker-thumb">{video.posterUrl ? <img src={video.posterUrl} alt="" /> : <Video size={18} />}<span>{index + 1}</span></span>
                        <span className="kol-video-picker-text"><strong>{video.title || 'Video review sản phẩm'}</strong><span>{video.collaborator?.fullName || 'Nhà sáng tạo'}</span><small>{({ PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Bị từ chối', HIDDEN: 'Đã ẩn' } as Record<string, string>)[video.status] || video.status}{video.isFeatured ? ' · Đã ghim' : ''}</small></span>
                      </button>
                    ))}
                  </nav>
                  <div className="kol-video-selected">
                {[activeReviewVideo].filter(Boolean).map((v: any) => {
                  const isPending = v.status === 'PENDING';
                  const isApproved = v.status === 'APPROVED';
                  const isRejected = v.status === 'REJECTED';
                  const isHidden = v.status === 'HIDDEN';

                  return (
                    <article
                      key={v.id}
                      className="kol-video-review-card bg-white rounded-xl border border-[#EAE4D7] p-3 text-xs shadow-none"
                    >
                      <div className="kol-video-review-layout grid grid-cols-1 sm:grid-cols-[224px_minmax(0,1fr)] gap-3 sm:gap-4 items-start">
                        <div className="kol-video-player overflow-hidden border border-[#EAE4D7] rounded-[10px] bg-[#FAF8F5] max-sm:w-full max-sm:max-w-[280px] max-sm:justify-self-center">
                          <video
                            src={v.urlOrContent}
                            poster={v.posterUrl || undefined}
                            controls
                            playsInline
                            preload="metadata"
                            className="w-full aspect-video object-contain"
                            aria-label={`Video review ${v.title || 'của KOL'}`}
                          >
                            Trình duyệt của bạn không hỗ trợ phát video này.
                          </video>
                        </div>

                        <div className="kol-video-info flex flex-col min-w-0">
                      <div className="space-y-2 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <strong className="kol-video-title text-sm font-semibold text-[#1A1612]" title={v.title}>
                            {v.title || 'Video review sản phẩm'}
                          </strong>
                          {isPending && <Badge variant="neutral" className="kol-video-status"><Clock3 className="h-3 w-3 text-[#B88E4F]" />Chờ duyệt</Badge>}
                          {isApproved && <Badge variant="neutral" className="kol-video-status"><CheckCircle2 className="h-3 w-3 text-[#059669]" />Đã duyệt</Badge>}
                          {isRejected && <Badge variant="danger">Bị từ chối</Badge>}
                          {isHidden && <Badge variant="neutral">Đã ẩn</Badge>}
                          {v.isFeatured && (
                            <span className="kol-video-featured inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px]">
                              <Star className="w-2.5 h-2.5" /> Đã ghim
                            </span>
                          )}
                        </div>

                        <details className="kol-video-details"><summary>Thông tin video & sản phẩm</summary>
                        <div className="kol-video-metadata text-[11px] text-[#7D715E]">
                          <p>KOL: <strong>{v.collaborator?.fullName || 'Nhà sáng tạo'}</strong></p>
                          <p>
                            Sản phẩm:{' '}
                            <strong className="text-[#1A1612]">
                              {v.product?.title || v.productName || selectedVideoProduct.title}
                            </strong>
                            {v.product?.sku ? ` (${v.product.sku})` : ''}
                          </p>
                          <a
                            href={v.urlOrContent}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#B88E4F] hover:underline flex items-center gap-1 font-semibold"
                          >
                            <ExternalLink className="w-3 h-3" /> Mở video
                          </a>
                        </div>

                        {v.caption && (
                          <p className="kol-video-caption text-[11px] text-[#7D715E] m-0">
                            {v.caption}
                          </p>
                        )}
                        </details>

                        {v.rejectionReason && (
                          <p className="text-[11px] text-rose-600 font-semibold m-0">
                            Lý do từ chối/ẩn: {v.rejectionReason}
                          </p>
                        )}
                      </div>

                      <div className="kol-video-actions flex flex-wrap items-center gap-2 shrink-0">
                        {isPending && (
                          <>
                            <button
                              type="button"
                              disabled={reviewingMediaId === v.id}
                              onClick={() => handleApproveVideo(v.id, false)}
                              className="kol-video-approve px-2.5 py-1.5 rounded-lg font-semibold text-xs transition cursor-pointer disabled:opacity-50"
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
                              <Star className="h-3.5 w-3.5" /> Duyệt &amp; ghim
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
                })}
                  </div>
                </div>
              )}
            </div>

            <div className="kol-video-review-footer bg-white border-t border-[#EAE4D7] flex justify-end">
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
          <section className="customer-review-modal flex w-full max-w-[900px] max-h-[min(84dvh,720px)] flex-col overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white text-left text-[#1A1612] shadow-[0_24px_80px_rgba(77,57,31,0.18)]" role="dialog" aria-modal="true" aria-labelledby="customer-review-title">
            <header className="customer-review-header flex items-center justify-between gap-4 border-b border-[#EAE4D7] bg-white p-[14px_18px] shrink-0">
              <div className="flex min-w-0 items-start gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F] sm:h-12 sm:w-12">
                  <MessageSquareText className="h-5 w-5" />
                </div>
                <div className="min-w-0 pt-0.5">
                  <h2 id="customer-review-title" className="m-0 text-base font-semibold text-[#1A1612]">Kiểm duyệt đánh giá</h2>
                  <p className="mb-0 mt-0.5 text-xs text-[#7D715E]">
                    Duyệt nội dung trước khi hiển thị trên sản phẩm.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModeration(false)}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#EAE4D7] bg-white text-[#7D715E] transition hover:border-[#C59B58] hover:bg-[#FBF5EB] hover:text-[#1A1612] cursor-pointer"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </header>

            <div className="customer-review-tabs border-b border-[#EAE4D7] bg-white p-[10px_16px] shrink-0">
              <div className="grid grid-cols-5 gap-1.5 max-sm:flex max-sm:overflow-x-auto">
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
                    aria-pressed={reviewFilterStatus === tab.key}
                    onClick={() => setReviewFilterStatus(tab.key as any)}
                    className={`flex min-w-0 min-h-10 items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-xs font-bold transition sm:px-3 cursor-pointer ${
                      reviewFilterStatus === tab.key
                        ? 'border-[#EEDFC6] bg-[#FBF5EB] text-[#231D15]'
                        : 'border-transparent bg-white text-[#7D715E] hover:border-[#EEDFC6] hover:bg-[#FBF5EB] hover:text-[#1A1612]'
                    }`}
                  >
                    <span className="flex min-w-0 items-center gap-2"><tab.icon className="h-4 w-4 shrink-0 text-[#B88E4F]" /><span className="truncate">{tab.label}</span></span>
                    <span className={`flex h-6 min-w-6 shrink-0 items-center justify-center rounded-lg border px-1.5 text-[10px] tabular-nums ${reviewFilterStatus === tab.key ? 'border-[#231D15]/10 bg-white/50 text-[#231D15]' : 'border-[#EAE4D7] bg-white text-[#7D715E]'}`}>{tab.count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="customer-review-list min-h-0 flex-1 overflow-y-auto overscroll-contain p-[14px_16px] space-y-2.5 [scrollbar-color:#EEDFC6_#FFFFFF]">
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
                      <details
                        key={review.id}
className="customer-review-card grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_112px] gap-5 p-3.5 min-w-0 rounded-xl border border-[#EAE4D7] bg-white shadow-none"
                      >
                        <summary className="customer-review-row">
                          <span className="customer-review-avatar" aria-hidden="true">{(review.customerName || 'Khách hàng').trim().split(/\s+/).filter(Boolean).slice(-2).map((part: string) => part[0]).join('').toUpperCase()}</span>
                          <div className="customer-review-card-heading flex flex-wrap items-center gap-x-2.5 gap-y-2">
                            <strong className="min-w-0 text-sm font-semibold leading-snug text-[#1A1612]">
                              {review.product?.title || 'Sản phẩm'}
                            </strong>
                            <span className="customer-review-row-meta"><span>{review.customerName || 'Khách hàng ẩn danh'}</span>{review.product?.sku && <span className="customer-review-row-sku">{review.product.sku}</span>}</span>
                            <span className="customer-review-rating" aria-label={`${review.rating || 5} trên 5 sao`}>
                              {Array.from({length: Math.max(1, Math.min(5, review.rating || 5))}, (_, index) => <Star key={index} className="h-3 w-3 fill-current" aria-hidden="true" />)}
                            </span>
                            {currentStatus === 'APPROVED' && <Badge variant="neutral" className="customer-review-status"><CheckCircle2 className="h-3 w-3 text-[#059669]" />Đã duyệt</Badge>}
                            {currentStatus === 'REJECTED' && <Badge variant="danger">Bị từ chối</Badge>}
                            {currentStatus === 'HIDDEN' && <Badge variant="neutral" className="customer-review-status">Đã ẩn</Badge>}
                            {currentStatus === 'PENDING' && <Badge variant="neutral" className="customer-review-status"><Clock3 className="h-3 w-3 text-[#B88E4F]" />Chờ duyệt</Badge>}
                          </div>
                          <ChevronDown className="customer-review-chevron" size={15} aria-hidden="true" />
                        </summary>
                        <div className="customer-review-expanded-body">
                          <p className="customer-review-comment">
                            {review.comment || 'Khách không để lại nội dung bình luận.'}
                          </p>

                          <div className="customer-review-author flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-[#7D715E]">
                            <span className="font-medium text-[#1A1612]">
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

                        <div className="customer-review-actions">
                          {currentStatus === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                                className="customer-review-approve min-w-0 justify-center"
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
                              variant="outline"
                              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              className="customer-review-approve w-full justify-center"
                              disabled={reviewActionId === review.id}
                              onClick={() => handleApproveCustomerReview(review)}
                            >
                              Duyệt lại
                            </Button>
                          )}

                          {currentStatus === 'HIDDEN' && (
                            <Button
                              size="sm"
                              variant="outline"
                              icon={<ShieldCheck className="w-3.5 h-3.5" />}
                              className="customer-review-approve w-full justify-center"
                              disabled={reviewActionId === review.id}
                              onClick={() => handleApproveCustomerReview(review)}
                            >
                              Công khai lại
                            </Button>
                          )}
                        </div>
                      </details>
                    );
                  });
                })()
              )}
            </div>
            <footer className="customer-review-footer">
              <Button variant="outline" size="sm" onClick={() => setShowReviewModeration(false)}>Đóng</Button>
            </footer>
          </section>
        </div>
      )}


      {rejectionModalReview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-[2px] animate-fadeIn">
          <div className="customer-review-rejection bg-white rounded-2xl shadow-2xl border border-[#EAE4D7] w-full max-w-md p-6 text-left animate-in zoom-in-95 duration-150 flex flex-col gap-4" role="dialog" aria-modal="true" aria-labelledby="customer-review-rejection-title">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 id="customer-review-rejection-title" className="text-base font-semibold text-[#1A1612] m-0">
                  {reviewRejectionActionType === 'REJECTED'
                    ? 'Từ chối đánh giá khách hàng'
                    : 'Ẩn đánh giá sản phẩm'}
                </h3>
                <p className="text-xs text-[#7D715E] m-0 mt-0.5">
                  Nhập lý do để khách hàng biết nội dung cần điều chỉnh.
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
