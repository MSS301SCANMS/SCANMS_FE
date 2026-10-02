import { useCallback, useEffect, useState } from 'react';
import { Check, Loader2, MessageSquare, Sparkles, X } from 'lucide-react';
import { referralLinksService } from '../../services/referral-links.service';

export function ExclusiveDealInbox() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setItems(await referralLinksService.getShopExclusiveDeals());
    } catch (error: any) {
      setFeedback(error?.response?.data?.message || 'Không thể tải đề xuất deal.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const decide = async (id: string, approve: boolean) => {
    setBusyId(id);
    setFeedback('');
    try {
      if (approve) await referralLinksService.approveExclusiveDeal(id);
      else await referralLinksService.rejectExclusiveDeal(id);
      setFeedback(approve ? 'Đã duyệt. Link VIP đã được tạo và gửi cho KOL trong Chat.' : 'Đã từ chối và gửi phản hồi trong Chat.');
      await load();
    } catch (error: any) {
      setFeedback(error?.response?.data?.message || 'Không thể xử lý đề xuất.');
    } finally {
      setBusyId(null);
    }
  };

  const pendingCount = items.filter((item) => item.status === 'PENDING').length;

  return (
    <section className="rounded-2xl border border-[#EAE4D7] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#1A1612]"><Sparkles className="h-5 w-5 text-[#B88E4F]" /> Đề xuất Exclusive Deal</h2>
          <p className="mt-1 text-sm text-[#7D715E]">KOL gửi mức hoa hồng VIP và cam kết doanh số; Shop xem xét tại đây hoặc trực tiếp trong Chat.</p>
        </div>
        <span className="rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-1.5 text-xs font-bold text-[#B88E4F]">{pendingCount} đang chờ</span>
      </div>

      {feedback && <div role="status" className="mt-4 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-2 text-sm text-[#7D715E]">{feedback}</div>}
      {loading ? (
        <div className="mt-5 flex items-center justify-center gap-2 py-8 text-sm text-[#7D715E]"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="mt-4 rounded-xl border border-dashed border-[#EAE4D7] bg-[#FAF8F5] p-5 text-center text-sm text-[#7D715E]">Chưa có đề xuất Exclusive Deal nào.</div>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {items.map((item) => (
            <article key={item.id} className="rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold text-[#1A1612]">{item.product?.title || 'Sản phẩm'}</div>
                  <div className="mt-1 text-xs text-[#7D715E]">Đề xuất bởi <strong>{item.collaborator?.fullName || 'KOL'}</strong> · {item.store?.name}</div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${item.status === 'APPROVED' ? 'bg-[#FBF5EB] text-[#B88E4F]' : item.status === 'REJECTED' ? 'bg-rose-50 text-rose-700' : 'bg-[#F3EFE6] text-[#7D715E]'}`}>
                  {item.status === 'APPROVED' ? 'Đã duyệt' : item.status === 'REJECTED' ? 'Đã từ chối' : 'Chờ duyệt'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#7D715E]">
                <span>Open Offer: <strong>{item.publicCommissionRate ?? '—'}%</strong></span>
                <span>Đề xuất VIP: <strong className="text-[#B88E4F]">{item.proposedCommissionRate}%</strong></span>
              </div>
              <div className="mt-3 rounded-lg border border-[#EAE4D7] bg-white p-3">
                <div className="text-[11px] font-bold uppercase tracking-wide text-[#7D715E]">Cam kết doanh số</div>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#1A1612]">{item.salesCommitment}</p>
              </div>
              {item.status === 'APPROVED' && item.referralLink?.shortCode && (
                <div className="mt-3 break-all text-xs font-semibold text-[#B88E4F]">Link VIP: /r/{item.referralLink.shortCode}</div>
              )}
              {item.status === 'PENDING' && (
                <div className="mt-3 flex flex-wrap justify-between gap-2">
                  <a href="/chat" className="inline-flex items-center gap-1.5 rounded-lg border border-[#EAE4D7] bg-white px-3 py-2 text-xs font-bold text-[#7D715E] hover:bg-[#F3EFE6]"><MessageSquare className="h-3.5 w-3.5" /> Mở Chat</a>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => void decide(item.id, false)} disabled={busyId === item.id} className="inline-flex items-center gap-1.5 rounded-lg border border-[#EAE4D7] bg-white px-3 py-2 text-xs font-bold text-[#7D715E] hover:bg-[#F3EFE6] disabled:opacity-50"><X className="h-3.5 w-3.5" /> Từ chối</button>
                    <button type="button" onClick={() => void decide(item.id, true)} disabled={busyId === item.id} className="inline-flex items-center gap-1.5 rounded-lg bg-[#C59B58] px-3 py-2 text-xs font-bold text-white hover:bg-[#B88E4F] disabled:opacity-50">{busyId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Duyệt & tạo link</button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
