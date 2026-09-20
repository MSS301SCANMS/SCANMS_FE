import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  PlusCircle,
  Search,
  Filter,
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
} from 'lucide-react';
import api from '../../services/api';
import { productService, type Product } from '../../services/product.service';
import { authService } from '../../services/auth.service';
import { toast } from '../../utils/toast';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/Table';

export default function ProductManagementPage() {
  const navigate = useNavigate();
  const currentUser = authService.getCurrentUser();
  const isKol = !currentUser?.role || currentUser?.role === 'COLLABORATOR';
  const currentStoreId = localStorage.getItem('current_store_id') || undefined;

  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmProduct, setDeleteConfirmProduct] = useState<any | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);


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


  const [formSku, setFormSku] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Chăm sóc da');
  const [formPrice, setFormPrice] = useState<number>(459000);
  const [formCommission, setFormCommission] = useState<number>(8);
  const [formStock, setFormStock] = useState<number>(100);
  const [formImage, setFormImage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

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

  const openCreateModal = () => {
    setEditingProduct(null);
    setFormSku('');
    setFormTitle('');
    setFormCategory('Chăm sóc da');
    setFormPrice(350000);
    setFormCommission(10);
    setFormStock(50);
    setFormImage('');
    setShowModal(true);
  };

  const openEditModal = (p: any) => {
    setEditingProduct(p);
    setFormSku(p.sku || '');
    setFormTitle(p.title || p.name);
    setFormCategory(p.category || 'Chăm sóc da');
    setFormPrice(p.price);
    setFormCommission(p.customCommissionRate || p.commissionRate || 10);
    setFormStock(p.stockQuantity || p.stock || 0);
    setFormImage(p.imageUrl || '');
    setShowModal(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await productService.updateProduct(editingProduct.id, {
          title: formTitle,
          price: Number(formPrice),
          customCommissionRate: Number(formCommission),
          stockQuantity: Number(formStock),
          imageUrl: formImage || undefined,
        });
        showToast('Cập nhật sản phẩm & hoa hồng thành công!');
      } else {
        await productService.createProduct({
          storeId: currentStoreId,
          sku: formSku,
          title: formTitle,
          categoryName: formCategory,
          price: Number(formPrice),
          customCommissionRate: Number(formCommission),
          stockQuantity: Number(formStock),
          imageUrl: formImage,
        });
        showToast('Đã thêm sản phẩm mới vào danh mục!');
      }
      setShowModal(false);
      loadProducts();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi lưu sản phẩm');
    }
  };

  const handleImageUpload = async (file?: File) => {
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Chỉ chấp nhận ảnh JPG, PNG hoặc WEBP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ảnh không được lớn hơn 5 MB');
      return;
    }
    setUploadingImage(true);
    try {
      const body = new FormData();
      body.append('file', file);
      const res: any = await api.post('/upload/image?folder=scanms/products', body, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const result = res?.data || res;
      const imageUrl = result?.secureUrl || result?.url;
      if (!imageUrl) throw new Error('Máy chủ không trả về đường dẫn ảnh');
      setFormImage(imageUrl);
      showToast('Tải ảnh sản phẩm thành công');
    } catch (err: any) {
      showToast(err.message || 'Không thể tải ảnh sản phẩm');
    } finally {
      setUploadingImage(false);
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
            images: ['/assets/serum-hero-optimized.jpg'],
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
            images: ['/assets/sunscreen-product.jpg'],
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
            images: ['/assets/serum-hero-optimized.jpg'],
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
            images: ['/assets/serum-hero-optimized.jpg'],
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
            images: ['/assets/serum-hero-optimized.jpg'],
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
      (filterStatus === 'active' && (p.status === 'active' || p.isActive)) ||
      (filterStatus === 'out_of_stock' && (p.status === 'out_of_stock' || p.stockQuantity === 0)) ||
      (filterStatus === 'paused' && (p.status === 'paused' || p.isActive === false));
    return matchSearch && matchStatus;
  });

  return (
    <div className="flex flex-col gap-6 text-left max-w-[1520px] mx-auto w-full p-4 sm:p-6 min-h-screen">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 p-3.5 bg-slate-900 text-white rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}


      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight m-0">
            {isKol ? 'Kho Sản Phẩm & Mức Hoa Hồng' : 'Danh mục sản phẩm'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 m-0">
            {isKol
              ? 'Duyệt các sản phẩm có hoa hồng cao để lấy link tiếp thị hoặc đăng ký nhận hàng mẫu.'
              : 'Cập nhật tồn kho, giá bán và mức hoa hồng riêng cho từng sản phẩm.'}
          </p>
        </div>

        {!isKol ? (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="amber"
              size="md"
              icon={<Video className="w-4 h-4" />}
              onClick={openAllVideoModeration}
            >
              <span className="inline-flex items-center gap-2">
                Duyệt video KOL
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-white text-[#B88E4F] text-[10px] font-extrabold inline-flex items-center justify-center shadow-xs">
                  {pendingKolVideoCount}
                </span>
              </span>
            </Button>
            <Button
              variant="outline"
              size="md"
              icon={<MessageSquareText className="w-4 h-4" />}
              onClick={openReviewModeration}
            >
              Duyệt đánh giá
            </Button>
            <Button
              variant="amber"
              size="md"
              icon={<Plus className="w-4 h-4" />}
              onClick={openCreateModal}
            >
              Thêm sản phẩm
            </Button>
          </div>
        ) : (
          <Button
            variant="amber"
            size="md"
            icon={<PlusCircle className="w-4 h-4" />}
            onClick={() => navigate('/collaborator/links')}
          >
            Tạo link tiếp thị
          </Button>
        )}
      </header>


      <Card className="p-3.5 sm:p-4 bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm text-slate-900 flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <input
              type="text"
              placeholder="Tìm tên hoặc SKU sản phẩm..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-xs sm:text-sm text-slate-800 placeholder-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 outline-none cursor-pointer"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="active">Đang bán</option>
              <option value="out_of_stock">Hết hàng</option>
              <option value="paused">Tạm dừng</option>
            </select>

            <Button variant="outline" size="sm" icon={<Filter className="w-3.5 h-3.5" />}>
              Bộ lọc
            </Button>
          </div>
        </div>
      </Card>


      <Card className="p-0 overflow-hidden shadow-xs">
        <Table>
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
              <TableHead>Giá bán lẻ</TableHead>
              <TableHead>Hoa hồng CTV</TableHead>
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
              const img = p.imageUrl || p.images?.[0] || p.image || '';
              const status =
                p.status || (p.isActive === false ? 'paused' : stock === 0 ? 'out_of_stock' : 'active');

              return (
                <TableRow key={p.id}>
                  <TableCell>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(p.id)}
                      onChange={(e) => handleSelectOne(p.id, e.target.checked)}
                      className="rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
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
                        <strong className="text-xs sm:text-sm font-bold text-slate-900 block truncate">
                          {title}
                        </strong>
                        <span className="text-[11px] text-slate-500 font-mono block mt-0.5">
                          {sku}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-slate-900">
                    {price.toLocaleString('vi-VN')} ₫
                  </TableCell>
                  <TableCell>
                    <Badge variant="amber" className="font-extrabold text-xs">
                      {rate}%
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`font-semibold ${stock === 0 ? 'text-rose-600 font-bold' : 'text-slate-700'}`}
                  >
                    {stock}
                  </TableCell>
                  <TableCell>
                    {status === 'active' && <Badge variant="success">Đang bán</Badge>}
                    {status === 'out_of_stock' && <Badge variant="danger">Hết hàng</Badge>}
                    {status === 'paused' && <Badge variant="neutral">Tạm dừng</Badge>}
                  </TableCell>
                  <TableCell className="text-right">
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
                      <div className="flex items-center justify-end gap-1">
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
        title={editingProduct ? 'Cập Nhật Sản Phẩm & Hoa Hồng' : 'Thêm Sản Phẩm Mới'}
        subtitle="Điền thông tin sản phẩm và thiết lập tỷ lệ chiết khấu cho KOL/CTV"
        maxWidth="md"
      >
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Mã SKU</label>
              <div className="relative flex items-center">
                <Tag className="w-4 h-4 text-[#B88E4F] absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={formSku}
                  onChange={(e) => setFormSku(e.target.value)}
                  placeholder="SR-VTC-15"
                  required
                  className="w-full bg-[#FAF8F5] border border-[#E8DAC4] rounded-xl pl-9 pr-3 py-2 text-sm text-[#1A1612] font-semibold focus:bg-white focus:border-[#B88E4F] focus:ring-2 focus:ring-[#B88E4F]/20 outline-none transition"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Danh mục</label>
              <div className="relative flex items-center">
                <FolderTree className="w-4 h-4 text-[#B88E4F] absolute left-3 pointer-events-none" />
                <input
                  type="text"
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  placeholder="Chăm sóc da"
                  required
                  className="w-full bg-[#FAF8F5] border border-[#E8DAC4] rounded-xl pl-9 pr-3 py-2 text-sm text-[#1A1612] font-semibold focus:bg-white focus:border-[#B88E4F] focus:ring-2 focus:ring-[#B88E4F]/20 outline-none transition"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">Tên sản phẩm</label>
            <div className="relative flex items-center">
              <Package className="w-4 h-4 text-[#B88E4F] absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder="Serum Vitamin C 15% Dưỡng Sáng Đều Màu Da"
                required
                className="w-full bg-[#FAF8F5] border border-[#E8DAC4] rounded-xl pl-9 pr-3 py-2 text-sm text-[#1A1612] font-semibold focus:bg-white focus:border-[#B88E4F] focus:ring-2 focus:ring-[#B88E4F]/20 outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-[#1A1612] flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#B88E4F]" />
                <span>Ảnh sản phẩm</span>
              </label>
              <span className="text-[11px] font-semibold text-[#A89066]">
                Khuyến nghị tỷ lệ 1:1
              </span>
            </div>

            <div className="relative flex items-center gap-4 rounded-2xl border border-[#E8DAC4] bg-gradient-to-br from-[#FFFDF9] via-[#FAF6F0] to-[#F5EFE6] p-3.5 shadow-2xs">

              <div
                onClick={() => document.getElementById('product-image-upload')?.click()}
                title="Bấm để tải ảnh lên"
                className="relative group cursor-pointer shrink-0"
              >
                {formImage ? (
                  <div className="relative w-[84px] h-[84px] rounded-2xl overflow-hidden border-2 border-[#D6BC8C] shadow-xs bg-white">
                    <img
                      src={formImage}
                      alt="Xem trước ảnh sản phẩm"
                      className="w-full h-full object-cover transition duration-200 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[11px] font-bold gap-1 backdrop-blur-xs">
                      <Camera size={14} />
                      <span>Đổi</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative w-[84px] h-[84px] rounded-2xl border-2 border-dashed border-[#D6BC8C] bg-gradient-to-b from-[#FFFDF9] via-[#FAF5EC] to-[#F3E9D7] flex flex-col items-center justify-center transition-all duration-200 group-hover:border-[#B88E4F] group-hover:bg-[#FFF9EE] group-hover:shadow-xs">

                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A] border border-[#DEBE85]/70 flex items-center justify-center text-[#92400E] shadow-2xs group-hover:scale-110 transition-transform">
                      <ImagePlus size={20} className="text-[#92400E]" />
                    </div>
                    <span className="text-[9.5px] font-bold text-[#A89066] mt-1 tracking-wider uppercase">
                      Tải ảnh
                    </span>

                    <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-gradient-to-r from-[#C59B58] to-[#B88E4F] text-white flex items-center justify-center shadow-xs border-2 border-white">
                      <Plus size={11} strokeWidth={3} />
                    </div>
                  </div>
                )}
              </div>


              <div className="min-w-0 flex-1">
                <input
                  id="product-image-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={uploadingImage}
                  onChange={(event) => {
                    void handleImageUpload(event.target.files?.[0]);
                    event.target.value = '';
                  }}
                />

                <div className="flex flex-wrap items-center gap-2">
                  <label
                    htmlFor="product-image-upload"
                    className="inline-flex cursor-pointer items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#9E783D] shadow-xs transition cursor-pointer"
                  >
                    <UploadCloud size={14} />
                    <span>{uploadingImage ? 'Đang tải ảnh...' : formImage ? 'Đổi ảnh khác' : 'Chọn ảnh từ máy'}</span>
                  </label>

                  {formImage && !uploadingImage && (
                    <button
                      type="button"
                      onClick={() => setFormImage('')}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition cursor-pointer"
                    >
                      <X size={13} />
                      <span>Xóa ảnh</span>
                    </button>
                  )}
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-[#7D715E]">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#FAF0DC] text-[#8C6B2D] font-bold text-[10px]">
                    JPG · PNG · WebP
                  </span>
                  <span>Tối đa 5 MB. Hiển thị trên sàn tiếp thị của KOL/CTV.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Giá bán lẻ (₫)</label>
              <div className="relative flex items-center">
                <Coins className="w-3.5 h-3.5 text-[#B88E4F] absolute left-3 pointer-events-none" />
                <input
                  type="number"
                  value={formPrice}
                  onChange={(e) => setFormPrice(Number(e.target.value))}
                  required
                  className="w-full bg-[#FAF8F5] border border-[#E8DAC4] rounded-xl pl-8 pr-2 py-2 text-sm text-[#1A1612] font-semibold focus:bg-white focus:border-[#B88E4F] focus:ring-2 focus:ring-[#B88E4F]/20 outline-none transition"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Hoa hồng (%)</label>
              <div className="relative flex items-center">
                <Percent className="w-3.5 h-3.5 text-[#B88E4F] absolute left-3 pointer-events-none" />
                <input
                  type="number"
                  value={formCommission}
                  onChange={(e) => setFormCommission(Number(e.target.value))}
                  required
                  className="w-full bg-[#FAF8F5] border border-[#E8DAC4] rounded-xl pl-8 pr-2 py-2 text-sm text-[#1A1612] font-semibold focus:bg-white focus:border-[#B88E4F] focus:ring-2 focus:ring-[#B88E4F]/20 outline-none transition"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Tồn kho</label>
              <div className="relative flex items-center">
                <Boxes className="w-3.5 h-3.5 text-[#B88E4F] absolute left-3 pointer-events-none" />
                <input
                  type="number"
                  value={formStock}
                  onChange={(e) => setFormStock(Number(e.target.value))}
                  required
                  className="w-full bg-[#FAF8F5] border border-[#E8DAC4] rounded-xl pl-8 pr-2 py-2 text-sm text-[#1A1612] font-semibold focus:bg-white focus:border-[#B88E4F] focus:ring-2 focus:ring-[#B88E4F]/20 outline-none transition"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#E8DAC4]/60">
            <button
              type="button"
              onClick={() => setShowModal(false)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-[#7D715E] bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={uploadingImage}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#C59B58] to-[#B88E4F] hover:from-[#B88E4F] hover:to-[#9E783D] shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              {uploadingImage ? 'Đang tải ảnh...' : 'Lưu thông tin sản phẩm'}
            </button>
          </div>
        </form>
      </Modal>


      {deleteConfirmProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 backdrop-blur-[1.5px] animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl border border-[#E8DAC4] w-full max-w-sm p-5 sm:p-6 text-left animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 mb-3.5">
              <div className="w-10 h-10 bg-rose-50 border border-rose-200/60 rounded-xl flex items-center justify-center flex-shrink-0 text-rose-600">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[#1A1612] m-0">Xác nhận tạm dừng sản phẩm</h3>
                <p className="text-[11px] text-[#7D715E] m-0 mt-0.5">Sản phẩm sẽ chuyển sang trạng thái ngừng bán</p>
              </div>
            </div>

            <div className="bg-[#FAF8F5] p-3 rounded-xl border border-[#E8DAC4] text-xs text-[#7D6D55] space-y-1.5 mb-5">
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


      {selectedVideoProduct && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-[2px] animate-fadeIn"
          onClick={() => setSelectedVideoProduct(null)}
        >
          <div
            className="bg-[#FAF8F5] rounded-2xl shadow-2xl border border-[#EEDFC6] w-full max-w-4xl text-left animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 sm:px-6 py-4 bg-white border-b border-[#EAE4D7]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#FBF5EB] border border-[#EEDFC6] rounded-xl flex items-center justify-center text-[#B88E4F] shrink-0">
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
                        <div className="bg-[#231D15] min-h-[210px] flex items-center justify-center relative">
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
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#C59B58] text-white">
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
                              className="px-2.5 py-1.5 rounded-lg bg-[#C59B58] text-white font-bold text-xs hover:bg-[#B88E4F] transition cursor-pointer disabled:opacity-50"
                            >
                              Duyệt
                            </button>
                            <button
                              type="button"
                              disabled={reviewingMediaId === v.id}
                              onClick={() => handleApproveVideo(v.id, true)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] font-bold text-xs hover:bg-[#F3EFE6] transition cursor-pointer disabled:opacity-50"
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
                                className="px-2.5 py-1.5 rounded-lg bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] font-bold text-xs hover:bg-[#F3EFE6] transition cursor-pointer"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#231D15]/45 backdrop-blur-[3px] animate-fadeIn">
          <section className="bg-[#FAF8F5] rounded-2xl shadow-[0_24px_80px_rgba(77,57,31,0.24)] border border-[#EEDFC6] w-full max-w-4xl max-h-[88vh] overflow-hidden flex flex-col">
            <header className="flex items-start justify-between gap-4 bg-white border-b border-[#EAE4D7] px-5 sm:px-6 py-5">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center shrink-0">
                  <MessageSquareText className="w-5 h-5" />
                </div>
                <div>
                <h2 className="text-xl font-extrabold text-[#1A1612] m-0 tracking-tight">Kiểm duyệt đánh giá khách hàng</h2>
                <p className="text-xs text-[#7D715E] mt-1.5 mb-0 leading-relaxed">
                  Chỉ đánh giá được duyệt (APPROVED) mới hiển thị công khai trên landing page sản phẩm.
                </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModeration(false)}
                className="w-9 h-9 rounded-xl border border-transparent hover:border-[#EAE4D7] hover:bg-[#F3EFE6] text-[#7D715E] hover:text-[#1A1612] flex items-center justify-center transition cursor-pointer shrink-0"
                aria-label="Đóng"
              >
                <X className="w-5 h-5" />
              </button>
            </header>


            <div className="flex gap-2 px-5 sm:px-6 py-3.5 overflow-x-auto bg-white border-b border-[#EAE4D7]">
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
                  className={`h-9 px-3 rounded-xl text-xs font-bold transition cursor-pointer inline-flex items-center gap-2 whitespace-nowrap border ${
                    reviewFilterStatus === tab.key
                      ? 'bg-[#C59B58] text-white border-[#C59B58] shadow-sm'
                      : 'bg-[#FAF8F5] text-[#7D715E] hover:bg-[#F3EFE6] hover:text-[#1A1612] border-[#EAE4D7]'
                  }`}
                >
                  <tab.icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                  <span className={`min-w-5 h-5 px-1.5 rounded-md flex items-center justify-center text-[10px] ${reviewFilterStatus === tab.key ? 'bg-white/15 text-white' : 'bg-white text-[#7D715E] border border-[#EAE4D7]'}`}>{tab.count}</span>
                </button>
              ))}
            </div>

            <div className="overflow-y-auto px-5 sm:px-6 py-5 space-y-3 flex-1">
              {loadingReviews ? (
                <p className="text-sm text-[#7D715E] text-center py-6">Đang tải danh sách đánh giá...</p>
              ) : customerReviews.length === 0 ? (
                <div className="rounded-xl border border-dashed border-[#EAE4D7] bg-[#FAF8F5] p-8 text-center text-sm text-[#7D715E]">
                  Chưa có đánh giá nào từ khách hàng.
                </div>
              ) : (
                (() => {
                  const filtered = customerReviews.filter((review) => {
                    if (reviewFilterStatus === 'ALL') return true;
                    return getReviewStatus(review) === reviewFilterStatus;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="rounded-xl border border-dashed border-[#EAE4D7] bg-[#FAF8F5] p-8 text-center text-sm text-[#7D715E]">
                        Không có đánh giá nào ở trạng thái này.
                      </div>
                    );
                  }

                  return filtered.map((review) => {
                    const currentStatus = getReviewStatus(review);
                    return (
                      <article
                        key={review.id}
                        className="rounded-2xl border border-[#EAE4D7] bg-white p-4 sm:p-5 flex flex-col sm:flex-row gap-4 justify-between shadow-[0_4px_16px_rgba(95,74,43,0.05)] hover:border-[#E0CDAE] transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5">
                            <strong className="text-sm text-[#1A1612]">
                              {review.product?.title || 'Sản phẩm'}
                            </strong>
                            {review.product?.sku && (
                              <span className="text-xs text-[#7D715E] font-mono">
                                ({review.product.sku})
                              </span>
                            )}
                            <span className="text-sm font-bold text-[#B88E4F] tracking-[1px]" aria-label={`${review.rating || 5} trên 5 sao`}>
                              {'★'.repeat(Math.max(1, Math.min(5, review.rating || 5)))}
                            </span>
                            {currentStatus === 'APPROVED' && <Badge variant="success">Đã duyệt</Badge>}
                            {currentStatus === 'REJECTED' && <Badge variant="danger">Bị từ chối</Badge>}
                            {currentStatus === 'HIDDEN' && <Badge variant="neutral">Đã ẩn</Badge>}
                            {currentStatus === 'PENDING' && <Badge variant="amber">Chờ duyệt</Badge>}
                          </div>

                          <p className="text-sm text-[#3B3127] my-3 leading-6 max-w-[65ch]">
                            {review.comment || 'Khách không để lại nội dung bình luận.'}
                          </p>

                          <div className="flex flex-wrap items-center gap-2 text-xs text-[#7D715E]">
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
                              <div className="mt-2.5 p-2.5 rounded-lg bg-rose-50 border border-rose-200/80 flex items-start gap-2 text-xs text-rose-800">
                                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                                <div>
                                  <span className="font-bold">Lý do kiểm duyệt: </span>
                                  <span>{review.rejectionReason}</span>
                                </div>
                              </div>
                            )}
                        </div>

                        <div className="flex sm:flex-col gap-2 shrink-0 self-stretch sm:self-center sm:min-w-[112px] justify-center">
                          {currentStatus === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                variant="amber"
                                icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                                disabled={reviewActionId === review.id}
                                onClick={() => handleApproveCustomerReview(review)}
                              >
                                Duyệt
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                icon={<Ban className="w-3.5 h-3.5" />}
                                className="text-rose-600 hover:bg-rose-50 hover:border-rose-300"
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
                                disabled={reviewActionId === review.id}
                                onClick={() => openReviewRejectionModal(review, 'HIDDEN')}
                              >
                                Ẩn
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                icon={<Ban className="w-3.5 h-3.5" />}
                                className="text-rose-600 hover:bg-rose-50 hover:border-rose-300"
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
