import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageSquare, X, Maximize2 } from 'lucide-react';
import { useScanmsChat } from '@/context/ScanmsChatContext';
import { collaborationChat } from '@/services/collaboration-chat.service';
import api from '@/services/api';
import { Button } from '@/components/ui/Button';
import { StoreChatPanel } from './StoreChatPanel';
import type { ChatProductInfo } from '@/types/chat.types';

interface StoreChatWorkspaceProps {
  floating?: boolean;
  storeId?: string;
  customerId?: string;
  storeName?: string;
  conversationId?: string;
  collaboratorId?: string;
  product?: ChatProductInfo;
}

export function StoreChatWorkspace(props: StoreChatWorkspaceProps) {
  const chat = useScanmsChat();
  return <ScopedStoreChatWorkspace key={chat.accountId} {...props} />;
}

function ScopedStoreChatWorkspace({floating = false, storeId, customerId, storeName, conversationId, collaboratorId, product}: StoreChatWorkspaceProps) {
  const chat = useScanmsChat();
  const location = useLocation(), navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [partners, setPartners] = useState<Array<{
    storeId: string;
    customerId: string;
    collaboratorId?: string;
    name: string;
    storeName: string
  }>>([]);
  const [error, setError] = useState('');
  const open = useRefCallback(chat.openChat);
  const currentProduct = useRefCallback(product);
  const select = useRefCallback(chat.selectConversation);
  useEffect(() => {
    if (!floating && !collaboratorId) open.current(storeId ? {id: storeId, name: storeName || 'Gian hàng', customerId} : undefined, currentProduct.current);
  }, [floating, storeId, customerId, storeName, collaboratorId, open, currentProduct, product?.id]);
  useEffect(() => {
    const partner = partners.find(row => row.collaboratorId === collaboratorId && (!storeId || row.storeId === storeId));
    if (!floating && collaboratorId && partner) open.current({id: partner.storeId, name: partner.storeName, customerId: partner.customerId}, currentProduct.current);
  }, [partners, collaboratorId, storeId, floating, open, currentProduct]);
  useEffect(() => {
    if (!floating && conversationId && chat.conversations.some(row => row.id === conversationId)) select.current(conversationId);
  }, [floating, conversationId, chat.conversations, select]);
  useEffect(() => {
    let cancelled = false;
    let shop = false;
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      shop = [user.role, ...(user.roles || [])].some(role => ['SHOP_OWNER', 'SHOP_MANAGER'].includes(role));
    } catch { /* Guest. */
    }
    if (!shop) return;
    void api.get('/stores/mine', {headers: {'x-skip-cache': '1'}}).then(async response => {
      const envelope = response as unknown as {
        result?: Array<{ storeId: string; name: string }>;
        data?: Array<{ storeId: string; name: string }>
      };
      const stores = envelope.result || envelope.data || [];
      const all = await Promise.all(stores.map(async store => (await collaborationChat.partners(store.storeId)).map(p => ({
        ...p,
        storeName: store.name
      }))));
      if (!cancelled) setPartners(all.flat());
    }).catch(cause => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : 'Không tải được đối tác.');
    });
    return () => {
      cancelled = true;
    };
  }, []);
  if (floating && (!chat.accountId || location.pathname.includes('/chat') || location.pathname.includes('/messages') || location.pathname.includes('/admin') || location.pathname.includes('/login') || location.pathname.includes('/register'))) return null;
  // The floating launcher would cover the live room's comment send button.
  // Explicitly opening a shop conversation from the room still shows its panel.
  if (floating && !chat.isOpen && /^\/live(?:\/|$)/.test(location.pathname)) return null;
  if (floating && !chat.isOpen) return <button aria-label="Mở chat"
                        className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-2xl bg-[#C59B58] px-4 py-3 text-white shadow-lg"
                        onClick={() => chat.openChat()}><MessageSquare
    size={20}/> Chat {chat.conversations.reduce((sum, row) => sum + row.unreadCount, 0) || ''}</button>;
  return <div
    className={floating ? 'fixed bottom-5 right-5 z-50 flex h-[680px] max-h-[85vh] w-[960px] flex-col overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white shadow-xl' : 'mx-auto flex h-[78vh] min-h-[560px] min-w-[850px] max-w-[1500px] flex-col overflow-hidden rounded-2xl border border-[#EAE4D7] bg-white'}>
    <header className="flex items-center justify-between border-b border-[#EAE4D7] px-4 py-3"><strong>Tin nhắn
      SCANMS</strong>{floating &&
      <div className="flex gap-2"><Button aria-label="Mở chat toàn trang" size="sm" variant="ghost"
                        onClick={() => navigate('/chat')}><Maximize2 size={16}/></Button><Button
        aria-label="Đóng chat" size="sm" variant="ghost" onClick={chat.closeChat}><X size={16}/></Button></div>}
    </header>
    <div className="flex min-h-0 flex-1">
      <aside className="w-[280px] shrink-0 overflow-y-auto border-r border-[#EAE4D7] p-3">
        <input aria-label="Tìm cuộc trò chuyện" value={search} onChange={event => setSearch(event.target.value)}
           placeholder="Tìm cuộc trò chuyện…"
           className="mb-3 w-full rounded-xl border border-[#EAE4D7] p-2 text-sm"/>
        {chat.chatError && !chat.conversations.length &&
          <p role="alert" className="text-sm text-red-600">{chat.chatError}</p>}
        {!chat.conversations.length && <p className="text-sm text-[#7D715E]">Chưa có cuộc trò chuyện.</p>}
        {chat.conversations.filter(row => `${row.peerName} ${row.store.name}`.toLowerCase().includes(search.toLowerCase())).map(row =>
          <button key={row.id} onClick={() => chat.selectConversation(row.id)}
              className={`mb-2 w-full rounded-xl border p-3 text-left text-sm ${chat.activeConversationId === row.id ? 'border-[#C59B58] bg-[#FBF5EB]' : 'border-[#EAE4D7]'}`}>
            <strong>{row.peerName || row.store.name}</strong>{row.unreadCount > 0 &&
            <span className="ml-2 rounded-full bg-[#C59B58] px-2 text-white">{row.unreadCount}</span>}<p
            className="mt-1 truncate text-xs text-[#7D715E]">{preview(row.lastMessage)}</p><p
            className="mt-1 text-[10px] text-[#7D715E]">{row.lastTime}</p></button>)}
        {partners.length > 0 && <><p className="my-3 font-semibold">KOL đã hợp tác</p>{partners.map(partner =>
          <Button key={`${partner.storeId}:${partner.customerId}`} variant="ghost"
              className="mb-2 w-full justify-start" onClick={() => chat.openChat({
            id: partner.storeId,
            name: partner.storeName,
            customerId: partner.customerId
          })}>{partner.name}</Button>)}</>}
        {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
      </aside>
      <main className="min-w-0 flex-1"><StoreChatPanel/></main>
    </div>
  </div>;
}

function useRefCallback<T>(value: T) {
  const ref = useRef(value);
  ref.current = value;
  return ref;
}

function preview(text: string) {
  try {
    const card = JSON.parse(text);
    return card.type === 'COMMISSION_DEAL' ? 'Đề xuất hoa hồng' : card.type === 'SAMPLE_REQUEST' ? 'Yêu cầu hàng mẫu' : card.type === 'PRODUCT_INQUIRY' ? 'Trao đổi sản phẩm' : text;
  } catch {
    return text;
  }
}
