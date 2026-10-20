import { useEffect, useRef, useState } from 'react';
import { Crown, Gift, CheckCircle2, XCircle, Clock3, CalendarDays } from 'lucide-react';
import api from '../../services/api';

function campaignDate(value?: string) {
  if (!value || !Number.isFinite(new Date(value).getTime())) return { date: 'Chưa xác định', time: '' };
  const date = new Date(value);
  return {
    date: date.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric' }),
    time: date.toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', hour12: false }),
  };
}

export function CampaignCardBubble({ card, isMine, participantId, onRespond }: {
  card: any;
  isMine: boolean;
  participantId?: string;
  onRespond?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [statusOverride, setStatusOverride] = useState<'ACCEPTED' | 'REJECTED' | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const effectiveParticipantId = participantId || card.participantId;
  const pending = useRef(false);
  const [currentState, setCurrentState] = useState<{ status: string; isActive: boolean; endDate: string } | null>(null);
  const [stateRevision, setStateRevision] = useState(0);
  useEffect(() => {
    if (card.type !== 'CAMPAIGN_INVITE' || !effectiveParticipantId) return;
    const controller = new AbortController();
    setCurrentState(null); setFeedbackError(null);
    const sync = () => void api.get(`/campaigns/invitations/${effectiveParticipantId}/state`, { signal: controller.signal, headers: { 'x-skip-cache': '1' } }).then(response => {
      if (!controller.signal.aborted) setCurrentState(response.data);
    }).catch(() => { if (!controller.signal.aborted) setFeedbackError('Không đồng bộ được trạng thái lời mời. Hãy thử lại.'); });
    sync();
    window.addEventListener('focus', sync);
    return () => { controller.abort(); window.removeEventListener('focus', sync); };
  }, [card.type, effectiveParticipantId, stateRevision]);

  const respond = async (decision: 'ACCEPTED' | 'REJECTED') => {
    if (pending.current || !currentState || currentState.status !== 'INVITED') return;
    if (!effectiveParticipantId) {
      setFeedbackError('Không tìm thấy mã định danh lời mời.');
      return;
    }
    pending.current = true;
    setLoading(true);
    setFeedbackError(null);
    try {
      await api.patch(`/campaigns/invitations/${effectiveParticipantId}/${decision === 'ACCEPTED' ? 'accept' : 'reject'}`, {});
      setStatusOverride(decision);
      onRespond?.();
    } catch (error: any) {
      setFeedbackError(error?.response?.data?.message || 'Không thể phản hồi lời mời lúc này.');
    } finally {
      pending.current = false;
      setLoading(false);
    }
  };

  const status = statusOverride || (currentState?.status === 'ACCEPTED' || currentState?.status === 'REJECTED' ? currentState.status : card.type === 'CAMPAIGN_ACCEPTED' ? 'ACCEPTED' : card.type === 'CAMPAIGN_REJECTED' ? 'REJECTED' : 'PENDING');
  const isExpired = currentState?.isActive === false || (!!(currentState?.endDate || card.endDate) && new Date(currentState?.endDate || card.endDate) <= new Date());
  const start = campaignDate(card.startDate);
  const end = campaignDate(card.endDate);

  if (status !== 'PENDING') return (
    <div className="flex items-start gap-2.5 w-[330px] max-w-full p-3 sm:px-3.5 border border-[#EAE4D7] rounded-xl bg-white text-[#1A1612]" role="status">
      {status === 'ACCEPTED' ? <CheckCircle2 size={18} className="text-[#059669] shrink-0 mt-0.5" /> : <XCircle size={18} className="text-[#7D715E] shrink-0 mt-0.5" />}
      <div>
        <strong className="text-xs font-semibold text-[#1A1612]">{status === 'ACCEPTED' ? 'Đã chấp nhận chiến dịch' : 'Đã từ chối chiến dịch'}</strong>
        <p className="m-0 my-1 text-[11px] break-all text-[#1A1612]">{card.campaignName}</p>
        <span className="text-[10px] leading-relaxed text-[#7D715E]">{status === 'ACCEPTED' ? 'Hoa hồng thưởng thêm đã được kích hoạt.' : 'Phản hồi đã được gửi tới đối tác.'}</span>
      </div>
    </div>
  );

  return (
    <div className="w-[330px] max-w-full border border-[#EEDFC6] rounded-2xl overflow-hidden bg-white text-[#1A1612] shadow-[0_3px_12px_rgba(35,29,21,0.03)] text-left">
      <header className="flex items-center gap-2.5 px-3.5 py-3 bg-[#FAF8F5] border-b border-[#EAE4D7]">
        <span className="grid place-items-center shrink-0 w-[34px] h-[34px] border border-[#EEDFC6] rounded-[10px] bg-[#FBF5EB] text-[#B88E4F]">
          <Crown size={18} />
        </span>
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] leading-3.5 text-[#7D715E]">Lời mời hợp tác</span>
          <strong className="text-[13px] leading-[18px] font-semibold text-[#1A1612]">Chiến dịch VIP</strong>
        </div>
        <span className="ml-auto px-2 py-0.5 border border-[#EEDFC6] rounded-md text-[#8C6226] bg-[#FBF5EB] text-[9px] font-semibold tracking-wider">VIP</span>
      </header>
      <div className="p-3.5">
        <h3 className="m-0 text-[15px] font-semibold leading-snug break-words text-[#1A1612]">{card.campaignName}</h3>
        {card.storeName && <p className="m-0 mt-1 text-[11px] text-[#7D715E] leading-relaxed break-words">Gian hàng <strong className="font-medium text-[#1A1612] ml-1">{card.storeName}</strong></p>}
        <div className="flex items-center justify-between gap-2.5 my-3 p-3 border border-[#EEDFC6] bg-[#FBF5EB] rounded-[10px]">
          <span className="flex items-center gap-2 text-[11px] font-medium text-[#1A1612]">
            <Gift size={16} className="shrink-0 text-[#B88E4F]" />
            <span>
              Hoa hồng thưởng thêm
              <small className="block mt-0.5 text-[#7D715E] text-[9px] font-normal">Cộng vào hoa hồng sản phẩm</small>
            </span>
          </span>
          <strong className="text-[#B88E4F] text-2xl font-semibold whitespace-nowrap tabular-nums">+{card.bonusCommissionRate}<small className="inline text-sm font-medium text-inherit">%</small></strong>
        </div>
        {card.personalMessage && <blockquote className="m-0 mb-3 pl-2.5 border-l-2 border-[#EEDFC6] text-[#7D715E] text-[11px] leading-relaxed break-words whitespace-pre-wrap">{card.personalMessage}</blockquote>}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <span className="flex items-center gap-1 text-[#7D715E] text-[10px]"><CalendarDays size={12} />Bắt đầu</span>
            <strong className="text-[11px] font-medium tabular-nums text-[#1A1612]">{start.date}</strong>
            <small className="text-[#7D715E] text-[10px] tabular-nums">{start.time}</small>
          </div>
          <div className="flex flex-col gap-1 pl-3 border-l border-[#EAE4D7]">
            <span className="flex items-center gap-1 text-[#7D715E] text-[10px]">Kết thúc</span>
            <strong className="text-[11px] font-medium tabular-nums text-[#1A1612]">{end.date}</strong>
            <small className="text-[#7D715E] text-[10px] tabular-nums">{end.time}</small>
          </div>
        </div>
        {feedbackError && <p className="m-0 mt-2.5 text-[11px] leading-relaxed text-[#DC2626]" role="alert">{feedbackError} <button type="button" className="underline" onClick={() => setStateRevision(value => value + 1)}>Thử lại</button></p>}
      </div>
      <footer className="px-3.5 py-2.5 border-t border-[#EAE4D7] bg-[#FAF8F5]">
        {isExpired ? (
          <div className="flex items-center gap-2 text-[11px] text-[#7D715E]"><Clock3 size={13} className="text-[#B88E4F] shrink-0" /><span>Chiến dịch đã kết thúc</span></div>
        ) : isMine ? (
          <div className="flex items-center gap-2 text-[11px] text-[#7D715E]"><Clock3 size={13} className="text-[#B88E4F] shrink-0" /><span>Đã gửi lời mời<small className="block text-[10px] mt-0.5">Đang chờ đối tác phản hồi</small></span></div>
        ) : (
          <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-2">
            <button type="button" id={`btn-reject-campaign-${card.campaignId}`} disabled={loading || !currentState} onClick={() => void respond('REJECTED')} className="min-h-[34px] px-2.5 py-1.5 border border-[#EAE4D7] rounded-lg bg-white text-[#7D715E] text-[11px] hover:bg-[#F3EFE6] cursor-pointer disabled:opacity-55">Từ chối</button>
            <button type="button" id={`btn-accept-campaign-${card.campaignId}`} disabled={loading || !currentState} onClick={() => void respond('ACCEPTED')} className="min-h-[34px] px-2.5 py-1.5 border border-[#EEDFC6] rounded-lg bg-[#FBF5EB] text-[#1A1612] text-[11px] font-semibold hover:bg-[#F3EFE6] cursor-pointer disabled:opacity-55">{loading ? 'Đang xử lý…' : (!currentState ? 'Đang đồng bộ…' : 'Chấp nhận lời mời')}</button>
          </div>
        )}
      </footer>
    </div>
  );
}
