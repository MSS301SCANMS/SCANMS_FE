import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { collaborationChat as service, type ResourceKind } from '@/services/collaboration-chat.service';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const labels: Record<string, string> = {
  PENDING: 'Chờ phản hồi',
  COUNTERED: 'Shop đề xuất lại',
  APPROVED: 'Đã thống nhất',
  REJECTED: 'Đã từ chối',
  CANCELLED: 'Đã hủy',
  SUPERSEDED: 'Đã thay thế',
  ENDED: 'Đã kết thúc',
  SHIPPED: 'Đã gửi hàng',
  RECEIVED: 'Đã nhận hàng'
};

export function CollaborationResourceCard({kind, id, isStoreOwner}: {
  kind: ResourceKind;
  id: string;
  isStoreOwner: boolean
}) {
  const cache = useQueryClient();
  const userId = (() => {
    try {
      return String(JSON.parse(localStorage.getItem('user') || '{}').id || '');
    } catch {
      return '';
    }
  })();
  const key = ['chat-resource', userId, kind, id];
  const resource = useQuery({
    queryKey: key,
    queryFn: () => service.resource(kind, id),
    refetchInterval: 5000,
    retry: false
  });
  const [note, setNote] = useState('');
  const [points, setPoints] = useState(1);
  const [carrier, setCarrier] = useState('');
  const [tracking, setTracking] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const deal = resource.data?.deal, sample = resource.data?.sample;
  const run = async (action: string) => {
    setPending(true);
    setError('');
    try {
      if (deal) await service.negotiate(id, deal.version, action as 'ACCEPT' | 'REJECT' | 'COUNTER', note, points);
      if (sample) await service.sampleDecision(sample, action, note, carrier, tracking);
      await cache.invalidateQueries({queryKey: key});
      await cache.invalidateQueries({queryKey: ['chat-samples']});
      await cache.invalidateQueries({queryKey: ['chat-deals']});
      if (deal) window.dispatchEvent(new Event('commission-deals-updated'));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Chưa xử lý được yêu cầu.');
      void resource.refetch();
    } finally {
      setPending(false);
    }
  };
  if (resource.isPending) return <p role="status">Đang tải đề xuất…</p>;
  if (resource.isError || (!deal && !sample)) return <div role="alert">Không tải được đề xuất hoặc bạn không có
    quyền. <Button size="sm" variant="ghost" onClick={() => void resource.refetch()}>Tải lại</Button></div>;
  const title = deal?.productName || sample?.product.title;
  const status = deal?.status || sample?.status || '';
  const mayReply = deal && ['PENDING', 'COUNTERED'].includes(status) && (deal.proposedByUserId ? deal.proposedByUserId !== userId : isStoreOwner);
  return <article className="w-full rounded-2xl border border-[#EAE4D7] bg-white p-4 text-sm text-[#1A1612]"
          data-testid="collaboration-card">
    <p className="font-semibold">{deal ? 'Thương lượng hoa hồng' : 'Yêu cầu hàng dùng thử'}</p>
    <Link className="mt-2 block font-medium text-[#B88E4F]"
       to={`/products/${deal?.productId || sample?.productId}`}>{title}</Link>
    <p className="my-2">{sample && status === 'APPROVED' ? 'Shop đã duyệt gửi mẫu' : labels[status] || status}</p>
    {deal && <><p>Cơ bản {Number(deal.baseRate)}% + {deal.extraPoints} điểm
      = <strong>{Number(deal.baseRate) + deal.extraPoints}%</strong></p>
      <p className="mt-2 whitespace-pre-wrap">{deal.message}</p>
      {deal.response && <p className="mt-2 whitespace-pre-wrap">Phản hồi mới nhất: {deal.response}</p>}
      <p className="text-xs text-[#7D715E]">Người đề xuất hiện
        tại: {deal.proposedByUserId === userId ? 'Bạn' : isStoreOwner ? deal.collaboratorName : 'Shop'}</p>
      <details className="mt-2">
        <summary>Lịch sử thương lượng</summary>
        {deal.negotiationHistory?.map((event, index) => <p key={index}
                                 className="mt-2 text-xs">{new Date(event.at).toLocaleString('vi-VN')} · {event.actorId === userId ? 'Bạn' : 'Đối tác'} · {Number(event.baseRate) + event.extraPoints}%
          · {event.note}</p>)}</details>
    </>}
    {sample && <><p>{sample.note}</p>{sample.response && <p className="mt-2">Phản hồi: {sample.response}</p>}
      <details className="mt-2">
        <summary>Thông tin nhận hàng (chỉ hai bên)</summary>
        <p>{sample.recipientName} · {sample.recipientPhone}</p><p>{sample.shippingAddress}</p></details>
      {sample.trackingCode && <p className="mt-2">{sample.carrier} · {sample.trackingCode}</p>}
    </>}
    {(mayReply || (sample && (isStoreOwner ? ['PENDING', 'APPROVED'].includes(status) : ['PENDING', 'SHIPPED'].includes(status)))) &&
      <div className="mt-3 space-y-2 border-t border-[#EAE4D7] pt-3">
        <Input aria-label="Phản hồi đề xuất" value={note} onChange={event => setNote(event.target.value)}
           placeholder="Ghi chú / lý do từ chối" maxLength={1000}/>
        {mayReply && <><select aria-label="Mức hoa hồng đề xuất lại" value={points}
                   onChange={event => setPoints(Number(event.target.value))}
                   className="rounded-xl border border-[#EAE4D7] p-2">{[1, 2, 3].map(value =>
          <option key={value} value={value}>Tăng {value} điểm phần trăm</option>)}</select>
          <div className="flex flex-wrap gap-2"><Button size="sm" loading={pending}
                                 onClick={() => void run('ACCEPT')}>Chấp nhận mức
            này</Button><Button size="sm" disabled={pending} variant="outline"
                      onClick={() => void run('COUNTER')}>Đề xuất lại</Button><Button size="sm"
                                                      disabled={pending || !note.trim()}
                                                      variant="ghost"
                                                      onClick={() => void run('REJECT')}>Từ
            chối</Button></div>
        </>}
        {sample && isStoreOwner && status === 'PENDING' &&
          <div className="flex gap-2"><Button loading={pending} size="sm" onClick={() => void run('approve')}>Đồng
            ý gửi mẫu</Button><Button disabled={pending || !note.trim()} size="sm" variant="outline"
                         onClick={() => void run('reject')}>Từ chối</Button></div>}
        {sample && isStoreOwner && status === 'APPROVED' && <><Input value={carrier}
                                      onChange={event => setCarrier(event.target.value)}
                                      placeholder="Đơn vị vận chuyển"/><Input
          value={tracking} onChange={event => setTracking(event.target.value)}
          placeholder="Mã vận đơn đã tạo"/><Button loading={pending}
                              disabled={!carrier.trim() || !tracking.trim()} size="sm"
                              onClick={() => void run('ship')}>Xác nhận đã gửi
          mẫu</Button></>}
        {sample && !isStoreOwner && status === 'PENDING' &&
          <Button size="sm" variant="outline" loading={pending} onClick={() => void run('cancel')}>Hủy yêu
            cầu</Button>}
        {sample && !isStoreOwner && status === 'SHIPPED' &&
          <Button size="sm" loading={pending} onClick={() => void run('receive')}>Đã nhận hàng mẫu</Button>}
      </div>}
    {error && <p role="alert" className="mt-2 text-red-600">{error}</p>}
  </article>;
}
