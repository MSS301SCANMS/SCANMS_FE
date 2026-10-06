export type SampleRequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'SHIPPED'
  | 'RECEIVED'
  | 'VIDEO_SUBMITTED'
  | 'REVISION_REQUIRED'
  | 'COMPLETED'
  | 'OVERDUE'
  | 'CANCELLED'
  | 'DELIVERY_ISSUE';

export interface SampleSocialChannel {
  id: string;
  platformName: string;
  channelName?: string;
  channelUrl: string;
  followerCount: number;
}

export interface SampleVideoAsset {
  id: string;
  title: string;
  urlOrContent: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'HIDDEN';
  rejectionReason?: string | null;
  createdAt: string;
}

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
  carrier?: string;
  socialChannelId?: string;
  socialChannel?: SampleSocialChannel | null;
  contentType?: string;
  expectedVideoAt?: string;
  acceptedTermsAt?: string;
  receivedAt?: string;
  deadlineAt?: string;
  reminderSentAt?: string;
  overdueAt?: string;
  videoUrl?: string;
  videoTitle?: string;
  videoSubmittedAt?: string;
  videoRejectionReason?: string | null;
  rejectedReason?: string | null;
  status: SampleRequestStatus;
  createdAt: string;
  updatedAt: string;
  collaborator: SampleCollaborator;
  product: SampleProduct;
  videoAssets?: SampleVideoAsset[];
}

export interface ShopStats {
  [status: string]: number;
  total: number;
}
