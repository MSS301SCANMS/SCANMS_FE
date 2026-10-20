export interface MarketplaceStore {
  id: string;
  name: string;
  slug?: string;
  logoUrl?: string | null;
  description?: string | null;
  totalProducts?: number;
  rating?: number | null;
  reviewCount?: number;
  isVerified?: boolean;
  category?: string;
  categories?: string[];
  defaultCommissionRate?: number | string;
  activeCampaign?: { id: string; name: string; endsAt: string } | null;
}
