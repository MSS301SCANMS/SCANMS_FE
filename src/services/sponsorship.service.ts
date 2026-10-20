import api from "./api";

export type SponsorshipStatus =
  "REQUESTED" | "APPROVED" | "REJECTED" | "CANCELLED" | "EXPIRED";
export interface Sponsorship {
  id: string;
  headline: string;
  startsAt: string;
  endsAt: string;
  status: SponsorshipStatus;
  fundingType: "PAID" | "PLATFORM_GRANT" | null;
  amount: string | null;
  paymentReference: string | null;
  paymentProofUrl: string | null;
  reviewNote: string | null;
  store: { id: string; name: string };
}
export interface SponsorshipPage {
  items: Sponsorship[];
  page: number;
  totalPages: number;
  total: number;
}
export interface SponsorshipRequest {
  renewsPlacementId?: string;
  quotedAmount: number;
  requestKey: string;
  headline: string;
  startsAt: string;
  endsAt: string;
}
export interface SponsorshipReview {
  decision: "APPROVE" | "REJECT";
  note: string;
  fundingType?: "PAID";
  amount?: number;
  paymentReference?: string;
  paymentProofUrl?: string;
}
// The shared interceptor unwraps HTTP responses; support the global response envelope too.
const unwrap = <T>(response: unknown): T =>
  (response as { data?: T })?.data ?? (response as T);
export const sponsorshipService = {
  async pricing(): Promise<{ dailyRate: number; currency: string; billingHours: number; minHours: number; maxDays: number }> {
    return unwrap(await api.get('/sponsored-placements/pricing', { headers: { 'x-skip-cache': 'true' } }));
  },
  async list(page: number, status: string): Promise<SponsorshipPage> {
    return unwrap(
      await api.get("/sponsored-placements", {
        params: { page, ...(status ? { status } : {}) },
        headers: { "x-skip-cache": "true" },
      }),
    );
  },
  async request(data: SponsorshipRequest) {
    return unwrap<Sponsorship>(await api.post("/sponsored-placements", data));
  },
  async review(id: string, data: SponsorshipReview) {
    return unwrap<Sponsorship>(
      await api.patch(`/sponsored-placements/${id}/review`, data),
    );
  },
  async cancel(id: string, note: string) {
    await api.patch(`/sponsored-placements/${id}/cancel`, { note });
  },
};
