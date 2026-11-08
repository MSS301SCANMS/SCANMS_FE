import { isLiveOfferActive, type LiveOffer } from '../services/live-commerce.service';

export interface LiveVariant {
  id: string;
  name?: string;
  sku?: string;
  size?: string;
  color?: string;
  price?: number;
  stockQuantity: number;
  isActive?: boolean;
}

export function normalizeLiveVariants(product: any): LiveVariant[] {
  return (Array.isArray(product?.variants) ? product.variants : [])
    .map((row: any) => ({
      id: row.id || row.variantId,
      name: row.name || [row.color, row.size].filter(Boolean).join(' / '),
      sku: row.sku,
      size: row.size,
      color: row.color,
      price: Number(row.price ?? row.priceVnd),
      stockQuantity: Math.max(0, Number(row.stockQuantity) || 0),
      isActive: row.isActive !== false && (!row.status || row.status === 'ACTIVE'),
    }))
    .filter((row: LiveVariant) => Boolean(row.id));
}

export function liveVariantQuote(variant: LiveVariant, offers: LiveOffer[], now = Date.now()) {
  const offer = offers.find((row) => row.variantId === variant.id && isLiveOfferActive(row, now));
  const listPrice = Number(variant.price),
    price = Number(offer?.priceVnd ?? listPrice);
  const stock = Number.isSafeInteger(variant.stockQuantity) ? Math.max(0, variant.stockQuantity) : 0;
  const available =
    variant.isActive !== false &&
    Number.isSafeInteger(price) &&
    price > 0 &&
    Number.isSafeInteger(listPrice) &&
    listPrice > 0 &&
    price <= listPrice;
  const stockQuantity = available
    ? Math.min(stock, offer ? Math.max(0, offer.quantityLimit - offer.reservedQuantity) : stock)
    : 0;
  return { price, listPrice, stockQuantity, offerId: offer?.id, endsAt: offer?.endsAt };
}

export type LiveVariantQuote = ReturnType<typeof liveVariantQuote>;
