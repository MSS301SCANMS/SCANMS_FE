import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
import { useSearchParams } from 'react-router-dom';
import {
  MessageSquare,
  Plus,
  Search,
  X,
  Send,
  Paperclip,
  CheckCheck,
  Check,
  Sparkles,
  ArrowUp,
  ArrowLeft,
  Gift,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Crown,
  ShoppingBag,
  ExternalLink,
  FileText,
  Ticket,
  Copy,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { getChatSocket } from '../../services/chat-socket.service';
import api from '../../services/api';
import type { ChatMessage, Conversation } from '../../types/chat';
import { SendVipCampaignModal } from '../../components/chat/SendVipCampaignModal';

function removeAccents(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[đĐ]/g, 'd');
}

function ChatAvatar({
  src,
  name,
  className,
}: {
  src?: string | null;
  name: string;
  className: string;
}) {
  const [failedSource, setFailedSource] = useState<string | null>(null);
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase() || 'S';

  return (
    <span className={`${className} relative inline-flex items-center justify-center overflow-hidden bg-[#F3EFE6] text-[#B88E4F] font-bold`}>
      <span aria-hidden="true">{initials}</span>
      {src && failedSource !== src && (
        <img
          src={src}
          alt={name}
          className="absolute inset-0 h-full w-full object-cover"
          onError={() => setFailedSource(src)}
        />
      )}
    </span>
  );
}

const ACCENTED_STRICT_PATTERNS = [
  'đụ', 'chó', 'lồn', 'cặc', 'buồi', 'sủa', 'đĩ', 'phò', 'dái', 'đéo', 'đell', 'cút', 'địt', 'chịch', 'xoạc'
];

const BAD_WORDS: string[] = [
  // Viết tắt / Acronyms / Teencode chửi thề
  'dm', 'dcm', 'dkm', 'cmm', 'clm', 'vcl', 'vcc', 'vkl', 'vl', 'ccl', 'clgt', 'dmm', 'đmm', 'đcm', 'đm', 'đkm', 'cl', 'cđmm', 'cdmm', 'vc', 'vch', 'vclol', 'vck', 'vca', 'vlon', 'vclz', 'vloz', 'vklz',

  // Các biến thể của Vãi ...
  'vai lon', 'vai loz', 'vai lozz', 'vai l', 'vai lz', 'vai cut', 'vai ca lon', 'vai ca loz', 'vai buoi', 'vai dai', 'vai lol', 'vai chuong', 'vai ca chuong', 'vai hang', 'vai ca hang',

  // Đéo / Dell
  'deo', 'dell', 'deoo', 'delll',

  // Lol / Lz / Loz / Lồn ghép
  'lol', 'lolz', 'lozl', 'loll', 'loz', 'lz', 'cái lồn', 'con lồn', 'đồ lồn', 'hãm lồn', 'lồn mẹ', 'lồn má', 'thằng lồn', 'mặt lồn',
  'cai lon', 'con lon', 'do lon', 'ham lon', 'lon me', 'lon ma', 'thang lon', 'mat lon',

  // Buồi / Cặc / Chim / Cu / Dái ghép
  'cak', 'cack', 'dau buoi', 'đầu buồi', 'dau cac', 'đầu cặc', 'củ cặc', 'cu cac', 'dam tac', 'cu to', 'chim to', 'cuc cut', 'cục cứt', 'hòn dái', 'hon dai', 'bú cu', 'bu cu',

  // Cụm từ chửi thề: Đụ / Địt / Chịch / Xoạc
  'đụ má', 'đụ mẹ', 'đụ cha', 'đụ bà', 'đụ con mẹ', 'đụ mẹ mày', 'đụ mẹ m',
  'dume', 'duma', 'du me', 'du ma', 'du cha', 'du ba', 'du con me', 'du me may', 'du me m', 'du me no',
  'địt mẹ', 'địt má', 'địt cụ', 'địt con mẹ', 'địt mẹ mày', 'địt mẹ m', 'địt nhau', 'địt bà mày',
  'dit', 'ditme', 'dit me', 'dit ma', 'dit ba', 'dit con me', 'dit cu', 'dit me may', 'dit me m', 'dit nhau', 'dit ba may',
  'phang', 'dam dang',

  // Súc sinh / Súc vật / Sủa / Chó
  'suc sinh', 'súc sinh', 'suc vat', 'súc vật', 'sua bay', 'sủa bậy', 'sua can', 'sủa càn',
  'con chó', 'thằng chó', 'đồ chó', 'chó đẻ', 'chó chết', 'chó điên', 'chó ngu', 'chó má',
  'cho de', 'cho chet', 'cho ngu', 'cho dien', 'cho ma', 'con cho', 'thang cho', 'do cho',
  'oc cho', 'óc chó', 'oc bo', 'óc bò', 'do ngu', 'đồ ngu', 'ngu si', 'ngu dan', 'ngu đần', 'ngu hoc', 'ngu học', 'ngu nhu cho', 'ngu như chó', 'ngu nhu bo', 'ngu như bò', 'ngu nhu heo', 'ngu như heo',
  'do lon', 'đồ lợn', 'do heo', 'đồ heo', 'do bo', 'đồ bò',

  // Khùng / Điên / Hãm
  'thang khung', 'thằng khùng', 'con khung', 'con khùng', 'do khung', 'đồ khùng',
  'thang dien', 'thằng điên', 'con dien', 'con điên', 'do dien', 'đồ điên',
  'do ham', 'đồ hãm',

  // Gái mại dâm / Sỉ nhục phụ nữ
  'con di', 'con đĩ', 'di tho', 'đĩ thõa', 'di diem', 'đĩ điếm', 'cave', 'gai goi', 'gái gọi', 'gai bao', 'gái bao', 'lam di', 'làm đĩ', 'con pho', 'con phò',

  // Cụm từ xúc phạm: Mẹ / Bố / Con mẹ / Tiên sư / Cút / Biến
  'con me m', 'con me may', 'con me no', 'con me', 'me may', 'me m', 'me no', 'me cha', 'me kiep',
  'mẹ mày', 'mẹ m', 'mẹ nó', 'mẹ kiếp', 'mẹ cha',
  'bo may', 'bo m', 'bố mày', 'bố m', 'to cha', 'tổ cha', 'to su', 'tổ sư', 'tien su', 'tiên sư', 'to me', 'tổ mẹ', 'tien me', 'tiên mẹ',
  'mat day', 'mất dạy', 'mat net', 'mất nết', 'chet me', 'chết mẹ', 'chet tiet', 'chết tiệt', 'chet cha', 'chết cha', 'chet ba', 'chết bà',
  'cut di', 'cút đi', 'cut me di', 'cút mẹ đi', 'bien di', 'biến đi', 'bien me di', 'biến mẹ đi',
  'khon nan', 'khốn nạn', 'do khon', 'đồ khốn', 'vo hoc', 'vô học', 'do hen', 'đồ hèn', 'do ban', 'đồ bẩn', 'hen ha', 'hèn hạ',

  // Tiếng Anh
  'fuck', 'fucking', 'fucker', 'fck', 'shit', 'bullshit', 'bitch', 'btch', 'asshole', 'bastard', 'dick', 'pussy', 'cunt', 'slut', 'whore', 'motherfucker'
];

const BANK_FRAUD_KEYWORDS = [
  'stk', 'so tai khoan', 'sotaikhoan', 'so tk', 'sotk', 'tk ngan hang', 'tai khoan ngan hang',
  'chuyen khoan', 'chuyen tien', 'chuyen vao tk', 'ck vao', 'bank qua', 'bank cho', 'chuyen qua stk',
  'vietcombank', 'vcb', 'mbbank', 'mb bank', 'techcombank', 'tcb', 'vietinbank', 'bidv', 'tpbank',
  'vpbank', 'agribank', 'acb', 'sacombank', 'shb', 'hdbank', 'vib', 'ocb', 'msb', 'seabank', 'momo', 'zalopay'
];

function isBankAccountOrFraudText(text: string): boolean {
  if (!text) return false;
  if (text.startsWith('{') && (text.includes('CAMPAIGN_') || text.includes('PRODUCT_INQUIRY') || text.includes('COUPON_VOUCHER'))) return false;

  const raw = text.toLowerCase().trim();
  const unaccented = removeAccents(raw).replace(/\s+/g, ' ').trim();

  const bankNumberRegex = /\b\d{8,18}\b/;
  const separatedBankNumberRegex = /\b\d{3,6}[\s.-]\d{3,6}[\s.-]\d{3,6}([\s.-]\d{3,6})?\b/;

  if (bankNumberRegex.test(raw) || separatedBankNumberRegex.test(raw)) {
    return true;
  }

  const hasBankKeywords = BANK_FRAUD_KEYWORDS.some((kw) => {
    const escaped = kw.replace(/\s+/g, '\\s+');
    const regex = new RegExp('(^|\\s|[.,:!?])' + escaped + '($|\\s|[.,:!?])', 'i');
    return regex.test(unaccented) || regex.test(raw);
  });

  return hasBankKeywords && /\d{4,}/.test(raw);
}

