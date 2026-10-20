import { useEffect, useRef, useState } from 'react';
import { Crown, X, Search, Send, Loader2, Users, Plus, Check } from 'lucide-react';
import api from '../../services/api';
import { Select } from '../ui/Select';
import { DateTimePicker } from '../common/DateTimePicker';
import type { Campaign } from '@/types/campaigns.types';
import type { ChatMessage } from '@/types/chat.types';

interface Props {
  conversationId?: string;
  collaboratorName?: string;
  onClose: () => void;
  onSuccess: (message: ChatMessage) => void;
}
interface Recipient {
  id: string; fullName: string; email: string; avatarUrl?: string;
  collaboratorProfile?: { avatarUrl?: string };
}

const localDateTime = (date: Date) => new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

export function SendVipCampaignModal({ conversationId, collaboratorName, onClose, onSuccess }: Props) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [recipientId, setRecipientId] = useState('');
  const [campaignId, setCampaignId] = useState('');
  const [query, setQuery] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [sendError, setSendError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [reload, setReload] = useState(0);
  const [unavailableCount, setUnavailableCount] = useState(0);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdCampaignId, setCreatedCampaignId] = useState('');
  const [draft, setDraft] = useState(() => ({ name: '', rate: '5', start: localDateTime(new Date()), end: localDateTime(new Date(Date.now() + 7 * 86400000)) }));
  const sending = useRef(false);
  const creatingRef = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const busy = submitting || saving;
  const recipientSearchRef = useRef<HTMLInputElement>(null);
  const sendButtonRef = useRef<HTMLButtonElement>(null);
  const datePopoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setLoadError('');
    const load = async () => {
      try {
        const [campaignRes, recipientRes]: any[] = await Promise.all([
          api.get('/campaigns/shop', { headers: { 'x-skip-cache': '1' } }),
          conversationId ? Promise.resolve([]) : api.get('/chat/search-collaborators'),
        ]);
        if (cancelled) return;
        const list = campaignRes?.data || campaignRes;
        const people = recipientRes?.data || recipientRes;
        if (!Array.isArray(list) || !Array.isArray(people)) throw new Error('Dữ liệu lời mời chưa hợp lệ. Vui lòng tải lại.');
        const active = list.filter((campaign: Campaign) => campaign.isActive && new Date(campaign.endDate).getTime() >= Date.now());
        setCampaigns(active); setRecipients(people); setUnavailableCount(list.length - active.length);
        setCampaignId(previous => active.some((campaign: Campaign) => campaign.id === previous) ? previous : active[0]?.id || '');
      } catch (error: any) {
        if (!cancelled) setLoadError(error.message || 'Không tải được dữ liệu lời mời.');
      } finally { if (!cancelled) setLoading(false); }
    };
    void load();
    return () => { cancelled = true; };
  }, [conversationId, reload]);

  useEffect(() => {
    const previousFocus = document.activeElement as HTMLElement | null;
    dialogRef.current?.focus();
    return () => { if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);

  useEffect(() => {
    if (!createdCampaignId || creating || saving) return;
    if (conversationId) sendButtonRef.current?.focus();
    else recipientSearchRef.current?.focus();
  }, [createdCampaignId, creating, saving, conversationId]);

  const selectedRecipient = recipients.find(person => person.id === recipientId);
  const selectedCampaign = campaigns.find(campaign => campaign.id === campaignId);
  const visibleRecipients = recipients.filter(person => `${person.fullName} ${person.email}`.toLocaleLowerCase('vi-VN').includes(query.trim().toLocaleLowerCase('vi-VN')));
  const recipientName = conversationId ? collaboratorName || 'KOL/CTV' : selectedRecipient?.fullName;
  const canSend = !loading && !loadError && !busy && !creating && Boolean(selectedCampaign && (conversationId || selectedRecipient));

  const createCampaign = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (creatingRef.current || busy) return;
    setCreateError('');
    const start = new Date(draft.start), end = new Date(draft.end), rate = Number(draft.rate);
    if (!draft.name.trim()) { setCreateError('Vui lòng nhập tên chiến dịch.'); return; }
    if (!draft.rate.trim() || !Number.isFinite(rate) || rate < 0 || rate > 100) { setCreateError('Hoa hồng thưởng thêm phải từ 0 đến 100%.'); return; }
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start || end <= new Date()) { setCreateError('Ngày kết thúc phải sau ngày bắt đầu và thời điểm hiện tại.'); return; }
    creatingRef.current = true; setSaving(true);
    try {
      const response: any = await api.post('/campaigns', { name: draft.name.trim(), bonusCommissionRate: rate, startDate: start.toISOString(), endDate: end.toISOString() });
      const campaign: Campaign = response?.data || response;
      if (!campaign?.id || !campaign.isActive || !(new Date(campaign.endDate).getTime() >= Date.now())) throw new Error('Máy chủ chưa xác nhận chiến dịch còn hiệu lực. Hãy tải lại trước khi thử tạo thêm.');
      setCampaigns(previous => [campaign, ...previous.filter(item => item.id !== campaign.id)]);
      setCampaignId(campaign.id); setCreatedCampaignId(campaign.id); setCreating(false); setSendError('');
    } catch (error: any) { setCreateError(error.message || 'Không tạo được chiến dịch. Vui lòng thử lại.'); }
    finally { creatingRef.current = false; setSaving(false); }
  };

  const submit = async () => {
    if (!canSend || sending.current) return;
    sending.current = true; setSubmitting(true); setSendError('');
    try {
      const personalMessage = note.trim() || undefined;
      const response: any = conversationId
        ? await api.post(`/campaigns/chat/${conversationId}/invite`, { campaignId, personalMessage })
        : await api.post(`/campaigns/${campaignId}/invite`, { collaboratorId: recipientId, personalMessage });
      const result = response?.data || response;
      if (!result?.chatMessage?.id || !result.chatMessage.conversationId) throw new Error('Máy chủ chưa xác nhận lời mời. Vui lòng thử lại.');
      onSuccess(result.chatMessage); onClose();
    } catch (error: any) { setSendError(error.message || 'Không gửi được lời mời. Vui lòng thử lại.'); }
    finally { sending.current = false; setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-60 p-4 flex items-center justify-center bg-[#231D15]/35 backdrop-blur-xs" onClick={() => { if (!busy) onClose(); }}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="vip-campaign-title"
        className="w-full max-w-[480px] max-h-[calc(100dvh-32px)] flex flex-col bg-white text-[#1A1612] border border-[#EAE4D7] rounded-[20px] shadow-[0_24px_80px_rgba(35,29,21,0.15)] outline-none overflow-hidden"
        onClick={event => event.stopPropagation()}
        onKeyDown={event => {
          if (event.key === 'Escape' && !busy) { event.stopPropagation(); onClose(); }
          if (event.key === 'Tab') {
            const elements = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), textarea:not([disabled]), [tabindex="0"]')).filter(element => element.getClientRects().length);
            const first = elements[0], last = elements[elements.length - 1];
            if (!first) { event.preventDefault(); return; }
            if (event.shiftKey && (document.activeElement === first || document.activeElement === event.currentTarget)) { event.preventDefault(); last.focus(); }
            else if (!event.shiftKey && (document.activeElement === last || document.activeElement === event.currentTarget)) { event.preventDefault(); first.focus(); }
          }
        }}
      >
        <header className="p-4 sm:p-5 flex items-center gap-2.5 sm:gap-3 border-b border-[#EAE4D7]">
          <span className="grid place-items-center w-[42px] h-[42px] rounded-[13px] bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] shrink-0"><Crown size={22} /></span>
          <div>
            <h3 id="vip-campaign-title" className="text-lg sm:text-[19px] leading-snug font-semibold tracking-tight text-[#1A1612] m-0">Mời chiến dịch VIP</h3>
            <p className="text-[11px] text-[#7D715E] m-0 mt-1 leading-relaxed">{creating ? 'Thiết lập chiến dịch để tiếp tục gửi lời mời.' : conversationId ? 'Chọn chiến dịch để mời KOL đang trò chuyện.' : 'Chọn KOL và chiến dịch để gửi lời mời.'}</p>
          </div>
          <button type="button" aria-label="Đóng" disabled={busy} onClick={onClose} className="ml-auto shrink-0 grid place-items-center w-7 h-7 border-0 rounded-lg bg-[#FAF8F5] text-[#7D715E] hover:bg-[#FBF5EB] hover:text-[#1A1612] cursor-pointer transition-colors"><X size={18} /></button>
        </header>

        <div className="p-4 sm:p-5 overflow-y-auto min-h-0 [scrollbar-width:thin]" aria-busy={loading}>
          {loading ? (
            <div className="min-h-[140px] flex flex-col justify-center items-center gap-3 text-center text-xs text-[#7D715E]"><Loader2 className="animate-spin text-[#B88E4F]" size={22} />Đang tải KOL và chiến dịch…</div>
          ) : loadError ? (
            <div className="min-h-[140px] flex flex-col justify-center items-center gap-3 text-center text-xs text-[#7D715E]"><p role="alert" className="text-[#DC2626] m-0">{loadError}</p><button type="button" onClick={() => setReload(value => value + 1)} className="px-3.5 py-1.5 border border-[#EEDFC6] bg-[#FBF5EB] text-[#1A1612] rounded-lg cursor-pointer">Tải lại</button></div>
          ) : creating ? (
            <form id="vip-create-campaign" className="space-y-3.5" onSubmit={event => void createCampaign(event)}>
              <div className="flex items-center gap-4 mb-3 text-[11px] text-[#7D715E]" aria-label="Các bước gửi lời mời">
                <span className="flex items-center gap-1.5 text-[#1A1612] font-semibold"><b className="grid place-items-center w-5 h-5 rounded-full bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6] text-[11px]">1</b>Thiết lập chiến dịch</span>
                <span className="flex items-center gap-1.5"><b className="grid place-items-center w-5 h-5 rounded-full bg-[#F3EFE6] text-[#7D715E] text-[11px]">2</b>Gửi lời mời</span>
              </div>
              <p className="m-0 mb-4 text-xs leading-relaxed text-[#7D715E]">Lời mời VIP cần có chiến dịch để KOL xem thời gian hợp tác và hoa hồng. Lưu xong, bạn sẽ chuyển ngay sang bước gửi lời mời.</p>
              <div>
                <label htmlFor="vip-create-name" className="block text-xs font-semibold text-[#1A1612] mb-1.5">Tên chiến dịch</label>
                <input id="vip-create-name" autoFocus required maxLength={200} placeholder="VD: Hợp tác KOL tháng 10" value={draft.name} disabled={saving} onChange={event => setDraft(previous => ({ ...previous, name: event.target.value }))} className="w-full h-10 px-3 border border-[#EAE4D7] rounded-[10px] bg-[#FAF8F5] text-[#1A1612] text-xs outline-none focus:border-[#C59B58] focus:bg-white" />
              </div>
              <div>
                <label htmlFor="vip-create-rate" className="block text-xs font-semibold text-[#1A1612] mb-1.5">Hoa hồng thưởng thêm (%)</label>
                <input id="vip-create-rate" type="number" min={0} max={100} step="0.01" required value={draft.rate} disabled={saving} onChange={event => setDraft(previous => ({ ...previous, rate: event.target.value }))} className="w-full h-10 px-3 border border-[#EAE4D7] rounded-[10px] bg-[#FAF8F5] text-[#1A1612] text-xs outline-none focus:border-[#C59B58] focus:bg-white" />
                <small className="block mt-1 text-[10px] leading-relaxed text-[#7D715E]">Được cộng thêm vào hoa hồng thông thường của sản phẩm.</small>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="vip-create-start" className="block text-xs font-medium text-[#7D715E] mb-1">Bắt đầu</label>
                  <DateTimePicker id="vip-create-start" compact required popoverTitle="Chọn ngày bắt đầu" inlinePopoverRef={datePopoverRef} value={draft.start} disabled={saving} onChange={value => setDraft(previous => ({ ...previous, start: value }))} />
                </div>
                <div>
                  <label htmlFor="vip-create-end" className="block text-xs font-medium text-[#7D715E] mb-1">Kết thúc</label>
                  <DateTimePicker id="vip-create-end" compact required popoverTitle="Chọn ngày kết thúc" inlinePopoverRef={datePopoverRef} minDateTime={draft.start} value={draft.end} disabled={saving} onChange={value => setDraft(previous => ({ ...previous, end: value }))} />
                </div>
              </div>
              <div ref={datePopoverRef} />
              {createError && <p role="alert" className="m-0 text-xs text-[#DC2626] leading-relaxed">{createError}</p>}
            </form>
          ) : campaigns.length === 0 ? (
            <div className="min-h-[140px] flex flex-col justify-center items-center gap-3 text-center text-xs text-[#7D715E]">
              <Crown size={26} className="text-[#B88E4F]" />
              <strong className="text-sm font-semibold text-[#1A1612]">{unavailableCount ? 'Chưa có chiến dịch còn hiệu lực' : 'Thiết lập chiến dịch để mời KOL'}</strong>
              <p className="m-0 max-w-[310px] leading-relaxed text-[11px]">{unavailableCount ? 'Các chiến dịch hiện có đã kết thúc hoặc bị tắt. Thiết lập chiến dịch mới, sau đó gửi lời mời.' : 'Gian hàng chưa có chiến dịch VIP. Thiết lập thời gian và hoa hồng một lần, sau đó dùng chiến dịch này để mời các KOL.'}</p>
              <button type="button" onClick={() => { setCreating(true); setCreateError(''); }} className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-[#EEDFC6] bg-[#FBF5EB] text-[#1A1612] rounded-lg font-medium cursor-pointer"><Plus size={15} />Thiết lập & tiếp tục mời</button>
            </div>
          ) : (
            <div className="space-y-4">
              {createdCampaignId === campaignId && (
                <div className="flex items-start gap-2 p-3 rounded-[10px] border border-[#EEDFC6] bg-[#FBF5EB]" role="status">
                  <Check size={17} className="text-[#B88E4F] shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-xs font-semibold text-[#1A1612]">Chiến dịch đã sẵn sàng</strong>
                    <p className="m-0 mt-1 text-[11px] leading-relaxed text-[#7D715E]">{conversationId ? `Bấm “Gửi lời mời VIP” để mời ${recipientName}.` : 'Chọn KOL bên dưới, rồi bấm “Gửi lời mời VIP”.'}</p>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-[#1A1612] mb-1.5">Người nhận lời mời</label>
                {conversationId ? (
                  <div className="flex items-center gap-2 p-2.5 bg-[#FBF5EB] border border-[#EEDFC6] rounded-[10px] text-xs">
                    <Users size={16} className="text-[#B88E4F] shrink-0" />
                    <strong className="font-semibold text-[#1A1612]">{recipientName}</strong>
                    <span className="ml-auto text-[9px] text-[#7D715E]">KOL / CTV</span>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <Search size={15} className="absolute left-3 top-3 text-[#7D715E]" />
                      <input ref={recipientSearchRef} aria-label="Tìm KOL nhận lời mời" placeholder="Tìm tên hoặc email KOL…" value={query} disabled={submitting} onChange={event => setQuery(event.target.value)} className="w-full h-9.5 pl-9 pr-3 border border-[#EAE4D7] rounded-[10px] bg-[#FAF8F5] text-xs text-[#1A1612] outline-none focus:border-[#C59B58] focus:bg-white" />
                    </div>
                    <div className="max-h-40 overflow-y-auto mt-2 [scrollbar-width:thin] space-y-1" role="group" aria-label="KOL nhận lời mời">
                      {visibleRecipients.length ? visibleRecipients.map(person => {
                        const isSelected = recipientId === person.id;
                        return (
                          <button
                            type="button"
                            key={person.id}
                            aria-pressed={isSelected}
                            disabled={submitting}
                            onClick={() => { setRecipientId(person.id); setSendError(''); }}
                            className={`flex items-center gap-2.5 w-full text-left p-2 border rounded-[10px] cursor-pointer transition-colors ${
                              isSelected ? 'bg-[#FBF5EB] border-[#EEDFC6]' : 'bg-white border-transparent hover:bg-[#FAF8F5]'
                            }`}
                          >
                            <span className="w-8 h-8 shrink-0 grid place-items-center bg-[#F3EFE6] border border-[#EAE4D7] rounded-[10px] text-xs font-semibold text-[#B88E4F] overflow-hidden">
                              {(person.collaboratorProfile?.avatarUrl || person.avatarUrl) ? <img src={person.collaboratorProfile?.avatarUrl || person.avatarUrl} alt="" className="w-full h-full object-cover" /> : person.fullName.charAt(0)}
                            </span>
                            <span className="min-w-0 flex-1">
                              <strong className="block text-xs leading-snug font-semibold text-[#1A1612] truncate">{person.fullName}</strong>
                              <small className="block text-[10px] text-[#7D715E] truncate">{person.email}</small>
                            </span>
                            <span className={`w-4 h-4 rounded-full shrink-0 ${isSelected ? 'border-4 border-[#C59B58] bg-white' : 'border border-[#EAE4D7] bg-white'}`} aria-hidden="true" />
                          </button>
                        );
                      }) : <p className="p-4 text-center text-xs text-[#7D715E] m-0">Không tìm thấy KOL phù hợp.</p>}
                    </div>
                  </>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#1A1612]">Chiến dịch</label>
                  <button type="button" disabled={busy} onClick={() => { setCreating(true); setCreateError(''); }} className="flex items-center gap-1 border-0 bg-transparent text-[#B88E4F] text-[11px] font-medium cursor-pointer hover:underline">
                    <Plus size={13} />Tạo mới
                  </button>
                </div>
                <Select aria-label="Chiến dịch VIP" value={campaignId} disabled={submitting} onChange={event => { setCampaignId(event.target.value); setSendError(''); }} options={campaigns.map(campaign => ({ value: campaign.id, label: campaign.name }))} />
                {selectedCampaign && (
                  <div className="flex flex-wrap justify-between gap-1 mt-1.5 text-[10px] text-[#7D715E]">
                    <span>Thưởng thêm <strong className="text-[#B88E4F] font-semibold">+{selectedCampaign.bonusCommissionRate}%</strong> hoa hồng</span>
                    <span>Đến {new Date(selectedCampaign.endDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="vip-campaign-note" className="block text-xs font-semibold text-[#1A1612] mb-1.5">Lời nhắn <span className="font-normal text-[#7D715E]">· Không bắt buộc</span></label>
                <textarea id="vip-campaign-note" rows={2} maxLength={1000} disabled={submitting} placeholder="Gửi lời chào hoặc đề xuất hợp tác…" value={note} onChange={event => setNote(event.target.value)} className="w-full p-2.5 border border-[#EAE4D7] rounded-[10px] bg-[#FAF8F5] text-xs text-[#1A1612] outline-none focus:border-[#C59B58] focus:bg-white resize-y" />
              </div>

              {recipientName && <p className="text-[11px] leading-relaxed text-[#7D715E] m-0">Lời mời sẽ gửi tới <strong className="font-semibold text-[#1A1612]">{recipientName}</strong> trong hội thoại KOL.</p>}
              {!recipientName && <p className="text-[11px] leading-relaxed text-[#7D715E] m-0">Chọn một KOL để bật nút gửi lời mời.</p>}
              {sendError && <p role="alert" className="text-xs text-[#DC2626] m-0">{sendError}</p>}
            </div>
          )}
        </div>

        <footer className="flex justify-end gap-2.5 p-3.5 sm:px-5 border-t border-[#EAE4D7] bg-white">
          <button type="button" disabled={busy} onClick={() => creating ? setCreating(false) : onClose()} className="inline-flex items-center justify-center gap-1.5 h-[38px] px-3.5 border border-[#EAE4D7] rounded-[10px] bg-white text-[#7D715E] text-xs font-medium cursor-pointer hover:bg-[#FAF8F5]">
            {creating ? 'Quay lại' : 'Đóng'}
          </button>
          {creating ? (
            <button type="submit" form="vip-create-campaign" disabled={saving} className="inline-flex items-center justify-center gap-1.5 h-[38px] px-4 border border-[#EEDFC6] rounded-[10px] bg-[#FBF5EB] text-[#1A1612] text-xs font-semibold hover:bg-[#F3E8D5] cursor-pointer">
              {saving ? <Loader2 size={16} className="animate-spin text-[#B88E4F]" /> : <Plus size={16} className="text-[#B88E4F]" />}
              {saving ? 'Đang lưu…' : 'Tạo & tiếp tục mời'}
            </button>
          ) : campaigns.length > 0 && (
            <button ref={sendButtonRef} type="button" disabled={!canSend} onClick={() => void submit()} className="inline-flex items-center justify-center gap-1.5 h-[38px] px-4 border border-[#EEDFC6] rounded-[10px] bg-[#FBF5EB] text-[#1A1612] text-xs font-semibold hover:bg-[#F3E8D5] cursor-pointer disabled:opacity-50">
              {submitting ? <Loader2 size={16} className="animate-spin text-[#B88E4F]" /> : <Send size={16} className="text-[#B88E4F]" />}
              {submitting ? 'Đang gửi…' : 'Gửi lời mời VIP'}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
}
