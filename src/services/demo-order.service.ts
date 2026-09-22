export interface DemoOrderItem {
  id: string;
  productId: string;
  productTitle: string;
  sku: string;
  imageUrl: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface DemoBuyerOrder {
  id: string;
  externalOrderSn: string;
  customerName: string;
  customerPhone: string;
  shippingAddress: string;
  subtotalAmount: number;
  discountAmount: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  status: 'PENDING' | 'SHIPPING' | 'DELIVERED' | 'COMPLETED';
  statusLabel: string;
  statusColor: string;
  timelineStep: number;
  createdAt: string;
  updatedAt: string;
  store: { id: string; name: string; slug: string };
  items: DemoOrderItem[];
  reviews: unknown[];
}

const STORAGE_KEY = 'scanms-frontend-demo-orders';

function readOrders(): DemoBuyerOrder[] {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export const demoOrderService = {
  list() {
    return readOrders();
  },

  create(input: {
    customerName: string;
    customerPhone: string;
    shippingAddress: string;
    paymentMethod: string;
    store: { id: string; name: string; slug?: string };
    product: { id: string; title: string; sku?: string; imageUrl?: string };
    quantity: number;
    unitPrice: number;
    discountAmount: number;
  }) {
    const now = new Date().toISOString();
    const id = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `demo-${Date.now()}`;
    const publicOrderCode = `FE${Date.now().toString().slice(-9)}`;
    const subtotal = input.unitPrice * input.quantity;
    const order: DemoBuyerOrder = {
      id,
      externalOrderSn: publicOrderCode,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      shippingAddress: input.shippingAddress,
      subtotalAmount: subtotal,
      discountAmount: input.discountAmount,
      finalAmount: Math.max(0, subtotal - input.discountAmount),
      paymentMethod: input.paymentMethod,
      paymentStatus: 'WAITING_PAYMENT',
      status: 'PENDING',
      statusLabel: 'Đã tiếp nhận đơn',
      statusColor: '#B88E4F',
      timelineStep: 1,
      createdAt: now,
      updatedAt: now,
      store: {
        id: input.store.id,
        name: input.store.name,
        slug: input.store.slug || 'frontend-demo-store',
      },
      items: [
        {
          id: `${id}-item`,
          productId: input.product.id,
          productTitle: input.product.title,
          sku: input.product.sku || 'DEMO-SKU',
          imageUrl: input.product.imageUrl || '/assets/product-placeholder.svg',
          quantity: input.quantity,
          unitPrice: input.unitPrice,
          totalPrice: subtotal,
        },
      ],
      reviews: [],
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify([order, ...readOrders()]));
    return order;
  },

  search(phone?: string, orderSn?: string) {
    const normalizedPhone = phone?.trim();
    const normalizedOrderSn = orderSn?.trim().toLowerCase();
    return readOrders().filter((order) => {
      if (normalizedPhone && order.customerPhone !== normalizedPhone) return false;
      if (normalizedOrderSn && order.externalOrderSn.toLowerCase() !== normalizedOrderSn) return false;
      return true;
    });
  },
};
