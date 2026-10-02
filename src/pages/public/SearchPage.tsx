import { useEffect, useState, useMemo } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Store,
  X,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Check,
  Filter,
  BadgeCheck,
  Radio,
  Coins,
  Sparkles,
  Package,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ZoomIn,
  ShieldCheck,
  ArrowRight,
  RotateCcw,
  Home,
  ChevronRight,
} from 'lucide-react';
import api from '../../services/api';
import { GuestCheckoutModal, type CheckoutProductItem, type CheckoutStoreInfo } from '../../components/checkout/GuestCheckoutModal';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { authService } from '../../services/auth.service';
import { formatMoney } from '../../features/marketplace/marketplaceUtils';
import type { Product } from '../../features/marketplace/marketplace.types';
import { toast } from '../../utils/toast';
import { useCart } from '../../context/CartContext';

interface CategoryItem {
  name: string;
  count: number;
}

interface StoreItem {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  isVerified?: boolean;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryParam = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || 'all';
  const storeParam = searchParams.get('store') || 'all';

  const [items, setItems] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [stores, setStores] = useState<StoreItem[]>([]);

  // Search & Filter state synced with URL params
  const [searchInput, setSearchInput] = useState(queryParam);
  const [selectedCategory, setSelectedCategory] = useState<string>(categoryParam);
  const [selectedStore, setSelectedStore] = useState<string>(storeParam);
  const [pricePreset, setPricePreset] = useState<string>(searchParams.get('preset') || 'all');
  const [minPrice, setMinPrice] = useState<string>(searchParams.get('min') || '');
  const [maxPrice, setMaxPrice] = useState<string>(searchParams.get('max') || '');
  const [onlyHasCommission, setOnlyHasCommission] = useState(searchParams.get('commission') === 'true');
  const [onlyInStock, setOnlyInStock] = useState(searchParams.get('inStock') === 'true');
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || 'newest');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllStores, setShowAllStores] = useState(false);

  const visibleCategories = useMemo(() => {
    if (showAllCategories) return categories;
    const initial = categories.slice(0, 4);
    const selected = categories.find((category) => category.name === selectedCategory);
    return selected && !initial.some((category) => category.name === selected.name)
      ? [...initial, selected]
      : initial;
  }, [categories, selectedCategory, showAllCategories]);

  const visibleStores = useMemo(() => {
    if (showAllStores) return stores;
    const initial = stores.slice(0, 3);
    const selected = stores.find((store) => store.id === selectedStore);
    return selected && !initial.some((store) => store.id === selected.id)
      ? [...initial, selected]
      : initial;
  }, [stores, selectedStore, showAllStores]);

  // Cart & Modals
  const { addItem, openCart } = useCart();
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);
  const [zoomProduct, setZoomProduct] = useState<Product | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setZoomProduct(null);
    };
    if (zoomProduct) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomProduct]);

  // Checkout modal
  const [activeCheckoutProduct, setActiveCheckoutProduct] = useState<{
    product: CheckoutProductItem;
    store: CheckoutStoreInfo;
    couponCode?: string;
    quantity?: number;
  } | null>(null);

  const currentUser = authService.getCurrentUser();
  const isKolUser = currentUser?.role === 'COLLABORATOR';

  const handleContactShopFromCard = (product: Product) => {
    if (!currentUser) {
      toast.info('Vui lòng đăng nhập tài khoản KOL để trao đổi hợp tác cùng Shop');
      navigate(`/login?redirect=/products/${product.sku || product.id}`);
      return;
    }
    if (!isKolUser) {
      toast.info('Tính năng liên hệ shop trực tiếp dành riêng cho tài khoản KOL/Creator.');
      return;
    }
    const storeId = product.storeId || 'a7e7bd20-bebc-44c9-a98b-004de44cf773';
    navigate(
      `/collaborator/collaboration?tab=messages&storeId=${storeId}&productId=${product.id}&productTitle=${encodeURIComponent(product.name)}&productImage=${encodeURIComponent(product.image)}&productPrice=${product.price}&productSku=${product.sku || ''}&commissionRate=${product.commissionRate || 15}`
    );
  };

  // Sync state when URL params change
  useEffect(() => {
    setSearchInput(queryParam);
    setSelectedCategory(categoryParam);
    setSelectedStore(storeParam);
  }, [queryParam, categoryParam, storeParam]);

  // Update URL search parameters when filters change
  const updateUrlParams = (updates: Record<string, string | null>) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all' || value === 'false') {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }
    });
    setSearchParams(newParams, { replace: true });
  };

  // Fetch real categories and stores
  useEffect(() => {
    let mounted = true;

    api.get('/public/products/categories')
      .then((res) => {
        if (!mounted) return;
        const payload = res.data?.data !== undefined ? res.data.data : res.data;
        if (Array.isArray(payload)) {
          setCategories(payload);
        }
      })
      .catch(() => {});

    api.get('/public/products/stores')
      .then((res) => {
        if (!mounted) return;
        const payload = res.data?.data !== undefined ? res.data.data : res.data;
        if (Array.isArray(payload)) {
          setStores(payload);
        }
      })
      .catch(() => {});

    return () => {
      mounted = false;
    };
  }, []);

  // Fetch real products from backend
  useEffect(() => {
    let mounted = true;
    setLoading(true);

    api.get('/public/products?limit=100')
      .then((res) => {
        if (!mounted) return;
        const payload = res.data?.data !== undefined ? res.data.data : res.data;
        const productList = Array.isArray(payload?.items)
          ? payload.items
          : Array.isArray(payload)
            ? payload
            : [];

        if (productList.length > 0) {
          const mapped: Product[] = productList.map((item: any) => {
            const rawRate = Number(item.customCommissionRate || item.commissionRate || 15);
            const priceNum = Number(item.price) || 0;
            const origNum = Number(item.originalPrice) || 0;

            let badge = '';
            if (rawRate > 0) badge = `Hoa hồng ${rawRate}%`;
            else if (item.stockQuantity > 0) badge = 'Sẵn hàng';

            return {
              id: item.id,
              sku: item.sku || item.id,
              name: item.title || item.name,
              category: item.categoryName || 'Khác',
              price: priceNum,
              origPrice: origNum,
              image: item.imageUrl || '/reference/assets/serum-hero-optimized.jpg',
              rating: 5.0,
              sold: 50 + (item.stockQuantity % 120),
              commissionRate: rawRate,
              seller: item.store?.name || 'ScanMS Partner Shop',
              storeId: item.store?.id || '',
              stock: item.stockQuantity !== undefined ? item.stockQuantity : 100,
              badge,
              features: ['Chính hãng 100%', 'Đồng kiểm tận tay', 'Bảo hộ 14 ngày'],
            };
          });

          setItems(mapped);
        }
      })
      .catch((err) => {
        console.error('Lỗi khi tải sản phẩm:', err);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);


  // Filter and Sort Logic
  const filteredProducts = useMemo(() => {
    return items.filter((p) => {
      // 1. Search keyword
      if (searchInput.trim()) {
        const q = searchInput.toLowerCase().trim();
        const matchTitle = p.name.toLowerCase().includes(q);
        const matchBrand = (p.brand || '').toLowerCase().includes(q);
        const matchCategory = (p.category || '').toLowerCase().includes(q);
        const matchSku = p.sku ? p.sku.toLowerCase().includes(q) : false;
        if (!matchTitle && !matchBrand && !matchCategory && !matchSku) {
          return false;
        }
      }

      // 2. Category
      if (selectedCategory !== 'all') {
        if (p.category.toLowerCase() !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      // 3. Store
      if (selectedStore !== 'all') {
        if (p.storeId !== selectedStore && p.brand !== selectedStore) {
          return false;
        }
      }

      // 4. Price presets
      if (pricePreset === 'under500' && p.price >= 500000) return false;
      if (pricePreset === '500to1000' && (p.price < 500000 || p.price > 1000000)) return false;
      if (pricePreset === '1000to3000' && (p.price < 1000000 || p.price > 3000000)) return false;
      if (pricePreset === 'above3000' && p.price <= 3000000) return false;

      // 5. Custom price bounds
      if (minPrice && p.price < Number(minPrice)) return false;
      if (maxPrice && p.price > Number(maxPrice)) return false;

      // 6. Only with commission
      if (onlyHasCommission && (!p.commissionRate || p.commissionRate <= 0)) {
        return false;
      }

      // 7. Only in stock
      if (onlyInStock && (p.stockQuantity ?? 0) <= 0) {
        return false;
      }

      return true;
    });
  }, [
    items,
    searchInput,
    selectedCategory,
    selectedStore,
    pricePreset,
    minPrice,
    maxPrice,
    onlyHasCommission,
    onlyInStock,
  ]);

  // Sort
  const displayedProducts = useMemo(() => {
    const list = [...filteredProducts];
    if (sortBy === 'price_asc') {
      list.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price_desc') {
      list.sort((a, b) => b.price - a.price);
    }
    return list;
  }, [filteredProducts, sortBy]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchInput.trim()) count++;
    if (selectedCategory !== 'all') count++;
    if (selectedStore !== 'all') count++;
    if (pricePreset !== 'all' || minPrice || maxPrice) count++;
    if (onlyHasCommission) count++;
    if (onlyInStock) count++;
    return count;
  }, [searchInput, selectedCategory, selectedStore, pricePreset, minPrice, maxPrice, onlyHasCommission, onlyInStock]);

  const handleResetFilters = () => {
    setSearchInput('');
    setSelectedCategory('all');
    setSelectedStore('all');
    setPricePreset('all');
    setMinPrice('');
    setMaxPrice('');
    setOnlyHasCommission(false);
    setOnlyInStock(false);
    navigate('/search', { replace: true });
  };

  const handleAddToCart = (product: Product, quantity = 1) => {
    addItem({
      product: {
        id: product.id,
        title: product.name,
        sku: product.sku,
        price: product.price,
        originalPrice: product.origPrice,
        imageUrl: product.image,
        stockQuantity: product.stockQuantity || (product as any).stock || 0,
        variants: product.variants,
        isActive: true,
      },
      store: {
        id: product.storeId || 'store-default',
        name: product.brand || (product as any).seller || 'Gian hàng SCANMS',
      },
      quantity,
      openCartAfterAdd: true,
    });
  };

  // Filter content renderer (shared by Desktop Sidebar and Mobile Drawer)
  const renderFilterContent = () => (
    <div className="space-y-4 text-left">
      {/* Category Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#1A1612]">
            Ngành hàng
          </label>
          <span className="text-[10px] font-semibold text-[#8C7D6B] bg-[#FAF8F5] border border-[#EAE4D7] px-2 py-0.5 rounded-md">
            {categories.length} danh mục
          </span>
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              updateUrlParams({ category: null });
            }}
            className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-all duration-150 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-[#FBF5EB] text-[#B88E4F] font-bold border border-[#EEDFC6] shadow-2xs'
                : 'text-[#3E352B] font-medium hover:bg-[#FAF8F5] hover:text-[#1A1612] border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {selectedCategory === 'all' ? (
                <span className="w-1 h-3.5 rounded-full bg-[#C59B58] shrink-0" />
              ) : (
                <span className="w-1 h-3.5 rounded-full bg-transparent shrink-0" />
              )}
              <span className="truncate">Tất cả ngành hàng</span>
            </div>
            {selectedCategory === 'all' && <Check className="w-3.5 h-3.5 text-[#B88E4F] shrink-0" />}
          </button>

          {visibleCategories.map((cat) => {
            const isSelected = selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat.name);
                  updateUrlParams({ category: cat.name });
                }}
                className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-[#FBF5EB] text-[#B88E4F] font-bold border border-[#EEDFC6] shadow-2xs'
                    : 'text-[#3E352B] font-medium hover:bg-[#FAF8F5] hover:text-[#1A1612] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-1.5">
                  {isSelected ? (
                    <span className="w-1 h-3.5 rounded-full bg-[#C59B58] shrink-0" />
                  ) : (
                    <span className="w-1 h-3.5 rounded-full bg-transparent shrink-0" />
                  )}
                  <span className="truncate text-left" title={cat.name}>{cat.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-semibold tabular-nums ${
                    isSelected ? 'bg-white text-[#B88E4F] border border-[#EEDFC6]' : 'bg-[#F3EFE6] text-[#7D715E]'
                  }`}>
                    {cat.count}
                  </span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-[#B88E4F] shrink-0" />}
                </div>
              </button>
            );
          })}
          {categories.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllCategories((current) => !current)}
              className="mt-1 flex w-full items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] hover:bg-[#F3EFE6] text-xs font-bold text-[#B88E4F] transition cursor-pointer active:scale-98"
            >
              <span>{showAllCategories ? 'Thu gọn' : `Xem thêm (${categories.length - 4})`}</span>
              {showAllCategories ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Partner Store Section */}
      <div className="pt-3.5 border-t border-[#EAE4D7]">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-black uppercase tracking-wider text-[#1A1612]">
            Gian hàng đối tác
          </label>
          <span className="text-[10px] font-semibold text-[#8C7D6B] bg-[#FAF8F5] border border-[#EAE4D7] px-2 py-0.5 rounded-md">
            {stores.length} gian hàng
          </span>
        </div>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => {
              setSelectedStore('all');
              updateUrlParams({ store: null });
            }}
            className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-all duration-150 cursor-pointer ${
              selectedStore === 'all'
                ? 'bg-[#FBF5EB] text-[#B88E4F] font-bold border border-[#EEDFC6] shadow-2xs'
                : 'text-[#3E352B] font-medium hover:bg-[#FAF8F5] hover:text-[#1A1612] border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              {selectedStore === 'all' ? (
                <span className="w-1 h-3.5 rounded-full bg-[#C59B58] shrink-0" />
              ) : (
                <span className="w-1 h-3.5 rounded-full bg-transparent shrink-0" />
              )}
              <Store className="w-3.5 h-3.5 text-[#B88E4F] shrink-0" />
              <span className="truncate">Toàn bộ gian hàng</span>
            </div>
            {selectedStore === 'all' && <Check className="w-3.5 h-3.5 text-[#B88E4F] shrink-0" />}
          </button>

          {visibleStores.map((st) => {
            const isSelected = selectedStore === st.id;
            return (
              <button
                key={st.id}
                type="button"
                onClick={() => {
                  setSelectedStore(st.id);
                  updateUrlParams({ store: st.id });
                }}
                className={`w-full px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-[#FBF5EB] text-[#B88E4F] font-bold border border-[#EEDFC6] shadow-2xs'
                    : 'text-[#3E352B] font-medium hover:bg-[#FAF8F5] hover:text-[#1A1612] border border-transparent'
                }`}
              >
                <div className="flex items-center gap-1.5 min-w-0 pr-1.5">
                  {isSelected ? (
                    <span className="w-1 h-3.5 rounded-full bg-[#C59B58] shrink-0" />
                  ) : (
                    <span className="w-1 h-3.5 rounded-full bg-transparent shrink-0" />
                  )}
                  <span className="truncate text-left" title={st.name}>{st.name}</span>
                  <span title="Gian hàng chính hãng xác thực 100% KYC" className="inline-flex shrink-0">
                    <BadgeCheck className="w-3.5 h-3.5 text-[#B88E4F]" />
                  </span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#B88E4F] shrink-0" />}
              </button>
            );
          })}
          {stores.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllStores((current) => !current)}
              className="mt-1 flex w-full items-center justify-center gap-1.5 py-1.5 px-3 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] hover:bg-[#F3EFE6] text-xs font-bold text-[#B88E4F] transition cursor-pointer active:scale-98"
            >
              <span>{showAllStores ? 'Thu gọn' : `Xem thêm (${stores.length - 3})`}</span>
              {showAllStores ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Price Range Section */}
      <div className="pt-3.5 border-t border-[#EAE4D7]">
        <label className="block text-xs font-black uppercase tracking-wider text-[#1A1612] mb-2">
          Khoảng giá
        </label>

        {/* Quick Price Preset Radio List */}
        <div className="space-y-1 mb-3">
          {[
            { id: 'all', label: 'Mọi mức giá' },
            { id: 'under500', label: 'Dưới 500.000 ₫' },
            { id: '500to1000', label: '500.000 ₫ - 1 triệu' },
            { id: '1000to3000', label: '1 - 3 triệu' },
            { id: 'above3000', label: 'Trên 3 triệu' },
          ].map((p) => {
            const isPresetActive = pricePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPricePreset(p.id);
                  updateUrlParams({ preset: p.id === 'all' ? null : p.id });
                }}
                className={`flex w-full items-center gap-2 px-2.5 py-1.5 rounded-xl text-left text-xs font-medium transition cursor-pointer ${
                  isPresetActive
                    ? 'bg-[#FBF5EB] text-[#B88E4F] font-bold border border-[#EEDFC6]'
                    : 'text-[#4A4036] hover:bg-[#FAF8F5] border border-transparent'
                }`}
              >
                <span className={`grid h-3.5 w-3.5 shrink-0 place-items-center rounded-full border transition-all ${
                  isPresetActive ? 'border-[#C59B58] bg-[#C59B58]' : 'border-[#C4B7A6] bg-white'
                }`}>
                  {isPresetActive && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                </span>
                <span className="truncate">{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Min / Max Inputs */}
        <div className="border-t border-[#EAE4D7]/70 pt-2.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7D715E] block mb-1.5">
            Tự nhập khoảng giá
          </span>
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5">
            <div className="relative">
              <input
                type="number"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value);
                  setPricePreset('custom');
                }}
                placeholder="Từ ₫"
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-2.5 py-1.5 text-xs text-[#1A1612] placeholder-[#8C7D6B] outline-none focus:border-[#C59B58] focus:bg-white font-medium"
              />
            </div>
            <span className="text-[#8C7D6B] font-bold text-xs">-</span>
            <div className="relative">
              <input
                type="number"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value);
                  setPricePreset('custom');
                }}
                placeholder="Đến ₫"
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-2.5 py-1.5 text-xs text-[#1A1612] placeholder-[#8C7D6B] outline-none focus:border-[#C59B58] focus:bg-white font-medium"
              />
            </div>
          </div>
          <button
            type="button"
            disabled={!minPrice && !maxPrice}
            onClick={() => updateUrlParams({ min: minPrice || null, max: maxPrice || null })}
            className="w-full mt-2 py-2 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-xs font-bold text-[#1A1612] transition shadow-2xs active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Áp dụng khoảng giá
          </button>
        </div>
      </div>

      {/* Partner Privilege Toggles */}
      <div className="pt-3.5 border-t border-[#EAE4D7] space-y-2">
        <label className="block text-xs font-black uppercase tracking-wider text-[#B88E4F] mb-1">
          Đặc Quyền Đối Tác & Trạng Thái
        </label>

        {/* Toggle 1: Commission */}
        <div
          onClick={() => {
            const next = !onlyHasCommission;
            setOnlyHasCommission(next);
            updateUrlParams({ commission: next ? 'true' : null });
          }}
          className={`flex items-center justify-between p-2.5 rounded-xl transition cursor-pointer border ${
            onlyHasCommission
              ? 'bg-[#FBF5EB] border-[#EEDFC6] shadow-2xs'
              : 'border-[#EAE4D7]/80 hover:bg-[#FAF8F5]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-1">
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
              onlyHasCommission ? 'bg-[#C59B58] text-[#1A1612] border-[#B88E4F]' : 'bg-[#FBF5EB] text-[#B88E4F] border-[#EAE4D7]'
            }`}>
              <Coins className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-[#1A1612] truncate">Hoa hồng CTV/KOL</span>
              <small className="text-[10px] text-[#7D715E] block truncate">Sản phẩm có mức chia sẻ</small>
            </div>
          </div>
          <div className={`w-9 h-5 rounded-full transition-colors relative p-0.5 shrink-0 ${onlyHasCommission ? 'bg-[#C59B58]' : 'bg-[#EAE4D7]'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${onlyHasCommission ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </div>

        {/* Toggle 2: In Stock */}
        <div
          onClick={() => {
            const next = !onlyInStock;
            setOnlyInStock(next);
            updateUrlParams({ inStock: next ? 'true' : null });
          }}
          className={`flex items-center justify-between p-2.5 rounded-xl transition cursor-pointer border ${
            onlyInStock
              ? 'bg-[#FBF5EB] border-[#EEDFC6] shadow-2xs'
              : 'border-[#EAE4D7]/80 hover:bg-[#FAF8F5]'
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0 pr-1">
            <div className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${
              onlyInStock ? 'bg-[#C59B58] text-[#1A1612] border-[#B88E4F]' : 'bg-[#F3EFE6] text-[#B88E4F] border-[#EAE4D7]'
            }`}>
              <Package className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-[#1A1612] truncate">Sẵn hàng đóng gói</span>
              <small className="text-[10px] text-[#7D715E] block truncate">Giao ngay trong 24-48h</small>
            </div>
          </div>
          <div className={`w-9 h-5 rounded-full transition-colors relative p-0.5 shrink-0 ${onlyInStock ? 'bg-[#C59B58]' : 'bg-[#EAE4D7]'}`}>
            <div className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${onlyInStock ? 'translate-x-4' : 'translate-x-0'}`} />
          </div>
        </div>
      </div>

      {/* Reset Filter Button at Bottom */}
      {activeFilterCount > 0 && (
        <div className="pt-3 border-t border-[#EAE4D7]">
          <button
            type="button"
            onClick={handleResetFilters}
            className="w-full py-2 px-3 rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-xs font-bold text-[#7D715E] transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Đặt lại tất cả bộ lọc ({activeFilterCount})</span>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1A1612] flex flex-col font-sans selection:bg-[#F3EFE6] selection:text-[#B88E4F] overflow-x-clip">

      {/* Unified Public Header */}
      <PublicHeader
        onOpenCart={openCart}
        defaultSearchQuery={searchInput}
        onSearchSubmit={(q) => {
          setSearchInput(q);
          updateUrlParams({ q: q || null });
        }}
        onOpenFilter={() => {
          if (window.innerWidth < 1024) {
            setIsMobileFilterOpen(true);
          } else {
            const filterEl = document.getElementById('search-filter-sidebar');
            if (filterEl) {
              filterEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-5 text-left">
        
        {/* Catalog heading and controls */}
        <div className="mb-6 pb-4 border-b border-[#EAE4D7]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              {/* Breadcrumb - Sleek & Modern */}
              <nav className="mb-2 flex items-center gap-1.5 text-xs font-medium text-[#7D715E]" aria-label="Breadcrumb">
                <Link
                  to="/"
                  className="inline-flex items-center gap-1.5 transition-colors hover:text-[#B88E4F] group"
                >
                  <Home className="w-3.5 h-3.5 text-[#B88E4F] transition-transform group-hover:scale-110" />
                  <span>Trang chủ</span>
                </Link>
                <ChevronRight className="w-3 h-3 text-[#B9AD9A] shrink-0" />
                <span className="font-semibold text-[#1A1612] bg-[#FBF5EB] border border-[#EEDFC6] px-2 py-0.5 rounded-md text-[11px]" aria-current="page">
                  Sản phẩm
                </span>
                {selectedCategory !== 'all' && (
                  <>
                    <ChevronRight className="w-3 h-3 text-[#B9AD9A] shrink-0" />
                    <span className="font-bold text-[#B88E4F] truncate max-w-[200px]" title={selectedCategory}>
                      {selectedCategory}
                    </span>
                  </>
                )}
              </nav>

              {/* Title & Product Count Badge */}
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="m-0 text-xl sm:text-2xl font-black tracking-[-0.03em] text-[#1A1612]">
                  {searchInput ? (
                    <>Kết quả cho “<span className="text-[#B88E4F]">{searchInput}</span>”</>
                  ) : selectedCategory !== 'all' ? (
                    <>{selectedCategory}</>
                  ) : (
                    <>Tất cả sản phẩm</>
                  )}
                </h1>

                {/* Sleek Count Badge */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#C59B58] animate-pulse shrink-0" />
                  <span className="tabular-nums">
                    {loading ? 'Đang cập nhật...' : `${displayedProducts.length} sản phẩm`}
                  </span>
                </div>
              </div>
            </div>

            {/* Right Controls: Mobile Filter Button & Sort */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(true)}
                className="lg:hidden flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-xs font-bold text-[#B88E4F] hover:bg-[#F3EFE6] transition cursor-pointer shadow-2xs active:scale-98"
              >
                <Filter className="w-4 h-4 text-[#B88E4F]" />
                <span>Bộ lọc</span>
                {activeFilterCount > 0 && (
                  <span className="w-4 h-4 rounded-full bg-[#C59B58] text-[#1A1612] text-[10px] font-black grid place-items-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="hidden items-center rounded-xl border border-[#EAE4D7] bg-white p-1 shadow-2xs md:flex" aria-label="Sắp xếp sản phẩm">
                {[
                  { value: 'newest', label: 'Mới nhất' },
                  { value: 'price_asc', label: 'Giá thấp' },
                  { value: 'price_desc', label: 'Giá cao' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      setSortBy(option.value);
                      updateUrlParams({ sort: option.value });
                    }}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      sortBy === option.value
                        ? 'bg-[#C59B58] text-[#1A1612] shadow-2xs'
                        : 'text-[#7D715E] hover:bg-[#FAF8F5] hover:text-[#1A1612]'
                    }`}
                    aria-pressed={sortBy === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5 text-xs md:hidden">
                <select
                  value={sortBy}
                  onChange={(e) => {
                    setSortBy(e.target.value);
                    updateUrlParams({ sort: e.target.value });
                  }}
                  className="bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3 py-2 text-xs font-bold text-[#1A1612] outline-none focus:border-[#C59B58] transition cursor-pointer"
                >
                  <option value="newest">Mới nhất</option>
                  <option value="price_asc">Giá: Thấp đến cao</option>
                  <option value="price_desc">Giá: Cao đến thấp</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* 2-Column Responsive Layout: Left Sidebar Filters + Right Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[275px_1fr] xl:grid-cols-[290px_1fr] gap-6 items-start">
          
          {/* DESKTOP FILTER SIDEBAR */}
          <aside id="search-filter-sidebar" className="hidden lg:block bg-white border border-[#EAE4D7] rounded-2xl p-4 shadow-[0_4px_24px_rgba(35,29,21,0.04)] text-left sticky top-24">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#EAE4D7] mb-3.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center shrink-0">
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                </div>
                <strong className="text-xs font-black uppercase tracking-wider text-[#1A1612] whitespace-nowrap">
                  Bộ lọc sản phẩm
                </strong>
                {activeFilterCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full bg-[#C59B58] text-[#1A1612] text-[10px] font-black shrink-0">
                    {activeFilterCount}
                  </span>
                )}
              </div>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-[11px] font-bold text-[#7D715E] hover:text-[#DC2626] transition flex items-center gap-1 cursor-pointer"
                  title="Xóa toàn bộ các bộ lọc đang chọn"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Đặt lại</span>
                </button>
              )}
            </div>

            {renderFilterContent()}
          </aside>

          {/* RIGHT PRODUCT GRID COLUMN */}
          <div className="flex-1 min-w-0">
            
            {/* Active Filter Chips Bar */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-5 p-3 rounded-2xl bg-[#F3EFE6]/60 border border-[#EAE4D7] text-xs">
                <span className="font-bold text-[#B88E4F] flex items-center gap-1">
                  <Filter className="w-3.5 h-3.5" />
                  Đang lọc:
                </span>

                {searchInput && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#EAE4D7] text-[#1A1612] font-medium">
                    Từ khóa: <strong>"{searchInput}"</strong>
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput('');
                        updateUrlParams({ q: null });
                      }}
                      className="hover:text-[#DC2626]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedCategory !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#EAE4D7] text-[#1A1612] font-medium">
                    Ngành hàng: <strong>{selectedCategory}</strong>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedCategory('all');
                        updateUrlParams({ category: null });
                      }}
                      className="hover:text-[#DC2626]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {selectedStore !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#EAE4D7] text-[#1A1612] font-medium">
                    Gian hàng: <strong>{stores.find((s) => s.id === selectedStore)?.name || selectedStore}</strong>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedStore('all');
                        updateUrlParams({ store: null });
                      }}
                      className="hover:text-[#DC2626]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {pricePreset !== 'all' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#EAE4D7] text-[#1A1612] font-medium">
                    Giá: <strong>{pricePreset}</strong>
                    <button
                      type="button"
                      onClick={() => {
                        setPricePreset('all');
                        updateUrlParams({ preset: null });
                      }}
                      className="hover:text-[#DC2626]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {onlyHasCommission && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#EAE4D7] text-[#1A1612] font-medium">
                    <strong>Có hoa hồng CTV</strong>
                    <button
                      type="button"
                      onClick={() => {
                        setOnlyHasCommission(false);
                        updateUrlParams({ commission: null });
                      }}
                      className="hover:text-[#DC2626]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                {onlyInStock && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white border border-[#EAE4D7] text-[#1A1612] font-medium">
                    <strong>Còn hàng</strong>
                    <button
                      type="button"
                      onClick={() => {
                        setOnlyInStock(false);
                        updateUrlParams({ inStock: null });
                      }}
                      className="hover:text-[#DC2626]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs font-bold text-[#DC2626] hover:underline ml-auto cursor-pointer"
                >
                  Xóa tất cả
                </button>
              </div>
            )}

            {/* Product Cards Grid */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white border border-[#EAE4D7] p-3 animate-pulse">
                    <div className="aspect-square bg-[#F3EFE6] mb-3" />
                    <div className="h-4 bg-[#F3EFE6] rounded w-3/4 mb-2" />
                    <div className="h-3 bg-[#F3EFE6] rounded w-1/2 mb-4" />
                    <div className="h-6 bg-[#F3EFE6] rounded w-1/3" />
                  </div>
                ))}
              </div>
            ) : displayedProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-[#EAE4D7] p-8 shadow-2xs">
                <ShoppingBag className="w-14 h-14 text-[#7D715E] mx-auto mb-3" />
                <strong className="text-base font-black text-[#1A1612] block">
                  Không tìm thấy sản phẩm phù hợp với bộ lọc
                </strong>
                <p className="text-xs text-[#7D715E] mt-1 mb-5">
                  Thử nới lỏng mức giá, chọn ngành hàng khác hoặc xóa bộ lọc để tìm lại.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="px-6 py-2.5 rounded-xl bg-[#EBD08C] text-white text-xs font-bold hover:bg-[#DEC07A] transition cursor-pointer shadow-xs"
                >
                  Đặt lại tất cả bộ lọc
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3.5">
                {displayedProducts.map((p) => {
                  const productDetailUrl = `/products/${p.sku || p.id}`;
                  return (
                    <div
                      key={p.id}
                      className="bg-white border border-[#EAE4D7] rounded-xl overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(75,57,34,0.10)] hover:border-[#C59B58]/80 transition duration-200 flex flex-col justify-between group text-left"
                    >
                      <div>
                        {/* Clickable Image -> Product Details */}
                        <div className="relative aspect-square bg-[#F3EFE6] overflow-hidden group/img">
                          <Link
                            to={productDetailUrl}
                            className="block w-full h-full cursor-pointer"
                            title="Xem chi tiết sản phẩm"
                          >
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-full h-full object-cover object-center transition-transform duration-300 scale-[1.03] group-hover:scale-[1.07]"
                              loading="lazy"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/reference/assets/serum-hero-optimized.jpg';
                              }}
                            />
                            {p.badge && (
                              <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-[#EBD08C] text-white text-[9px] font-black shadow-xs z-10">
                                {p.badge}
                              </span>
                            )}
                            {p.origPrice > p.price && (
                              <span className="absolute top-0 right-0 px-2 py-0.5 rounded-bl-lg bg-[#FEE2E2] text-[#EE4D2D] text-[10px] sm:text-[11px] font-bold border-l border-b border-[#FADCD5] shadow-2xs z-10">
                                -{Math.round(((p.origPrice - p.price) / p.origPrice) * 100)}%
                              </span>
                            )}
                          </Link>

                          {/* Quick Magnifying Glass Zoom Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setZoomProduct(p);
                            }}
                            className="absolute bottom-2 right-2 w-6 h-6 rounded-full bg-white/85 hover:bg-white text-[#B88E4F] border border-[#EAE4D7] shadow-xs flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-90 cursor-pointer z-10"
                            title="Phóng to ảnh sản phẩm"
                            aria-label="Phóng to ảnh sản phẩm"
                          >
                            <ZoomIn className="w-3 h-3 text-[#B88E4F]" />
                          </button>
                        </div>

                        <div className="p-3">
                          {/* Store Name with Badge */}
                          <div className="flex items-center justify-between gap-1 mb-1.5">
                            <Link to={`/shops/${p.storeId}`} className="text-[11px] font-bold text-[#7D715E] flex items-center gap-1 truncate hover:text-[#B88E4F]" onClick={(event) => event.stopPropagation()}>
                              <Store className="w-3.5 h-3.5 text-[#B88E4F] shrink-0" />
                              <span className="truncate">{p.brand}</span>
                            </Link>
                            <span className="text-[10px] text-[#B88E4F] font-bold shrink-0">
                              Chính hãng
                            </span>
                          </div>

                          {/* Product Title */}
                          <Link to={productDetailUrl} className="block group-hover:text-[#B88E4F] transition">
                            <h3 className="text-xs font-bold text-[#1A1612] line-clamp-2 min-h-[34px] mb-2 leading-snug">
                              {p.name}
                            </h3>
                          </Link>

                          {/* KOC Commission Pill */}
                          {(p.commissionRate || 0) > 0 && (
                            <div className="mb-2 px-2 py-1 bg-[#FBF5EB] border border-[#EAE4D7] text-[10px] text-[#B88E4F] font-bold flex items-center justify-between">
                              <span>Hoa hồng CTV: {p.commissionRate}%</span>
                              <span className="text-[#B88E4F]">
                                ~{p.commissionAmount ? formatMoney(p.commissionAmount) : formatMoney((p.price * (p.commissionRate || 0)) / 100)}
                              </span>
                            </div>
                          )}

                          {/* Price Display */}
                          <div className="flex items-baseline gap-2">
                            <span className="text-base font-black text-[#B88E4F]">
                              {formatMoney(p.price)}
                            </span>
                            {p.origPrice > p.price && (
                              <span className="text-xs text-[#7D715E] line-through font-medium">
                                {formatMoney(p.origPrice)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card Bottom Actions */}
                      <div className="px-3 pb-3 pt-0 flex flex-col gap-1.5">
                        <div className="grid grid-cols-[40px_1fr] gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAddToCart(p)}
                            className="py-2 px-2 rounded-lg border border-[#EAE4D7] bg-white text-[#1A1612] hover:bg-[#FBF5EB] hover:border-[#C59B58] transition flex items-center justify-center cursor-pointer active:scale-95"
                            title="Thêm vào giỏ hàng"
                          >
                            <ShoppingCart className="w-3.5 h-3.5 text-[#B88E4F]" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveCheckoutProduct({
                                product: {
                                  id: p.id,
                                  sku: p.sku,
                                  title: p.name,
                                  price: p.price,
                                  originalPrice: p.origPrice,
                                  imageUrl: p.image,
                                  stockQuantity: p.stockQuantity || 0,
                                  variants: p.variants,
                                },
                                store: {
                                  id: p.storeId || 'store-default',
                                  name: p.brand,
                                },
                                couponCode: p.kol?.coupon || '',
                              });
                            }}
                            className="py-2 px-2.5 rounded-lg bg-[#EBD08C] text-white text-xs font-black hover:bg-[#DEC07A] transition flex items-center justify-center gap-1 cursor-pointer active:scale-95"
                          >
                            Mua ngay
                          </button>
                        </div>

                        {isKolUser && (
                          <button
                            type="button"
                            onClick={() => handleContactShopFromCard(p)}
                            className="w-full py-2 px-3 rounded-xl bg-[#FBF5EB] hover:bg-[#ECE1CD] border border-[#EAE4D7] text-xs font-bold text-[#B88E4F] flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-98"
                            title="Nhắn tin trực tiếp với Shop về mẫu thử và chính sách hoa hồng cho sản phẩm này"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-[#B88E4F]" />
                            <span>Liên hệ Shop</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Mobile Filter Slide-Over Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative ml-auto w-full max-w-xs sm:max-w-sm bg-white h-full shadow-2xl p-5 overflow-y-auto flex flex-col justify-between z-10 text-left">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-[#EAE4D7] mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center shrink-0">
                    <SlidersHorizontal className="w-4 h-4 text-[#B88E4F]" />
                  </div>
                  <strong className="text-base font-black text-[#1A1612]">Bộ Lọc Chi Tiết</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="p-1.5 rounded-xl hover:bg-[#FAF8F5] text-[#7D715E] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {renderFilterContent()}
            </div>

            <div className="pt-4 border-t border-[#EAE4D7] mt-6">
              <button
                type="button"
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full py-3 rounded-2xl bg-[#C59B58] text-[#1A1612] hover:bg-[#B88E4F] text-xs font-bold transition shadow-xs cursor-pointer active:scale-98"
              >
                Xem {displayedProducts.length} sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* KOC LIVE COMMERCE PREVIEW MODAL */}
      {isLiveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsLiveModalOpen(false)}
          />
          <div className="relative w-full max-w-2xl bg-white border border-[#EAE4D7] rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200 text-left">
            <div className="px-6 py-4 bg-gradient-to-r from-[#1A1612] to-[#1A1612] text-white flex items-center justify-between border-b border-[#7D715E]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E11D48] to-[#9F1239] flex items-center justify-center text-white shadow-xs">
                  <Radio className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <strong className="text-sm font-black tracking-tight">KOC Live Commerce Hub</strong>
                  <p className="text-[11px] text-[#EAE4D7] m-0">Phòng phát sóng bán hàng & tiếp thị liên kết đa gian hàng</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsLiveModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-[#EAE4D7] hover:text-white transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto space-y-4 bg-[#FAF8F5]">
              <div className="p-4 rounded-2xl bg-[#FBF5EB] border border-[#EAE4D7] flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#B88E4F] shrink-0 mt-0.5" />
                <div>
                  <strong className="text-xs font-black text-[#1A1612] block">
                    Đặc quyền Live Commerce dành cho KOC & Gian Hàng ScanMS
                  </strong>
                  <p className="text-[11px] text-[#7D715E] mt-0.5 m-0 leading-relaxed">
                    KOC có thể ghim sản phẩm trực tiếp từ các gian hàng đối tác đã kiểm duyệt KYC, khách mua ngay trong lúc xem live với chiết khấu độc quyền.
                  </p>
                </div>
              </div>

              <div className="bg-white border border-[#EAE4D7] rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded-full bg-[#FFE4E6] text-[#E11D48] text-[10px] font-black animate-pulse">
                      ĐANG PHÁT
                    </span>
                    <strong className="text-xs font-bold text-[#1A1612]">KOC Linh Trương • Review Mỹ Phẩm Sora Skin</strong>
                  </div>
                  <span className="text-[11px] text-[#7D715E]">1.2k người đang xem • Hoa hồng CTV 28%</span>
                </div>
                <button
                  type="button"
                  onClick={() => toast.success('Đã kết nối luồng Live KOC demo!')}
                  className="px-4 py-2 rounded-xl bg-[#EBD08C] text-white text-xs font-bold hover:bg-[#DEC07A] transition"
                >
                  Xem Live
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guest Checkout Modal */}
      {activeCheckoutProduct && (
        <GuestCheckoutModal
          isOpen={true}
          onClose={() => setActiveCheckoutProduct(null)}
          product={activeCheckoutProduct.product}
          store={activeCheckoutProduct.store}
          initialCouponCode={activeCheckoutProduct.couponCode}
          initialQuantity={activeCheckoutProduct.quantity}
          onOrderPlaced={(orderData: any) => {
            setActiveCheckoutProduct(null);
            toast.success(`Đặt hàng thành công! Mã đơn: ${orderData.orderCode || orderData.id}`);
          }}
        />
      )}

      {/* FULL PRODUCT ZOOM MODAL */}
      {zoomProduct && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setZoomProduct(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-white border border-[#EAE4D7] rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[92vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              type="button"
              onClick={() => setZoomProduct(null)}
              className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-white/95 hover:bg-white text-[#1A1612] border border-[#EAE4D7] shadow-md flex items-center justify-center transition cursor-pointer hover:scale-105"
              aria-label="Đóng xem chi tiết"
            >
              <X className="w-5 h-5 text-[#7D715E]" />
            </button>

            {/* Left: Large High-Resolution Image Viewport */}
            <div className="relative flex-1 bg-[#FAF8F5] flex items-center justify-center p-4 sm:p-8 min-h-[320px] md:min-h-[480px] overflow-hidden group">
              <img
                src={zoomProduct.image}
                alt={zoomProduct.name}
                className="max-h-[55vh] md:max-h-[75vh] w-auto max-w-full object-contain rounded-2xl shadow-sm transition-transform duration-300 hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = '/reference/assets/serum-hero-optimized.jpg';
                }}
              />
              <div className="absolute bottom-3 left-3 px-3 py-1 rounded-full bg-black/60 backdrop-blur-xs text-white text-[11px] font-medium flex items-center gap-1.5 pointer-events-none">
                <ZoomIn className="w-3.5 h-3.5 text-[#EAE4D7]" />
                <span>Xem chi tiết độ phân giải cao</span>
              </div>
            </div>

            {/* Right: Product Summary & Quick Actions */}
            <div className="w-full md:w-80 lg:w-96 p-5 sm:p-6 flex flex-col justify-between border-t md:border-t-0 md:border-l border-[#EAE4D7] bg-white text-left">
              <div className="space-y-4">
                {/* Store badge */}
                <div className="flex items-center gap-2 text-xs text-[#7D715E]">
                  <Store className="w-4 h-4 text-[#B88E4F]" />
                  <span className="font-bold text-[#1A1612]">{zoomProduct.brand}</span>
                  <span className="px-1.5 py-0.5 rounded bg-[#FBF5EB] text-[#B88E4F] text-[10px] font-bold border border-[#EAE4D7]">
                    KYC Verified
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-base sm:text-lg font-black text-[#1A1612] leading-snug">
                  {zoomProduct.name}
                </h3>

                {/* Category & SKU */}
                <div className="flex flex-wrap gap-2 text-[11px] text-[#7D715E]">
                  {zoomProduct.category && (
                    <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#EAE4D7]">
                      {zoomProduct.category}
                    </span>
                  )}
                  {zoomProduct.sku && (
                    <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#EAE4D7] font-mono">
                      SKU: {zoomProduct.sku}
                    </span>
                  )}
                </div>

                {/* Price block */}
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#EAE4D7] space-y-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xl font-black text-[#B88E4F]">
                      {formatMoney(zoomProduct.price)}
                    </span>
                    {zoomProduct.origPrice > zoomProduct.price && (
                      <span className="text-xs text-[#7D715E] line-through">
                        {formatMoney(zoomProduct.origPrice)}
                      </span>
                    )}
                  </div>
                  {(zoomProduct.commissionRate || 0) > 0 && (
                    <p className="text-[11px] font-bold text-[#B88E4F] m-0">
                      Hoa hồng CTV/KOL: {zoomProduct.commissionRate}% (~{formatMoney(zoomProduct.commissionAmount || Math.round((zoomProduct.price * (zoomProduct.commissionRate || 0)) / 100))})
                    </p>
                  )}
                </div>

                {/* Assurance notice */}
                <div className="p-3 rounded-xl bg-[#FBF5EB] border border-[#EAE4D7] text-[11px] text-[#B88E4F] space-y-1">
                  <p className="font-bold m-0 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#B88E4F]" />
                    Cam kết chính hãng 100%
                  </p>
                  <p className="m-0 text-[#7D715E]">
                    Đồng kiểm khi nhận hàng · Đổi trả trong 14 ngày nếu có lỗi từ nhà sản xuất.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-2">
                <Link
                  to={`/products/${zoomProduct.sku || zoomProduct.id}`}
                  onClick={() => setZoomProduct(null)}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#EBD08C] hover:bg-[#DEC07A] text-white text-xs font-bold text-center flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer"
                >
                  <span>Xem trang chi tiết đầy đủ</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    const p = zoomProduct;
                    setZoomProduct(null);
                    setActiveCheckoutProduct({
                      product: {
                        id: p.id,
                        sku: p.sku,
                        title: p.name,
                        price: p.price,
                        originalPrice: p.origPrice,
                        imageUrl: p.image,
                        stockQuantity: p.stockQuantity || 0,
                        variants: p.variants,
                      },
                      store: {
                        id: p.storeId || 'store-default',
                        name: p.brand,
                      },
                      couponCode: p.kol?.coupon || '',
                    });
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-[#FAF8F5] hover:bg-[#F3EFE6] border border-[#EAE4D7] text-[#1A1612] text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span>Mua ngay sản phẩm này</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
