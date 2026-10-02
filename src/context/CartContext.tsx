import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from '../utils/toast';
import { authService } from '../services/auth.service';
import api from '../services/api';
import { customerService } from '../services/customer.service';

export interface CartVariantInfo {
  id: string;
  name: string;
  sku: string;
  price?: number | string | null;
  stockQuantity: number;
  isActive?: boolean;
}

export interface CartItem {
  cartItemId: string; // `${productId}_${variantId || 'base'}`
  productId: string;
  variantId?: string;
  variantName?: string;
  title: string;
  sku: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  quantity: number;
  stockQuantity: number;
  isActive: boolean;
  store: {
    id: string;
    name: string;
    slug?: string;
    logoUrl?: string;
    policyReturn?: string;
    policyWarranty?: string;
    policyShipping?: string;
  };
  availableVariants?: CartVariantInfo[];
}

export interface StoreCartGroup {
  storeId: string;
  storeName: string;
  storeSlug?: string;
  storeLogoUrl?: string;
  items: CartItem[];
  subtotal: number;
  selectedSubtotal: number;
  allSelected: boolean;
  someSelected: boolean;
  hasOutOfStock: boolean;
}

interface AddItemParams {
  product: {
    id: string;
    title?: string;
    name?: string;
    sku?: string;
    price: number | string;
    originalPrice?: number | string;
    origPrice?: number | string;
    imageUrl?: string;
    image?: string;
    stockQuantity?: number;
    isActive?: boolean;
    variants?: CartVariantInfo[];
  };
  variantId?: string;
  quantity?: number;
  store: {
    id: string;
    name: string;
    slug?: string;
    logoUrl?: string;
    policyReturn?: string;
    policyWarranty?: string;
    policyShipping?: string;
  };
  openCartAfterAdd?: boolean;
}

interface CartContextType {
  cart: CartItem[];
  selectedItemIds: string[];
  totalCount: number;
  selectedCount: number;
  selectedSubtotal: number;
  cartSubtotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  addItem: (params: AddItemParams) => void;
  updateQuantity: (cartItemId: string, newQuantity: number) => void;
  updateVariant: (cartItemId: string, newVariantId: string) => void;
  removeItem: (cartItemId: string) => void;
  removeItems: (cartItemIds: string[]) => void;
  toggleSelectItem: (cartItemId: string) => void;
  toggleSelectStore: (storeId: string, selectAll?: boolean) => void;
  toggleSelectAll: (selectAll?: boolean) => void;
  clearCart: () => void;
  groupedByStore: StoreCartGroup[];
  selectedItems: CartItem[];
  isCheckoutOpen: boolean;
  setIsCheckoutOpen: (open: boolean) => void;
  checkoutItems: CartItem[];
  startCheckout: (customItems?: CartItem[]) => void;
  editCheckoutCart: (items: CartItem[]) => void;
  continueShoppingFromCheckout: (items: CartItem[]) => void;
  closeCheckout: () => void;
  refreshCartStock: () => Promise<void>;
  isValidatingStock: boolean;
  isCartSyncing: boolean;
  cartSyncedAt: string | null;
}

