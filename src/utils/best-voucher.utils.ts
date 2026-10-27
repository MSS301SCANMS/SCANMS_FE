export interface VoucherQuote {
  code: string;
  discountAmount: number;
  shippingDiscountVnd?: number;
  discountType?: string;
  finalAmount: number;
}

// Use server totals: caps, shipping fees and personal usage limits cannot be
// inferred reliably from the public catalogue. Preview never reserves a use.
export async function findBestVoucher(
  codes: string[],
  quote: (code: string) => Promise<unknown>,
  signal: AbortSignal,
): Promise<VoucherQuote | null> {
  const candidates = [...new Set(codes.map(code => code.trim().toUpperCase()).filter(Boolean))].sort();
  let next = 0;
  let best: VoucherQuote | null = null;
  await Promise.all(Array.from({ length: Math.min(3, candidates.length) }, async () => {
    while (!signal.aborted && next < candidates.length) {
      const code = candidates[next++];
      try {
        const raw = await quote(code) as Partial<VoucherQuote> | null;
        if (signal.aborted || !raw) continue;
        const goods = Number(raw.discountAmount ?? 0), shipping = Number(raw.shippingDiscountVnd ?? 0);
        const total = Number(raw.finalAmount);
        if (![goods, shipping, total].every(value => Number.isSafeInteger(value) && value >= 0)
            || goods + shipping <= 0) continue;
        if (!best || total < best.finalAmount || total === best.finalAmount && code < best.code) {
          best = { code, discountAmount: goods, shippingDiscountVnd: shipping,
            discountType: raw.discountType, finalAmount: total };
        }
      } catch {
        // An expired, exhausted or ineligible code must not hide other offers.
      }
    }
  }));
  return signal.aborted ? null : best;
}
