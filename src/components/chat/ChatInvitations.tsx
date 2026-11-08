import { useState } from 'react';
import { Check, Handshake, MessageSquare, X } from 'lucide-react';
import { partnershipInvitationsService, type PartnershipInvitation } from '@/services/partnership-invitations.service';
import { Button } from '@/components/ui/Button';
import { ChatAvatar } from './ChatAvatar';

const statusLabels: Record<string, string> = {
  PENDING: 'Chờ phản hồi', ACCEPTED: 'Đã liên kết hợp tác', REJECTED: 'Đã từ chối', CANCELLED: 'Đã thu hồi',
};

export function ChatInvitations({ rows, shop, onChanged, onOpen }: {
  rows: PartnershipInvitation[]; shop: boolean; onChanged: () => Promise<unknown>;
  onOpen: (invitation: PartnershipInvitation) => void;
}) {
  const [pending, setPending] = useState('');
  const [error, setError] = useState('');
  const respond = async (row: PartnershipInvitation, decision: 'ACCEPTED' | 'REJECTED' | 'CANCELLED') => {
    setPending(row.id); setError('');
    try {
      if (decision === 'CANCELLED') await partnershipInvitationsService.cancel(row.id);
      else await partnershipInvitationsService.respond(row.id, decision);
      await onChanged();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Chưa cập nhật được lời mời.'); }
    finally { setPending(''); }
  };
  return <div className="store-chat-invitations">
    {error && <p className="store-chat-error" role="alert">{error}</p>}
    {!rows.length && <div className="store-chat-side-empty"><Handshake size={28} /><p>Chưa có lời mời hợp tác.</p></div>}
    {rows.map(row => <article key={row.id} className="store-chat-invitation">
      <div className="store-chat-partner-name"><ChatAvatar name={shop ? row.collaboratorName : row.storeName} small />
        <div><strong>{shop ? row.collaboratorName : row.storeName}</strong><small>{statusLabels[row.status] || row.status}</small></div></div>
      {row.productName && <p className="store-chat-invitation-product">{row.productName}</p>}
      <p className="store-chat-invitation-note">{row.message}</p>
      <time>{new Date(row.createdAt).toLocaleDateString('vi-VN')}</time>
      <div className="store-chat-invitation-actions">
        {!shop && row.status === 'PENDING' && <>
          <Button size="sm" loading={pending === row.id} onClick={() => void respond(row, 'ACCEPTED')}><Check size={14} />Chấp nhận</Button>
          <Button size="sm" variant="ghost" disabled={Boolean(pending)} onClick={() => void respond(row, 'REJECTED')}><X size={14} />Từ chối</Button>
        </>}
        {shop && row.status === 'PENDING' && <Button size="sm" variant="ghost" disabled={Boolean(pending)}
          onClick={() => void respond(row, 'CANCELLED')}>Thu hồi lời mời</Button>}
        {row.status === 'ACCEPTED' && <Button size="sm" variant="outline" onClick={() => onOpen(row)}><MessageSquare size={14} />Nhắn tin</Button>}
      </div>
    </article>)}
  </div>;
}
