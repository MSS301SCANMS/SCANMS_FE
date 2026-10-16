import { backendGet, backendPost, backendPatch } from './api';
import type * as B from '../types/backend.generated';
import type { ResourcePath } from './backend-contract';

export interface ResourceResponses {
  stores: B.StoreResponse;
  'store-applications': B.StoreApplicationResponse;
  products: B.ProductResponse;
  'product-categories': B.ProductCategoryResponse;
  'product-images': B.ProductImageResponse;
  'product-variants': B.ProductVariantResponse;
  feedbacks: B.FeedbackResponse;
  livestreams: B.LivestreamResponse;
  orders: B.OrderResponse;
  'seller-orders': B.SellerOrderResponse;
  'order-items': B.OrderItemResponse;
  shipments: B.ShipmentResponse;
  returns: B.ReturnRequestResponse;
  'discount-allocations': B.DiscountAllocationResponse;
  payments: B.PaymentResponse;
  wallets: B.WalletResponse;
  'wallet-transactions': B.WalletTransactionResponse;
  'bank-accounts': B.BankAccountResponse;
  withdrawals: B.WithdrawalRequestResponse;
  settlements: B.SellerSettlementResponse;
  'fee-configs': B.FeeConfigResponse;
  vouchers: B.VoucherResponse;
  'voucher-redemptions': B.VoucherRedemptionResponse;
  collaborators: B.CollaboratorProfileResponse;
  referrals: B.ReferralLinkResponse;
  'commission-policies': B.CommissionPolicyResponse;
  commissions: B.CommissionResponse;
}
export interface ResourceRequests {
  products: B.CreateProductRequest;
  'product-categories': B.CreateProductCategoryRequest;
  'product-images': B.CreateProductImageRequest;
  'product-variants': B.CreateProductVariantRequest;
  'store-applications': B.CreateStoreApplicationRequest;
  livestreams: B.CreateLivestreamRequest;
  vouchers: B.CreateVoucherRequest;
  collaborators: B.ApplyCollaboratorRequest;
}

export const scanmsService = {
  async list<K extends ResourcePath>(resource: K, signal?: AbortSignal): Promise<ResourceResponses[K][]> {
    const result = await backendGet<ResourceResponses[K][]>(`/${resource}`, signal);
    if (!Array.isArray(result)) throw new Error('Danh sách trả về không hợp lệ.');
    return result;
  },
  get<K extends ResourcePath>(resource: K, id: string, signal?: AbortSignal): Promise<ResourceResponses[K]> {
    return backendGet(`/${resource}/${encodeURIComponent(id)}`, signal);
  },
  storeDashboard(storeId: string, signal?: AbortSignal): Promise<B.StoreDashboardResponse> {
    return backendGet(`/stores/${encodeURIComponent(storeId)}/dashboard`, signal);
  },
  livestreamSales(livestreamId: string, signal?: AbortSignal): Promise<B.LivestreamSalesResponse> {
    return backendGet(`/livestream-sales/${encodeURIComponent(livestreamId)}`, signal);
  },
  create<K extends keyof ResourceRequests>(resource: K, payload: ResourceRequests[K]): Promise<ResourceResponses[K]> {
    return backendPost(`/${resource}`, payload);
  },
  action<K extends ResourcePath>(resource: K, id: string, action: string, payload: Record<string, unknown> = {}): Promise<ResourceResponses[K]> {
    return backendPost(`/${resource}/${encodeURIComponent(id)}/${action}`, payload);
  },
  updateProfile(payload: B.UpdateUserProfileRequest): Promise<B.UserResponse> {
    return backendPatch('/users/me', payload);
  },
  async analyze(image: File): Promise<AiSuggestion> {
    const data = new FormData(); data.append('image', image);
    return backendPost('/products/ai-analyze', data);
  },
};
export type AiSuggestion = B.AiDetectionResponse;
