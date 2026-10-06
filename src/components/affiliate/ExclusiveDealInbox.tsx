import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, AlertTriangle, Check, Loader2, MessageSquare, ShieldAlert, Sparkles, X } from 'lucide-react';
import { referralLinksService } from '../../services/referral-links.service';
import { Select } from '../ui/Select';

export interface ExclusiveDealInboxProps {
  onChat?: (item: any) => void;
}

export function ExclusiveDealInbox({ onChat }: ExclusiveDealInboxProps = {}) {
  const navigate = useNavigate();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [selectedDealToTerminate, setSelectedDealToTerminate] = useState<any | null>(null);
  const [terminateReason, setTerminateReason] = useState('KOL không đạt chỉ tiêu đơn hàng/doanh số sau chu kỳ cam kết');
  const [escalateDispute, setEscalateDispute] = useState(false);
  const [submittingTerminate, setSubmittingTerminate] = useState(false);

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

  const handleConfirmTerminate = async () => {
    if (!selectedDealToTerminate || submittingTerminate) return;
    setSubmittingTerminate(true);
    try {
      await referralLinksService.terminateExclusiveDeal(selectedDealToTerminate.id, {
        reason: terminateReason,
        escalateDispute,
      });
      setFeedback('Đã đóng deal độc quyền và áp dụng chế tài vi phạm cam kết đối với KOL.');
      setSelectedDealToTerminate(null);
      await load();
    } catch (err: any) {
      setFeedback(err?.response?.data?.message || err?.message || 'Không thể đóng deal lúc này.');
    } finally {
      setSubmittingTerminate(false);
    }
  };

  const handleChat = (e: React.MouseEvent, item: any) => {
    e.preventDefault();
    if (onChat) {
      onChat(item);
      return;
    }
    const chatInput = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(
      'input[placeholder*="Nhập tin nhắn"], textarea[placeholder*="Nhập tin nhắn"], #embedded-chat-input'
    );
    if (chatInput) {
      chatInput.focus();
      chatInput.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      return;
    }
    const kolId = item.collaboratorId || item.collaborator?.id || item.collaborator?.userId;
    if (kolId) {
      navigate(`/merchant/kol-hub?tab=messages&kol=${kolId}`);
    } else {
      navigate('/merchant/kol-hub?tab=messages');
    }
  };

  const pendingCount = items.filter((item) => item.status === 'PENDING').length;

  return (
    <section className="rounded-2xl border border-[#EAE4D7] bg-white p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="flex items-center gap-2 text-base font-extrabold text-[#1A1612]"><Sparkles className="h-4 w-4 text-[#B88E4F]" /> Đề xuất Exclusive Deal</h2>
          <p className="mt-0.5 text-xs text-[#7D715E]">KOL đề xuất mức hoa hồng độc quyền và cam kết doanh số.</p>
        </div>
        <span className="rounded-full border border-[#EEDFC6] bg-[#FBF5EB] px-2.5 py-1 text-xs font-bold text-[#B88E4F]">{pendingCount} đang chờ</span>
      </div>

      {feedback && <div role="status" className="mt-2 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-1.5 text-xs text-[#7D715E]">{feedback}</div>}
      {loading ? (
        <div className="mt-2 flex items-center justify-center gap-2 py-4 text-sm text-[#7D715E]"><Loader2 className="h-4 w-4 animate-spin" /> Đang tải...</div>
      ) : items.length === 0 ? (
        <div className="mt-2 rounded-xl border border-dashed border-[#EAE4D7] bg-[#FAF8F5] p-3 text-center text-xs text-[#7D715E]">Chưa có đề xuất Exclusive Deal nào.</div>
      ) : (
        <div className="mt-2 grid gap-2">
          {items.map((item) => {
            const isTerminated = item.shopResponse?.startsWith('[ĐÃ ĐÓNG DEAL / CHẾ TÀI]') || item.referralLink?.status === 'BLOCKED';
            return (
              <article key={item.id} className="rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-3.5 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-extrabold text-[#1A1612]">{item.product?.title || 'Sản phẩm'}</div>
                    <div className="truncate text-xs text-[#7D715E]">Đề xuất bởi <strong>{item.collaborator?.fullName || 'KOL'}</strong> · {item.store?.name}</div>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                    isTerminated
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : item.status === 'APPROVED'
                        ? 'bg-[#FBF5EB] text-[#B88E4F] border border-[#EEDFC6]'
                        : item.status === 'REJECTED'
                          ? 'bg-rose-50 text-rose-700'
                          : 'bg-[#F3EFE6] text-[#7D715E]'
                  }`}>
                    {isTerminated
                      ? 'Đã đóng deal (Chế tài vi phạm)'
                      : item.status === 'APPROVED'
                        ? (item.isCurrentDeal ? 'Đang áp dụng' : 'Deal cũ')
                        : item.status === 'REJECTED'
                          ? 'Đã từ chối'
                          : 'Chờ duyệt'}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-lg border border-[#EAE4D7] bg-white px-2 py-1 text-[#7D715E]">Hoa hồng sàn <strong className="ml-1 text-[#1A1612]">{item.publicCommissionRate ?? '—'}%</strong></span>
                  <span className="rounded-lg border border-[#EEDFC6] bg-white px-2 py-1 text-[#7D715E]">Hoa hồng độc quyền <strong className="ml-1 text-[#B88E4F]">{item.proposedCommissionRate}%</strong></span>
                  {item.status === 'PENDING' && item.currentCommissionRate != null && (
                    <span className="rounded-lg border border-[#EEDFC6] bg-white px-2 py-1 text-[#7D715E]">Đang áp dụng <strong className="ml-1 text-[#B88E4F]">{item.currentCommissionRate}%</strong></span>
                  )}
                  <span className="max-w-full truncate text-[#7D715E] sm:max-w-[280px]" title={item.salesCommitment}>Cam kết: <strong className="text-[#1A1612]">{item.salesCommitment}</strong></span>
                  {item.status === 'APPROVED' && item.referralLink?.shortCode && !isTerminated && (
                    <span className="break-all font-semibold text-[#B88E4F]">Link VIP: /r/{item.referralLink.shortCode}</span>
                  )}
                  {item.status === 'PENDING' && (
                    <span className="ml-auto flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleChat(e, item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#EAE4D7] bg-white px-2 py-1.5 text-[11px] font-bold text-[#7D715E] hover:bg-[#F3EFE6] hover:text-[#1A1612] transition cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> Chat
                      </button>
                      <button type="button" onClick={() => void decide(item.id, false)} disabled={busyId === item.id} className="inline-flex items-center gap-1 rounded-lg border border-[#EAE4D7] bg-white px-2 py-1.5 text-[11px] font-bold text-[#7D715E] hover:bg-[#F3EFE6] disabled:opacity-50 cursor-pointer"><X className="h-3.5 w-3.5" /> Từ chối</button>
                      <button type="button" onClick={() => void decide(item.id, true)} disabled={busyId === item.id} className="inline-flex items-center gap-1 rounded-lg bg-[#C59B58] px-2.5 py-1.5 text-[11px] font-bold text-white hover:bg-[#B88E4F] disabled:opacity-50 cursor-pointer shadow-xs">{busyId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Duyệt & tạo link</button>
                    </span>
                  )}
                  {item.status === 'APPROVED' && item.isCurrentDeal && !isTerminated && (
                    <span className="ml-auto flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => handleChat(e, item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#EAE4D7] bg-white px-2 py-1.5 text-[11px] font-bold text-[#7D715E] hover:bg-[#F3EFE6] hover:text-[#1A1612] transition cursor-pointer"
                      >
                        <MessageSquare className="h-3.5 w-3.5" /> Chat
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDealToTerminate(item)}
                        className="inline-flex items-center gap-1 rounded-lg border border-[#DC2626]/30 bg-white px-2.5 py-1.5 text-[11px] font-bold text-[#DC2626] hover:bg-[#DC2626]/10 transition cursor-pointer"
                        title="Đóng deal riêng do KOL không đạt cam kết doanh số"
                      >
                        <AlertTriangle className="h-3.5 w-3.5" /> Đóng deal (Vi phạm KPI)
                      </button>
                    </span>
                  )}
                </div>
                {item.shopResponse && (
                  <p className="mt-2 text-[11px] leading-relaxed text-[#7D715E] bg-white p-2 rounded-lg border border-[#EAE4D7]">
                    <strong>Phản hồi:</strong> {item.shopResponse}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      )}

      {/* TERMINATION & SANCTIONS MODAL */}
      {selectedDealToTerminate && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-[#231D15]/50 p-4 backdrop-blur-xs" onMouseDown={(e) => {
          if (e.target === e.currentTarget && !submittingTerminate) setSelectedDealToTerminate(null);
        }}>
          <div className="w-full max-w-lg rounded-2xl border border-[#EAE4D7] bg-white shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 text-left">
            <div className="flex items-start justify-between gap-4 border-b border-[#EAE4D7] px-6 py-4 bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-200">
                  <ShieldAlert className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-[#1A1612]">Đóng deal & Áp dụng chế tài cam kết</h3>
                  <p className="text-xs text-[#7D715E]">KOL không đạt cam kết doanh số hoặc sản lượng nội dung</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDealToTerminate(null)}
                disabled={submittingTerminate}
                className="rounded-lg p-2 text-[#7D715E] hover:bg-[#F3EFE6] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3 space-y-1">
                <div className="font-bold text-sm text-[#1A1612]">{selectedDealToTerminate.product?.title}</div>
                <div className="text-[#7D715E]">KOL đối tác: <strong className="text-[#1A1612]">{selectedDealToTerminate.collaborator?.fullName}</strong></div>
                <div className="text-[#7D715E]">Hoa hồng VIP đang áp dụng: <strong className="text-[#B88E4F]">{selectedDealToTerminate.proposedCommissionRate}%</strong> (Sàn: {selectedDealToTerminate.publicCommissionRate ?? '—'}%)</div>
                <div className="text-[#7D715E] pt-1 border-t border-[#EAE4D7] mt-1">Cam kết ban đầu: <em className="text-[#1A1612]">"{selectedDealToTerminate.salesCommitment}"</em></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1A1612] mb-1.5">
                  Lý do đóng deal & áp dụng chế tài:
                </label>
                <Select
                  value={terminateReason}
                  onChange={(e) => setTerminateReason(e.target.value)}
                  className="w-full text-xs font-medium"
                >
                  <option value="KOL không đạt chỉ tiêu đơn hàng/doanh số sau chu kỳ cam kết">KOL không đạt chỉ tiêu đơn hàng/doanh số sau chu kỳ cam kết</option>
                  <option value="KOL không đăng đủ số lượng video review / livestream theo thỏa thuận">KOL không đăng đủ số lượng video review / livestream theo thỏa thuận</option>
                  <option value="KOL nhận hàng mẫu nhưng bùng hàng, không phản hồi (Ghosting)">KOL nhận hàng mẫu nhưng bùng hàng, không phản hồi (Ghosting)</option>
                  <option value="KOL vi phạm chính sách tiếp thị của gian hàng">KOL vi phạm chính sách tiếp thị của gian hàng</option>
                </Select>
              </div>

              {/* Notice of Automatic Sanctions */}
              <div className="rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3.5 space-y-2 text-[#7D715E] leading-relaxed">
                <div className="font-bold text-[#1A1612] flex items-center gap-1.5">
                  <AlertCircle className="h-4 w-4 text-[#C59B58]" /> Chế tài sẽ tự động áp dụng:
                </div>
                <ul className="list-disc list-inside space-y-1 text-[11px] pl-1">
                  <li><strong>Cấp 1:</strong> Hủy link VIP, hoa hồng các đơn hàng mới quay về mức tiêu chuẩn (đơn cũ giữ nguyên).</li>
                  <li><strong>Cấp 2:</strong> Ghi nhận vi phạm, trừ điểm tín nhiệm & giảm thứ hạng của KOL trên hệ thống.</li>
                  <li><strong>Cấp 3:</strong> Tự động khóa quyền xin deal của KOL theo số lần vi phạm (Lần 1: 1 tuần, Lần 2: 2 tuần, Lần 3: 3 tuần, Lần 4+: 4 tuần & khóa mẫu thử).</li>
                </ul>
              </div>

              {/* Escalate Dispute Option */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl border border-rose-200 bg-rose-50/50 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={escalateDispute}
                  onChange={(e) => setEscalateDispute(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-md border-rose-400 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <div>
                  <span className="font-bold text-[#DC2626] block">
                    Cấp 4: Chuyển hồ sơ lên Trọng tài sàn SCANMS (Yêu cầu bồi thường mẫu thử)
                  </span>
                  <span className="text-[11px] text-[#7D715E] block mt-0.5">
                    Tích chọn nếu Shop đã gửi hàng mẫu giá trị cao nhưng KOL hoàn toàn không đăng bài / bùng hàng (Ghosting).
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-[#EAE4D7] px-6 py-4 bg-[#FAF8F5]">
              <button
                type="button"
                onClick={() => setSelectedDealToTerminate(null)}
                disabled={submittingTerminate}
                className="rounded-xl border border-[#EAE4D7] px-4 py-2.5 text-xs font-bold text-[#7D715E] hover:bg-white cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmTerminate}
                disabled={submittingTerminate}
                className="inline-flex items-center gap-2 rounded-xl bg-[#DC2626] px-5 py-2.5 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 cursor-pointer shadow-sm transition"
              >
                {submittingTerminate ? <Loader2 className="h-4 w-4 animate-spin" /> : <AlertTriangle className="h-4 w-4" />}
                Xác nhận đóng deal & Áp dụng chế tài
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
