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
  liveSessionId?: string;
  liveCouponCode?: string;
  liveCouponCodes?: string[];
  variantId?: string;
  variantName?: string;
  title: string;
  sku: string;
  price: number;
  listPrice?: number;
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

export interface AddItemParams {
  liveSessionId?: string;
  liveCouponCode?: string;
  liveCouponCodes?: string[];
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

export interface CartContextType {
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
  checkoutCouponCode?: string;
  startCheckout: (customItems?: CartItem[], couponCode?: string) => void;
  buyNow: (params: AddItemParams, couponCode?: string) => void;
  editCheckoutCart: (items: CartItem[]) => void;
  continueShoppingFromCheckout: (items: CartItem[]) => void;
  closeCheckout: () => void;
  refreshCartStock: () => Promise<void>;
  isValidatingStock: boolean;
  isCartSyncing: boolean;
  cartSyncedAt: string | null;
}
