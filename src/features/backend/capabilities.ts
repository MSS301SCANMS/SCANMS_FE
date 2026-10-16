import type { ResourcePath } from '../../services/backend-contract';
import type { UserProfile } from '../../services/auth.service';
import type { ResourceRequests } from '../../services/scanms.service';
import type { Snapshot } from './snapshot';

export type CreatableResource = keyof ResourceRequests;
export function canCreate(resource: ResourcePath, user: UserProfile, snapshot: Snapshot, storeId: string): resource is CreatableResource {
  if (resource === 'store-applications') return true;
  if (resource === 'collaborators') return !snapshot.collaborators.some(row => row.userId === user.userId);
  if (resource === 'product-categories') return user.roles.includes('ADMIN') || user.roles.includes('MANAGER');
  if (resource === 'vouchers' && user.roles.includes('ADMIN')) return true;
  if (!['products', 'product-images', 'product-variants', 'livestreams', 'vouchers'].includes(resource)) return false;
  return (user.roles.includes('SHOP_OWNER') || user.roles.includes('ADMIN')) && snapshot.stores.some(row => row.storeId === storeId
    && (row.ownerUserId === user.userId || user.roles.includes('ADMIN')) && row.approvalStatus === 'APPROVED');
}
