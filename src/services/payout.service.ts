import api from "./api";
import type { PayoutStatus } from "./wallet.service";

export interface MerchantPayout {
  id: string;
  collaboratorId: string;
  collaboratorName: string;
  collaboratorEmail?: string | null;
  collaboratorPhone?: string | null;
  collaboratorAvatar?: string | null;
  collaboratorTaxCode?: string | null;
  kycStatus?: string;
  storeId: string;
  amount: string;
  taxAmount: string;
  netAmount: string;
  status: PayoutStatus;
  bankName: string | null;
  bankAccountNumber: string | null;
  bankAccountName: string | null;
  bankRefCode: string | null;
  batchId: string | null;
  hasBill: boolean;
  rejectedReason: string | null;
  createdAt: string;
  processedAt: string | null;
}
export interface MerchantPayoutHistory {
  maxBillBytes: number;
  requests: MerchantPayout[];
  total: number;
  page: number;
  limit: number;
}
export interface MerchantPayoutBatch {
  id: string;
  createdAt: string;
  payoutCount: number;
}
interface Envelope<T> {
  data: T;
}

export const payoutService = {
  async list(storeId: string, page: number, status: PayoutStatus | "") {
    return (
      await api.get<never, Envelope<MerchantPayoutHistory>>(
        `/stores/${storeId}/payouts`,
        { params: { page, limit: 10, ...(status ? { status } : {}) } },
      )
    ).data;
  },
  async batches(storeId: string) {
    return (
      await api.get<
        never,
        Envelope<{ batches: MerchantPayoutBatch[]; total: number }>
      >(`/stores/${storeId}/payouts/batches`, {
        params: { page: 1, limit: 10 },
      })
    ).data;
  },
  async approve(
    payoutId: string,
    bill: File,
    options: { bankRefCode?: string; note?: string } = {},
  ) {
    const body = new FormData();
    if (options.bankRefCode) body.append("bankRefCode", options.bankRefCode);
    if (options.note) body.append("note", options.note);
    body.append("bill", bill);
    return (
      await api.post<never, Envelope<MerchantPayout>>(
        `/payouts/${payoutId}/approve`,
        body,
        { headers: { "Content-Type": "multipart/form-data" }, timeout: 45000 },
      )
    ).data;
  },
  async reject(storeId: string, payoutId: string, reason: string) {
    return (
      await api.patch<never, Envelope<MerchantPayout>>(
        `/stores/${storeId}/payouts/${payoutId}/reject`,
        { reason },
      )
    ).data;
  },
  async bill(storeId: string, payoutId: string) {
    return (
      await api.get<never, Envelope<{ url: string }>>(
        `/stores/${storeId}/payouts/${payoutId}/bill`,
      )
    ).data;
  },
  async exportBatch(storeId: string, payoutIds: string[]) {
    return api.post<never, Blob>(
      `/stores/${storeId}/payouts/export-vietqr`,
      { payoutIds },
      { responseType: "blob" },
    );
  },
  async downloadBatch(storeId: string, batchId: string) {
    return api.get<never, Blob>(
      `/stores/${storeId}/payouts/batches/${batchId}/download`,
      { responseType: "blob" },
    );
  },
};

export async function getPayoutErrorMessage(error: unknown): Promise<string> {
  if (error && typeof error === "object" && "response" in error) {
    const response = error.response as { data?: unknown } | undefined;
    if (response?.data instanceof Blob) {
      try {
        const data = JSON.parse(await response.data.text()) as {
          message?: unknown;
        };
        if (typeof data.message === "string") return data.message;
        if (Array.isArray(data.message))
          return data.message
            .filter((value: unknown) => typeof value === "string")
            .join("; ");
      } catch {

      }
    }
  }
  return error instanceof Error ? error.message : "Không thể xử lý payout";
}
