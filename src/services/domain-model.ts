import type * as B from '../types/backend.generated';

export function ownedStores(stores: B.StoreResponse[], userId: string): B.StoreResponse[] {
  return stores.filter(store => store.ownerUserId === userId);
}
export function catalogProduct(product: B.ProductResponse, variants: B.ProductVariantResponse[], images: B.ProductImageResponse[]) {
  const selectedVariants = variants.filter(variant => variant.productId === product.productId);
  const available = selectedVariants.filter(variant => variant.status === 'ACTIVE' && (variant.stockQuantity || 0) > 0);
  const sortedImages = images.filter(image => image.productId === product.productId)
    .sort((a, b) => Number(b.primaryImage) - Number(a.primaryImage) || (a.sortOrder || 0) - (b.sortOrder || 0));
  return { ...product, variants: selectedVariants, images: sortedImages,
    imageUrl: sortedImages[0]?.imageUrl || null,
    availableQuantity: available.reduce((sum, variant) => sum + (variant.stockQuantity || 0), 0),
    canPurchase: product.status === 'ACTIVE' && available.length > 0,
  };
}
export function walletBelongsTo(wallet: B.WalletResponse, userId: string, storeIds: string[], collaboratorIds: string[]) {
  if (wallet.ownerType === 'CUSTOMER') return wallet.ownerRefId === userId;
  if (wallet.ownerType === 'STORE') return storeIds.includes(wallet.ownerRefId || '');
  if (wallet.ownerType === 'COLLABORATOR') return collaboratorIds.includes(wallet.ownerRefId || '');
  return false;
}
export function eligibleVoucherReferences(scope: B.VoucherScopeType, storeId: string, productId?: string, livestreamId?: string) {
  if (scope === 'STORE') return { storeId, productId: null, livestreamId: null };
  if (scope === 'PRODUCT') {
    if (!productId) throw new Error('Vui lòng chọn sản phẩm áp dụng.');
    return { storeId, productId, livestreamId: null };
  }
  if (scope === 'LIVESTREAM') {
    if (!livestreamId) throw new Error('Vui lòng chọn livestream áp dụng.');
    return { storeId, productId: null, livestreamId };
  }
  return { storeId: null, productId: null, livestreamId: null };
}
export function formatVnd(value: unknown) {
  return typeof value === 'number' && Number.isSafeInteger(value)
    ? `${value.toLocaleString('vi-VN')} ₫` : 'Chưa có';
}
