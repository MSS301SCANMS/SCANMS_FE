import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { unwrapApi } from '@/utils/api-response';
import { collaborationChat } from '@/services/collaboration-chat.service';
import { partnershipInvitationsService } from '@/services/partnership-invitations.service';
import { productCommissionDeals } from '@/services/product-commission-deals.service';

export interface ChatPartner {
  storeId: string;
  storeName: string;
  customerId: string;
  collaboratorId?: string;
  name: string;
}

export function useChatWorkspaceData(accountId: string, shop: boolean, kol: boolean, enabled = true) {
  const collaboration = Boolean(enabled && accountId && (shop || kol));
  const mode = shop ? 'shop' : 'kol';
  const invitations = useQuery({
    queryKey: ['chat-invitations', accountId, collaboration ? mode : 'none'], enabled: collaboration,
    queryFn: () => partnershipInvitationsService.list(mode), refetchInterval: 20000, retry: false,
  });
  const samples = useQuery({
    queryKey: ['chat-samples', accountId, collaboration ? mode : 'none'], enabled: collaboration,
    queryFn: () => collaborationChat.samples(shop), refetchInterval: 15000, retry: false,
  });
  const deals = useQuery({
    queryKey: ['chat-deals', accountId, collaboration ? mode : 'none'], enabled: collaboration,
    queryFn: () => productCommissionDeals.list(mode), refetchInterval: 15000, retry: false,
  });
  const shopPartners = useQuery({
    queryKey: ['chat-partners', accountId], enabled: Boolean(enabled && accountId && shop), retry: false,
    queryFn: async (): Promise<ChatPartner[]> => {
      const stores = unwrapApi<Array<{ storeId?: string; id?: string; name: string }>>(
        await api.get('/stores/mine', { headers: { 'x-skip-cache': '1' } }),
      );
      if (!Array.isArray(stores)) throw new Error('Không tải được gian hàng của bạn.');
      const groups = await Promise.all(stores.map(async store => {
        const id = store.storeId || store.id || '';
        return (await collaborationChat.partners(id)).map(partner => ({ ...partner, storeName: store.name }));
      }));
      return groups.flat();
    }, refetchInterval: 20000,
  });
  const partners = useMemo(() => {
    if (!collaboration) return [];
    if (shop) return shopPartners.data || [];
    const result = new Map<string, ChatPartner>();
    for (const invitation of invitations.data || []) {
      if (invitation.status === 'ACCEPTED') result.set(invitation.storeId, {
        storeId: invitation.storeId, storeName: invitation.storeName, name: invitation.storeName,
        customerId: accountId, collaboratorId: invitation.collaboratorId,
      });
    }
    return [...result.values()];
  }, [accountId, collaboration, invitations.data, shop, shopPartners.data]);
  return { invitations, samples, deals, shopPartners, partners };
}
