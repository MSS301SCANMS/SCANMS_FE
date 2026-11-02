import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useScanmsChat } from '@/context/ScanmsChatContext';
import { Button } from '@/components/ui/Button';
import { CollaborationChatComposer } from './CollaborationChatComposer';
import { CollaborationResourceCard } from './CollaborationResourceCard';
import { parseCollaborationResource } from '@/utils/chat-resource.utils';

export function StoreChatPanel() {
  const chat = useScanmsChat();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const scroll = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const lastConversation = useRef('');
  const row = chat.activeConversation;
  const id = row?.id || '';
  useEffect(() => {
    if (lastConversation.current !== id) {
      nearBottom.current = true;
      lastConversation.current = id;
    }
    if (nearBottom.current && scroll.current) scroll.current.scrollTop = scroll.current.scrollHeight;
  }, [id, row?.messages]);
  if (!row) return <div className="grid h-full place-items-center p-8 text-[#7D715E]">Chọn cuộc trò chuyện để bắt đầu.
    Bạn có thể nhắn tin từ trang shop hoặc sản phẩm.</div>;
  const send = async () => {
    const text = drafts[id] || '';
    if (!text.trim()) return;
    if (await chat.sendMessage(text)) setDrafts(value => ({...value, [id]: value[id] === text ? '' : value[id]}));
  };
  return <section className="flex h-full min-h-0 flex-col bg-white" aria-label="Nội dung cuộc trò chuyện">
    <header className="border-b border-[#EAE4D7] px-4 py-3"><strong>{row.peerName || row.store.name}</strong><p
      className="text-xs text-[#7D715E]" role="status">{chat.connectionState}</p></header>
    {chat.chatError && <p className="border-b border-red-100 bg-red-50 px-4 py-2 text-xs text-red-700"
               role="alert">{chat.chatError}</p>}
    <div ref={scroll} onScroll={event => {
      const el = event.currentTarget;
      nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    }} className="min-h-0 flex-1 space-y-3 overflow-y-auto bg-[#FAF8F5] p-4" data-testid="chat-history">
      {chat.hasOlderMessages &&
        <Button size="sm" variant="ghost" loading={chat.loadingMessages} onClick={async () => {
          const previous = scroll.current?.scrollHeight || 0, top = scroll.current?.scrollTop || 0;
          nearBottom.current = false;
          await chat.loadOlderMessages();
          requestAnimationFrame(() => {
            if (scroll.current) scroll.current.scrollTop = top + scroll.current.scrollHeight - previous;
          });
        }}>Xem tin nhắn cũ hơn</Button>}
      {chat.loadingMessages && !row.messages.length && <p role="status">Đang tải tin nhắn…</p>}
      {!chat.loadingMessages && !row.messages.length &&
        <p className="text-sm text-[#7D715E]">Chưa có tin nhắn. Hãy gửi lời chào.</p>}
      {row.messages.map(message => {
        const card = parseCollaborationResource(message.content);
        return <div key={message.id}
              className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}
              data-message-id={message.id}>
          <div className="max-w-[90%] space-y-2">
            {card ? <CollaborationResourceCard kind={card.type} id={card.resourceId}
                             isStoreOwner={Boolean(row.isStoreOwner)}/>
              : message.product ? <Link to={`/products/${message.product.id}`}
                           className="block rounded-xl border border-[#EAE4D7] bg-white p-3 text-sm"><strong>{message.product.title || 'Đang tải sản phẩm…'}</strong>
                  <p>{Number(message.product.price).toLocaleString('vi-VN')} ₫</p><span
                    className="text-[#B88E4F]">Xem sản phẩm</span></Link>
                :
                <p className={`whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm ${message.sender === 'user' ? 'bg-[#C59B58] text-white' : 'border border-[#EAE4D7] bg-white'}`}>{message.content}</p>}
            <p className="text-xs text-[#7D715E]">{message.timestamp} · {message.delivery === 'sending' ? 'Đang gửi' : message.delivery === 'failed' ? 'Gửi thất bại' : 'Đã gửi'}{message.delivery === 'failed' &&
              <button className="ml-2 underline" onClick={() => void chat.retryMessage(message.id)}>Gửi
                lại</button>}</p>
          </div>
        </div>;
      })}
    </div>
    <CollaborationChatComposer/>
    {chat.activeProduct &&
      <div className="flex items-center justify-between border-t border-[#EAE4D7] px-3 py-2 text-sm"><span>Đang hỏi: {chat.activeProduct.title}</span><Button
        size="sm" onClick={async () => {
        if (chat.activeProduct && await chat.sendProductsInquiry([chat.activeProduct])) chat.clearActiveProduct();
      }}>Gửi sản phẩm</Button></div>}
    <form className="flex gap-2 border-t border-[#EAE4D7] p-3" onSubmit={event => {
      event.preventDefault();
      void send();
    }}>
      <textarea aria-label="Tin nhắn" value={drafts[id] || ''} maxLength={10000}
           onChange={event => setDrafts(value => ({...value, [id]: event.target.value}))}
           onKeyDown={event => {
             if (event.key === 'Enter' && !event.shiftKey) {
               event.preventDefault();
               void send();
             }
           }} placeholder="Nhập tin nhắn…" rows={2}
           className="min-w-0 flex-1 resize-none rounded-xl border border-[#EAE4D7] p-2 text-sm"/>
      <Button type="submit" disabled={!drafts[id]?.trim()}>Gửi</Button>
    </form>
  </section>;
}
