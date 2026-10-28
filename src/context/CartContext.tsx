import React, { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { toast } from '../utils/toast';
import { authService } from '../services/auth.service';
import api from '../services/api';
import { checkoutService } from '../services/checkout.service';
import { getSafeProductImageUrl } from '@/utils/marketplace.utils';
import { customerService, type CartSessionRequest } from '../services/customer.service';
import { mergeCartItems } from '@/utils/cart-merge.utils';
import { normalizeOrderVariantId } from '@/utils/order-variant.utils';
import type {
  CartVariantInfo,
  CartItem,
  StoreCartGroup,
  AddItemParams,
  CartContextType,
} from '@/types/cart.types';
import {
  getCartStorageKey,
  getSelectedStorageKey,
  PENDING_CHECKOUT_KEY,
  CART_OWNER_KEY,
  loadCartFromStorage,
  loadSelectedFromStorage,
} from '@/utils/cart-storage.utils';

export type {
  CartVariantInfo,
  CartItem,
  StoreCartGroup,
  AddItemParams,
  CartContextType,
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const getInitialUserId = () => localStorage.getItem('token') ? authService.getCurrentUser()?.id || null : null;
  const [activeUserId, setActiveUserId] = useState<string | null>(getInitialUserId);

  // 1. Initialize user-scoped cart from LocalStorage
  const [cart, setCart] = useState<CartItem[]>(() => loadCartFromStorage(getInitialUserId()));

  // 2. Initialize selected items for active user
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>(() => loadSelectedFromStorage(getInitialUserId()));

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [checkoutItems, setCheckoutItems] = useState<CartItem[]>([]);
  const [checkoutCouponCode, setCheckoutCouponCode] = useState<string>('');
  const [isValidatingStock, setIsValidatingStock] = useState(false);
  const [isCartSyncing, setIsCartSyncing] = useState(false);
  const [cartSyncedAt, setCartSyncedAt] = useState<string | null>(null);
  const hydratedUserRef = useRef<string | null>(null);
  const skipNextPushRef = useRef(false);
  const cartRef = useRef(cart);
  const selectedRef = useRef(selectedItemIds);
  const userIdRef = useRef(activeUserId);
  const loadingUserRef = useRef<string | null>(null);
  const authRevisionRef = useRef(0);
  const sessionRef = useRef<CartSessionRequest | null>(null);
  cartRef.current = cart;
  selectedRef.current = selectedItemIds;

  useEffect(() => {
    let mounted = true;
    let sessionController: AbortController | null = null;
    const syncIdentity = () => {
      const user = authService.getCurrentUser();
      const token = localStorage.getItem('token');
      const nextId = token && user?.id ? user.id : null;
      const previousId = userIdRef.current;
      if (nextId === previousId && (!nextId || token === sessionRef.current?.token) &&
          (hydratedUserRef.current === nextId || loadingUserRef.current === nextId)) return;
      // Cancel work for the previous session before loading another owner's basket.
      sessionController?.abort();
      sessionController = new AbortController();
      const session = nextId && token ? { token, signal: sessionController.signal } : null;
      sessionRef.current = session;
      const revision = ++authRevisionRef.current;
      const isCurrent = () => mounted && userIdRef.current === nextId && authRevisionRef.current === revision &&
        localStorage.getItem('token') === token && !session?.signal.aborted;

      if (previousId !== nextId) {
        skipNextPushRef.current = false;
        setIsCartOpen(false);
        setIsValidatingStock(false);
        if (previousId) {
          setIsCheckoutOpen(false);
          setCheckoutItems([]);
          setCheckoutCouponCode('');
          localStorage.removeItem(PENDING_CHECKOUT_KEY);
        }
      }

      // Capture the guest basket before changing ownership; both auth events can fire together.
      const guest = !previousId && nextId ? cartRef.current : [];
      const guestSelection = !previousId && nextId ? selectedRef.current : [];
      const accountCache = loadCartFromStorage(nextId);
      const accountSelection = loadSelectedFromStorage(nextId);
      const staged = mergeCartItems(accountCache, guest, true);
      userIdRef.current = nextId;
      cartRef.current = staged;
      const selection = [...new Set([...accountSelection, ...guestSelection])];
      if (nextId && guest.length) {
        try {
          localStorage.setItem(getCartStorageKey(nextId), JSON.stringify(staged));
          localStorage.setItem(getSelectedStorageKey(nextId), JSON.stringify(selection));
          localStorage.removeItem(getCartStorageKey(null));
          localStorage.removeItem(getSelectedStorageKey(null));
        } catch {
          // Keep the in-memory basket and guest recovery copy if storage is full.
        }
      }
      selectedRef.current = selection;
      setActiveUserId(nextId);
      setCart(staged);
      setSelectedItemIds(selection);
      hydratedUserRef.current = null;
      loadingUserRef.current = nextId;
      setCartSyncedAt(null);
      if (!nextId || !session) {
        setIsCartSyncing(false);
        return;
      }

      setIsCartSyncing(true);
      void customerService.getCart(session).then(async (remote) => {
        if (!isCurrent()) return;
        const account = mergeCartItems(remote.items || [], accountCache);
        const combined = mergeCartItems(account, guest, true);
        const next = mergeCartItems(combined, cartRef.current);
        // Persist the server-reconciled basket without remounting the checkout form.
        localStorage.setItem(getCartStorageKey(nextId), JSON.stringify(next));
        cartRef.current = next;
        skipNextPushRef.current = true;
        setCart(next);
        setSelectedItemIds((previous) => {
          const selected = new Set(previous);
          for (const item of remote.items || []) {
            if (!accountCache.some((cached) => cached.cartItemId === item.cartItemId) && item.isActive && item.stockQuantity > 0) selected.add(item.cartItemId);
          }
          return [...selected].filter((id) => next.some((item) => item.cartItemId === id));
        });
        hydratedUserRef.current = nextId;
        localStorage.setItem(CART_OWNER_KEY, nextId);
        setCartSyncedAt(remote.syncedAt || new Date().toISOString());
        if (guest.length || accountCache.length) {
          const synced = await customerService.syncCart(next.map((item) => ({
            productId: item.productId, variantId: normalizeOrderVariantId(item.variantId), quantity: item.quantity,
          })), session);
          if (isCurrent()) setCartSyncedAt(synced.syncedAt || new Date().toISOString());
        }
      }).catch(() => {
        // The staged account copy remains available offline; retry on the next auth/focus event.
        if (isCurrent()) hydratedUserRef.current = null;
      }).finally(() => {
        if (isCurrent()) {
          loadingUserRef.current = null;
          setIsCartSyncing(false);
        }
      });
    };
    syncIdentity();
    window.addEventListener('scanms_auth_changed', syncIdentity);
    window.addEventListener('auth-user-updated', syncIdentity);
    window.addEventListener('storage', syncIdentity);
    window.addEventListener('focus', syncIdentity);
    return () => {
      mounted = false;
      sessionController?.abort();
      authRevisionRef.current += 1;
      loadingUserRef.current = null;
      window.removeEventListener('scanms_auth_changed', syncIdentity);
      window.removeEventListener('auth-user-updated', syncIdentity);
      window.removeEventListener('storage', syncIdentity);
      window.removeEventListener('focus', syncIdentity);
    };
  }, []);

  useEffect(() => {
    if (!activeUserId || hydratedUserRef.current !== activeUserId) return;
    const session = sessionRef.current;
    if (!session || session.signal.aborted) return;
    if (skipNextPushRef.current) {
      skipNextPushRef.current = false;
      return;
    }
    const userId = activeUserId;
    const isCurrent = () => userIdRef.current === userId && sessionRef.current === session &&
      !session.signal.aborted && localStorage.getItem('token') === session.token;
    const timer = window.setTimeout(() => {
      if (!isCurrent()) return;
      setIsCartSyncing(true);
      customerService.syncCart(cart.map((item) => ({
        productId: item.productId, variantId: normalizeOrderVariantId(item.variantId), quantity: item.quantity,
      })), session)
        .then((result) => { if (isCurrent()) setCartSyncedAt(result.syncedAt || new Date().toISOString()); })
        .catch(() => { if (isCurrent()) toast.error('Chưa thể đồng bộ giỏ hàng. Sản phẩm vẫn được giữ trên thiết bị.'); })
        .finally(() => { if (isCurrent()) setIsCartSyncing(false); });
    }, 250);
    return () => window.clearTimeout(timer);
  }, [cart, activeUserId]);

  // Sync cart to active user's localStorage
  useEffect(() => {
    if (activeUserId !== userIdRef.current) return;
    try {
      const key = getCartStorageKey(activeUserId);
      localStorage.setItem(key, JSON.stringify(cart));
    } catch (err) {
      console.error('Failed to save cart to localStorage', err);
    }
  }, [cart, activeUserId]);

  // Sync selectedItemIds to active user's localStorage
  useEffect(() => {
    if (activeUserId !== userIdRef.current) return;
    try {
      const key = getSelectedStorageKey(activeUserId);
      localStorage.setItem(key, JSON.stringify(selectedItemIds));
    } catch (err) {
      console.error('Failed to save selectedItemIds to localStorage', err);
    }
  }, [selectedItemIds, activeUserId]);

  // A cart item stores a product photo snapshot. Refresh legacy photo URLs so
  // an image corrected in the catalogue is also corrected in an existing cart.
  useEffect(() => {
    let cancelled = false;
    const staleProductIds = Array.from(new Set(
      cart
        .filter(({ imageUrl }) =>
          imageUrl.includes('/scanms/products/') ||
          (imageUrl.startsWith('/assets/products/') && !imageUrl.startsWith('/assets/products/real/')),
        )
        .map(({ productId }) => productId)
        .filter(Boolean),
    ));

    if (staleProductIds.length === 0) return;

    const refreshImages = async () => {
      const imageByProductId = new Map<string, string>();
      await Promise.all(staleProductIds.map(async (productId) => {
        try {
          const response: any = await api.get(
            `/public/products/${encodeURIComponent(productId)}/landing`,
            { headers: { 'x-skip-cache': 'true' } },
          );
          const payload = response?.product
            ? response
            : response?.data?.product
              ? response.data
              : response?.data?.data || response?.data || response;
          const imageUrl = payload?.images?.[0] || payload?.product?.imageUrl;
          if (typeof imageUrl === 'string' && imageUrl.trim()) {
            imageByProductId.set(productId, imageUrl.trim());
          }
        } catch {
          // Keep the saved cart usable if the catalogue is temporarily offline.
        }
      }));

      if (cancelled || imageByProductId.size === 0) return;
      const refreshItem = (item: CartItem): CartItem => {
        const imageUrl = imageByProductId.get(item.productId);
        return imageUrl
          ? { ...item, imageUrl: getSafeProductImageUrl(imageUrl, item.title, item.variantName) }
          : item;
      };
      setCart((previous) => previous.map(refreshItem));
      setCheckoutItems((previous) => previous.map(refreshItem));
    };

    void refreshImages();
    return () => {
      cancelled = true;
    };
  }, [cart, activeUserId]);

  // Ensure selectedItemIds only contains items currently in cart
  useEffect(() => {
    setSelectedItemIds((prev) => {
      // A previous render's effect can run after another account has hydrated.
      const existingIds = new Set(cartRef.current.map((i) => i.cartItemId));
      const filtered = prev.filter((id) => existingIds.has(id));
      return filtered.length === prev.length ? prev : filtered;
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
          if (isCheckoutOpen) {
            localStorage.removeItem(PENDING_CHECKOUT_KEY);
            return;
          }

          if (Array.isArray(pending.itemIds) && pending.itemIds.length > 0) {
            const toCheckout = cart.filter((i) => pending.itemIds.includes(i.cartItemId) && i.stockQuantity > 0);
            if (toCheckout.length > 0) {
              localStorage.removeItem(PENDING_CHECKOUT_KEY);
              setSelectedItemIds(pending.itemIds);
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
  }, [cart, isCheckoutOpen]);

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
    ({ product, variantId, quantity = 1, store, openCartAfterAdd = true, liveSessionId, liveCouponCode, liveCouponCodes }: AddItemParams) => {
      const prodTitle = product.title || product.name || 'Sản phẩm';
      const prodImage = getSafeProductImageUrl(product.imageUrl || product.image, prodTitle);
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
      const cartItemId = `${product.id}_${variantId || 'base'}${liveSessionId ? `_live_${liveSessionId}` : ''}`;

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
            liveSessionId,
            liveCouponCode,
            liveCouponCodes,
          };
          return next;
        }

        // Add new item
        const newItem: CartItem = {
          liveCouponCodes,
          liveSessionId,
          liveCouponCode,
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

      const newCartItemId = `${currentItem.productId}_${newVariantId}${currentItem.liveSessionId ? `_live_${currentItem.liveSessionId}` : ''}`;

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
      const newKey = `${currentItem?.productId}_${newVariantId}${currentItem?.liveSessionId ? `_live_${currentItem.liveSessionId}` : ''}`;
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
    const storeItemIds = cart
      .filter((item) => item.store.id === storeId && item.isActive && item.stockQuantity > 0)
      .map((item) => item.cartItemId);
    setSelectedItemIds((prev) => {
      const allCurrentlySelected = storeItemIds.length > 0 && storeItemIds.every((id) => prev.includes(id));
      const shouldSelect = forceSelect !== undefined ? forceSelect : !allCurrentlySelected;
      return shouldSelect ? Array.from(new Set([...prev, ...storeItemIds])) : prev.filter((id) => !storeItemIds.includes(id));
    });
  }, [cart]);

  // Toggle select all across the entire cart
  const toggleSelectAll = useCallback((forceSelect?: boolean) => {
    const selectableIds = cart
      .filter((item) => item.isActive && item.stockQuantity > 0)
      .map((item) => item.cartItemId);
    setSelectedItemIds((prev) => {
      const allSelected = selectableIds.length > 0 && selectableIds.every((id) => prev.includes(id));
      const shouldSelect = forceSelect !== undefined ? forceSelect : !allSelected;
      return shouldSelect ? selectableIds : [];
    });
  }, [cart]);

  // Clear entire cart
  const clearCart = useCallback(() => {
    setCart([]);
    setSelectedItemIds([]);
    try {
      localStorage.removeItem(getCartStorageKey(activeUserId));
      localStorage.removeItem(getSelectedStorageKey(activeUserId));
    } catch {}
  }, [activeUserId]);

  // Start checkout flow (Requirement 4 & 5)
  const startCheckout = useCallback(
    (customItems?: CartItem[], couponCode?: string) => {
      const itemsToCheckout = customItems && customItems.length > 0 ? customItems : selectedItems;
      if (new Set(itemsToCheckout.map(item => `${item.productId}_${item.variantId || 'base'}`)).size !== itemsToCheckout.length) {
        toast.warning('Bạn đang chọn cùng phân loại ở giỏ thường và giỏ live. Hãy chọn một nguồn mua cho phân loại này.');
        return;
      }

      if (!itemsToCheckout || itemsToCheckout.length === 0) {
        toast.warning('Vui lòng chọn ít nhất 1 sản phẩm để tiến hành đặt hàng.');
        return;
      }

      // Check login status: nếu chưa đăng nhập, lưu pending state nhưng không redirect mất giỏ hàng,
      // mà mở ngay CheckoutModal để khách đăng nhập tại chỗ qua Google/Email rồi thanh toán ngay!
      const token = localStorage.getItem('token');
      const currentUser = authService.getCurrentUser();

      if (!token || !currentUser) {
        const itemIds = itemsToCheckout.map((i) => i.cartItemId);
        localStorage.setItem(
          PENDING_CHECKOUT_KEY,
          JSON.stringify({ itemIds, time: Date.now() }),
        );
      }

      setCheckoutItems(itemsToCheckout);
      if (couponCode !== undefined) {
        setCheckoutCouponCode(couponCode);
      }
      setIsCartOpen(false);
      setIsCheckoutOpen(true);
    },
    [selectedItems],
  );

  // Mua ngay sản phẩm trực tiếp (Instant Buy): lập tức mở thanh toán cho sản phẩm được chọn mà không cần chờ chọn checkbox
  const buyNow = useCallback(
    (params: AddItemParams, couponCode?: string) => {
      const prodTitle = params.product.title || params.product.name || 'Sản phẩm';
      const prodImage = getSafeProductImageUrl(params.product.imageUrl || params.product.image, prodTitle);
      const availableVariants = params.product.variants || [];

      let matchedVariant: CartVariantInfo | undefined;
      let finalPrice = Number(params.product.price || 0);
      let finalSku = params.product.sku || '';
      let availableStock = Number(params.product.stockQuantity ?? 9999);

      let variantId = params.variantId;
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

      const cartItemId = `${params.product.id}_${variantId || 'base'}${params.liveSessionId ? `_live_${params.liveSessionId}` : ''}`;
      const qty = params.quantity || 1;

      const directItem: CartItem = {
        liveCouponCodes: params.liveCouponCodes,
        liveSessionId: params.liveSessionId,
        liveCouponCode: params.liveCouponCode,
        cartItemId,
        productId: params.product.id,
        variantId,
        variantName: matchedVariant?.name,
        title: prodTitle,
        sku: finalSku,
        price: finalPrice,
        originalPrice: params.product.originalPrice ? Number(params.product.originalPrice) : (params.product.origPrice ? Number(params.product.origPrice) : undefined),
        imageUrl: prodImage,
        quantity: Math.min(qty, availableStock),
        stockQuantity: availableStock,
        isActive: params.product.isActive !== false,
        store: {
          id: params.store.id,
          name: params.store.name,
          slug: params.store.slug,
          logoUrl: params.store.logoUrl,
          policyReturn: params.store.policyReturn,
          policyWarranty: params.store.policyWarranty,
          policyShipping: params.store.policyShipping,
        },
        availableVariants,
      };

      // Đồng thời thêm vào giỏ hàng
      setCart((prev) => {
        const existingIndex = prev.findIndex((item) => item.cartItemId === cartItemId);
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = { ...next[existingIndex], quantity: Math.min(next[existingIndex].quantity + qty, availableStock) };
          return next;
        }
        return [...prev, directItem];
      });
      setSelectedItemIds((prev) => (prev.includes(cartItemId) ? prev : [...prev, cartItemId]));

      // Kích hoạt ngay thanh toán với món hàng này
      startCheckout([directItem], couponCode);
    },
    [startCheckout],
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
    localStorage.removeItem(PENDING_CHECKOUT_KEY);
    setIsCheckoutOpen(false);
    setCheckoutItems([]);
    setCheckoutCouponCode('');
  }, []);

  // Real-time stock & price validation (Requirement 6)
  const refreshCartStock = useCallback(async () => {
    if (cart.length === 0) return;
    const revision = authRevisionRef.current;
    setIsValidatingStock(true);
    try {
      const res: any = await checkoutService.validateCart(cart.map((i) => ({
          productId: i.productId,
          variantId: normalizeOrderVariantId(i.variantId),
          quantity: i.quantity,
          clientPrice: i.price,
          liveSessionId: i.liveSessionId,
        })));

      if (authRevisionRef.current !== revision) return;

      const data = res?.data || res;
      if (data?.items && Array.isArray(data.items)) {
        setCart((prev) => {
          return prev.map((localItem) => {
            const serverMatch = data.items.find(
              (s: any) =>
                s.productId === localItem.productId &&
                s.liveSessionId === localItem.liveSessionId &&
                (s.variantId ? s.variantId === localItem.variantId : true),
            );
            if (!serverMatch) return localItem;
            return {
              ...localItem,
              price: serverMatch.currentPrice !== undefined ? serverMatch.currentPrice : localItem.price,
              listPrice: serverMatch.listPrice !== undefined ? serverMatch.listPrice : localItem.listPrice,
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
      if (authRevisionRef.current === revision) setIsValidatingStock(false);
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
      checkoutCouponCode,
      startCheckout,
      buyNow,
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
      checkoutCouponCode,
      startCheckout,
      buyNow,
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
