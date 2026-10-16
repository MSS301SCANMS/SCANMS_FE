import { scanmsService } from '../../services/scanms.service';
import { RESOURCE_PATHS, type ResourcePath } from '../../services/backend-contract';
import type { UserProfile } from '../../services/auth.service';
import { resourceConfig } from './resource-config';

export type Row = Record<string, unknown>;
export type Snapshot = Record<ResourcePath, Row[]>;
export function emptySnapshot(): Snapshot {
  return Object.fromEntries(RESOURCE_PATHS.map(key => [key, [] as Row[]])) as Snapshot;
}
const productResources: ResourcePath[] = ['stores', 'products', 'product-images', 'product-variants', 'product-categories', 'feedbacks', 'livestreams'];
const orderResources: ResourcePath[] = ['stores', 'products', 'orders', 'seller-orders', 'order-items', 'shipments', 'returns', 'discount-allocations', 'payments'];
const moneyResources: ResourcePath[] = ['stores', 'collaborators', 'wallets', 'wallet-transactions', 'withdrawals', 'settlements', 'bank-accounts', 'fee-configs'];
const affiliateResources: ResourcePath[] = ['stores', 'products', 'livestreams', 'collaborators', 'referrals', 'commissions', 'commission-policies'];
export function dependencies(resource: ResourcePath): ResourcePath[] {
  if (resource === 'store-applications') return ['stores', 'store-applications'];
  if (resource === 'vouchers' || resource === 'voucher-redemptions') return ['stores', 'products', 'livestreams', 'vouchers', 'voucher-redemptions'];
  if (productResources.includes(resource)) return resource === 'livestreams' ? [...productResources, 'collaborators'] : productResources;
  if (moneyResources.includes(resource)) return moneyResources;
  if (affiliateResources.includes(resource)) return affiliateResources;
  return orderResources;
}
export async function loadSnapshot(resource: ResourcePath, signal: AbortSignal): Promise<Snapshot> {
  const result = emptySnapshot();
  await Promise.all(dependencies(resource).map(async key => {
    result[key] = (await scanmsService.list(key, signal)) as unknown as Row[];
  }));
  return result;
}

// Presentation filtering only. Server role and ownership checks remain required.
export function scopedSnapshot(raw: Snapshot, user: UserProfile, area: 'customer' | 'merchant' | 'collaborator' | 'admin' | 'catalog'): Snapshot {
  if (area === 'admin' && user.roles.includes('ADMIN')) return raw;
  const result = { ...raw };
  const ownStores = raw.stores.filter(row => row.ownerUserId === user.userId);
  const storeIds = new Set(ownStores.map(row => row.storeId));
  const ownCollaborators = raw.collaborators.filter(row => row.userId === user.userId);
  const collaboratorIds = new Set(ownCollaborators.map(row => row.collaboratorId));
  const adminModeration = area === 'admin' && user.roles.includes('MANAGER');
  const shopArea = area === 'merchant';
  const customerArea = area === 'customer';

  result.stores = area === 'catalog' ? raw.stores.filter(row => row.approvalStatus === 'APPROVED') : adminModeration ? raw.stores : ownStores;
  result['store-applications'] = adminModeration ? raw['store-applications'] : raw['store-applications'].filter(row => row.applicantUserId === user.userId);
  result.products = shopArea ? raw.products.filter(row => storeIds.has(row.storeId)) : raw.products;
  if (area === 'catalog') result.products = result.products.filter(row => row.status === 'ACTIVE' && result.stores.some(store => store.storeId === row.storeId));
  const productIds = new Set(result.products.map(row => row.productId));
  for (const key of ['product-images', 'product-variants', 'feedbacks'] as const) result[key] = raw[key].filter(row => productIds.has(row.productId));
  result.livestreams = shopArea ? raw.livestreams.filter(row => storeIds.has(row.storeId)) : raw.livestreams;
  result.vouchers = shopArea ? raw.vouchers.filter(row => row.issuerType === 'STORE' && storeIds.has(row.storeId)) : raw.vouchers;
  const voucherIds = new Set(result.vouchers.map(row => row.voucherId));
  result['voucher-redemptions'] = adminModeration ? raw['voucher-redemptions'] : raw['voucher-redemptions'].filter(row => shopArea ? voucherIds.has(row.voucherId) : row.userId === user.userId);
  result.collaborators = adminModeration ? raw.collaborators : shopArea ? raw.collaborators.filter(row => row.approvalStatus === 'APPROVED') : ownCollaborators;
  result.referrals = raw.referrals.filter(row => shopArea ? productIds.has(row.productId) : collaboratorIds.has(row.collaboratorId));
  const referralIds = new Set(result.referrals.map(row => row.referralLinkId));
  result.commissions = raw.commissions.filter(row => shopArea ? referralIds.has(row.referralLinkId) : collaboratorIds.has(row.collaboratorId));
  result['commission-policies'] = raw['commission-policies'].filter(row => row.scopeType === 'PLATFORM' || storeIds.has(row.storeId) || collaboratorIds.has(row.collaboratorId));

  result.orders = customerArea ? raw.orders.filter(row => row.customerId === user.userId) : raw.orders;
  const customerOrderIds = new Set(result.orders.map(row => row.orderId));
  result['seller-orders'] = raw['seller-orders'].filter(row => shopArea ? storeIds.has(row.storeId) : customerOrderIds.has(row.orderId));
  const sellerIds = new Set(result['seller-orders'].map(row => row.sellerOrderId));
  const orderIds = new Set(result['seller-orders'].map(row => row.orderId));
  if (shopArea) result.orders = result.orders.filter(row => orderIds.has(row.orderId));
  result['order-items'] = raw['order-items'].filter(row => sellerIds.has(row.sellerOrderId));
  const itemIds = new Set(result['order-items'].map(row => row.orderItemId));
  result.shipments = raw.shipments.filter(row => sellerIds.has(row.sellerOrderId));
  result.returns = raw.returns.filter(row => itemIds.has(row.orderItemId));
  result['discount-allocations'] = raw['discount-allocations'].filter(row => itemIds.has(row.orderItemId));
  result.payments = raw.payments.filter(row => (customerArea ? customerOrderIds : orderIds).has(row.orderId));

  result.wallets = raw.wallets.filter(row =>
    (customerArea && row.ownerType === 'CUSTOMER' && row.ownerRefId === user.userId) ||
    (shopArea && row.ownerType === 'STORE' && storeIds.has(row.ownerRefId)) ||
    (area === 'collaborator' && row.ownerType === 'COLLABORATOR' && collaboratorIds.has(row.ownerRefId)));
  const walletIds = new Set(result.wallets.map(row => row.walletId));
  result['wallet-transactions'] = raw['wallet-transactions'].filter(row => walletIds.has(row.walletId));
  result.withdrawals = raw.withdrawals.filter(row => walletIds.has(row.walletId));
  result.settlements = raw.settlements.filter(row => storeIds.has(row.storeId));
  result['bank-accounts'] = raw['bank-accounts'].filter(row => storeIds.has(row.storeId) || collaboratorIds.has(row.collaboratorId));
  result['fee-configs'] = [];
  return result;
}

export function referenceLabel(snapshot: Snapshot, field: string, value: unknown): string | undefined {
  const resource = RESOURCE_PATHS.find(key => resourceConfig[key].id === field);
  const match = resource ? snapshot[resource].find(row => row[field] === value) : undefined;
  return match ? String(match.name || match.title || match.proposedStoreName || match.code || match.sku || '') || undefined : undefined;
}