const CART_STORAGE_KEY = 'scanms_cart_v1';
const SELECTED_STORAGE_KEY = 'scanms_cart_selected_v1';
const PENDING_CHECKOUT_KEY = 'scanms_pending_checkout';
const CART_OWNER_KEY = 'scanms_cart_owner';

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Initialize cart from LocalStorage
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback empty
    }
    return [];
  });

  // 2. Initialize selected items
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(SELECTED_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {
      // Fallback
    }
    return [];
  });

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [isValidatingStock, setIsValidatingStock] = useState(false);
  const [isCartSyncing, setIsCartSyncing] = useState(false);
  const [cartSyncedAt, setCartSyncedAt] = useState<string | null>(null);
  const [authVersion, setAuthVersion] = useState(0);
  const hydratedUserRef = useRef<string | null>(null);
  const skipNextPushRef = useRef(false);

  useEffect(() => {
    const onAuthChanged = () => setAuthVersion((value) => value + 1);
    window.addEventListener('scanms_auth_changed', onAuthChanged);
    window.addEventListener('storage', onAuthChanged);
    return () => {
      window.removeEventListener('scanms_auth_changed', onAuthChanged);
      window.removeEventListener('storage', onAuthChanged);
    };
  }, []);

  // Hydrate from PostgreSQL after sign-in and merge only a genuine guest cart.
  useEffect(() => {
    const user = authService.getCurrentUser();
    const token = localStorage.getItem('token');
    if (!token || !user?.id) {
      if (hydratedUserRef.current) {
        setCart([]);
        setSelectedItemIds([]);
        setCartSyncedAt(null);
        hydratedUserRef.current = null;
        localStorage.removeItem(CART_OWNER_KEY);
      }
      return;
    }
    if (hydratedUserRef.current === user.id) return;

    let active = true;
    setIsCartSyncing(true);
    customerService
      .getCart()
      .then(async (remote) => {
        if (!active) return;
        const previousOwner = localStorage.getItem(CART_OWNER_KEY);
        // Once a cart belongs to an account, PostgreSQL is authoritative on
        // subsequent sign-ins. Only an unowned guest cart may be merged.
        const localItems = previousOwner ? [] : cart;
        const merged = new Map<string, CartItem>();
        for (const item of remote.items || []) merged.set(item.cartItemId, item as CartItem);
        for (const item of localItems) {
          const existing = merged.get(item.cartItemId);
          merged.set(item.cartItemId, existing
            ? { ...existing, quantity: Math.min(Math.max(existing.quantity, item.quantity), existing.stockQuantity || 1) }
            : item);
        }
        const next = Array.from(merged.values());
        skipNextPushRef.current = true;
        setCart(next);
        setSelectedItemIds(next.filter((item) => item.isActive && item.stockQuantity > 0).map((item) => item.cartItemId));
        hydratedUserRef.current = user.id;
        localStorage.setItem(CART_OWNER_KEY, user.id);
        setCartSyncedAt(remote.syncedAt || new Date().toISOString());
        if (localItems.length > 0) {
          const synced = await customerService.syncCart(next.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
          })));
          if (active) setCartSyncedAt(synced.syncedAt || new Date().toISOString());
        }
      })
      .catch(() => {
        // Keep the local guest cart if the API is temporarily unavailable.
      })
      .finally(() => active && setIsCartSyncing(false));

    return () => { active = false; };
  }, [authVersion]);

  // Persist every signed-in cart mutation to the centralized cart table.
  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user?.id || hydratedUserRef.current !== user.id) return;
    if (skipNextPushRef.current) {
      skipNextPushRef.current = false;
      return;
    }
    const timer = window.setTimeout(() => {
      setIsCartSyncing(true);
      customerService
        .syncCart(cart.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })))
        .then((result) => setCartSyncedAt(result.syncedAt || new Date().toISOString()))
        .catch(() => toast.error('Chưa thể đồng bộ giỏ hàng. Hệ thống sẽ thử lại khi bạn thao tác tiếp.'))
        .finally(() => setIsCartSyncing(false));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [cart]);

  // Sync cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (err) {
      console.error('Failed to save cart to localStorage', err);
    }
  }, [cart]);

  // Sync selectedItemIds to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SELECTED_STORAGE_KEY, JSON.stringify(selectedItemIds));
    } catch (err) {
      console.error('Failed to save selectedItemIds to localStorage', err);
    }
  }, [selectedItemIds]);

  // Ensure selectedItemIds only contains items currently in cart
  useEffect(() => {
    const existingIds = new Set(cart.map((i) => i.cartItemId));
    setSelectedItemIds((prev) => {
      const filtered = prev.filter((id) => existingIds.has(id));
      // If user had no selection but cart has items, select all in-stock items by default
      if (filtered.length === 0 && cart.length > 0 && prev.length === 0) {
        return cart.filter((i) => i.isActive && i.stockQuantity > 0).map((i) => i.cartItemId);
      }
      return filtered;
    });
  }, [cart]);

  // Auto-resume checkout after login if pending
  useEffect(() => {
    const checkPendingCheckout = () => {
      const pendingRaw = localStorage.getItem(PENDING_CHECKOUT_KEY);
      const token = localStorage.getItem('token');
      const user = authService.getCurrentUser();

      if (token && user && pendingRaw) {
        try {
          const pending = JSON.parse(pendingRaw);
          localStorage.removeItem(PENDING_CHECKOUT_KEY);

          if (Array.isArray(pending.itemIds) && pending.itemIds.length > 0) {
            setSelectedItemIds(pending.itemIds);
            const toCheckout = cart.filter((i) => pending.itemIds.includes(i.cartItemId) && i.stockQuantity > 0);
            if (toCheckout.length > 0) {
              setCheckoutItems(toCheckout);
              setIsCheckoutOpen(true);
              toast.info('Chào mừng trở lại! Đã khôi phục các món trong giỏ hàng để bạn tiếp tục đặt mua.');
            }
          }
        } catch {
          localStorage.removeItem(PENDING_CHECKOUT_KEY);
        }
      }
    };

    checkPendingCheckout();
  }, [cart]);

  // Total quantity count of all items
  const totalCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // Total subtotal of all items
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  // Selected items list
  const selectedItems = useMemo(() => {
    const set = new Set(selectedItemIds);
    return cart.filter((item) => set.has(item.cartItemId));
  }, [cart, selectedItemIds]);

  // Selected count
  const selectedCount = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [selectedItems]);

  // Selected subtotal
  const selectedSubtotal = useMemo(() => {
    return selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [selectedItems]);

  // Group cart items by store
  const groupedByStore = useMemo<StoreCartGroup[]>(() => {
    const map = new Map<string, StoreCartGroup>();

    for (const item of cart) {
      const storeId = item.store.id || 'default_store';
      let group = map.get(storeId);
      if (!group) {
        group = {
          storeId,
          storeName: item.store.name || 'Gian Hàng Đối Tác',
          storeSlug: item.store.slug,
          storeLogoUrl: item.store.logoUrl,
          items: [],
          subtotal: 0,
          selectedSubtotal: 0,
          allSelected: false,
          someSelected: false,
          hasOutOfStock: false,
        };
        map.set(storeId, group);
      }
      group.items.push(item);
      group.subtotal += item.price * item.quantity;
      if (selectedItemIds.includes(item.cartItemId)) {
        group.selectedSubtotal += item.price * item.quantity;
      }
      if (!item.isActive || item.stockQuantity <= 0) {
        group.hasOutOfStock = true;
      }
    }

    // Determine allSelected & someSelected for each group
    for (const group of map.values()) {
      const selectableItems = group.items.filter((i) => i.isActive && i.stockQuantity > 0);
      if (selectableItems.length === 0) {
        group.allSelected = false;
        group.someSelected = false;
      } else {
        const selectedCountInGroup = selectableItems.filter((i) => selectedItemIds.includes(i.cartItemId)).length;
        group.allSelected = selectedCountInGroup === selectableItems.length;
        group.someSelected = selectedCountInGroup > 0 && selectedCountInGroup < selectableItems.length;
      }
    }

    return Array.from(map.values());
  }, [cart, selectedItemIds]);

  // Open & Close
  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);

  // Add Item to Cart
  const addItem = useCallback(
    ({ product, variantId, quantity = 1, store, openCartAfterAdd = true }: AddItemParams) => {
      const prodTitle = product.title || product.name || 'Sản phẩm';
      const prodImage = product.imageUrl || product.image || '/assets/marketplace/scanms-placeholder.png';
      const availableVariants = product.variants || [];

      // Find variant if specified
      let matchedVariant: CartVariantInfo | undefined;
      let finalPrice = Number(product.price || 0);
      let finalSku = product.sku || '';
      let availableStock = Number(product.stockQuantity || 0);

      if (variantId && availableVariants.length > 0) {
        matchedVariant = availableVariants.find((v) => v.id === variantId);
        if (matchedVariant) {
          if (matchedVariant.price !== null && matchedVariant.price !== undefined) {
            finalPrice = Number(matchedVariant.price);
          }
          finalSku = matchedVariant.sku || finalSku;
          availableStock = Number(matchedVariant.stockQuantity || 0);
        }
      } else if (availableVariants.length > 0) {
        // If product has variants but none selected, select the first in-stock variant
        matchedVariant = availableVariants.find((v) => v.stockQuantity > 0) || availableVariants[0];
        if (matchedVariant) {
          variantId = matchedVariant.id;
          if (matchedVariant.price !== null && matchedVariant.price !== undefined) {
            finalPrice = Number(matchedVariant.price);
          }
          finalSku = matchedVariant.sku || finalSku;
          availableStock = Number(matchedVariant.stockQuantity || 0);
        }
      }

      if (availableStock <= 0) {
        toast.error(`Sản phẩm "${prodTitle}" hiện đã hết hàng.`);
        return;
      }

      // Unique cart item identifier (Requirement 1: product + variant)
      const cartItemId = `${product.id}_${variantId || 'base'}`;

      setCart((prev) => {
        const existingIndex = prev.findIndex((item) => item.cartItemId === cartItemId);
        if (existingIndex >= 0) {
          const existing = prev[existingIndex];
          const newQty = Math.min(existing.quantity + quantity, availableStock);
          const next = [...prev];
          next[existingIndex] = {
            ...existing,
            quantity: newQty,
            stockQuantity: availableStock,
            price: finalPrice,
          };
          return next;
        }

        // Add new item
        const newItem: CartItem = {
          cartItemId,
          productId: product.id,
          variantId,
          variantName: matchedVariant?.name,
          title: prodTitle,
          sku: finalSku,
          price: finalPrice,
          originalPrice: product.originalPrice ? Number(product.originalPrice) : (product.origPrice ? Number(product.origPrice) : undefined),
          imageUrl: prodImage,
          quantity: Math.min(quantity, availableStock),
          stockQuantity: availableStock,
          isActive: product.isActive !== false,
          store: {
            id: store.id,
            name: store.name,
            slug: store.slug,
            logoUrl: store.logoUrl,
            policyReturn: store.policyReturn,
            policyWarranty: store.policyWarranty,
            policyShipping: store.policyShipping,
          },
          availableVariants,
        };

        return [...prev, newItem];
      });

      // Auto-select this item for checkout
      setSelectedItemIds((prev) => (prev.includes(cartItemId) ? prev : [...prev, cartItemId]));

      toast.success(
        `Đã thêm ${quantity > 1 ? `x${quantity} ` : ''}"${prodTitle}${matchedVariant ? ` (${matchedVariant.name})` : ''}" vào giỏ hàng!`,
      );

      if (openCartAfterAdd) {
        setIsCartOpen(true);
      }
    },
    [],
  );

  // Update quantity with stock ceiling
  const updateQuantity = useCallback((cartItemId: string, newQuantity: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.cartItemId === cartItemId) {
            if (newQuantity <= 0) return null;
            const clamped = Math.min(newQuantity, item.stockQuantity || 9999);
            if (clamped < newQuantity) {
              toast.warning(`Số lượng tối đa trong kho là ${item.stockQuantity}.`);
            }
            return { ...item, quantity: Math.max(1, clamped) };
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  }, []);

  // Update variant directly inside cart (Requirement 3)
  const updateVariant = useCallback((cartItemId: string, newVariantId: string) => {
    setCart((prev) => {
      const currentItem = prev.find((i) => i.cartItemId === cartItemId);
      if (!currentItem || !currentItem.availableVariants) return prev;

      const newVar = currentItem.availableVariants.find((v) => v.id === newVariantId);
      if (!newVar) return prev;

      const newCartItemId = `${currentItem.productId}_${newVariantId}`;

      // Check if target variant already in cart
      const existingOther = prev.find((i) => i.cartItemId === newCartItemId);
      if (existingOther) {
        // Merge quantities
        const mergedQty = Math.min(existingOther.quantity + currentItem.quantity, newVar.stockQuantity);
        return prev
          .filter((i) => i.cartItemId !== cartItemId)
          .map((i) => (i.cartItemId === newCartItemId ? { ...i, quantity: mergedQty } : i));
      }

      // Replace variant on current line
      return prev.map((item) => {
        if (item.cartItemId === cartItemId) {
          return {
            ...item,
            cartItemId: newCartItemId,
            variantId: newVar.id,
            variantName: newVar.name,
            sku: newVar.sku,
            price: newVar.price !== null && newVar.price !== undefined ? Number(newVar.price) : item.price,
            stockQuantity: newVar.stockQuantity,
            quantity: Math.min(item.quantity, newVar.stockQuantity),
          };
        }
        return item;
      });
    });

    // Update selection key
    setSelectedItemIds((prev) => {
      if (!prev.includes(cartItemId)) return prev;
      const currentItem = cart.find((i) => i.cartItemId === cartItemId);
      const newKey = `${currentItem?.productId}_${newVariantId}`;
      return prev.map((k) => (k === cartItemId ? newKey : k));
    });
  }, [cart]);

  // Remove single item
  const removeItem = useCallback((cartItemId: string) => {
    setCart((prev) => prev.filter((i) => i.cartItemId !== cartItemId));
    setSelectedItemIds((prev) => prev.filter((id) => id !== cartItemId));
    toast.info('Đã xóa sản phẩm khỏi giỏ hàng.');
  }, []);

  // Remove multiple items (Requirement 10: only remove placed items)
  const removeItems = useCallback((cartItemIds: string[]) => {
    const set = new Set(cartItemIds);
    setCart((prev) => prev.filter((i) => !set.has(i.cartItemId)));
    setSelectedItemIds((prev) => prev.filter((id) => !set.has(id)));
  }, []);

  // Toggle selection for 1 item
  const toggleSelectItem = useCallback((cartItemId: string) => {
    setSelectedItemIds((prev) => {
      if (prev.includes(cartItemId)) {
        return prev.filter((id) => id !== cartItemId);
      } else {
        return [...prev, cartItemId];
      }
    });
  }, []);

  // Toggle selection for all items in a store
  const toggleSelectStore = useCallback((storeId: string, forceSelect?: boolean) => {
    setCart((currentCart) => {
      const storeItems = currentCart.filter(
        (i) => i.store.id === storeId && i.isActive && i.stockQuantity > 0,
      );
      const storeItemIds = storeItems.map((i) => i.cartItemId);

      setSelectedItemIds((prev) => {
        const allCurrentlySelected = storeItemIds.every((id) => prev.includes(id));
        const shouldSelect = forceSelect !== undefined ? forceSelect : !allCurrentlySelected;

        if (shouldSelect) {
          const next = new Set([...prev, ...storeItemIds]);
          return Array.from(next);
        } else {
          return prev.filter((id) => !storeItemIds.includes(id));
        }
      });

      return currentCart;
    });
  }, []);

  // Toggle select all across the entire cart
  const toggleSelectAll = useCallback((forceSelect?: boolean) => {
    setCart((currentCart) => {
      const selectableIds = currentCart
        .filter((i) => i.isActive && i.stockQuantity > 0)
        .map((i) => i.cartItemId);

      setSelectedItemIds((prev) => {
        const allSelected = selectableIds.length > 0 && selectableIds.every((id) => prev.includes(id));
        const shouldSelect = forceSelect !== undefined ? forceSelect : !allSelected;

        if (shouldSelect) {
          return selectableIds;
        } else {
          return [];
        }
      });

      return currentCart;
    });
  }, []);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedItemIds([]);
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(SELECTED_STORAGE_KEY);
  }, []);

  // Start checkout flow (Requirement 4 & 5)
  const startCheckout = useCallback(
    (customItems?: CartItem[]) => {
      const itemsToCheckout = customItems || selectedItems;

      if (!itemsToCheckout || itemsToCheckout.length === 0) {
        toast.warning('Vui lòng chọn ít nhất 1 sản phẩm để tiến hành đặt hàng.');
        return;
      }

      // Check login status
      const token = localStorage.getItem('token');
      const currentUser = authService.getCurrentUser();

      if (!token || !currentUser) {
        // Guest user: save state and redirect to login
        const itemIds = itemsToCheckout.map((i) => i.cartItemId);
        localStorage.setItem(
          PENDING_CHECKOUT_KEY,
          JSON.stringify({ itemIds, time: Date.now() }),
        );

        toast.info('Vui lòng đăng nhập hoặc tạo tài khoản để hoàn tất đơn hàng!');
        const redirectUrl = encodeURIComponent(
          window.location.pathname + window.location.search,
        );
        window.location.href = `/login?redirect=${redirectUrl}`;
        return;
      }

      // User logged in: open checkout modal with selected items
      setCheckoutItems(itemsToCheckout);
      setIsCartOpen(false);
      setIsCheckoutOpen(true);
    },
    [selectedItems],
  );

  // Preserve direct-buy items in the shared cart without doubling an existing variant.
  const stageCheckoutItems = useCallback((items: CartItem[]) => {
    setCart((prev) => {
      const next = [...prev];
      for (const item of items) {
        const existingIndex = next.findIndex((entry) => entry.cartItemId === item.cartItemId);
        if (existingIndex < 0) {
          next.push(item);
        } else if (next[existingIndex].quantity < item.quantity) {
          next[existingIndex] = { ...next[existingIndex], quantity: item.quantity };
        }
      }
      return next;
    });
    setSelectedItemIds((prev) => Array.from(new Set([
      ...prev,
      ...items.map((item) => item.cartItemId),
    ])));
    setCheckoutItems([]);
    setIsCheckoutOpen(false);
  }, []);

  const editCheckoutCart = useCallback((items: CartItem[]) => {
    stageCheckoutItems(items);
    setIsCartOpen(true);
  }, [stageCheckoutItems]);

  const continueShoppingFromCheckout = useCallback((items: CartItem[]) => {
    stageCheckoutItems(items);
    setIsCartOpen(false);
  }, [stageCheckoutItems]);

  const closeCheckout = useCallback(() => {
    setIsCheckoutOpen(false);
    setCheckoutItems([]);
  }, []);

  // Real-time stock & price validation (Requirement 6)
  const refreshCartStock = useCallback(async () => {
    if (cart.length === 0) return;
    setIsValidatingStock(true);
    try {
      const res: any = await api.post('/orders/validate-cart', {
        items: cart.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
          clientPrice: i.price,
        })),
      });

      const data = res?.data || res;
      if (data?.items && Array.isArray(data.items)) {
        setCart((prev) => {
          return prev.map((localItem) => {
            const serverMatch = data.items.find(
              (s: any) =>
                s.productId === localItem.productId &&
                (s.variantId ? s.variantId === localItem.variantId : true),
            );
            if (!serverMatch) return localItem;
            return {
              ...localItem,
              price: serverMatch.currentPrice !== undefined ? serverMatch.currentPrice : localItem.price,
              stockQuantity: serverMatch.stockQuantity !== undefined ? serverMatch.stockQuantity : localItem.stockQuantity,
              isActive: serverMatch.isActive !== false && !serverMatch.outOfStock,
              quantity: Math.min(localItem.quantity, serverMatch.stockQuantity || 1),
            };
          });
        });

        if (data.warnings && data.warnings.length > 0) {
          toast.warning(data.warnings[0]);
        }
      }
    } catch {
      // Backend validation silent fallback
    } finally {
      setIsValidatingStock(false);
    }
  }, [cart]);

  const value = useMemo(
    () => ({
      cart,
      selectedItemIds,
      totalCount,
      selectedCount,
      selectedSubtotal,
      cartSubtotal,
      isCartOpen,
      setIsCartOpen,
      openCart,
      closeCart,
      addItem,
      updateQuantity,
      updateVariant,
      removeItem,
      removeItems,
      toggleSelectItem,
      toggleSelectStore,
      toggleSelectAll,
      clearCart,
      groupedByStore,
      selectedItems,
      isCheckoutOpen,
      setIsCheckoutOpen,
      checkoutItems,
      startCheckout,
      editCheckoutCart,
      continueShoppingFromCheckout,
      closeCheckout,
      refreshCartStock,
      isValidatingStock,
      isCartSyncing,
      cartSyncedAt,
    }),
    [
      cart,
      selectedItemIds,
      totalCount,
      selectedCount,
      selectedSubtotal,
      cartSubtotal,
      isCartOpen,
      openCart,
      closeCart,
      addItem,
      updateQuantity,
      updateVariant,
      removeItem,
      removeItems,
      toggleSelectItem,
      toggleSelectStore,
      toggleSelectAll,
      clearCart,
      groupedByStore,
      selectedItems,
      isCheckoutOpen,
      checkoutItems,
      startCheckout,
      editCheckoutCart,
      continueShoppingFromCheckout,
      closeCheckout,
      refreshCartStock,
      isValidatingStock,
      isCartSyncing,
      cartSyncedAt,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
