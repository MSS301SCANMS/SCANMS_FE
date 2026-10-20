import api from "./api";

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

interface ApiEnvelope<T> {
  data: T;
}

export interface StoreOrderItem {
  productId: string;
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
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
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
        storeId: params?.storeId,
        status: params?.status,
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
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    return {
      items: list,
      pagination: {
        total: list.length,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(list.length / limit)),
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
    // Map FE statuses → SellerOrderStatus query param
    const statusMap: Record<string, string> = {
      PENDING: 'PENDING',
      SHIPPING: 'SHIPPED',
      DELIVERED: 'DELIVERED',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
      RETURN_REQUESTED: 'RETURN_REQUESTED',
      RETURNED: 'RETURNED',
      DISPUTED: 'DISPUTED',
    };
    const status = statusMap[data.status] || data.status;
    const response: any = await api.patch(`/seller-orders/${orderId}/status`, null, {
      params: { status },
    });
    if (data.trackingNumber) {
      try {
        const shipment: any = await api.get(`/shipments/by-seller-order/${orderId}`);
        const shipmentId = shipment?.result?.shipmentId || shipment?.result?.id || shipment?.data?.id;
        if (shipmentId) {
          await api.patch(`/shipments/${shipmentId}/status`, null, {
            params: {
              status: 'IN_TRANSIT',
              carrier: data.carrierName,
              trackingCode: data.trackingNumber,
            },
          });
        }
      } catch {
        // shipment may not exist yet
      }
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

  async downloadExcelTemplate() {
    throw new Error('BE chưa hỗ trợ import Excel đơn hàng.');
  },
  async createManualOrder(_data: ManualOrderInput) {
    throw new Error('BE chưa hỗ trợ tạo đơn thủ công. Dùng luồng checkout.');
  },

  async importExcel(_file: File, _storeId?: string) {
    throw new Error('BE chưa hỗ trợ import Excel đơn hàng.');
  },

  async shopCancelOrder(_orderId: string, _reason: string): Promise<{ message: string; order: any }> {
    throw new Error('BE chưa hỗ trợ hủy đơn từ phía shop qua API này.');
  },
};
