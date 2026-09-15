import api from "./api";

export type ManagedOrderStatus =
  "PENDING" | "SHIPPING" | "DELIVERED" | "COMPLETED" | "CANCELLED" | "RETURNED";

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

export const orderService = {
  async quoteDiscount(data: {
    storeId?: string;
    customerPhone: string;
    discountCode: string;
    items: ManualOrderItemInput[];
  }) {
    const response = (await api.post(
      "/orders/manual/discount",
      data,
    )) as unknown as ApiEnvelope<{
      code: string;
      discountAmount: number;
      message: string;
    }>;
    return response.data;
  },

  async downloadExcelTemplate() {

    const blob = (await api.get("/orders/import-excel/template", {
      responseType: "blob",
    })) as unknown as Blob;
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "scanms-order-import-template.xlsx";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
  async createManualOrder(data: ManualOrderInput) {
    const response = (await api.post(
      "/orders/manual",
      data,
    )) as unknown as ApiEnvelope<{
      message: string;
      order: CreatedManualOrder;
    }>;
    return response.data;
  },

  async importExcel(file: File, storeId?: string) {
    const formData = new FormData();
    formData.append("file", file);
    if (storeId) {
      formData.append("storeId", storeId);
    }

    const response = (await api.post("/orders/import-excel", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 60000,
    })) as unknown as ApiEnvelope<ExcelImportResult>;
    return response.data;
  },
};