function isProfaneText(text: string): boolean {
  if (!text) return false;
  if (text.startsWith('{') && (text.includes('CAMPAIGN_') || text.includes('PRODUCT_INQUIRY') || text.includes('COUPON_VOUCHER'))) return false;

  const raw = text.toLowerCase().trim();
  const unaccented = removeAccents(raw)
    .replace(/[@]/g, 'a')
    .replace(/[0]/g, 'o')
    .replace(/[1!|]/g, 'i')
    .replace(/[3]/g, 'e')
    .replace(/[$]/g, 's')
    .replace(/[7]/g, 't')
    .replace(/[._\-*~`+=/\\;,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // 1. Kiểm tra từ ngữ đặc biệt: "cc" (Ngoại trừ dung tích: 50 cc, 100cc)
  const ccRegex = /(^|[\s.,!?:;()_\-"'`~@#$%^&*+=[\]{}|\\/<>])cc($|[\s.,!?:;()_\-"'`~@#$%^&*+=[\]{}|\\/<>])/i;
  if (ccRegex.test(unaccented) || ccRegex.test(raw)) {
    const isCapacityUnit = /\b\d+\s*cc\b/i.test(raw) || /\b\d+\s*cc\b/i.test(unaccented);
    if (!isCapacityUnit) {
      return true;
    }
  }

  // 2. Kiểm tra các từ ngữ có dấu bắt buộc (ACCENTED_STRICT_PATTERNS) trực tiếp trên chuỗi gốc
  for (const aw of ACCENTED_STRICT_PATTERNS) {
    const escaped = aw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    const regex = new RegExp(`(^|[\\s.,!?:;()_\\-"'\`~@#$%^&*+=\\[\\]{}|\\\\/<>])` + escaped + `($|[\\s.,!?:;()_\\-"'\`~@#$%^&*+=\\[\\]{}|\\\\/<>])`, 'i');
    if (regex.test(raw)) {
      return true;
    }
  }

  // 3. Kiểm tra danh sách BAD_WORDS
  for (const bw of BAD_WORDS) {
    const cleanBw = bw.trim().toLowerCase();
    const cleanBwUnaccented = removeAccents(cleanBw);

    if (raw === cleanBw || unaccented === cleanBwUnaccented) {
      return true;
    }

    const escaped = cleanBwUnaccented.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');
    const regex = new RegExp(`(^|[\\s.,!?:;()_\\-"'\`~@#$%^&*+=\\[\\]{}|\\\\/<>])` + escaped + `($|[\\s.,!?:;()_\\-"'\`~@#$%^&*+=\\[\\]{}|\\\\/<>])`, 'i');

    if (regex.test(unaccented) || regex.test(raw)) {
      return true;
    }
  }
  return false;
}




function tryParseCampaignCard(text: string) {
  try {
    const obj = JSON.parse(text);
    if (['CAMPAIGN_INVITE', 'CAMPAIGN_ACCEPTED', 'CAMPAIGN_REJECTED'].includes(obj.type)) return obj;
  } catch {

  }
  return null;
}

function tryParseExclusiveDealCard(text: string) {
  try {
    const obj = JSON.parse(text);
    if (['EXCLUSIVE_DEAL_PROPOSAL', 'EXCLUSIVE_DEAL_DECISION'].includes(obj.type)) return obj;
  } catch {
    return null;
  }
  return null;
}

function ExclusiveDealCardBubble({ card, isMine, isShop }: { card: any; isMine: boolean; isShop: boolean }) {
  const [loading, setLoading] = useState(false);
  const [decision, setDecision] = useState<string | null>(null);
  const [linkUrl, setLinkUrl] = useState<string | null>(card.shortUrl || null);
  const [error, setError] = useState<string | null>(null);

  const decide = async (approve: boolean) => {
    if (!card.proposalId || loading) return;
    setLoading(true);
    setError(null);
    try {
      const response: any = await api.patch(
        `/affiliate-deals/${card.proposalId}/${approve ? 'approve' : 'reject'}`,
        approve ? {} : { reason: '' },
      );
      const result = response?.data?.data || response?.data || response;
      setDecision(approve ? 'APPROVED' : 'REJECTED');
      if (result?.shortUrl) setLinkUrl(result.shortUrl);
      toast.success(approve ? 'Đã duyệt deal và tạo link VIP.' : 'Đã từ chối đề xuất deal.');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Không thể xử lý đề xuất lúc này.');
    } finally {
      setLoading(false);
    }
  };

  const status = decision || card.status;
  const isDecisionCard = card.type === 'EXCLUSIVE_DEAL_DECISION';
  const isApproved = status === 'APPROVED';
  const isRejected = status === 'REJECTED';

  return (
    <div className="max-w-sm space-y-2 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] p-3 text-[#1A1612] shadow-2xs">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 rounded-full border border-[#EEDFC6] bg-white px-2 py-0.5 text-[10px] font-extrabold text-[#B88E4F]">
          <Sparkles className="h-3 w-3" /> EXCLUSIVE DEAL
        </span>
        <span className={`whitespace-nowrap shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${isApproved ? 'bg-white text-[#B88E4F]' : isRejected ? 'bg-rose-50 text-rose-700' : 'bg-[#F3EFE6] text-[#7D715E]'}`}>
          {isApproved ? 'Đã duyệt' : isRejected ? 'Đã từ chối' : 'Chờ Shop duyệt'}
        </span>
      </div>
      <div>
        <div className="text-xs sm:text-sm font-bold truncate text-[#1A1612]">{card.productTitle || 'Sản phẩm'}</div>
        {card.storeName && <div className="text-[10px] text-[#7D715E]">Shop: {card.storeName}</div>}
      </div>
      {card.publicCommissionRate !== undefined && (
        <div className="flex items-center justify-between bg-white rounded-lg p-2 border border-[#EAE4D7] text-xs">
          <div>
            <span className="text-[10px] text-[#7D715E] block leading-tight">Hoa hồng sàn</span>
            <strong className="text-xs font-bold text-[#1A1612]">{card.publicCommissionRate}%</strong>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#B88E4F] font-bold block leading-tight">Hoa hồng độc quyền</span>
            <strong className="text-xs sm:text-sm font-black text-[#B88E4F]">{card.approvedCommissionRate ?? card.proposedCommissionRate}%</strong>
          </div>
        </div>
      )}
      {card.isRevision && card.currentCommissionRate != null && (
        <div className="rounded-lg border border-[#EEDFC6] bg-white p-2.5 text-xs">Hoa hồng độc quyền đang áp dụng<strong className="mt-1 block text-sm text-[#B88E4F]">{card.currentCommissionRate}%</strong></div>
      )}
      {!isDecisionCard && isMine && status === 'PENDING' && card.isRevision && (
        <div className="text-[11px] leading-relaxed text-[#7D715E]">Mức hoa hồng độc quyền hiện tại vẫn áp dụng trong lúc Shop xem xét đề xuất mới.</div>
      )}
      {!isDecisionCard && !isMine && status === 'PENDING' && card.isRevision && (
        <div className="text-[11px] leading-relaxed text-[#7D715E]">Đề xuất điều chỉnh hoa hồng độc quyền. Nếu duyệt, mức mới áp dụng cho đơn hàng mới; đơn đã tạo giữ nguyên mức cũ.</div>
      )}
      {isDecisionCard && card.message && <div className="text-xs leading-relaxed text-[#7D715E]">{card.message}</div>}
      {card.salesCommitment && (
        <div className="rounded-lg border border-[#EAE4D7] bg-white px-2.5 py-2 text-xs">
          <div className="text-[9.5px] font-bold uppercase tracking-wide text-[#7D715E]">Cam kết doanh số</div>
          <p className="mt-0.5 whitespace-pre-wrap text-xs text-[#1A1612] leading-relaxed line-clamp-2">{card.salesCommitment}</p>
        </div>
      )}
      {card.shopResponse && <div className="text-xs text-[#7D715E]">Phản hồi Shop: {card.shopResponse}</div>}
      {error && <div className="rounded-lg border border-rose-200 bg-rose-50 p-2 text-xs text-rose-700">{error}</div>}
      {isApproved && linkUrl && (
        <div className="flex items-center gap-2 mt-1">
          <a href={linkUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 break-all text-xs font-bold text-[#B88E4F] underline">
            <ExternalLink className="h-3.5 w-3.5 shrink-0" /> Link tiếp thị độc quyền
          </a>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(linkUrl);
              toast.success('Đã sao chép link tiếp thị độc quyền!');
            }}
            className="p-1 rounded text-[#7D715E] hover:text-[#B88E4F] hover:bg-white border border-[#EAE4D7] cursor-pointer"
            title="Sao chép link tiếp thị"
          >
            <Copy className="h-3 w-3" />
          </button>
        </div>
      )}
      {!isDecisionCard && status === 'PENDING' && isShop && !isMine && (
        <div className="flex gap-2">
          <button type="button" disabled={loading} onClick={() => void decide(false)} className="flex-1 rounded-lg border border-[#EAE4D7] bg-white px-2 py-1.5 text-xs font-bold text-[#7D715E] hover:bg-[#F3EFE6] disabled:opacity-50 cursor-pointer">Từ chối</button>
          <button type="button" disabled={loading} onClick={() => void decide(true)} className="flex-1 rounded-lg bg-[#C59B58] px-2 py-1.5 text-xs font-bold text-white hover:bg-[#B88E4F] disabled:opacity-50 cursor-pointer">{loading ? 'Đang xử lý...' : card.isRevision ? 'Duyệt đổi deal' : 'Duyệt & tạo link'}</button>
        </div>
      )}
      {!isDecisionCard && status === 'PENDING' && isMine && <div className="text-center text-[11px] font-semibold text-[#7D715E]">Đã gửi Shop · Đang chờ phản hồi</div>}
      {isDecisionCard && isApproved && <div className="text-[11px] text-[#7D715E]">Shop đã chốt mức hoa hồng độc quyền. Link riêng đã được cấp cho KOL.</div>}
      {isDecisionCard && isRejected && <div className="text-[11px] text-[#7D715E]">Shop đã phản hồi đề xuất này.</div>}
    </div>
  );
}


function CampaignCardBubble({
  card,
  isMine,
  participantId,
  onRespond,
}: {
  card: any;
  isMine: boolean;
  participantId?: string;
  onRespond?: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [statusOverride, setStatusOverride] = useState<'ACCEPTED' | 'REJECTED' | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);

  const effectiveParticipantId = participantId || card.participantId;

  const handleAccept = async () => {
    if (!effectiveParticipantId) {
      setFeedbackError('Không tìm thấy mã định danh lời mời.');
      return;
    }
    setLoading(true);
    setFeedbackError(null);
    try {
      await api.patch(`/campaigns/invitations/${effectiveParticipantId}/accept`, {});
      setStatusOverride('ACCEPTED');
      onRespond?.();
    } catch (e: any) {
      console.error(e);
      setFeedbackError(e?.response?.data?.message || 'Không thể chấp nhận lời mời lúc này.');
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!effectiveParticipantId) {
      setFeedbackError('Không tìm thấy mã định danh lời mời.');
      return;
    }
    setLoading(true);
    setFeedbackError(null);
    try {
      await api.patch(`/campaigns/invitations/${effectiveParticipantId}/reject`, {});
      setStatusOverride('REJECTED');
      onRespond?.();
    } catch (e: any) {
      console.error(e);
      setFeedbackError(e?.response?.data?.message || 'Không thể từ chối lời mời lúc này.');
    } finally {
      setLoading(false);
    }
  };

  if (card.type === 'CAMPAIGN_ACCEPTED' || statusOverride === 'ACCEPTED') {
    return (
      <div className="flex items-center gap-2.5 p-3.5 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 text-emerald-900 rounded-2xl text-xs font-semibold shadow-xs max-w-sm">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <div className="min-w-0">
          <div>
            Đã chấp nhận tham gia chiến dịch <strong>{card.campaignName}</strong>
          </div>
          <div className="text-[10px] text-emerald-700 font-normal mt-0.5">
            Quyền lợi hoa hồng thưởng thêm đã được kích hoạt thành công.
          </div>
        </div>
      </div>
    );
  }

  if (card.type === 'CAMPAIGN_REJECTED' || statusOverride === 'REJECTED') {
    return (
      <div className="flex items-center gap-2.5 p-3.5 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 text-rose-900 rounded-2xl text-xs font-semibold shadow-xs max-w-sm">
        <XCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
        <div className="min-w-0">
          <div>
            Đã từ chối tham gia chiến dịch <strong>{card.campaignName}</strong>
          </div>
          <div className="text-[10px] text-rose-600 font-normal mt-0.5">
            Thông báo phản hồi đã được gửi lại cho đối tác.
          </div>
        </div>
      </div>
    );
  }

  const isExpired = card.endDate && new Date(card.endDate) < new Date();

  return (
    <div className="p-4 bg-gradient-to-br from-amber-50/90 via-orange-50/80 to-amber-100/60 border-2 border-amber-300 rounded-3xl shadow-sm text-stone-800 space-y-3 max-w-sm relative overflow-hidden backdrop-blur-xs">

      <div className="absolute top-0 right-0 w-24 h-24 bg-amber-400/10 rounded-full blur-xl pointer-events-none" />


      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black tracking-wide bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
          <Sparkles className="w-3 h-3 text-amber-100" /> THẺ MỜI VIP
        </span>
        <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-200/60 px-2 py-0.5 rounded-full border border-amber-300/60">
          <Gift className="w-3.5 h-3.5 text-amber-700" />
          <span>FR-27</span>
        </div>
      </div>


      <div className="space-y-1">
        <div className="font-extrabold text-stone-900 text-sm leading-snug">
          🎯 {card.campaignName}
        </div>
        {card.storeName && (
          <div className="text-[11px] text-stone-600 font-medium">
            Gian hàng: <strong className="text-stone-800">{card.storeName}</strong>
          </div>
        )}
        <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-700 bg-amber-100/80 px-2.5 py-1 rounded-xl border border-amber-300/70 shadow-2xs mt-1">
          <span>Thưởng Độc Quyền:</span>
          <span className="text-amber-900 text-sm">+{card.bonusCommissionRate}% Hoa Hồng</span>
        </div>
      </div>


      {card.personalMessage && (
        <div className="p-2.5 bg-white/80 border border-amber-200/80 rounded-xl text-xs text-stone-700 italic">
          "{card.personalMessage}"
        </div>
      )}


      <div className="text-[11px] text-stone-600 bg-white/70 px-3 py-1.5 rounded-xl border border-amber-200/60 flex items-center justify-between">
        <span>Thời hạn áp dụng:</span>
        <span className="font-bold text-stone-800">
          {card.startDate ? new Date(card.startDate).toLocaleDateString('vi-VN') : ''} →{' '}
          {card.endDate ? new Date(card.endDate).toLocaleDateString('vi-VN') : ''}
        </span>
      </div>


      {feedbackError && (
        <div className="p-2 bg-rose-50 border border-rose-200 rounded-xl text-[11px] text-rose-700 font-medium">
          {feedbackError}
        </div>
      )}


      {!isMine && !statusOverride && (
        <div className="pt-1 space-y-1.5">
          {isExpired ? (
            <div className="text-center text-xs font-bold text-stone-500 py-1 bg-stone-100 rounded-xl">
              Chiến dịch này đã kết thúc
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                id={`btn-accept-campaign-${card.campaignId}`}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                disabled={loading}
                onClick={handleAccept}
              >
                {loading ? '⏳ Đang xử lý...' : '✅ Chấp nhận'}
              </button>
              <button
                id={`btn-reject-campaign-${card.campaignId}`}
                className="py-2 px-3 bg-[#F3EFE6] hover:bg-[#EAE4D7] text-[#1A1612] border border-[#EAE4D7] rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 active:scale-95 cursor-pointer"
                disabled={loading}
                onClick={handleReject}
              >
                {loading ? '⏳' : '❌ Từ chối'}
              </button>
            </div>
          )}
        </div>
      )}

      {isMine && !statusOverride && (
        <div className="text-center text-[11px] font-semibold text-amber-800 bg-amber-100/50 py-1 rounded-xl border border-amber-200">
          Đã gửi tới đối tác • Đang chờ phản hồi
        </div>
      )}
    </div>
  );
}

export interface ProductInquiryCardData {
  type: 'PRODUCT_INQUIRY';
  productId: string;
  productTitle: string;
  productImage?: string;
  productPrice?: number;
  productSku?: string;
  commissionRate?: number;
  message?: string;
}

function tryParseProductInquiryCard(text: string): ProductInquiryCardData | null {
  if (!text || !text.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(text);
    if (parsed && parsed.type === 'PRODUCT_INQUIRY') {
      return parsed;
    }
  } catch {
    return null;
  }
  return null;
}

function ProductInquiryCardBubble({
  card,
  isMine,
}: {
  card: ProductInquiryCardData;
  isMine: boolean;
}) {
  return (
    <div
      className={`max-w-sm rounded-2xl border p-3.5 space-y-3 shadow-xs ${
        isMine
          ? 'bg-[#FAF8F5] border-[#EAE4D7] text-[#1A1612]'
          : 'bg-white border-[#EAE4D7] text-[#1A1612]'
      }`}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#EAE4D7] pb-2">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#FBF5EB] text-[#B88E4F] border border-[#EAE4D7]">
          <ShoppingBag className="w-3.5 h-3.5 text-[#B88E4F]" />
          <span>Trao đổi về Sản Phẩm</span>
        </span>
        {card.commissionRate && (
          <span className="text-[11px] font-extrabold text-[#B88E4F] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            Hoa hồng: {card.commissionRate}%
          </span>
        )}
      </div>

      <div className="flex gap-3">
        {card.productImage ? (
          <img
            src={card.productImage}
            alt={card.productTitle}
            className="w-16 h-16 rounded-xl object-cover border border-[#EAE4D7] shrink-0 bg-[#F3EFE6]"
          />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-[#F3EFE6] border border-[#EAE4D7] flex items-center justify-center text-[#B88E4F] font-bold text-xs shrink-0">
            SCANMS
          </div>
        )}
        <div className="min-w-0 flex-1 flex flex-col justify-between">
          <div>
            <h4 className="font-bold text-xs text-[#1A1612] line-clamp-2 leading-tight">
              {card.productTitle}
            </h4>
            {card.productSku && (
              <span className="text-[10px] text-[#7D715E] font-mono block mt-0.5">
                SKU: {card.productSku}
              </span>
            )}
          </div>
          {typeof card.productPrice === 'number' && (
            <div className="text-xs font-black text-[#B88E4F]">
              {card.productPrice.toLocaleString('vi-VN')} ₫
            </div>
          )}
        </div>
      </div>

      {card.message && (
        <div className="p-2.5 bg-white/90 rounded-xl border border-[#EAE4D7] text-xs text-[#1A1612] whitespace-pre-wrap leading-relaxed">
          {card.message}
        </div>
      )}

      <div className="pt-1 flex items-center justify-between gap-2 border-t border-[#EAE4D7]/70">
        <a
          href={`/products/${card.productSku || card.productId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#B88E4F] hover:text-[#B88E4F] hover:underline"
        >
          <span>Xem chi tiết trên Sàn</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
}

interface CouponVoucherCardData {
  type: 'COUPON_VOUCHER';
  couponId: string;
  couponCode: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minimumOrderAmount?: number | null;
  maximumDiscountAmount?: number | null;
  remainingUses?: number | null;
  expiresAt?: string | null;
  scopeType?: string;
  products?: Array<{ id: string; title: string }>;
  categories?: string[];
  storeName?: string;
}

function tryParseCouponVoucherCard(text: string): CouponVoucherCardData | null {
  if (!text || !text.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(text);
    if (parsed?.type === 'COUPON_VOUCHER' && parsed.couponId && parsed.couponCode) {
      return parsed;
    }
  } catch {}
  return null;
}

function CouponVoucherCardBubble({ card }: { card: CouponVoucherCardData }) {
  const [copied, setCopied] = useState(false);
  const discount = card.discountType === 'PERCENTAGE'
    ? `Giảm ${card.discountValue}%`
    : `Giảm ${Number(card.discountValue).toLocaleString('vi-VN')}₫`;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(card.couponCode);
      setCopied(true);
      toast.success('Đã sao chép mã giảm giá.');
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error('Không thể sao chép mã trên thiết bị này.');
    }
  };

  return (
    <article className="max-w-sm rounded-2xl border border-[#EEDFC6] bg-white p-3.5 text-[#1A1612] shadow-xs">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-[#B88E4F]">
        <Ticket className="h-4 w-4" /> Mã giảm giá · {card.storeName || 'Shop'}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 rounded-xl border border-dashed border-[#C59B58] bg-[#FBF5EB] p-3">
        <span className="font-mono text-base font-extrabold tracking-wider text-[#8F682E]">{card.couponCode}</span>
        <button type="button" onClick={() => void copyCode()} className="inline-flex items-center gap-1.5 rounded-lg border border-[#EEDFC6] bg-white px-2.5 py-1.5 text-xs font-bold text-[#7D715E] hover:bg-[#FAF8F5]">
          <Copy className="h-3.5 w-3.5" /> {copied ? 'Đã chép' : 'Sao chép'}
        </button>
      </div>
      <div className="mt-2 text-sm font-extrabold">{discount}</div>
      {card.minimumOrderAmount && <div className="mt-1 text-[11px] text-[#7D715E]">Đơn tối thiểu {Number(card.minimumOrderAmount).toLocaleString('vi-VN')}₫</div>}
      {card.maximumDiscountAmount && card.discountType === 'PERCENTAGE' && <div className="text-[11px] text-[#7D715E]">Giảm tối đa {Number(card.maximumDiscountAmount).toLocaleString('vi-VN')}₫</div>}
      {card.scopeType === 'PRODUCTS' && <div className="mt-1 text-[11px] text-[#7D715E]">Áp dụng cho {card.products?.length || 0} sản phẩm trong danh sách Shop.</div>}
      {card.scopeType === 'CATEGORIES' && <div className="mt-1 text-[11px] text-[#7D715E]">Danh mục: {card.categories?.join(', ') || 'theo điều kiện của Shop'}.</div>}
      {card.expiresAt && <div className="mt-1 text-[11px] text-[#7D715E]">Hạn đến {new Date(card.expiresAt).toLocaleDateString('vi-VN')}</div>}
      {card.remainingUses !== null && card.remainingUses !== undefined && <div className="mt-1 text-[11px] text-[#7D715E]">Còn {card.remainingUses} lượt sử dụng</div>}
    </article>
  );
}




function NewConversationModal({
  onClose,
  onCreated,
  isShop,
  asCustomer,
}: {
  onClose: () => void;
  onCreated: (conv: Conversation) => void;
  isShop: boolean;
  asCustomer: boolean;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);

  const search = useCallback(
    async (q: string) => {
      setLoading(true);
      try {
        const endpoint = isShop
          ? `/chat/search-collaborators?q=${encodeURIComponent(q.trim())}`
          : `/chat/search-stores?q=${encodeURIComponent(q.trim())}`;
        const res: any = await api.get(endpoint);
        const list = Array.isArray(res) ? res : res?.data || [];
        setResults(list);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [isShop]
  );

  useEffect(() => {
    const t = setTimeout(() => search(query), 200);
    return () => clearTimeout(t);
  }, [query, search]);

  const startChat = async (item: any) => {
    const id = item.id;
    setCreating(id);
    try {
      const body = isShop
        ? { collaboratorId: id }
        : { storeId: id, ...(asCustomer ? { asCustomer: true } : {}) };
      const res: any = await api.post('/chat/conversations', body);
      const conv = res && res.id ? res : res?.data || res;
      if (conv && conv.id) {
        onCreated(conv);
      }
      onClose();
    } catch (err) {
      console.error('Error starting chat:', err);
    } finally {
      setCreating(null);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={e => e.stopPropagation()}
      >

        <div className="flex items-center justify-between px-5 py-4 border-b border-stone-100 bg-stone-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-stone-900 text-base">
              {isShop ? 'Bắt đầu chat với KOL / CTV' : 'Bắt đầu chat với Shop / Cửa hàng'}
            </h3>
          </div>
          <button
            className="w-8 h-8 rounded-full hover:bg-stone-200/80 text-stone-500 flex items-center justify-center transition-colors"
            onClick={onClose}
            title="Đóng"
          >
            <X className="w-4 h-4" />
          </button>
        </div>


        <div className="p-4 border-b border-stone-100">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              id="new-chat-search"
              autoFocus
              placeholder={
                isShop
                  ? 'Tìm theo tên, email, sđt KOL...'
                  : 'Tìm theo tên shop, email chủ shop...'
              }
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white transition-all"
            />
            {query && (
              <button
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 p-0.5"
                onClick={() => setQuery('')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>


        <div className="flex-1 overflow-y-auto p-3 space-y-1 divide-y divide-stone-50 min-h-[220px]">
          {loading && (
            <div className="py-12 text-center text-xs font-semibold text-stone-400 flex flex-col items-center gap-2">
              <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span>Đang tìm kiếm...</span>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="py-12 text-center text-stone-400 text-xs flex flex-col items-center gap-2">
              <Search className="w-8 h-8 text-stone-300 stroke-1" />
              <p>Không tìm thấy {isShop ? 'KOL / CTV nào' : 'Cửa hàng nào'}</p>
            </div>
          )}

          {!loading &&
            results.map((item: any) => (
              <div
                key={item.id}
                id={`new-chat-${item.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-amber-50/60 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0 pr-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                    {isShop
                      ? item.fullName?.[0]?.toUpperCase() || '?'
                      : item.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-stone-900 text-sm truncate">
                      {isShop ? item.fullName : item.name}
                    </div>
                    <div className="text-xs text-stone-500 truncate">
                      {isShop
                        ? item.email
                        : item.owner?.fullName
                          ? `Chủ: ${item.owner.fullName}`
                          : item.owner?.email || 'N/A'}
                    </div>
                  </div>
                </div>

                <button
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg transition-all shadow-xs flex-shrink-0 disabled:opacity-50"
                  disabled={creating === item.id}
                  onClick={() => startChat(item)}
                >
                  {creating === item.id ? 'Đang mở...' : 'Nhắn tin'}
                </button>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}




function formatMsgTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return `Hôm qua ${format(d, 'HH:mm')}`;
  return format(d, 'dd/MM HH:mm', { locale: vi });
}

function formatConvTime(dateStr: string) {
  const d = new Date(dateStr);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Hôm qua';
  return format(d, 'dd/MM/yy', { locale: vi });
}




export interface ProductContextData {
  id: string;
  title: string;
  image?: string;
  price?: number;
  sku?: string;
  commissionRate?: number;
}

interface ChatBoxPageProps {
  embedded?: boolean;
  targetStoreId?: string;
  targetStoreName?: string;
  targetStoreLogo?: string;
  targetCollaboratorId?: string;
  targetCollaboratorName?: string;
  targetCollaboratorAvatar?: string;
  hideSidebar?: boolean;
  hideHeaderInChat?: boolean;
  className?: string;
  initialProductContext?: ProductContextData;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const LEGACY_ID_MAP: Record<string, string> = {
  'sora-skin-001': 'a7e7bd20-bebc-44c9-a98b-004de44cf773',
  'aura-bio-002': '461bdfe3-2260-4ac7-b93b-6a6da5c45535',
  'greenbio-003': 'c4444444-4444-4444-8444-444444444444',
  'green-bio-003': 'c4444444-4444-4444-8444-444444444444',
  'lumiere-004': 'd5555555-5555-4555-8555-555555555555',
  'kol-001': '33333333-3333-4333-8333-333333333333',
  'kol-002': '44444444-4444-4444-8444-444444444444',
  'kol-003': '237a7208-1c74-4322-96b2-51d810660723',
};

export default function ChatBoxPage({
  embedded = false,
  targetStoreId,
  targetStoreName: _targetStoreName,
  targetStoreLogo: _targetStoreLogo,
  targetCollaboratorId,
  targetCollaboratorName: _targetCollaboratorName,
  targetCollaboratorAvatar: _targetCollaboratorAvatar,
  hideSidebar = false,
  hideHeaderInChat = false,
  className = '',
  initialProductContext,
}: ChatBoxPageProps = {}) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();

  const effectiveTargetStoreId = targetStoreId || searchParams.get('storeId') || undefined;
  const requestedConversationId = searchParams.get('conversationId');
  const isCustomerConversation =
    currentUser?.role === 'CUSTOMER' || searchParams.get('asCustomer') === '1';
  const queryProductId = searchParams.get('productId');
  const queryProductContext: ProductContextData | undefined = queryProductId
    ? {
        id: queryProductId,
        title: searchParams.get('productTitle') || 'Sản phẩm đang quan tâm',
        image: searchParams.get('productImage') || undefined,
        price: Number(searchParams.get('productPrice')) || undefined,
        sku: searchParams.get('productSku') || undefined,
      }
    : undefined;
  const effectiveProductContext = initialProductContext || queryProductContext;

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const conversationsRef = useRef<Conversation[]>([]);
  conversationsRef.current = conversations;
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [pinnedProduct, setPinnedProduct] = useState<ProductContextData | null>(
    effectiveProductContext || null
  );

  useEffect(() => {
    if (effectiveProductContext) {
      setPinnedProduct(effectiveProductContext);
    }
  }, [initialProductContext, queryProductId]);
  const [isConnected, setIsConnected] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [oldestMsgId, setOldestMsgId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isShop = currentUser?.role === 'SHOP_MANAGER';
  const onlyCustomerChats = isShop && window.location.pathname === '/merchant/customer-messages';
  const canSeeAffiliateDeals = isShop || currentUser?.role === 'COLLABORATOR';
  const visibleMessages = canSeeAffiliateDeals
    ? messages
    : messages.filter((message) => !tryParseExclusiveDealCard(message.messageText));

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openConversationRef = useRef<(conv: Conversation) => Promise<void>>(() => Promise.resolve());
  const activeConvIdRef = useRef<string | null>(null);
  const sendingRef = useRef(false);

  const scrollToBottom = useCallback((smooth = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);


  useEffect(() => {
    let isMounted = true;

    const setupContext = async (list: Conversation[]) => {
      if (requestedConversationId) {
        const selected = list.find((conversation) => conversation.id === requestedConversationId);
        if (selected) { openConversationRef.current(selected); return; }
      }
      if (effectiveTargetStoreId) {
        const effectiveStoreId = LEGACY_ID_MAP[effectiveTargetStoreId] || effectiveTargetStoreId;
        const matching = list.find(
          (c) => c.storeId === effectiveStoreId || c.store?.id === effectiveStoreId
        );
        if (matching) {
          openConversationRef.current(matching);
        } else if (UUID_REGEX.test(effectiveStoreId)) {
          try {
            const res: any = await api.post('/chat/conversations', {
              storeId: effectiveStoreId,
              ...(isCustomerConversation ? { asCustomer: true } : {}),
            });
            const realConv = res?.data || res;
            if (isMounted && realConv && realConv.id) {
              setConversations((prev) => {
                const filtered = prev.filter((c) => c.id !== realConv.id);
                return [realConv, ...filtered];
              });
              openConversationRef.current(realConv);
            }
          } catch (err) {
            console.warn('Không thể khởi tạo hội thoại thật với shop:', err);
          }
        }
      } else if (targetCollaboratorId) {
        const effectiveCollabId = LEGACY_ID_MAP[targetCollaboratorId] || targetCollaboratorId;
        const matching = list.find(
          (c) => c.collaboratorId === effectiveCollabId || c.collaborator?.id === effectiveCollabId
        );
        if (matching) {
          openConversationRef.current(matching);
        } else if (UUID_REGEX.test(effectiveCollabId)) {
          try {
            const res: any = await api.post('/chat/conversations', { collaboratorId: effectiveCollabId });
            const realConv = res?.data || res;
            if (isMounted && realConv && realConv.id) {
              setConversations((prev) => {
                const filtered = prev.filter((c) => c.id !== realConv.id);
                return [realConv, ...filtered];
              });
              openConversationRef.current(realConv);
            }
          } catch (err) {
            console.warn('Không thể khởi tạo hội thoại thật với KOL:', err);
          }
        }
      } else if (list.length > 0) {
        openConversationRef.current(list[0]);
      }
    };

    api
      .get('/chat/conversations')
      .then((res: any) => {
        if (!isMounted) return;
        const all: Conversation[] = Array.isArray(res) ? res : res?.data || [];
        const list = onlyCustomerChats ? all.filter((conversation) => Boolean(conversation.customerId)) : all;
        setConversations(list);
        setupContext(list);
      })
      .catch((err) => {
        console.warn('Lỗi tải danh sách hội thoại:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [effectiveTargetStoreId, targetCollaboratorId, isCustomerConversation, requestedConversationId, onlyCustomerChats]);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const showErrorToast = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4000);
  };

  const showSuccessToast = (msg: string) => {
    setSuccessMessage(msg);
    toast.success(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };


  useEffect(() => {
    const socket = getChatSocket();
    setIsConnected(socket.connected);

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onNewMessage = (msg: ChatMessage) => {
      if (!canSeeAffiliateDeals && tryParseExclusiveDealCard(msg.messageText)) return;
      if (!conversationsRef.current.some((conversation) => conversation.id === msg.conversationId)) {
        api.get('/chat/conversations', { headers: { 'x-skip-cache': '1' } }).then((response: any) => {
          const all: Conversation[] = Array.isArray(response) ? response : response?.data || [];
          setConversations(onlyCustomerChats ? all.filter((conversation) => Boolean(conversation.customerId)) : all);
        }).catch(() => undefined);
      }
      if (msg.conversationId === activeConvIdRef.current) {
        setMessages(prev => prev.some((item) => item.id === msg.id) ? prev : [...prev, msg]);
        if (msg.senderId !== currentUser?.id) {
          api.patch(`/chat/conversations/${msg.conversationId}/read`).catch(() => undefined);
        }
        setTimeout(() => scrollToBottom(true), 50);
      }
      setConversations(prev =>
        prev
          .map(c =>
            c.id === msg.conversationId
              ? {
                ...c,
                lastMessageAt: msg.createdAt,
                _count: { chatMessages: msg.senderId === currentUser?.id || msg.conversationId === activeConvIdRef.current
                  ? (c._count?.chatMessages || 0) : (c._count?.chatMessages || 0) + 1 },
                chatMessages: [
                  {
                    messageText: msg.messageText,
                    mediaType: msg.mediaType,
                    mediaName: msg.mediaName,
                    createdAt: msg.createdAt,
                    senderId: msg.senderId,
                    isRead: msg.isRead,
                  },
                ],
              }
              : c
          )
          .sort(
            (a, b) =>
              new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
          )
      );
    };
    const onRead = ({ conversationId, readerId }: { conversationId: string; readerId: string }) => {
      if (conversationId === activeConvIdRef.current && readerId !== currentUser?.id) {
        setMessages(prev => prev.map(msg => msg.senderId === currentUser?.id ? { ...msg, isRead: true } : msg));
      }
    };
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('new_message', onNewMessage);
    socket.on('messages_read', onRead);

    const onTyping = ({ fullName, isTyping }: { fullName: string; isTyping: boolean }) => {
        setTypingUser(isTyping ? fullName : null);
        if (isTyping) {
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setTypingUser(null), 3000);
        }
      };
    socket.on('user_typing', onTyping);

    const onError = (err: { message: string }) => {
      console.error('Socket error:', err.message);
      showErrorToast(err.message || 'Lỗi gửi tin nhắn');
    };
    socket.on('error', onError);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('new_message', onNewMessage);
      socket.off('messages_read', onRead);
      socket.off('user_typing', onTyping);
      socket.off('error', onError);
    };
  }, [scrollToBottom, onlyCustomerChats]);


  const openConversation = async (conv: Conversation) => {
    if (!conv || !conv.id) return;
    const socket = getChatSocket();

    if (activeConvId && UUID_REGEX.test(activeConvId)) {
      socket.emit('leave_conversation', { conversationId: activeConvId });
    }

    setActiveConvId(conv.id);
    activeConvIdRef.current = conv.id;
    setMessages([]);
    setHasMore(false);
    setOldestMsgId(undefined);
    setIsLoadingMsgs(true);

    if (UUID_REGEX.test(conv.id)) {
      try {
        const res: any = await api.get(`/chat/conversations/${conv.id}/messages?take=50`);
        const msgs: ChatMessage[] = Array.isArray(res) ? res : res?.data || [];
        setMessages(msgs);
        setHasMore(msgs.length === 50);
        setOldestMsgId(msgs[0]?.id);
        await api.patch(`/chat/conversations/${conv.id}/read`);
        setConversations(prev => prev.map(item => item.id === conv.id
          ? { ...item, _count: { chatMessages: 0 }, chatMessages: item.chatMessages?.[0] ? [{ ...item.chatMessages[0], isRead: true }] : [] } : item));
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoadingMsgs(false);
        setTimeout(() => scrollToBottom(), 50);
      }

      socket.emit('join_conversation', { conversationId: conv.id });
    } else {
      setIsLoadingMsgs(false);
    }
  };
  openConversationRef.current = openConversation;


  const loadMore = async () => {
    if (!activeConvId || !oldestMsgId || !hasMore) return;
    const container = messagesContainerRef.current;
    const prevScrollHeight = container?.scrollHeight || 0;

    try {
      const res: any = await api.get(
        `/chat/conversations/${activeConvId}/messages?take=50&cursor=${oldestMsgId}`
      );
      const older: ChatMessage[] = Array.isArray(res) ? res : res?.data || [];
      setMessages(prev => [...older, ...prev]);
      setHasMore(older.length === 50);
      setOldestMsgId(older[0]?.id);

      setTimeout(() => {
        if (container) {
          container.scrollTop = container.scrollHeight - prevScrollHeight;
        }
      }, 0);
    } catch (err) {
      console.error(err);
    }
  };


  const sendMessage = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || !activeConvId || sendingRef.current) return;

    if (isBankAccountOrFraudText(trimmed)) {
      showErrorToast(
        '⚠️ Tin nhắn bị chặn: Không được phép gửi số tài khoản ngân hàng (STK) hoặc yêu cầu chuyển tiền ngoài hệ thống nhằm phòng chống lừa đảo!'
      );
      return;
    }

    if (isProfaneText(trimmed)) {
      showErrorToast(
        '⚠️ Tin nhắn bị chặn: Vui lòng không sử dụng từ ngữ thô tục, chửi thề hoặc vi phạm chuẩn mực văn minh!'
      );
      return;
    }

    let messageToSend = trimmed;
    if (pinnedProduct) {
      messageToSend = JSON.stringify({
        type: 'PRODUCT_INQUIRY',
        productId: pinnedProduct.id,
        productTitle: pinnedProduct.title,
        productImage: pinnedProduct.image,
        productPrice: pinnedProduct.price,
        productSku: pinnedProduct.sku,
        commissionRate: pinnedProduct.commissionRate,
        message: trimmed,
      });
    }

    const socket = getChatSocket();
    if (!socket.connected) { showErrorToast('Mất kết nối chat, vui lòng thử lại.'); return; }
    sendingRef.current = true;
    setIsSending(true);
    socket.timeout(8000).emit('send_message', {
      conversationId: activeConvId,
      messageText: messageToSend,
      messageId: crypto.randomUUID(),
    }, (timeoutError: Error | null, result?: { ok: boolean; error?: string }) => {
      sendingRef.current = false;
      setIsSending(false);
      if (timeoutError || !result?.ok) {
        showErrorToast(result?.error || 'Không gửi được tin nhắn, vui lòng thử lại.');
        return;
      }
      setInputText((current) => current.trim() === trimmed ? '' : current);
      setPinnedProduct(null);
      if (pinnedProduct && queryProductId) {
        const nextParams = new URLSearchParams(searchParams);
        ['productId', 'productTitle', 'productImage', 'productPrice', 'productSku', 'commissionRate'].forEach(key => nextParams.delete(key));
        setSearchParams(nextParams, { replace: true });
      }
    });

    socket.emit('typing', { conversationId: activeConvId, isTyping: false });
  }, [inputText, activeConvId, pinnedProduct, queryProductId, searchParams, setSearchParams]);


  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(e.target.value);
    if (!activeConvId) return;
    const socket = getChatSocket();
    socket.emit('typing', { conversationId: activeConvId, isTyping: true });
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      socket.emit('typing', { conversationId: activeConvId, isTyping: false });
    }, 2000);
  };


  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const activeConv = conversations.find(c => c.id === activeConvId);
  const filteredConversations = conversations.filter(
    c =>
      (c.store?.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.collaborator?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.customer?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getOtherParty = (conv: Conversation) => {
    if (!currentUser) return conv.store?.name || 'Cửa hàng';
    return currentUser.role === 'COLLABORATOR' || currentUser.role === 'CUSTOMER'
      ? conv.store?.name || 'Cửa hàng'
      : conv.customer?.fullName || conv.collaborator?.fullName || 'Khách hàng / Đối tác';
  };

  const getOtherAvatarUrl = (conv: Conversation) => {
    if (currentUser?.role === 'COLLABORATOR') {
      return conv.store?.owner?.avatarUrl || conv.store?.logoUrl || undefined;
    }
    return (
      conv.collaborator?.collaboratorProfile?.avatarUrl ||
      conv.collaborator?.avatarUrl ||
      undefined
    );
  };

  // getOtherAvatar replaced by ChatAvatar with getOtherAvatarUrl

  const openOtherProfile = (conv: Conversation) => {
    if (currentUser?.role === 'COLLABORATOR') {
      const store = conv.store;
      if (!store?.id) return;
      navigate(
        store.slug
          ? `/shop/${encodeURIComponent(store.slug)}`
          : `/marketplace?shop=${encodeURIComponent(store.id)}`
      );
      return;
    }

    if (currentUser?.role === 'SHOP_MANAGER' && conv.collaborator?.id) {
      navigate(
        `/merchant/kol-hub?kol=${encodeURIComponent(conv.collaborator.id)}&tab=profile`
      );
    }
  };

  const canOpenOtherProfile = (conv: Conversation) =>
    (currentUser?.role === 'COLLABORATOR' && Boolean(conv.store?.id)) ||
    (currentUser?.role === 'SHOP_MANAGER' && Boolean(conv.collaborator?.id));

  return (
    <div className={embedded ? 'h-full w-full' : 'mx-auto flex w-full max-w-[1520px] flex-col pt-3 pb-4 sm:pt-4'}>
      <div
        className={`flex min-h-0 min-w-0 ${embedded ? 'h-full w-full' : 'h-[calc(100dvh-130px)] min-h-[460px] sm:min-h-[560px]'} overflow-hidden rounded-3xl border border-[#EAE4D7] bg-white shadow-[0_12px_36px_rgba(35,29,21,0.08)] ${className}`}
        id="chat-page"
      >
      {!hideSidebar && (
      <aside
        className={`${activeConvId ? 'hidden sm:flex' : 'flex'} ${
          isSidebarCollapsed ? 'w-[72px]' : 'w-full sm:w-[300px] lg:w-[320px] xl:w-[350px]'
        } min-h-0 flex-shrink-0 flex-col border-r border-[#EAE4D7] bg-[#FAF8F5] transition-[width] duration-300 ease-in-out`}
        aria-label="Danh sách hội thoại"
      >

        {isSidebarCollapsed ? (
          /* COLLAPSED VIEW: Only Avatars & Expand Toggle */
          <div className="flex flex-col h-full items-center">
            {/* Header with Expand Button */}
            <div className="h-12 w-full border-b border-[#EAE4D7] bg-white flex items-center justify-center">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed(false)}
                className="w-8 h-8 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7] hover:border-[#B88E4F] hover:bg-[#FBF5EB] text-[#7D715E] hover:text-[#B88E4F] flex items-center justify-center transition cursor-pointer shadow-2xs"
                title="Mở rộng danh sách hội thoại"
                aria-label="Mở rộng danh sách hội thoại"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Collapsed List: Avatars only */}
            <div className="flex-1 w-full overflow-y-auto py-2.5 px-2 space-y-2.5 no-scrollbar flex flex-col items-center">
              {filteredConversations.map((conv) => {
                const lastMsg = conv.chatMessages?.[0];
                const isActive = conv.id === activeConvId;
                const unread = (conv._count?.chatMessages || 0) > 0 || (lastMsg && !lastMsg.isRead && lastMsg.senderId !== currentUser?.id);
                const otherParty = getOtherParty(conv);

                return (
                  <div key={conv.id} className="relative group">
                    <button
                      type="button"
                      onClick={() => openConversation(conv)}
                      className={`relative p-1 rounded-2xl transition cursor-pointer block ${
                        isActive
                          ? 'bg-[#FBF5EB] ring-2 ring-[#C59B58] shadow-sm'
                          : 'hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div className="relative">
                        <ChatAvatar
                          src={getOtherAvatarUrl(conv)}
                          name={otherParty}
                          className="w-9 h-9 rounded-xl border border-[#EAE4D7] text-xs shadow-2xs"
                        />
                        {unread && (
                          <span
                            className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#DC2626] text-white flex items-center justify-center text-[8px] font-black border-2 border-white shadow-2xs animate-pulse"
                            title="Tin nhắn mới"
                          />
                        )}
                      </div>
                    </button>

                    {/* Floating Tooltip Card on Hover */}
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 hidden group-hover:flex z-50 flex-col min-w-[200px] max-w-[260px] p-2.5 bg-white border border-[#EAE4D7] rounded-xl shadow-xl pointer-events-none whitespace-nowrap animate-in fade-in duration-150 text-left">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-[#1A1612] truncate">
                          {otherParty}
                        </span>
                        {lastMsg && (
                          <span className="text-[9.5px] text-[#7D715E]/70 shrink-0 font-medium">
                            {formatConvTime(lastMsg.createdAt)}
                          </span>
                        )}
                      </div>
                      <span className="text-[10.5px] text-[#7D715E] truncate mt-1">
                        {lastMsg?.messageText || 'Bắt đầu cuộc trò chuyện...'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* EXPANDED VIEW: Clean, Compact, Warm Sand & Gold */
          <>
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-[#EAE4D7] bg-white px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-[#FBF5EB] border border-[#EEDFC6] text-[#B88E4F] flex items-center justify-center shadow-2xs shrink-0">
                  <MessageSquare className="w-3.5 h-3.5" />
                </div>
                <div className="flex items-center gap-1.5 min-w-0">
                  <h1 className="truncate text-sm font-extrabold tracking-tight text-[#1A1612]">
                    Tin nhắn
                  </h1>
                  <div
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      isConnected ? 'bg-emerald-500 ring-2 ring-emerald-200' : 'bg-rose-500'
                    }`}
                    title={isConnected ? 'Đang kết nối Realtime' : 'Mất kết nối'}
                  />
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <button
                  type="button"
                  id="btn-new-conversation"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-[#B88E4F] shadow-2xs transition hover:border-[#B88E4F] hover:bg-[#FBF5EB] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]/40"
                  title="Tạo cuộc trò chuyện mới"
                  onClick={() => setShowNewChat(true)}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>

                {/* Button to collapse sidebar */}
                <button
                  type="button"
                  onClick={() => setIsSidebarCollapsed(true)}
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] text-[#7D715E] shadow-2xs transition hover:border-[#B88E4F] hover:bg-[#FBF5EB] hover:text-[#B88E4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]/40"
                  title="Thu gọn danh sách (chỉ hiện icon)"
                  aria-label="Thu gọn danh sách"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="border-b border-[#EAE4D7] bg-[#FAF8F5] p-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#7D715E]" />
                <input
                  id="chat-search-input"
                  type="text"
                  className="w-full rounded-xl border border-[#EAE4D7] bg-white py-2.5 pl-9 pr-8 text-sm font-medium text-[#1A1612] shadow-2xs transition placeholder:text-[#7D715E]/60 focus:border-[#C59B58] focus:outline-none focus:ring-2 focus:ring-[#C59B58]/15"
                  placeholder="Tìm kiếm hội thoại..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7D715E] hover:text-[#1A1612] text-xs font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>
            </div>

            {/* Conversation List */}
            <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-2.5 py-2 no-scrollbar" role="list">
              {filteredConversations.length === 0 && (
                <div className="py-12 text-center text-[#7D715E] text-xs space-y-2">
                  <MessageSquare className="w-7 h-7 mx-auto text-[#C59B58]/40 stroke-1" />
                  <p className="font-medium">Chưa có cuộc trò chuyện nào</p>
                  <button
                    className="text-[#B88E4F] hover:underline font-bold text-xs"
                    onClick={() => setShowNewChat(true)}
                  >
                    + Bắt đầu chat ngay
                  </button>
                </div>
              )}

              {filteredConversations.map((conv) => {
                const lastMsg = conv.chatMessages?.[0];
                const isActive = conv.id === activeConvId;
                const unread = (conv._count?.chatMessages || 0) > 0 || (lastMsg && !lastMsg.isRead && lastMsg.senderId !== currentUser?.id);
                const otherParty = getOtherParty(conv);

                return (
                  <div
                    key={conv.id}
                    id={`conv-item-${conv.id}`}
                    className={`group relative flex cursor-pointer items-center gap-3 rounded-2xl border px-3 py-3 transition-all duration-150 ${
                      isActive
                        ? 'border-[#EEDFC6] bg-[#FBF5EB] shadow-xs'
                        : 'hover:bg-[#FAF8F5] border border-transparent'
                    }`}
                    role="listitem"
                    onClick={() => openConversation(conv)}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && openConversation(conv)}
                  >
                    {/* Active gold left indicator bar */}
                    {isActive && (
                      <div className="absolute left-0 top-2 bottom-2 w-1 bg-[#C59B58] rounded-r-full" />
                    )}

                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        openOtherProfile(conv);
                      }}
                      disabled={!canOpenOtherProfile(conv)}
                      title={`Xem hồ sơ ${otherParty}`}
                      aria-label={`Xem hồ sơ ${otherParty}`}
                      className="rounded-full border-0 bg-transparent p-0 flex-shrink-0 cursor-pointer disabled:cursor-default"
                    >
                      <ChatAvatar
                        src={getOtherAvatarUrl(conv)}
                        name={otherParty}
                        className={`h-10 w-10 rounded-full text-xs shadow-2xs transition-transform group-hover:scale-105 ${
                          isActive ? 'border border-[#C59B58] ring-2 ring-[#C59B58]/20' : 'border border-[#EAE4D7]'
                        }`}
                      />
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={`truncate text-[13px] font-bold transition-colors ${
                            isActive ? 'text-[#B88E4F]' : 'text-[#1A1612] group-hover:text-[#B88E4F]'
                          }`}
                          title={otherParty}
                        >
                          {otherParty}
                        </span>
                        {lastMsg && (
                          <span className="shrink-0 text-[10px] font-medium text-[#7D715E]/80">
                            {formatConvTime(lastMsg.createdAt)}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`truncate text-[11px] leading-snug ${
                            unread ? 'font-bold text-[#1A1612]' : 'text-[#7D715E]'
                          }`}
                        >
                          {lastMsg
                            ? lastMsg.mediaType
                              ? `📎 ${lastMsg.mediaName || 'Tệp đính kèm'}`
                              : lastMsg.messageText.startsWith('{')
                              ? lastMsg.messageText.includes('EXCLUSIVE_DEAL_')
                                ? canSeeAffiliateDeals
                                  ? '🤝 [Đề xuất Exclusive Deal]'
                                  : 'Shop đã gửi tin nhắn.'
                                : lastMsg.messageText.includes('PRODUCT_INQUIRY')
                                ? '🛍️ [Trao đổi về sản phẩm]'
                                : lastMsg.messageText.includes('COUPON_VOUCHER')
                                  ? '🎟️ [Mã giảm giá]'
                                  : lastMsg.messageText.includes('CAMPAIGN_')
                                    ? '👑 [Chiến dịch hợp tác VIP]'
                                    : '💬 [Tin nhắn đính kèm]'
                              : lastMsg.messageText
                            : 'Bắt đầu cuộc trò chuyện...'}
                        </span>
                        {unread && (
                          <span className="w-2 h-2 rounded-full bg-[#C59B58] flex-shrink-0 animate-pulse" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </aside>
      )}


      <main className={`${activeConvId ? 'flex' : 'hidden sm:flex'} relative min-w-0 flex-1 flex-col bg-[#FAF8F5]/60`} aria-label="Khung chat">
        {!activeConv ? (
          <div className="flex flex-1 flex-col items-center justify-center space-y-3 p-6 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] text-[#B88E4F] shadow-xs">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h2 className="text-lg font-bold text-[#1A1612]">Chọn một hội thoại</h2>
            <p className="max-w-sm text-sm text-[#7D715E]">
              Chọn cuộc trò chuyện ở cột bên trái hoặc bấm dấu <strong>+</strong> để bắt đầu trao đổi trực tiếp
            </p>
          </div>
        ) : (
          <>

            {!hideHeaderInChat && (
            <header className="flex items-center justify-between gap-3 border-b border-[#EAE4D7] bg-white px-4 py-3 shadow-xs sm:px-6">
              <div className="flex min-w-0 items-center gap-3">
                <button type="button" className="rounded-xl p-2 text-[#7D715E] transition hover:bg-[#F3EFE6] hover:text-[#1A1612] sm:hidden" onClick={() => { setActiveConvId(null); activeConvIdRef.current = null; }} aria-label="Về danh sách hội thoại"><ArrowLeft size={20} /></button>
                <button
                  type="button"
                  onClick={() => openOtherProfile(activeConv)}
                  disabled={!canOpenOtherProfile(activeConv)}
                  title={`Xem hồ sơ ${getOtherParty(activeConv)}`}
                  aria-label={`Xem hồ sơ ${getOtherParty(activeConv)}`}
                  className="rounded-full border-0 bg-transparent p-0 cursor-pointer disabled:cursor-default focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]"
                >
                  <ChatAvatar
                    src={getOtherAvatarUrl(activeConv)}
                    name={getOtherParty(activeConv)}
                    className="h-11 w-11 rounded-full border border-[#EEDFC6] text-sm shadow-xs"
                  />
                </button>
                <div className="min-w-0">
                  <div className="truncate text-sm font-bold text-[#1A1612] sm:text-base">{getOtherParty(activeConv)}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-xs text-[#7D715E]">
                    {typingUser ? (
                      <span className="flex items-center gap-1 font-medium text-[#B88E4F]">
                        <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-[#C59B58]" />
                        {typingUser} đang nhập...
                      </span>
                    ) : (
                  <span className="flex items-center gap-1.5">
                        <span
                          className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'
                            }`}
                        />
                        {isConnected ? 'Đang hoạt động' : 'Ngoại tuyến'}
                      </span>
                    )}
                  </div>
                </div>
              </div>


              {isShop && (
                <button
                  id="btn-open-vip-invite"
                  type="button"
                  className="inline-flex shrink-0 cursor-pointer items-center gap-2 rounded-xl border border-[#EEDFC6] bg-[#FBF5EB] px-3 py-2 text-xs font-bold text-[#B88E4F] transition hover:border-[#C59B58] hover:bg-[#F3EFE6] hover:text-[#1A1612] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]/40"
                  onClick={() => setShowVipModal(true)}
                  title="Gửi Thẻ Mời VIP Chiến Dịch Tiếp Thị Độc Quyền"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#B88E4F]" />
                  <span>Mời Chiến Dịch VIP</span>
                </button>
              )}
            </header>
            )}


            <div
              className={`min-h-0 flex-1 overflow-y-auto ${embedded ? 'space-y-3 p-3 sm:p-4' : 'space-y-5 p-4 sm:p-7 lg:p-8'}`}
              ref={messagesContainerRef}
              onScroll={e => {
                if ((e.target as HTMLElement).scrollTop < 60 && hasMore) {
                  loadMore();
                }
              }}
            >
              {hasMore && (
                <div className="text-center">
                  <button
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#EAE4D7] bg-white px-3 py-1.5 text-xs font-semibold text-[#7D715E] transition hover:border-[#C59B58] hover:bg-[#FBF5EB]"
                    onClick={loadMore}
                  >
                    <ArrowUp className="w-3 h-3" /> Tải thêm tin nhắn cũ hơn
                  </button>
                </div>
              )}

              {isLoadingMsgs && (
                  <div className="flex flex-col items-center gap-2 py-12 text-xs text-[#7D715E]">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#C59B58] border-t-transparent" />
                  <span>Đang tải tin nhắn...</span>
                </div>
              )}

              {visibleMessages.map((msg, idx) => {
                const isMine = msg.senderId === currentUser?.id;
                const showDate =
                  idx === 0 ||
                  new Date(visibleMessages[idx - 1].createdAt).toDateString() !==
                  new Date(msg.createdAt).toDateString();

                return (
                  <div key={msg.id} className="space-y-2">
                    {showDate && (
                      <div className="my-4 flex items-center justify-center">
                        <span className="rounded-full border border-[#EAE4D7] bg-white px-3 py-1 text-[11px] font-semibold text-[#7D715E] shadow-2xs">
                          {isToday(new Date(msg.createdAt))
                            ? 'Hôm nay'
                            : isYesterday(new Date(msg.createdAt))
                              ? 'Hôm qua'
                              : format(new Date(msg.createdAt), 'dd/MM/yyyy', { locale: vi })}
                        </span>
                      </div>
                    )}

                    <div className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
                      {!isMine && (
                        <button
                          type="button"
                          onClick={() => openOtherProfile(activeConv)}
                          disabled={!canOpenOtherProfile(activeConv)}
                          title={`Xem hồ sơ ${getOtherParty(activeConv)}`}
                          aria-label={`Xem hồ sơ ${getOtherParty(activeConv)}`}
                          className="rounded-full border-0 bg-transparent p-0 flex-shrink-0 mb-1 cursor-pointer disabled:cursor-default hover:ring-2 hover:ring-[#C59B58] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]"
                        >
                          <ChatAvatar
                            src={
                              msg.sender.collaboratorProfile?.avatarUrl ||
                              msg.sender.avatarUrl ||
                              getOtherAvatarUrl(activeConv)
                            }
                            name={msg.sender.fullName || getOtherParty(activeConv)}
                            className="w-7 h-7 rounded-full text-[10px]"
                          />
                        </button>
                      )}

                      <div className={`max-w-[78%] space-y-1 sm:max-w-[72%] lg:max-w-[68%] ${isMine ? 'items-end' : 'items-start'}`}>
                        {!isMine && (
                          <div className="pl-1 text-xs font-medium text-[#7D715E]">
                            {msg.sender.fullName}
                          </div>
                        )}

                        {(() => {
                          const exclusiveDealCard = tryParseExclusiveDealCard(msg.messageText);
                          if (exclusiveDealCard) {
                            if (!canSeeAffiliateDeals) return null;
                            return <ExclusiveDealCardBubble card={exclusiveDealCard} isMine={isMine} isShop={isShop} />;
                          }

                          const inquiryCard = tryParseProductInquiryCard(msg.messageText);
                          if (inquiryCard) {
                            return <ProductInquiryCardBubble card={inquiryCard} isMine={isMine} />;
                          }

                          const couponCard = tryParseCouponVoucherCard(msg.messageText);
                          if (couponCard) {
                            return <CouponVoucherCardBubble card={couponCard} />;
                          }

                          const card = tryParseCampaignCard(msg.messageText);
                          if (card) {
                            return <CampaignCardBubble card={card} isMine={isMine} />;
                          }

                          return (
                            <div
                              className={`rounded-2xl p-3.5 text-sm leading-relaxed shadow-xs ${isMine
                                  ? 'rounded-tr-md border border-[#B88E4F] bg-[#C59B58] text-[#231D15]'
                                  : 'rounded-tl-md border border-[#EAE4D7] bg-white text-[#1A1612]'
                                }`}
                            >
                              {msg.mediaUrl && msg.mediaType === 'IMAGE' && (
                                <a href={msg.mediaUrl} target="_blank" rel="noreferrer">
                                  <img
                                    src={msg.mediaUrl}
                                    alt={msg.mediaName || 'Ảnh đính kèm'}
                                    className="max-w-xs max-h-72 object-contain rounded-lg mb-2 cursor-pointer hover:opacity-95"
                                  />
                                </a>
                              )}
                              {msg.mediaUrl && msg.mediaType === 'VIDEO' && (
                                <video
                                  src={msg.mediaUrl}
                                  controls
                                  preload="metadata"
                                  className="max-w-xs max-h-72 rounded-lg mb-2"
                                />
                              )}
                              {msg.mediaUrl && msg.mediaType === 'DOCUMENT' && (
                                <a
                                  href={msg.mediaUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  download={msg.mediaName || true}
                                  className="mb-2 flex items-center gap-2.5 rounded-xl border border-stone-200 bg-white/80 px-3 py-2.5 text-stone-800 hover:bg-white"
                                >
                                  <FileText className="h-5 w-5 shrink-0 text-amber-700" />
                                  <span className="break-all">{msg.mediaName || 'Tải tài liệu đính kèm'}</span>
                                </a>
                              )}
                              {msg.mediaUrl && !msg.mediaType && (
                                <a href={msg.mediaUrl} target="_blank" rel="noreferrer" className="mb-2 inline-flex items-center gap-2 text-amber-800 underline">
                                  <FileText className="h-4 w-4" /> Tải tệp đính kèm
                                </a>
                              )}
                              {msg.messageText && <p className="whitespace-pre-wrap break-words">{msg.messageText}</p>}
                            </div>
                          );
                        })()}

                        <div
                          className={`flex items-center gap-1 px-1 text-[10px] text-[#7D715E]/80 ${isMine ? 'justify-end' : 'justify-start'
                            }`}
                        >
                          <span>{formatMsgTime(msg.createdAt)}</span>
                          {isMine && (
                            <span>
                              {msg.isRead ? (
                                <CheckCheck className="w-3 h-3 text-amber-600 inline" />
                              ) : (
                                <Check className="w-3 h-3 inline" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {typingUser && (
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-[#EAE4D7] bg-[#F3EFE6] text-xs font-bold text-[#7D715E]">
                    {typingUser[0]?.toUpperCase()}
                  </div>
                  <div className="flex items-center gap-1 rounded-2xl rounded-tl-md border border-[#EAE4D7] bg-white px-3.5 py-2 shadow-xs">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C59B58] [animation-delay:-0.3s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C59B58] [animation-delay:-0.15s]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#C59B58]" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>


            <div className="border-t border-[#EAE4D7] bg-white">
              {/* PINNED PRODUCT INQUIRY BANNER */}
              {pinnedProduct && (
                <div className="mx-4 mt-3 p-3 bg-gradient-to-r from-[#FBF5EB] to-[#FAF8F5] border border-[#EAE4D7] rounded-2xl shadow-2xs">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {pinnedProduct.image ? (
                        <img
                          src={pinnedProduct.image}
                          alt={pinnedProduct.title}
                          className="w-12 h-12 rounded-xl object-cover border border-[#EAE4D7] shrink-0 bg-white"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#F3EFE6] border border-[#EAE4D7] flex items-center justify-center text-[#B88E4F] font-bold text-xs shrink-0">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-[#B88E4F] bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#EAE4D7]">
                            Đang đính kèm sản phẩm
                          </span>
                          {pinnedProduct.commissionRate && (
                            <span className="text-[10.5px] font-extrabold text-[#B88E4F]">
                              Hoa hồng: {pinnedProduct.commissionRate}%
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-xs text-[#1A1612] truncate mt-0.5">
                          {pinnedProduct.title}
                        </h4>
                        {typeof pinnedProduct.price === 'number' && (
                          <div className="text-xs font-black text-[#B88E4F]">
                            {pinnedProduct.price.toLocaleString('vi-VN')} ₫
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPinnedProduct(null)}
                      className="p-1 text-[#7D715E] hover:text-[#1A1612] hover:bg-[#F3EFE6] rounded-lg transition-colors cursor-pointer"
                      title="Bỏ đính kèm sản phẩm này"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick question chips */}
                  <div className="mt-2.5 pt-2 border-t border-[#EAE4D7]/60 flex flex-wrap gap-1.5 items-center">
                    <span className="text-[10.5px] font-bold text-[#7D715E] flex items-center gap-1 mr-1">
                      <Sparkles className="w-3 h-3 text-[#B88E4F]" /> Gợi ý nhanh:
                    </span>
                    {[
                      {
                        label: '📦 Xin mẫu thử (Sample)',
                        text: 'Chào Shop, mình quan tâm đến sản phẩm này và muốn đăng ký xin hàng mẫu trải nghiệm để quay video review/livestream.',
                      },
                      {
                        label: '💰 Thỏa thuận hoa hồng',
                        text: 'Chào Shop, mình muốn trao đổi thêm về chính sách hoa hồng thưởng thêm cho dòng sản phẩm này nếu đạt KPI doanh số.',
                      },
                      {
                        label: '🔍 Kiểm tra tồn kho',
                        text: 'Chào Shop, sản phẩm này hiện tại kho còn sẵn số lượng bao nhiêu để mình lên kế hoạch gắn link video ạ?',
                      },
                    ].map((chip, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setInputText(chip.text)}
                        className="px-2.5 py-1 rounded-full bg-white hover:bg-[#F3EFE6] border border-[#EAE4D7] hover:border-[#C59B58] text-[#1A1612] text-[11px] font-medium transition-all shadow-2xs cursor-pointer active:scale-95"
                      >
                        {chip.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className={`${embedded ? 'p-2.5 sm:p-3' : 'px-4 py-3 sm:px-6 sm:py-4'}`}>
                <div className="flex items-end gap-2 sm:gap-2.5">
                <button
                  type="button"
                  className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-[#7D715E] transition hover:bg-[#F3EFE6] hover:text-[#B88E4F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]/40"
                  id="chat-attach-btn"
                  title="Đính kèm ảnh"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                {isShop && (
                  <button
                    type="button"
                    id="btn-composer-vip-invite"
                    className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl text-[#B88E4F] transition hover:bg-[#FBF5EB] hover:text-[#1A1612] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C59B58]/40"
                    title="Gửi Thẻ Mời VIP Chiến Dịch Tiếp Thị Độc Quyền"
                    onClick={() => setShowVipModal(true)}
                  >
                    <Crown className="w-5 h-5" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="chat-file-input"
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) console.log('File:', file.name);
                  }}
                />
                <textarea
                  id="chat-message-input"
                  className="min-h-10 max-h-28 flex-1 resize-none rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] px-4 py-2.5 text-sm text-[#1A1612] transition-all placeholder:text-[#7D715E]/70 focus:border-[#C59B58] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#C59B58]/15"
                  placeholder="Nhập tin nhắn..."
                  value={inputText}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  rows={1}
                />
                <button
                  id="chat-send-btn"
                  type="button"
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all ${inputText.trim() && !isSending
                      ? 'cursor-pointer bg-[#C59B58] text-[#231D15] shadow-xs hover:bg-[#B88E4F]'
                      : 'cursor-not-allowed bg-[#F3EFE6] text-[#B8AE9D]'
                    }`}
                  onClick={sendMessage}
                  disabled={!inputText.trim() || isSending}
                  title="Gửi tin nhắn"
                >
                  <Send className="w-4 h-4" />
                </button>
                </div>
                {!embedded && (
                  <p className="mt-2 pl-1 text-[11px] text-[#7D715E]">
                    Enter để gửi <span className="px-1 text-[#C8BDAA]">·</span> Shift + Enter để xuống dòng
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </main>


      {successMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-white text-[#1A1612] border border-[#EEDFC6] px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-[#059669] flex-shrink-0" />
          <p className="text-xs font-semibold flex-1 leading-snug">{successMessage}</p>
          <button
            className="text-[#7D715E] hover:text-[#1A1612] p-1"
            onClick={() => setSuccessMessage(null)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}


      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-white text-[#1A1612] border border-rose-200 px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          <p className="text-xs font-semibold flex-1 leading-snug">{errorMessage}</p>
          <button
            className="text-[#7D715E] hover:text-[#1A1612] p-1"
            onClick={() => setErrorMessage(null)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}


      {showVipModal && activeConv?.collaboratorId && (
        <SendVipCampaignModal
          conversationId={activeConv.id}
          collaboratorName={getOtherParty(activeConv)}
          onClose={() => setShowVipModal(false)}
          onSuccess={newMsg => {
            if (newMsg) {
              setMessages(prev => {
                if (prev.some(m => m.id === newMsg.id)) return prev;
                return [...prev, newMsg];
              });
              setTimeout(() => scrollToBottom(true), 100);
            }
            showSuccessToast('Đã gửi Thẻ Mời VIP chiến dịch tới đối tác thành công!');
          }}
        />
      )}


      {showNewChat && (
        <NewConversationModal
          isShop={isShop}
          asCustomer={currentUser?.role === 'CUSTOMER'}
          onClose={() => setShowNewChat(false)}
          onCreated={conv => {
            if (!conv || !conv.id) return;
            setConversations(prev => {
              const exists = prev.find(c => c.id === conv.id);
              if (exists) {
                setTimeout(() => openConversation(exists), 50);
                return prev;
              }
              const updated = [conv, ...prev];
              setTimeout(() => openConversation(conv), 50);
              return updated;
            });
          }}
        />
      )}
      </div>
    </div>
  );
}
