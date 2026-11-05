import { useEffect, useRef, useState } from 'react';
import { Download, FileText, ImageIcon, X } from 'lucide-react';
import { storeChatService } from '@/services/store-chat.service';
import { attachmentSize, type ChatAttachmentCard } from '@/utils/chat-attachment.utils';
import { Button } from '@/components/ui/Button';

export function StoreChatAttachment({ card, conversationId, sent }: {
  card: ChatAttachmentCard; conversationId: string; sent: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const [image, setImage] = useState('');
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  useEffect(() => {
    if (!sent || card.mediaType !== 'IMAGE') return;
    let cancelled = false, url = '', started = false;
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting) || started) return;
      started = true;
      observer.disconnect();
      void storeChatService.download(conversationId, card.attachmentId).then(blob => {
        if (cancelled) return;
        url = URL.createObjectURL(blob);
        setImage(url);
        setError('');
      }).catch(() => { if (!cancelled) setError('Chưa tải được ảnh.'); });
    });
    if (root.current) observer.observe(root.current);
    return () => { cancelled = true; observer.disconnect(); if (url) URL.revokeObjectURL(url); };
  }, [conversationId, card.attachmentId, card.mediaType, sent, attempt]);
  useEffect(() => {
    if (!expanded) return;
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [expanded]);
  const download = async () => {
    setDownloading(true);
    try {
      const blob = await storeChatService.download(conversationId, card.attachmentId);
      if (!mounted.current) return;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = card.fileName;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setError('');
    } catch { if (mounted.current) setError('Không tải được tệp. Vui lòng thử lại.'); }
    finally { if (mounted.current) setDownloading(false); }
  };
  return <div ref={root} className="max-w-[340px] space-y-2 rounded-xl border border-[#EAE4D7] bg-white p-3">
    {image ? <button type="button" aria-label={`Xem ảnh ${card.fileName}`} onClick={() => setExpanded(true)}>
      <img src={image} alt={card.fileName} className="max-h-52 max-w-full rounded-lg object-contain" />
    </button> : <div className="flex items-center gap-2 text-[#B88E4F]">
      {card.mediaType === 'IMAGE' ? <ImageIcon size={24} /> : <FileText size={24} />}
      <span className="text-xs">{card.mediaType === 'IMAGE' ? 'Hình ảnh' : 'Tài liệu'}</span>
    </div>}
    <p className="break-all text-sm font-semibold">{card.fileName}</p>
    <div className="flex items-center justify-between gap-3 text-xs text-[#7D715E]">
      <span>{attachmentSize(card.sizeBytes)}</span>
      {sent && <Button type="button" size="sm" variant="ghost" loading={downloading}
        aria-label={`Tải xuống ${card.fileName}`} onClick={() => void download()}><Download size={14} /> Tải xuống</Button>}
    </div>
    {error && <p className="text-xs text-red-700" role="alert">{error} <button type="button" className="underline"
      onClick={() => { setError(''); setAttempt(value => value + 1); }}>Thử lại</button></p>}
    {expanded && image && <div role="dialog" aria-modal="true" aria-label={`Ảnh ${card.fileName}`}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/85 p-8"
      onClick={() => setExpanded(false)}>
      <button type="button" autoFocus aria-label="Đóng xem ảnh" className="absolute right-6 top-6 rounded-full bg-white p-2"
        onClick={() => setExpanded(false)}><X /></button>
      <img src={image} alt={card.fileName} className="max-h-[85vh] max-w-[90vw] object-contain" onClick={event => event.stopPropagation()} />
    </div>}
  </div>;
}
