import api from "./api";
import { orderDisplayCode } from '../utils/order-display-code';

export type ManagedOrderStatus =
  "PENDING" | "SHIPPING" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "RETURN_REQUESTED" | "DISPUTED" | "RETURNED";

export interface StoreReturnRequest {
  id: string;
  reason: string;
  details: string | null;
  imageUrls: string[];
  unboxingVideoUrl: string;
  status: import('./return.service').ReturnStatus;
  deadlineAt: string;
  shipByAt?: string | null;
  returnAddress?: string | null;
  returnInstructions?: string | null;
  submittedAt: string;
  shopResponse: string | null;
  shopRespondedAt: string | null;
}

export interface ManualOrderItemInput {
  productId?: string;
  sku?: string;
  quantity: number;
  unitPrice?: number;
}

export interface ManualOrderInput {
  storeId?: string;
  externalOrderSn?: string;
  requestId?: string;
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: string;
  customer?: {
    name: string;
    phone: string;
    email?: string;
    address: string;
    province: string;
    district: string;
    ward?: string;
  };
  paymentMethod?: "COD" | "BANK_TRANSFER" | "E_WALLET";
  shippingFee?: number;
  discountCode?: string;
  note?: string;
  totalAmount?: number;
  status?: ManagedOrderStatus;
  discountAmount?: number;
  items: ManualOrderItemInput[];
}

export interface CreatedManualOrder {
  id: string;
  externalOrderSn: string;
  finalAmount: number | string;
  status: ManagedOrderStatus;
}

export interface ExcelImportError {
  row: number;
  orderCode?: string;
  field?: string;
  message: string;
}

export interface ExcelImportResult {
  message: string;
  summary: {
    totalRows: number;
    totalOrders: number;
    importedOrders: number;
    skippedOrders: number;
    errorRows: number;
  };
  importedOrders: Array<{
    orderCode: string;
    orderId: string;
    itemCount: number;
  }>;
  errors: ExcelImportError[];
}

export interface StoreOrderItem {
  productId: string;
  variantId?: string;
  variantName?: string;
  title: string;
  sku: string;
  imageUrl?: string;
  quantity: number;
  unitPrice: number;
  appliedCommissionRate: number;
  calculatedCommissionAmount: number;
}

export interface StoreOrderRecord {
  id: string;
  externalOrderSn: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  deliveredAt: string | null;
  status: ManagedOrderStatus;
  returnRequest?: StoreReturnRequest | null;
  returnRequests?: Array<{ returnRequestId: string; status: string; quantity: number }>;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  shippingAddress: string;
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  finalAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  trackingNumber: string | null;
  ghnEnvironment?: 'LIVE' | 'TEST' | null;
  carrierName: string | null;
  store?: { id: string; name: string; slug: string; logoUrl?: string };
  attributedCollaborator?: { id: string; fullName: string; email: string } | null;
  couponCode: string | null;
  totalCommission: number;
  items: StoreOrderItem[];
}

