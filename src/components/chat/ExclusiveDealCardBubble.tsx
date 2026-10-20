import { useEffect, useState } from 'react';
import { Sparkles, ChevronDown, ExternalLink, Copy, Check, Clock3 } from 'lucide-react';
import { toast } from 'sonner';
import api from '../../services/api';

export function ExclusiveDealCardBubble({ card, isMine, isShop, compact = false }: { card: any; isMine: boolean; isShop: boolean; compact?: boolean }) {
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState<string | null>(card.shortUrl || null);
  const [voucherCode, setVoucherCode] = useState<string | null>(card.vipVoucherCode || null);
  const [loadingIssued, setLoadingIssued] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState<'link' | 'voucher' | null>(null);
  const status = decision || card.status;
  const isDecision = card.type === 'EXCLUSIVE_DEAL_DECISION';
  const approved = status === 'APPROVED';
  const rejected = status === 'REJECTED';
  const rate = card.approvedCommissionRate ?? card.proposedCommissionRate;
  const canReview = !isDecision && status === 'PENDING' && isShop && !isMine;

  useEffect(() => {
    setLinkUrl(card.shortUrl || null);
    setVoucherCode(card.vipVoucherCode || null);
  }, [card.proposalId, card.shortUrl, card.vipVoucherCode]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  useEffect(() => {
    if (!approved || !card.proposalId || (linkUrl && voucherCode)) return;
    let active = true;
    setLoadingIssued(true);
    const loadIssued = async () => {
      try {
        const response: any = await api.get(`/affiliate-deals/${isShop ? 'shop' : 'mine'}`);
        const payload = response?.data?.data || response?.data || response;
        const issued = Array.isArray(payload) ? payload.find(item => item.id === card.proposalId) : null;
        if (!active || !issued) return;
        if (issued.shortUrl) setLinkUrl(issued.shortUrl);
        else if (issued.referralLink?.shortCode) setLinkUrl(`${window.location.origin}/r/${encodeURIComponent(issued.referralLink.shortCode)}`);
        const code = issued.vipVoucherCode || issued.referralLink?.customCouponCode;
        if (code) setVoucherCode(code);
      } catch {
        if (active) setError('Chưa tải được link và mã đã cấp. Vui lòng mở lại cuộc trò chuyện.');
      } finally {
        if (active) setLoadingIssued(false);
      }
    };
    void loadIssued();
    return () => { active = false; };
  }, [approved, card.proposalId, isShop, linkUrl, voucherCode]);

  const decide = async (approve: boolean) => {
    if (!card.proposalId || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response: any = await api.patch(`/affiliate-deals/${card.proposalId}/${approve ? 'approve' : 'reject'}`, approve ? {} : { reason: '' });
      const result = response?.data?.data || response?.data || response;
      setDecision(approve ? 'APPROVED' : 'REJECTED');
      if (result?.shortUrl) setLinkUrl(result.shortUrl);
      const code = result?.vipVoucherCode || result?.referralLink?.customCouponCode;
      if (code) setVoucherCode(code);
      toast.success(approve ? 'Đã duyệt deal và tạo link VIP.' : 'Đã từ chối đề xuất deal.');
    } catch (actionError: any) {
      setError(actionError?.response?.data?.message || 'Không thể xử lý đề xuất lúc này.');
    } finally {
      setLoading(false);
    }
  };

  const copyIssued = async (kind: 'link' | 'voucher') => {
    const value = kind === 'link' ? linkUrl : voucherCode;
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      toast.success(kind === 'link' ? 'Đã sao chép link tiếp thị độc quyền!' : 'Đã sao chép mã voucher VIP!');
    } catch {
      toast.error('Không sao chép được link. Vui lòng thử lại.');
    }
  };

  return (
    <article className={`${compact ? 'w-72' : 'w-80'} max-w-[min(100%,calc(100vw-48px))] overflow-hidden border border-[#EAE4D7] rounded-xl bg-white text-[#1A1612] text-left shadow-[0_2px_8px_rgba(35,29,21,0.02)]`}>
      <header className="flex items-center gap-1.5 px-3 py-2.5 border-b border-[#EAE4D7] bg-white">
        <span className="w-6 h-6 grid place-items-center shrink-0 rounded-[7px] bg-[#FBF5EB] text-[#B88E4F]"><Sparkles size={14} /></span>
        <strong className="text-xs font-semibold text-[#1A1612]">Deal độc quyền</strong>
        <span className={`inline-flex items-center gap-1 shrink-0 ml-auto px-1.5 py-1 border rounded-md text-[9px] leading-tight font-medium ${rejected ? 'bg-white border-[#EAE4D7] text-[#7D715E]' : 'border-[#EEDFC6] bg-[#FBF5EB] text-[#8C6226]'}`}>
          {approved ? <Check size={11} className="text-[#059669]" /> : !rejected ? <Clock3 size={11} className="text-[#B88E4F]" /> : null}
          {approved ? 'Đã duyệt' : rejected ? 'Đã từ chối' : 'Chờ duyệt'}
        </span>
      </header>
      <div className="p-2.5 sm:px-3">
        <h3 className="m-0 text-xs leading-relaxed font-semibold break-words text-[#1A1612]">{card.productTitle || 'Sản phẩm'}</h3>
        {card.storeName && <p className="m-0 mt-1 text-[#7D715E] text-[10px] leading-relaxed break-words">Gian hàng <strong className="ml-1 text-[#1A1612] font-normal">{card.storeName}</strong></p>}
        {(card.publicCommissionRate != null || rate != null) && (
          <div className="grid grid-cols-2 mt-2.5 p-2 px-2.5 rounded-lg bg-[#FBF5EB]">
            <div>
              <span className="text-[#7D715E] text-[10px]">Hoa hồng sàn</span>
              <strong className="block mt-0.5 text-xl leading-tight font-semibold tabular-nums text-[#1A1612]">{card.publicCommissionRate ?? '—'}<small className="text-[13px] ml-0.5 font-normal">%</small></strong>
            </div>
            <div className="pl-3 border-l border-[#EEDFC6]">
              <span className="text-[#8C6226] text-[10px]">Hoa hồng độc quyền</span>
              <strong className="block mt-0.5 text-xl leading-tight font-semibold tabular-nums text-[#B88E4F]">{rate ?? '—'}<small className="text-[13px] ml-0.5 font-normal">%</small></strong>
            </div>
          </div>
        )}
        {card.isRevision && card.currentCommissionRate != null && <p className="mt-2 text-[#7D715E] text-[10px] leading-relaxed">Mức đang áp dụng <strong className="ml-1 text-[#1A1612] font-medium">{card.currentCommissionRate}%</strong></p>}
        {!isDecision && status === 'PENDING' && card.isRevision && <p className="mt-2 text-[#7D715E] text-[10px] leading-relaxed">{isMine ? 'Mức hiện tại vẫn áp dụng trong lúc gian hàng xem xét đề xuất.' : 'Mức mới áp dụng cho đơn hàng mới sau khi duyệt. Đơn đã tạo giữ nguyên mức cũ.'}</p>}
        {isDecision && card.message && (
          <details className="mt-2 bg-white text-xs group">
            <summary className="flex items-center justify-between gap-2 py-1 list-none text-[#7D715E] text-[10px] cursor-pointer hover:text-[#1A1612] hover:bg-[#FAF8F5] rounded-md transition-colors select-none">
              Chi tiết phản hồi<ChevronDown size={13} className="group-open:rotate-180 transition-transform text-[#B88E4F]" />
            </summary>
            <p className="m-0 mt-1 pb-1 text-[11px] leading-relaxed whitespace-pre-wrap break-words text-[#7D715E]">{card.message}</p>
          </details>
        )}
        {card.salesCommitment && (
          <details className="mt-2 bg-white text-xs group">
            <summary className="flex items-center justify-between gap-2 py-1 list-none text-[#7D715E] text-[10px] cursor-pointer hover:text-[#1A1612] hover:bg-[#FAF8F5] rounded-md transition-colors select-none">
              Cam kết doanh số<ChevronDown size={13} className="group-open:rotate-180 transition-transform text-[#B88E4F]" />
            </summary>
            <p className="m-0 mt-1 pb-1 text-[11px] leading-relaxed whitespace-pre-wrap break-words text-[#7D715E]">{card.salesCommitment}</p>
          </details>
        )}
        {card.shopResponse && (
          <details className="mt-2 bg-white text-xs group">
            <summary className="flex items-center justify-between gap-2 py-1 list-none text-[#7D715E] text-[10px] cursor-pointer hover:text-[#1A1612] hover:bg-[#FAF8F5] rounded-md transition-colors select-none">
              Phản hồi gian hàng<ChevronDown size={13} className="group-open:rotate-180 transition-transform text-[#B88E4F]" />
            </summary>
            <p className="m-0 mt-1 pb-1 text-[11px] leading-relaxed whitespace-pre-wrap break-words text-[#7D715E]">{card.shopResponse}</p>
          </details>
        )}
        {error && <p className="mt-2 text-[11px] leading-relaxed text-[#DC2626]" role="alert">{error}</p>}
      </div>
      {(canReview || approved || (!isDecision && isMine && status === 'PENDING')) && (
        <footer className="px-3 py-2 border-t border-[#EAE4D7] bg-white">
          {approved && (
            <div className="space-y-3">
              <div>
                <p className="m-0 mb-1 text-[10px] font-medium text-[#7D715E]">Link tiếp thị độc quyền</p>
                <div className="flex items-start gap-2 rounded-lg border border-[#EAE4D7] bg-[#FAF8F5] p-2">
                  {linkUrl ? <a href={linkUrl} target="_blank" rel="noreferrer" className="min-w-0 flex-1 break-all text-[11px] leading-relaxed text-[#1A1612] hover:underline">{linkUrl}</a> : <span className="flex-1 text-[11px] text-[#7D715E]">{loadingIssued ? 'Đang tải link đã cấp…' : 'Chưa có link được cấp'}</span>}
                  <button type="button" disabled={!linkUrl} onClick={() => void copyIssued('link')} title="Sao chép link tiếp thị" aria-label="Sao chép link tiếp thị" className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-[#EAE4D7] bg-white text-[#B88E4F] hover:border-[#C59B58] disabled:opacity-40">{copied === 'link' ? <Check size={14} /> : <Copy size={14} />}</button>
                </div>
              </div>
              <div>
                <p className="m-0 mb-1 text-[10px] font-medium text-[#7D715E]">Mã voucher VIP đã cấp</p>
                <div className="flex items-center gap-2 rounded-lg border border-[#EEDFC6] bg-[#FBF5EB] p-2">
                  <span className="min-w-0 flex-1 break-all font-mono text-xs font-semibold text-[#1A1612]">{voucherCode || (loadingIssued ? 'Đang tải mã đã cấp…' : 'Chưa có mã voucher được cấp')}</span>
                  <button type="button" disabled={!voucherCode} onClick={() => void copyIssued('voucher')} title="Sao chép mã voucher VIP" aria-label="Sao chép mã voucher VIP" className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-[#EEDFC6] bg-white text-[#B88E4F] hover:border-[#C59B58] disabled:opacity-40">{copied === 'voucher' ? <Check size={14} /> : <Copy size={14} />}</button>
                </div>
              </div>
              {linkUrl && <a href={linkUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-[#B88E4F] hover:underline"><ExternalLink size={12} />Mở link tiếp thị</a>}
            </div>
          )}
          {canReview && (
            <div className="grid grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] gap-2">
              <button type="button" disabled={loading} onClick={() => void decide(false)} className="min-h-[32px] px-2 py-1.5 border border-[#EAE4D7] rounded-lg bg-white text-[#7D715E] text-[11px] font-medium hover:bg-[#F3EFE6] cursor-pointer disabled:opacity-50">Từ chối</button>
              <button type="button" disabled={loading} onClick={() => void decide(true)} className="min-h-[32px] px-2 py-1.5 border border-[#EEDFC6] rounded-lg bg-[#FBF5EB] text-[#1A1612] text-[11px] font-semibold hover:bg-[#F3EFE6] cursor-pointer disabled:opacity-50">{loading ? 'Đang xử lý…' : card.isRevision ? 'Duyệt đổi deal' : 'Duyệt & tạo link'}</button>
            </div>
          )}
          {!isDecision && isMine && status === 'PENDING' && <p className="flex items-center gap-1.5 m-0 text-[10px] text-[#7D715E]"><Clock3 size={13} className="text-[#B88E4F] shrink-0" />Đã gửi · Chờ gian hàng phản hồi</p>}
        </footer>
      )}
    </article>
  );
}
