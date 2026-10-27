import type { CartItem } from '../../context/CartContext';

export interface ProductVariantItem {
  id: string;
  productId?: string;
  name: string;
  sku: string;
  price?: number | string | null;
  stockQuantity: number;
  isActive?: boolean;
}

export interface CheckoutProductItem {
  id: string;
  title: string;
  sku?: string;
  price: number | string;
  originalPrice?: number | string;
  imageUrl?: string;
  stockQuantity: number;
  variants?: ProductVariantItem[];
}

export interface CheckoutStoreInfo {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string;
  policyReturn?: string;
  policyWarranty?: string;
  policyShipping?: string;
}

export interface GuestCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: CheckoutProductItem;
  store?: CheckoutStoreInfo;
  checkoutItems?: CartItem[];
  initialQuantity?: number;
  initialCouponCode?: string;
  initialShippingCouponCode?: string;
  initialExtraVoucher?: { code: string; benefitType: 'GOODS' | 'SHIPPING' };
  initialVariantId?: string;
  initialLiveSessionId?: string;
  onOrderPlaced?: (orderData: any) => void;
  onPaymentConfirmed?: (orderData: any) => void;
}