export interface StoreOrdersResponse {
  items: StoreOrderRecord[];
  returnRequestsError?: string;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const unwrapOrderResponse = (response: any) => response?.result ?? response?.data ?? response;
const amount = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

function mapSellerOrder(raw: any, order: any, checkout: any): StoreOrderRecord {
  const summary = checkout.sellerOrders?.find((seller: any) => seller.sellerOrderId === raw.sellerOrderId);
  if (!summary || !Array.isArray(summary.items)) throw new Error('Chưa tải được sản phẩm trong đơn hàng. Vui lòng thử lại.');
  const totals = summary.totalsSnapshot || raw.totalsSnapshot || {};
  const ship = order.shippingSnapshot || {};
  const items: StoreOrderItem[] = summary.items.map((item: any) => {
    const product = item.productSnapshot || {};
    return {
      productId: item.productId,
      variantId: item.variantId,
      variantName: [product.size || item.selectedSize, product.color].filter(Boolean).join(' / '),
      title: product.title || product.name || 'Sản phẩm',
      sku: product.sku && !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(product.sku) ? product.sku : '',
      imageUrl: product.imageUrl,
      quantity: amount(item.quantity),
      unitPrice: amount(item.unitPrice),
      appliedCommissionRate: amount(item.ruleSnapshot?.commissionRate),
      calculatedCommissionAmount: amount(item.ruleSnapshot?.commissionAmountVnd),
    };
  });
  const subtotal = summary.items.reduce((sum: number, item: any) => sum + amount(item.grossAmountVnd ?? amount(item.unitPrice) * amount(item.quantity)), 0);
  const discount = summary.items.reduce((sum: number, item: any) => sum + amount(item.discountAmountVnd), 0);
  // Spring checkout uses one configured shipping fee for each seller order.
  const shipping = amount(totals.shippingFeeVnd ?? (amount(order.sagaState?.shippingFeeVnd) / Math.max(1, checkout.sellerOrders.length)));
  const statusMap: Record<string, ManagedOrderStatus> = { CONFIRMED: 'PENDING', PROCESSING: 'PENDING', PACKING: 'PENDING', SHIPPED: 'SHIPPING' };
  return {
    id: raw.sellerOrderId,
    externalOrderSn: checkout.publicOrderCode || raw.orderId,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
    completedAt: raw.status === 'COMPLETED' ? raw.updatedAt : null,
    deliveredAt: raw.deliveredAt || null,
    status: statusMap[raw.status] || raw.status,
    customerName: ship.name || ship.customerName || 'Khách hàng',
    customerPhone: ship.phone || ship.customerPhone || '',
    customerEmail: ship.email || ship.customerEmail || null,
    shippingAddress: ship.address || ship.shippingAddress || '',
    subtotalAmount: subtotal,
    discountAmount: discount,
    shippingFee: shipping,
    finalAmount: amount(totals.netPaidVnd ?? subtotal - discount) + shipping,
    paymentMethod: order.sagaState?.paymentMethod || ship.paymentMethod || '',
    paymentStatus: ['PAID', 'PROCESSING', 'COMPLETED'].includes(order.status) ? 'PAID' : 'UNPAID',
    ghnEnvironment: totals.shippingEnvironment === 'TEST' ? 'TEST' : 'LIVE',
    trackingNumber: totals.trackingCode || null,
    carrierName: totals.carrier || null,
    store: { id: raw.storeId, name: totals.storeName || 'Gian hàng', slug: totals.storeSlug || raw.storeId },
    attributedCollaborator: null,
    couponCode: null,
    totalCommission: items.reduce((sum, item) => sum + item.calculatedCommissionAmount, 0),
    items,
  };
}

export const orderService = {
  async getMyStoreOrders(params?: {
    status?: string;
    paymentStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
    storeId?: string;
  }, fresh = false): Promise<StoreOrdersResponse> {
    const response: any = await api.get("/seller-orders", {
      params: {
        storeId: params?.storeId || localStorage.getItem('current_store_id') || undefined,
      },
      headers: fresh ? { 'x-skip-cache': 'true' } : undefined,
    });
    const list = Array.isArray(response?.result)
      ? response.result
      : Array.isArray(response?.data)
        ? response.data
        : Array.isArray(response)
          ? response
          : [];
    // SellerOrderResponse is a summary. Resolve its order and line items before
    // passing it to dashboard cards or the merchant order table.
    const details = new Map<string, Promise<{ order: any; checkout: any }>>();
    let mapped: StoreOrderRecord[] = await Promise.all(list.map(async (raw: any) => {
      if (!raw.sellerOrderId) return { ...raw, items: Array.isArray(raw.items) ? raw.items : [], finalAmount: amount(raw.finalAmount) };
      if (!details.has(raw.orderId)) details.set(raw.orderId, Promise.all([
        api.get(`/orders/${raw.orderId}`, { headers: fresh ? { 'x-skip-cache': 'true' } : undefined }),
        api.get(`/orders/${raw.orderId}/checkout-details`, { headers: fresh ? { 'x-skip-cache': 'true' } : undefined }),
      ]).then(([order, checkout]) => ({ order: unwrapOrderResponse(order), checkout: unwrapOrderResponse(checkout) })));
      const detail = await details.get(raw.orderId)!;
      return mapSellerOrder(raw, detail.order, detail.checkout);
    }));
    const missingProducts = [...new Set(mapped.flatMap(order => order.items.filter(item => !item.sku || !item.imageUrl).map(item => item.productId)))];
    const catalog = new Map(await Promise.all(missingProducts.map(async id => {
      try { return [id, unwrapOrderResponse(await api.get(`/public/products/${encodeURIComponent(id)}/landing`))] as const; }
      catch { return [id, null] as const; }
    })));
    mapped = mapped.map(order => ({ ...order, items: order.items.map(item => {
      const landing = catalog.get(item.productId);
      const variant = landing?.product?.variants?.find((variant: any) => (variant.id || variant.variantId) === item.variantId);
      return { ...item, sku: item.sku || variant?.sku || '',
        imageUrl: item.imageUrl || landing?.product?.imageUrl,
        variantName: item.variantName || [variant?.size, variant?.color].filter(Boolean).join(' / ') };
    }) }));
    // Returns have their own lifecycle; a delivered seller order remains
    // delivered in the database while its return request is being reviewed.
    let returnRows: any[] = [];
    let returnRequestsError: string | undefined;
    try {
      const result = unwrapOrderResponse(await api.get('/returns/shop', {
        headers: { 'x-skip-cache': 'true' },
      }));
      if (!Array.isArray(result)) throw new Error('Phản hồi yêu cầu trả hàng không hợp lệ.');
      returnRows = result;
    } catch {
      // A failed returns request must not hide the shop's otherwise available orders.
      returnRequestsError = 'Chưa tải được yêu cầu trả hàng. Hãy mở mục “Yêu cầu trả hàng” hoặc thử tải lại.';
    }
    mapped = mapped.map(order => ({ ...order, returnRequests: returnRows
      .filter((row: any) => row.sellerOrderId === order.id && (!order.store?.id || row.storeId === order.store.id))
      .map((row: any) => ({ returnRequestId: row.returnRequestId, status: row.status, quantity: amount(row.quantity) })) }));
    if (params?.status) mapped = mapped.filter(order => order.status === params.status);
    if (params?.paymentStatus) mapped = mapped.filter(order => order.paymentStatus === params.paymentStatus);
    if (params?.search?.trim()) {
      const query = params.search.trim().toLocaleLowerCase();
      mapped = mapped.filter(order => [order.id, order.externalOrderSn, orderDisplayCode(order.externalOrderSn), order.customerName, order.customerPhone,
        ...order.items.map(item => item.title)].some(value => value?.toLocaleLowerCase().includes(query)));
    }
    const page = Math.max(1, params?.page || 1);
    const limit = Math.max(1, params?.limit || 20);
    return {
      items: mapped.slice((page - 1) * limit, page * limit),
      returnRequestsError,
      pagination: {
        total: mapped.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(mapped.length / limit)),
      },
    };
  },

