import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useScanmsChat } from '@/context/ScanmsChatContext';
import { Button } from '@/components/ui/Button';
import { CollaborationChatComposer } from './CollaborationChatComposer';
import { CollaborationResourceCard } from './CollaborationResourceCard';
import { parseCollaborationResource } from '@/utils/chat-resource.utils';
import { CheckCheck, Handshake, ImagePlus, Loader2, Package, Paperclip, Send, X } from 'lucide-react';
import type { ResourceKind } from '@/services/collaboration-chat.service';
import { ChatAvatar } from './ChatAvatar';
import { StoreChatAttachment } from './StoreChatAttachment';
import { attachmentError, attachmentSize, CHAT_DOCUMENT_ACCEPT, CHAT_IMAGE_ACCEPT, parseChatAttachment } from '@/utils/chat-attachment.utils';

export function StoreChatPanel({ canCollaborate = false, composerMode = '', onComposerModeChange }: {
  canCollaborate?: boolean; composerMode?: ResourceKind | ''; onComposerModeChange?: (value: ResourceKind | '') => void;
}) {
  const chat = useScanmsChat();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const scroll = useRef<HTMLDivElement>(null);
  const nearBottom = useRef(true);
  const lastConversation = useRef('');
  const [files, setFiles] = useState<Record<string, File | undefined>>({});
  const [fileError, setFileError] = useState('');
  const [preview, setPreview] = useState('');
  const imageInput = useRef<HTMLInputElement>(null);
  const documentInput = useRef<HTMLInputElement>(null);
  const row = chat.activeConversation;
  const id = row?.id || '';
  const selectedFile = files[id];
  useEffect(() => {
    setFileError('');
    if (!selectedFile || !/\.(jpe?g|png|webp)$/i.test(selectedFile.name)) { setPreview(''); return; }
    const url = URL.createObjectURL(selectedFile);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [id, selectedFile]);
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
    setFileError('');
    const text = drafts[id] || '';
    if (selectedFile) {
      try {
        await chat.sendAttachment(selectedFile, preview ? 'IMAGE' : 'DOCUMENT');
        setFiles(value => ({ ...value, [id]: undefined }));
      } catch (error) {
        setFileError(error instanceof Error ? error.message : 'Không gửi được tệp.');
        return;
      }
    }
    if (!text.trim()) return;
    if (await chat.sendMessage(text)) setDrafts(value => ({...value, [id]: value[id] === text ? '' : value[id]}));
  };
  return <section className="store-chat-thread" aria-label="Nội dung cuộc trò chuyện">
    <div ref={scroll} onScroll={event => {
      const el = event.currentTarget;
      nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    }} className="store-chat-history" data-testid="chat-history">
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
      {!chat.loadingMessages && !row.messages.length && <div className="store-chat-panel-empty"><Handshake size={30} />
        <h3>Cùng bắt đầu cuộc trò chuyện</h3><p>Gửi lời chào hoặc chọn một sản phẩm để trao đổi với {row.peerName || row.store.name}.</p></div>}
      {row.messages.map(message => {
        const card = parseCollaborationResource(message.content);
        const attachment = parseChatAttachment(message.content);
        return <div key={message.id} id={card ? `chat-resource-${card.resourceId}` : undefined}
              className={`store-chat-message${message.sender === 'user' ? ' store-chat-message--own' : ''}`}
              data-message-id={message.id}>
          {message.sender !== 'user' && <ChatAvatar small name={message.senderName || row.peerName || row.store.name} src={!row.isStoreOwner ? row.store.logoUrl : undefined} />}
          <div className="store-chat-message-body">
            <span className="store-chat-message-author">{message.sender === 'user' ? 'Bạn' : message.senderName || row.peerName || row.store.name}</span>
            {attachment ? <StoreChatAttachment card={attachment} conversationId={id} sent={message.delivery === 'sent'} />
              : card ? <CollaborationResourceCard kind={card.type} id={card.resourceId}
                             isStoreOwner={Boolean(row.isStoreOwner)}/>
              : message.product ? <Link to={`/products/${message.product.id}`}
                           className="block rounded-xl border border-[#EAE4D7] bg-white p-3 text-sm"><strong>{message.product.title || 'Đang tải sản phẩm…'}</strong>
                  <p>{Number(message.product.price).toLocaleString('vi-VN')} ₫</p><span
                    className="text-[#B88E4F]">Xem sản phẩm</span></Link>
                :
                <p className="store-chat-message-text">{message.content}</p>}
            <p className="store-chat-message-meta">{message.timestamp} · {message.delivery === 'sending' ? `Đang gửi${message.uploadProgress !== undefined ? ` ${message.uploadProgress}%` : ''}` : message.delivery === 'failed' ? 'Gửi thất bại' : 'Đã gửi'}
              {message.delivery === 'sending' ? <Loader2 size={11} className="animate-spin" /> : message.delivery !== 'failed' && message.sender === 'user' ? <CheckCheck size={12} /> : null}
              {message.delivery === 'failed' &&
              <button className="ml-2 underline" onClick={() => void chat.retryMessage(message.id)}>Gửi
                lại</button>}</p>
          </div>
        </div>;
      })}
    </div>
    {canCollaborate && <CollaborationChatComposer mode={composerMode} onModeChange={onComposerModeChange} hideActions />}
    {chat.activeProduct &&
      <div className="flex items-center justify-between border-t border-[#EAE4D7] px-3 py-2 text-sm"><span>Đang hỏi: {chat.activeProduct.title}</span><Button
        size="sm" onClick={async () => {
        if (chat.activeProduct && await chat.sendProductsInquiry([chat.activeProduct])) chat.clearActiveProduct();
      }}>Gửi sản phẩm</Button></div>}
    <form className="store-chat-composer" onSubmit={event => { event.preventDefault(); void send(); }}>
    {selectedFile && <div className="store-chat-file-preview" data-testid="chat-attachment-preview">
      {preview && <img src={preview} alt="Ảnh chuẩn bị gửi" className="h-14 w-14 rounded-lg object-cover" />}
      <div><p>{selectedFile.name}</p><small>{attachmentSize(selectedFile.size)}</small></div>
      <Button type="button" size="sm" variant="ghost" aria-label="Bỏ tệp đính kèm" onClick={() => setFiles(value => ({ ...value, [id]: undefined }))}><X size={16} /></Button>
    </div>}
    {fileError && <p role="alert" className="px-3 py-1 text-xs text-red-700">{fileError}</p>}
      <div className="store-chat-composer-tools">
        <button type="button" aria-label="Gửi ảnh" onClick={() => imageInput.current?.click()}><ImagePlus size={18} />Ảnh</button>
        <button type="button" aria-label="Gửi tài liệu" onClick={() => documentInput.current?.click()}><Paperclip size={18} />Tài liệu</button>
        {canCollaborate && <><button type="button" aria-label="Đề xuất hoa hồng" onClick={() => onComposerModeChange?.(composerMode === 'COMMISSION_DEAL' ? '' : 'COMMISSION_DEAL')}><Handshake size={18} />Hoa hồng</button>
          <button type="button" aria-label="Xin hàng dùng thử" onClick={() => onComposerModeChange?.(composerMode === 'SAMPLE_REQUEST' ? '' : 'SAMPLE_REQUEST')}><Package size={18} />Hàng mẫu</button></>}
        <small>Tối đa 10 MB/tệp</small>
        {([['Ảnh', CHAT_IMAGE_ACCEPT, imageInput], ['Tài liệu', CHAT_DOCUMENT_ACCEPT, documentInput]] as const).map(([label, accept, ref]) =>
          <input key={label} ref={ref} type="file" accept={accept} className="hidden" aria-label={`Chọn ${label.toLowerCase()}`} onChange={event => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (!file) return;
            const error = attachmentError(file);
            setFileError(error || '');
            if (!error) setFiles(value => ({ ...value, [id]: file }));
          }} />)}
      </div>
      <div className="store-chat-composer-row">
        <textarea aria-label="Tin nhắn" value={drafts[id] || ''} maxLength={10000}
          onChange={event => setDrafts(value => ({...value, [id]: event.target.value}))}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              void send();
            }
          }} placeholder="Nhập tin nhắn…" rows={1} />
        <button type="submit" className="store-chat-send" aria-label="Gửi tin nhắn" disabled={!drafts[id]?.trim() && !selectedFile}><Send size={20} /><span className="sr-only">Gửi</span></button>
      </div>
    </form>
  </section>;
}
