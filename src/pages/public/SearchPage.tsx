import { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import {
  Store,
  X,
  ShoppingBag,
  SlidersHorizontal,
  Check,
  Filter,
  BadgeCheck,
  Zap,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Heart,
} from 'lucide-react';
import api from '../../services/api';
import { PublicHeader } from '../../components/layout/PublicHeader';
import { authService } from '../../services/auth.service';
import { customerService } from '../../services/customer.service';
import { formatMoney, getSafeProductImageUrl } from '../../features/marketplace/marketplaceUtils';
import type { Product } from '../../features/marketplace/marketplace.types';
import { toast } from '../../utils/toast';
import { useCart } from '../../context/CartContext';
import { LiveSessionDealBadge, useLiveSessionDeals } from '../../components/product/LiveSessionDealBadge';
import { LiveCommerceHubModal } from '../../components/marketplace/LiveCommerceHubModal';

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
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sort') || 'popular');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllStores, setShowAllStores] = useState(false);
  const [isPriceDropdownOpen, setIsPriceDropdownOpen] = useState(false);
  const priceDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (priceDropdownRef.current && !priceDropdownRef.current.contains(e.target as Node)) {
        setIsPriceDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
  const { openCart } = useCart();
  const [isLiveModalOpen, setIsLiveModalOpen] = useState(false);

  const [currentUser, setCurrentUser] = useState(() => authService.getCurrentUser());
  const isKolUser = currentUser?.role === 'COLLABORATOR';
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set());

  // Load customer wishlist & sync events
  useEffect(() => {
    const loadWishlist = () => {
      const user = authService.getCurrentUser();
      setCurrentUser(user);
      if (user?.role === 'CUSTOMER') {
        customerService
          .getWishlist()
          .then((items) => {
            if (Array.isArray(items)) {
              setWishlistIds(new Set(items.map((it) => it.product?.id).filter(Boolean) as string[]));
            }
          })
          .catch(() => {});
      } else {
        setWishlistIds(new Set());
      }
    };

    loadWishlist();

    const handleWishlistUpdated = (e: any) => {
      const { productId, wishlisted } = e.detail || {};
      if (!productId) return;
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (wishlisted) next.add(productId);
        else next.delete(productId);
        return next;
      });
    };

    window.addEventListener('auth-user-updated', loadWishlist);
    window.addEventListener('wishlist-updated', handleWishlistUpdated as EventListener);
    return () => {
      window.removeEventListener('auth-user-updated', loadWishlist);
      window.removeEventListener('wishlist-updated', handleWishlistUpdated as EventListener);
    };
  }, []);

  const handleToggleWishlist = async (productId: string) => {
    if (!currentUser) {
      toast.error('Vui lòng đăng nhập để thêm sản phẩm vào danh sách yêu thích!');
      navigate('/login?role=CUSTOMER');
      return;
    }
    if (currentUser.role !== 'CUSTOMER') {
      toast.error('Chức năng Yêu thích sản phẩm dành cho tài khoản Khách hàng mua sắm.');
      return;
    }

    try {
      const res = await customerService.toggleWishlist(productId);
      setWishlistIds((prev) => {
        const next = new Set(prev);
        if (res.wishlisted) {
          next.add(productId);
          toast.success('Đã lưu vào danh sách yêu thích!');
        } else {
          next.delete(productId);
          toast.info('Đã bỏ lưu sản phẩm');
        }
        return next;
      });
      window.dispatchEvent(
        new CustomEvent('wishlist-updated', {
          detail: { productId, wishlisted: res.wishlisted },
        })
      );
    } catch {
      toast.error('Không thể cập nhật danh sách yêu thích. Vui lòng thử lại.');
    }
  };

  useEffect(() => {
    const syncUser = () => setCurrentUser(authService.getCurrentUser());
    window.addEventListener('auth-user-updated', syncUser);
    return () => window.removeEventListener('auth-user-updated', syncUser);
  }, []);

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
            const commissionValue = item.customCommissionRate ?? item.commissionRate ?? item.store?.defaultCommissionRate;
            const parsedRate = commissionValue == null ? 0 : Number(commissionValue);
            const rawRate = Number.isFinite(parsedRate) && parsedRate > 0 ? parsedRate : 0;
            const priceNum = Number(item.price) || 0;
            const origNum = Number(item.originalPrice) || 0;

            let badge = '';
            if (rawRate > 0) badge = `Hoa hồng ${rawRate}%`;
            else if (item.stockQuantity > 0) badge = 'Sẵn hàng';

            const titleLower = (item.title || item.name || '').toLowerCase();
            const resolvedBrand = item.store?.name || item.brand || (
              titleLower.includes('lumi') ? 'Lumière Lab Vietnam' :
              (titleLower.includes('granola') || titleLower.includes('trà') || titleLower.includes('hạt')) ? 'GreenBio Health & Herbs' :
              (titleLower.includes('aura') || titleLower.includes('bàn phím') || titleLower.includes('tai nghe')) ? 'Aura Bio Cosmetics Vietnam' :
              'Sora Skin Official Store'
            );

            return {
              id: item.id,
              sku: item.sku || item.id,
              name: item.title || item.name,
              brand: resolvedBrand,
              category: item.categoryName || 'Khác',
              categoryLabel: item.categoryName || 'Khác',
              price: priceNum,
              origPrice: origNum,
              image: getSafeProductImageUrl(item.imageUrl, item.title || item.name, item.categoryName),
              rating: 5.0,
              sold: `${50 + (item.stockQuantity % 120)}`,
              commissionRate: rawRate || undefined,
              commissionAmount: rawRate > 0 ? Math.round(priceNum * (rawRate / 100)) : undefined,
              seller: resolvedBrand,
              storeId: item.store?.id || '',
              stock: item.stockQuantity !== undefined ? item.stockQuantity : 100,
              stockQuantity: item.stockQuantity !== undefined ? item.stockQuantity : 100,
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
    } else if (sortBy === 'sales') {
      list.sort((a, b) => (Number(b.sold) || 0) - (Number(a.sold) || 0));
    } else if (sortBy === 'newest') {
      list.reverse();
    }
    return list;
  }, [filteredProducts, sortBy]);
  const { deals: liveDeals, now: liveDealsNow } = useLiveSessionDeals(displayedProducts.map((product) => product.id));

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


  // Filter content renderer (shared by Desktop Sidebar and Mobile Drawer) - SCANMS E-Commerce Layout
  const renderFilterContent = () => (
    <div className="space-y-3.5 text-left">
      {/* Category Section - SCANMS Standard */}
      <div>
        <div className="space-y-1">
          {/* Tất cả sản phẩm (Toàn sàn & Mọi gian hàng) */}
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedStore('all');
              updateUrlParams({ category: null, store: null });
            }}
            className={`w-full text-left py-1 text-xs transition-colors cursor-pointer flex items-start gap-1.5 ${
              selectedCategory === 'all' && selectedStore === 'all'
                ? 'font-bold text-[#B88E4F]'
                : 'font-normal text-[#231D15] hover:text-[#B88E4F] pl-3'
            }`}
          >
            {selectedCategory === 'all' && selectedStore === 'all' && (
              <span className="text-[#B88E4F] text-[9px] mt-0.5 shrink-0 select-none">▸</span>
            )}
            <span className="leading-snug">Tất cả sản phẩm</span>
          </button>

          {/* Category List */}
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
                className={`w-full text-left py-1 text-xs transition-colors cursor-pointer flex items-start gap-1.5 ${
                  isSelected
                    ? 'font-bold text-[#B88E4F]'
                    : 'font-normal text-[#231D15] hover:text-[#B88E4F] pl-3'
                }`}
              >
                {isSelected && (
                  <span className="text-[#B88E4F] text-[9px] mt-0.5 shrink-0 select-none">▸</span>
                )}
                <span className="leading-snug">{cat.name}</span>
              </button>
            );
          })}

          {/* SCANMS Standard "Thêm ▾" / "Thu gọn ▴" */}
          {categories.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllCategories((current) => !current)}
              className="flex items-center gap-1 py-1 pl-3 text-xs font-normal text-[#231D15] hover:text-[#B88E4F] transition-colors cursor-pointer mt-0.5"
            >
              <span>{showAllCategories ? 'Thu gọn' : 'Thêm'}</span>
              {showAllCategories ? (
                <ChevronUp className="w-3 h-3 text-[#7D715E]" />
              ) : (
                <ChevronDown className="w-3 h-3 text-[#7D715E]" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Partner Store Section - SCANMS Standard */}
      <div className="pt-3 border-t border-[#EAE4D7]">
        <div className="flex items-center justify-between mb-1.5 pb-1 border-b border-[#EAE4D7]/70">
          <label className="text-xs font-bold uppercase tracking-wider text-[#1A1612]">
            Gian hàng đối tác
          </label>
        </div>

        <div className="space-y-1">
          {/* Toàn bộ gian hàng */}
          <button
            type="button"
            onClick={() => {
              setSelectedStore('all');
              updateUrlParams({ store: null });
            }}
            className={`w-full text-left py-1 text-xs transition-colors cursor-pointer flex items-start gap-1.5 ${
              selectedStore === 'all'
                ? 'font-bold text-[#B88E4F]'
                : 'font-normal text-[#231D15] hover:text-[#B88E4F] pl-3'
            }`}
          >
            {selectedStore === 'all' && (
              <span className="text-[#B88E4F] text-[9px] mt-0.5 shrink-0 select-none">▸</span>
            )}
            <span className="leading-snug">Toàn bộ gian hàng</span>
          </button>

          {/* Store List */}
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
                className={`w-full text-left py-1 text-xs transition-colors cursor-pointer flex items-start gap-1.5 ${
                  isSelected
                    ? 'font-bold text-[#B88E4F]'
                    : 'font-normal text-[#231D15] hover:text-[#B88E4F] pl-3'
                }`}
              >
                {isSelected && (
                  <span className="text-[#B88E4F] text-[9px] mt-0.5 shrink-0 select-none">▸</span>
                )}
                <span className="leading-snug flex items-center gap-1">
                  <span>{st.name}</span>
                  <BadgeCheck className="w-3 h-3 text-[#B88E4F] shrink-0 inline" />
                </span>
              </button>
            );
          })}

          {/* SCANMS Standard "Thêm ▾" / "Thu gọn ▴" */}
          {stores.length > 3 && (
            <button
              type="button"
              onClick={() => setShowAllStores((current) => !current)}
              className="flex items-center gap-1 py-1 pl-3 text-xs font-normal text-[#231D15] hover:text-[#B88E4F] transition-colors cursor-pointer mt-0.5"
            >
              <span>{showAllStores ? 'Thu gọn' : 'Thêm'}</span>
              {showAllStores ? (
                <ChevronUp className="w-3 h-3 text-[#7D715E]" />
              ) : (
                <ChevronDown className="w-3 h-3 text-[#7D715E]" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Price Range Section - SCANMS Standard */}
      <div className="pt-3 border-t border-[#EAE4D7]">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1612] mb-1.5 pb-1 border-b border-[#EAE4D7]/70">
          Khoảng giá
        </label>

        {/* SCANMS Price Inputs: Từ ₫ - Đến ₫ & Áp Dụng Button */}
        <div className="mb-2">
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-1.5 mb-2">
            <input
              type="number"
              value={minPrice}
              onChange={(e) => {
                setMinPrice(e.target.value);
                setPricePreset('custom');
              }}
              placeholder="₫ TỪ"
              className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded px-2 py-1 text-xs text-[#1A1612] placeholder-[#8C7D6B] outline-none focus:border-[#C59B58] focus:bg-white font-medium text-center"
            />
            <span className="text-[#8C7D6B] text-xs font-bold">-</span>
            <input
              type="number"
              value={maxPrice}
              onChange={(e) => {
                setMaxPrice(e.target.value);
                setPricePreset('custom');
              }}
              placeholder="₫ ĐẾN"
              className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded px-2 py-1 text-xs text-[#1A1612] placeholder-[#8C7D6B] outline-none focus:border-[#C59B58] focus:bg-white font-medium text-center"
            />
          </div>
          <button
            type="button"
            disabled={!minPrice && !maxPrice}
            onClick={() => updateUrlParams({ min: minPrice || null, max: maxPrice || null })}
            className="w-full py-1.5 rounded bg-[#C59B58] hover:bg-[#B88E4F] text-xs font-bold text-[#1A1612] uppercase tracking-wider transition shadow-2xs active:scale-98 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Áp dụng
          </button>
        </div>

        {/* Quick Price Preset Radio List */}
        <div className="space-y-1 pt-1 border-t border-[#EAE4D7]/50">
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
                className={`w-full text-left py-1 text-xs transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isPresetActive
                    ? 'font-bold text-[#B88E4F]'
                    : 'font-normal text-[#231D15] hover:text-[#B88E4F] pl-3'
                }`}
              >
                {isPresetActive && (
                  <span className="text-[#B88E4F] text-[9px] shrink-0 select-none">▸</span>
                )}
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Partner Privilege Toggles / Service & Promotion - SCANMS Standard */}
      <div className="pt-3 border-t border-[#EAE4D7] space-y-1.5">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#1A1612] mb-1 pb-1 border-b border-[#EAE4D7]/70">
          Dịch vụ & Khuyến mãi
        </label>

        {/* Checkbox 1: Commission */}
        <label
          onClick={() => {
            const next = !onlyHasCommission;
            setOnlyHasCommission(next);
            updateUrlParams({ commission: next ? 'true' : null });
          }}
          className="flex items-center gap-2 py-1 pl-1 cursor-pointer text-xs text-[#231D15] hover:text-[#B88E4F] transition-colors group select-none"
        >
          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
            onlyHasCommission
              ? 'bg-[#C59B58] border-[#B88E4F] text-[#1A1612]'
              : 'border-[#C4B7A6] bg-white group-hover:border-[#C59B58]'
          }`}>
            {onlyHasCommission && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          </div>
          <span className={onlyHasCommission ? 'font-bold text-[#B88E4F]' : 'font-normal'}>
            Hoa hồng CTV/KOL
          </span>
        </label>

        {/* Checkbox 2: In Stock */}
        <label
          onClick={() => {
            const next = !onlyInStock;
            setOnlyInStock(next);
            updateUrlParams({ inStock: next ? 'true' : null });
          }}
          className="flex items-center gap-2 py-1 pl-1 cursor-pointer text-xs text-[#231D15] hover:text-[#B88E4F] transition-colors group select-none"
        >
          <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors shrink-0 ${
            onlyInStock
              ? 'bg-[#C59B58] border-[#B88E4F] text-[#1A1612]'
              : 'border-[#C4B7A6] bg-white group-hover:border-[#C59B58]'
          }`}>
            {onlyInStock && <Check className="w-2.5 h-2.5 stroke-[3]" />}
          </div>
          <span className={onlyInStock ? 'font-bold text-[#B88E4F]' : 'font-normal'}>
            Sẵn hàng giao ngay
          </span>
        </label>
      </div>

      {/* Reset Filter Button at Bottom */}
      {activeFilterCount > 0 && (
        <div className="pt-3 border-t border-[#EAE4D7]">
          <button
            type="button"
            onClick={handleResetFilters}
            className="w-full py-1.5 px-2.5 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] hover:bg-rose-50 hover:border-rose-200 hover:text-rose-700 text-xs font-bold text-[#7D715E] transition flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Xóa tất cả bộ lọc ({activeFilterCount})</span>
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

      {/* Main Content Area - 1200px Centered SCANMS Standard Container */}
      <main className="flex-1 max-w-[1200px] w-full mx-auto px-3 sm:px-4 py-4 sm:py-5 text-left">
        {/* 2-Column Responsive Layout: Left Sidebar Filters (190px) + Right Product Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[190px_1fr] gap-4 sm:gap-5 items-start">
          
          {/* DESKTOP FILTER SIDEBAR (Flat SCANMS Standard - No outer wrapping frame) */}
          <aside id="search-filter-sidebar" className="hidden lg:block text-left sticky top-24">
            {/* Sidebar Header: Exact matching 52px height and alignment with Sort Bar */}
            <div className="h-[52px] flex items-center gap-2 min-w-0 border-b border-[#EAE4D7] pb-1 mb-2">
              <SlidersHorizontal className="w-4 h-4 text-[#1A1612]" />
              <strong className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#1A1612] whitespace-nowrap">
                Bộ lọc sản phẩm
              </strong>
              {activeFilterCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-[#C59B58] text-[#1A1612] text-[9.5px] font-black shrink-0">
                  {activeFilterCount}
                </span>
              )}
            </div>

            <div>
              {renderFilterContent()}
            </div>
          </aside>

          {/* RIGHT PRODUCT GRID COLUMN */}
          <div className="flex-1 min-w-0 space-y-3.5">
            
            {/* SCANMS Standard Sort Bar: Exact matching 52px height and alignment with Bộ lọc sản phẩm */}
            <div className="h-[52px] bg-[#F3EFE6] border border-[#EAE4D7] rounded-xl px-4 flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                {/* Mobile Filter Button */}
                <button
                  type="button"
                  onClick={() => setIsMobileFilterOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-[#EAE4D7] text-xs font-bold text-[#1A1612] hover:text-[#B88E4F] cursor-pointer shadow-2xs shrink-0"
                >
                  <Filter className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span>Bộ lọc</span>
                  {activeFilterCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#C59B58] text-[#1A1612] text-[10px] font-black grid place-items-center">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                <span className="text-xs sm:text-sm font-medium text-[#7D715E] shrink-0">
                  Sắp xếp theo
                </span>

                {/* Phổ Biến Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('popular');
                    updateUrlParams({ sort: 'popular' });
                  }}
                  className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer select-none active:scale-98 ${
                    sortBy === 'popular'
                      ? 'bg-[#C59B58] text-white shadow-2xs border border-[#C59B58]'
                      : 'bg-white text-[#1A1612] hover:bg-[#FAF8F5] hover:text-[#B88E4F] border border-[#EAE4D7]'
                  }`}
                  aria-pressed={sortBy === 'popular'}
                >
                  Phổ Biến
                </button>

                {/* Mới Nhất Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('newest');
                    updateUrlParams({ sort: 'newest' });
                  }}
                  className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer select-none active:scale-98 ${
                    sortBy === 'newest'
                      ? 'bg-[#C59B58] text-white shadow-2xs border border-[#C59B58]'
                      : 'bg-white text-[#1A1612] hover:bg-[#FAF8F5] hover:text-[#B88E4F] border border-[#EAE4D7]'
                  }`}
                  aria-pressed={sortBy === 'newest'}
                >
                  Mới Nhất
                </button>

                {/* Bán Chạy Button */}
                <button
                  type="button"
                  onClick={() => {
                    setSortBy('sales');
                    updateUrlParams({ sort: 'sales' });
                  }}
                  className={`px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer select-none active:scale-98 ${
                    sortBy === 'sales'
                      ? 'bg-[#C59B58] text-white shadow-2xs border border-[#C59B58]'
                      : 'bg-white text-[#1A1612] hover:bg-[#FAF8F5] hover:text-[#B88E4F] border border-[#EAE4D7]'
                  }`}
                  aria-pressed={sortBy === 'sales'}
                >
                  Bán Chạy
                </button>

                {/* SCANMS Standard Giá Dropdown */}
                <div
                  ref={priceDropdownRef}
                  className="relative"
                  onMouseEnter={() => setIsPriceDropdownOpen(true)}
                  onMouseLeave={() => setIsPriceDropdownOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setIsPriceDropdownOpen((prev) => !prev)}
                    className={`min-w-[145px] sm:min-w-[165px] px-3.5 py-1.5 sm:py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer select-none active:scale-98 flex items-center justify-between gap-2 ${
                      sortBy === 'price_asc' || sortBy === 'price_desc'
                        ? 'bg-[#C59B58] text-white shadow-2xs border border-[#C59B58]'
                        : 'bg-white text-[#1A1612] hover:bg-[#FAF8F5] hover:text-[#B88E4F] border border-[#EAE4D7]'
                    }`}
                    aria-expanded={isPriceDropdownOpen}
                  >
                    <span className="truncate">
                      {sortBy === 'price_asc'
                        ? 'Giá: Thấp đến Cao'
                        : sortBy === 'price_desc'
                        ? 'Giá: Cao đến Thấp'
                        : 'Giá'}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 shrink-0 transition-transform duration-150 ${
                        isPriceDropdownOpen ? 'rotate-180' : ''
                      } ${sortBy === 'price_asc' || sortBy === 'price_desc' ? 'text-white' : 'text-[#7D715E]'}`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  {isPriceDropdownOpen && (
                    <div className="absolute left-0 top-full mt-1 w-full bg-white border border-[#EAE4D7] rounded-lg shadow-lg z-30 py-1 overflow-hidden animate-in fade-in zoom-in-95 duration-100 text-left">
                      <button
                        type="button"
                        onClick={() => {
                          setSortBy('price_asc');
                          updateUrlParams({ sort: 'price_asc' });
                          setIsPriceDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between ${
                          sortBy === 'price_asc'
                            ? 'bg-[#FBF5EB] text-[#B88E4F] font-bold'
                            : 'text-[#1A1612] hover:bg-[#FAF8F5] hover:text-[#B88E4F]'
                        }`}
                      >
                        <span>Giá: Thấp đến Cao</span>
                        {sortBy === 'price_asc' && <Check className="w-3.5 h-3.5 text-[#B88E4F]" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setSortBy('price_desc');
                          updateUrlParams({ sort: 'price_desc' });
                          setIsPriceDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 text-xs sm:text-sm font-medium transition cursor-pointer flex items-center justify-between ${
                          sortBy === 'price_desc'
                            ? 'bg-[#FBF5EB] text-[#B88E4F] font-bold'
                            : 'text-[#1A1612] hover:bg-[#FAF8F5] hover:text-[#B88E4F]'
                        }`}
                      >
                        <span>Giá: Cao đến Thấp</span>
                        {sortBy === 'price_desc' && <Check className="w-3.5 h-3.5 text-[#B88E4F]" />}
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="text-xs text-[#7D715E] font-medium hidden md:flex items-center gap-1.5 shrink-0">
                <span className="tabular-nums font-bold text-[#1A1612]">{displayedProducts.length}</span>
                <span>sản phẩm</span>
              </div>
            </div>

            {/* Active Filter Chips Bar */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 p-3 rounded-2xl bg-[#F3EFE6]/60 border border-[#EAE4D7] text-xs">
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

            {/* Product Cards Grid - SCANMS 5-Column Grid on Desktop */}
            {loading ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
                {[...Array(10)].map((_, i) => (
                  <div key={i} className="bg-white border border-[#EAE4D7] rounded-xl p-2.5 animate-pulse">
                    <div className="aspect-square bg-[#F3EFE6] rounded-lg mb-2.5" />
                    <div className="h-3.5 bg-[#F3EFE6] rounded w-3/4 mb-2" />
                    <div className="h-3 bg-[#F3EFE6] rounded w-1/2 mb-3" />
                    <div className="h-5 bg-[#F3EFE6] rounded w-1/3" />
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3">
                {displayedProducts.map((p) => {
                  const productDetailUrl = `/products/${p.sku || p.id}`;
                  const formatSoldCount = (sold?: number | string) => {
                    const count = Number(sold) || 600000;
                    if (count >= 1000000) return `${(count / 1000000).toFixed(1).replace('.0', '')}tr+`;
                    if (count >= 1000) return `${(count / 1000).toFixed(count >= 10000 ? 0 : 1).replace('.0', '')}k+`;
                    return `${count}`;
                  };

                  return (
                    <div
                      key={p.id}
                      className="bg-white border border-[#EAE4D7] rounded-xl overflow-hidden hover:-translate-y-1 hover:shadow-[0_10px_24px_rgba(75,57,34,0.12)] hover:border-[#C59B58] transition-all duration-200 flex flex-col justify-between group text-left relative"
                    >
                      {/* Entire Card Clickable Area -> Product Details (SCANMS Standard) */}
                      <Link
                        to={productDetailUrl}
                        className="block flex-1 flex flex-col cursor-pointer"
                        title={p.name}
                      >
                        {/* Image Container with Discount Badge & Wishlist Heart */}
                        <div className="relative aspect-square bg-[#F3EFE6] overflow-hidden">
                          <LiveSessionDealBadge deal={liveDeals[p.id]} now={liveDealsNow} />
                          <img
                            src={p.image}
                            alt={p.name}
                            className="w-full h-full object-cover object-center transition-transform duration-300 scale-[1.02] group-hover:scale-[1.06]"
                            loading="lazy"
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              if (!target.dataset.hasFallback) {
                                target.dataset.hasFallback = 'true';
                                target.src = getSafeProductImageUrl(null, p.name);
                              }
                            }}
                          />
                          {p.origPrice > p.price && (
                            <span className="absolute top-0 left-0 px-1.5 py-0.5 rounded-br-md bg-[#FEE2E2] text-[#DC2626] text-[9.5px] sm:text-[10px] font-bold border-r border-b border-[#FADCD5] shadow-2xs z-10">
                              -{Math.round(((p.origPrice - p.price) / p.origPrice) * 100)}%
                            </span>
                          )}

                          {/* Wishlist Heart Button */}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleWishlist(p.id);
                            }}
                            className={`absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm z-10 cursor-pointer active:scale-90 ${
                              wishlistIds.has(p.id)
                                ? 'bg-white text-[#DC2626] ring-1 ring-[#DC2626]/30 shadow-[0_2px_8px_rgba(220,38,38,0.25)] hover:scale-110'
                                : 'bg-white/90 hover:bg-white text-[#7D715E] hover:text-[#DC2626] hover:scale-110 backdrop-blur-xs'
                            }`}
                            title={wishlistIds.has(p.id) ? 'Bỏ lưu sản phẩm' : 'Lưu vào danh sách yêu thích'}
                          >
                            <Heart className={`w-3.5 h-3.5 transition-colors ${wishlistIds.has(p.id) ? 'fill-[#DC2626] text-[#DC2626]' : ''}`} />
                          </button>
                        </div>

{/* Card Content - SCANMS Compact Proportions */}
                        <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between">
                          <div>
                            {/* Row 1: Store Icon & Shop Name • Chính hãng */}
                            <div className="flex items-center justify-between gap-1 h-5 mb-1 min-w-0">
                              <Link
                                to={p.storeId ? `/shops/${p.storeId}` : `/marketplace?store=${encodeURIComponent(p.brand || '')}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[10.5px] font-bold text-[#7D715E] hover:text-[#B88E4F] flex items-center gap-1 min-w-0 truncate"
                                title={p.brand || 'Gian hàng đối tác'}
                              >
                                <Store className="w-3 h-3 text-[#B88E4F] shrink-0" />
                                <span className="truncate max-w-[85px] sm:max-w-[105px]">
                                  {p.brand || 'Gian hàng đối tác'}
                                </span>
                              </Link>
                              <span className="inline-flex items-center px-1 py-0.2 rounded bg-[#FBF5EB] border border-[#EEDFC6] text-[8.5px] sm:text-[9px] font-extrabold text-[#B88E4F] shrink-0">
                                Chính hãng
                              </span>
                            </div>

                            {/* Row 2: Product Title (Strictly fixed height 34px - 2 lines, so 1-line and 2-line titles are 100% evenly aligned) */}
                            <h3
                              className="text-xs font-semibold text-[#1A1612] group-hover:text-[#B88E4F] transition-colors line-clamp-2 h-[34px] leading-[17px] mb-1 overflow-hidden"
                              title={p.name}
                            >
                              {p.name}
                            </h3>

                            {/* Row 3: SCANMS Badge Row - "Rẻ Vô Địch" / "Hoa hồng" (Fixed height h-5 to keep all cards uniform) */}
                            <div className="flex items-center gap-1 h-5 mb-1.5 min-w-0">
                              <span
                                className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-[#FBF5EB] border border-[#EEDFC6] text-[9px] font-black text-[#B88E4F] shrink-0 shadow-2xs tracking-tight"
                                title="Bảo chứng giá tốt nhất sàn - Rẻ Vô Địch"
                              >
                                <Zap className="w-2.5 h-2.5 fill-[#B88E4F] text-[#B88E4F] shrink-0" />
                                <span>Rẻ Vô Địch</span>
                              </span>

                              {isKolUser && (p.commissionRate || 0) > 0 && (
                                <span className="text-[9px] text-[#B88E4F] font-bold bg-[#FBF5EB] px-1 py-0.5 rounded border border-[#EEDFC6] truncate">
                                  HH {p.commissionRate}%
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Row 4: SCANMS Standard Bottom Bar: Big Bold Price on Left, Sold Count on Right */}
                          <div className="pt-1.5 border-t border-[#EAE4D7]/60 flex items-center justify-between gap-1">
                            <span className="text-xs sm:text-sm font-black text-[#B88E4F] tracking-tight truncate">
                              {formatMoney(p.price)}
                            </span>

                            <span className="text-[10px] text-[#7D715E] font-medium shrink-0 whitespace-nowrap">
                              {formatSoldCount(p.sold)} đã bán
                            </span>
                          </div>
                        </div>
                      </Link>

                      {/* Optional discreet Chat Shop for KOL partners */}
                      {isKolUser && (
                        <div className="px-2.5 pb-2 pt-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleContactShopFromCard(p);
                            }}
                            className="w-full py-1 px-2 rounded-md bg-[#FBF5EB] hover:bg-[#F3EFE6] border border-[#EEDFC6] text-[10px] font-bold text-[#B88E4F] flex items-center justify-center gap-1 transition cursor-pointer shadow-2xs active:scale-98"
                            title="Nhắn tin trực tiếp với Shop về mẫu thử và chính sách hoa hồng"
                          >
                            <MessageSquare className="w-3 h-3 text-[#B88E4F]" />
                            <span>Liên hệ Shop</span>
                          </button>
                        </div>
                      )}
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
      <LiveCommerceHubModal
        isOpen={isLiveModalOpen}
        onClose={() => setIsLiveModalOpen(false)}
      />
    </div>
  );
}
