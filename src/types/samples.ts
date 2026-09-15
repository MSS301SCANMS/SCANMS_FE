export type SampleRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SHIPPED';

export interface SampleProduct {
  id: string;
  title: string;
  sku: string;
  imageUrl?: string;
  price: number;
  storeId: string;
  store: { id: string; name: string };
}

export interface SampleCollaborator {
  id: string;
  fullName: string;
  email: string;
  phoneNumber?: string;
  role: string;
}

export interface SampleRequest {
  id: string;
  collaboratorId: string;
  productId: string;
  shippingAddress: string;
  trackingNumber?: string;
  status: SampleRequestStatus;
  createdAt: string;
  updatedAt: string;
  collaborator: SampleCollaborator;
  product: SampleProduct;
}

export interface ShopStats {
  pending: number;
  approved: number;
  shipped: number;
  rejected: number;
  total: number;
}