  async updateOrderFulfillment(
    orderId: string,
    data: {
      status: ManagedOrderStatus;
      trackingNumber?: string;
      carrierName?: string;
      note?: string;
    },
  ) {
    let response: any;
    if (data.status === 'SHIPPING') {
      response = await api.post(`/commerce/seller-orders/${orderId}/dispatch`, {
        environment: 'MANUAL', carrier: data.carrierName, trackingCode: data.trackingNumber,
      });
    } else if (data.status === 'DELIVERED') {
      response = await api.post(`/commerce/seller-orders/${orderId}/delivered`);
    } else {
      throw new Error('Thao tác này chưa được hỗ trợ. Hãy xử lý theo trạng thái giao hàng hiện tại.');
    }

    return {
      message: 'Cập nhật trạng thái đơn thành công',
      order: response?.result || response?.data || response,
    };
  },

  async respondReturnRequest(returnId: string, data: { decision: 'APPROVE' | 'REJECT'; response: string }) {
    const status = data.decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    const response: any = await api.post(`/returns/${returnId}/decision`, {
      status,
      decisionReason: data.response,
    });
    return {
      message: 'Đã xử lý yêu cầu trả hàng',
      returnRequest: response?.result || response?.data || response,
    };
  },

  async quoteDiscount(data: {
    storeId?: string;
    customerPhone: string;
    discountCode: string;
    items: ManualOrderItemInput[];
  }) {
    const response: any = await api.post('/checkout/quote', {
      couponCode: data.discountCode,
      items: data.items.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      })),
    });
    const result = response?.result || response?.data || response;
    return {
      code: data.discountCode,
      discountAmount: Number(result?.discountAmount ?? result?.voucherDiscountVnd ?? 0),
      message: result?.message || 'OK',
    };
  },

  async downloadExcelTemplate(): Promise<any> {
    throw new Error('BE chưa hỗ trợ import Excel đơn hàng.');
  },
  async createManualOrder(_data: ManualOrderInput): Promise<{ message: string; order: any }> {
    throw new Error('BE chưa hỗ trợ tạo đơn thủ công. Dùng luồng checkout.');
  },

  async importExcel(_file: File, _storeId?: string): Promise<ExcelImportResult> {
    throw new Error('BE chưa hỗ trợ import Excel đơn hàng.');
  },

  async shopCancelOrder(_orderId: string, _reason: string): Promise<{ message: string; order: any }> {
    throw new Error('BE chưa hỗ trợ hủy đơn từ phía shop qua API này.');
  },
};
