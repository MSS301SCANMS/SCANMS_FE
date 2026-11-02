import api from './api';
import type {ProductCommissionDeal} from './product-commission-deals.service';

const unwrap = <T, >(value: unknown): T => {
  const response = value as { result?: T; data?: T };
  return (response?.result ?? response?.data ?? value) as T;
};

export interface ChatSample {
  id: string;
  productId: string;
  storeId: string;
  customerId: string;
  collaboratorId: string;
  product: { id: string; title: string; price?: number; thumbnail?: string };
  status: string;
  version: number;
  note: string;
  response?: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string;
  carrier?: string;
  trackingCode?: string;
  createdAt: string;
}

export interface CollaborationResource {
  storeId: string;
  customerId: string;
  deal?: ProductCommissionDeal;
  sample?: ChatSample;
}

export type ResourceKind = 'COMMISSION_DEAL' | 'SAMPLE_REQUEST';

export interface SampleDraft {
  requestId: string;
  productId: string;
  note: string;
  recipientName: string;
  recipientPhone: string;
  shippingAddress: string
}

export const collaborationChat = {
  resource: async (kind: ResourceKind, id: string) => unwrap<CollaborationResource>(await api.get(`/referrals/chat/resources/${kind}/${id}`, {headers: {'x-skip-cache': '1'}})),
  partners: async (storeId: string) => unwrap<Array<{
    storeId: string;
    customerId: string;
    collaboratorId?: string;
    name: string
  }>>(await api.get('/referrals/chat/partners', {params: {storeId}, headers: {'x-skip-cache': '1'}})),
  negotiate: async (id: string, expectedVersion: number, action: 'ACCEPT' | 'REJECT' | 'COUNTER', note: string, extraPoints?: number) =>
    unwrap<ProductCommissionDeal>(await api.post(`/referrals/commission-deals/${id}/negotiate`, {
      expectedVersion,
      action,
      note,
      extraPoints
    })),
  createSample: async (input: SampleDraft) => unwrap<ChatSample>(await api.post('/sample-requests', input)),
  samples: async (shop: boolean) => unwrap<ChatSample[]>(await api.get(`/sample-requests/${shop ? 'shop' : 'my'}`, {headers: {'x-skip-cache': '1'}})),
  sampleDecision: async (row: ChatSample, action: string, response = '', carrierName = '', trackingNumber = '') =>
    unwrap<ChatSample>(await api.patch(`/sample-requests/${row.id}/${action}`, {
      expectedVersion: row.version,
      response,
      carrierName,
      trackingNumber
    })),
};
