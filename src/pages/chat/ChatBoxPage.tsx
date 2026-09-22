import { useEffect, useRef, useState, useCallback } from 'react';
import { format, isToday, isYesterday } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'sonner';
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
  Gift,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Crown,
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
  if (text.startsWith('{') && text.includes('CAMPAIGN_')) return false;

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
  if (text.startsWith('{') && text.includes('CAMPAIGN_')) return false;

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
                className="py-2 px-3 bg-stone-700 hover:bg-stone-800 text-stone-100 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 active:scale-95 cursor-pointer"
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




function NewConversationModal({
  onClose,
  onCreated,
  isShop,
}: {
  onClose: () => void;
  onCreated: (conv: Conversation) => void;
  isShop: boolean;
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
      const body = isShop ? { collaboratorId: id } : { storeId: id };
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
}: ChatBoxPageProps = {}) {
  const currentUser = (() => {
    try {
      return JSON.parse(localStorage.getItem('user') || 'null');
    } catch {
      return null;
    }
  })();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [typingUser, setTypingUser] = useState<string | null>(null);
  const [isLoadingMsgs, setIsLoadingMsgs] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [oldestMsgId, setOldestMsgId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showVipModal, setShowVipModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const isShop = currentUser?.role === 'SHOP_MANAGER';

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const openConversationRef = useRef<(conv: Conversation) => Promise<void>>(() => Promise.resolve());

  const scrollToBottom = useCallback((smooth = false) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  }, []);


  useEffect(() => {
    let isMounted = true;

    const setupContext = async (list: Conversation[]) => {
      if (targetStoreId) {
        const effectiveStoreId = LEGACY_ID_MAP[targetStoreId] || targetStoreId;
        const matching = list.find(
          (c) => c.storeId === effectiveStoreId || c.store?.id === effectiveStoreId
        );
        if (matching) {
          openConversationRef.current(matching);
        } else if (UUID_REGEX.test(effectiveStoreId)) {
          try {
            const res: any = await api.post('/chat/conversations', { storeId: effectiveStoreId });
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
        const list: Conversation[] = Array.isArray(res) ? res : res?.data || [];
        setConversations(list);
        setupContext(list);
      })
      .catch((err) => {
        console.warn('Lỗi tải danh sách hội thoại:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [targetStoreId, targetCollaboratorId]);

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

    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('new_message', (msg: ChatMessage) => {
      setMessages(prev => [...prev, msg]);
      setConversations(prev =>
        prev
          .map(c =>
            c.id === msg.conversationId
              ? {
                ...c,
                lastMessageAt: msg.createdAt,
                chatMessages: [
                  {
                    messageText: msg.messageText,
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
      setTimeout(() => scrollToBottom(true), 50);
    });

    socket.on(
      'user_typing',
      ({ fullName, isTyping }: { fullName: string; isTyping: boolean }) => {
        setTypingUser(isTyping ? fullName : null);
        if (isTyping) {
          if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
          typingTimerRef.current = setTimeout(() => setTypingUser(null), 3000);
        }
      }
    );

    socket.on('error', (err: { message: string }) => {
      console.error('Socket error:', err.message);
      showErrorToast(err.message || 'Lỗi gửi tin nhắn');
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('error');
    };
  }, [scrollToBottom]);


  const openConversation = async (conv: Conversation) => {
    if (!conv || !conv.id) return;
    const socket = getChatSocket();

    if (activeConvId && UUID_REGEX.test(activeConvId)) {
      socket.emit('leave_conversation', { conversationId: activeConvId });
    }

    setActiveConvId(conv.id);
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
    if (!trimmed || !activeConvId || isSending) return;


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

    const socket = getChatSocket();
    setIsSending(true);
    socket.emit('send_message', {
      conversationId: activeConvId,
      messageText: trimmed,
    });
    setInputText('');
    setIsSending(false);

    socket.emit('typing', { conversationId: activeConvId, isTyping: false });
  }, [inputText, activeConvId, isSending]);


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
      (c.collaborator?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getOtherParty = (conv: Conversation) => {
    if (!currentUser) return conv.store?.name || 'Cửa hàng';
    return currentUser.role === 'COLLABORATOR'
      ? conv.store?.name || 'Cửa hàng'
      : conv.collaborator?.fullName || 'KOL / CTV';
  };

  const getOtherAvatar = (conv: Conversation) => {
    if (!currentUser) return conv.store?.name?.[0]?.toUpperCase() || '💬';
    return currentUser.role === 'COLLABORATOR'
      ? conv.store?.name?.[0]?.toUpperCase() || 'S'
      : conv.collaborator?.fullName?.[0]?.toUpperCase() || 'K';
  };

  return (
    <div
      className={`flex ${embedded ? 'h-full w-full' : 'h-[calc(100vh-5.5rem)]'} bg-white rounded-2xl border border-[#EAE4D7] shadow-sm overflow-hidden ${className}`}
      id="chat-page"
    >
      {!hideSidebar && (
      <aside
        className="w-80 flex-shrink-0 flex flex-col border-r border-[#EAE4D7] bg-[#FAF8F5]/60"
        aria-label="Danh sách hội thoại"
      >

        <div className="flex items-center justify-between px-4 py-3.5 border-b border-stone-200/60 bg-white/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h1 className="text-base font-bold text-stone-900">Tin nhắn</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              id="btn-new-conversation"
              className="w-8 h-8 rounded-lg bg-amber-600 hover:bg-amber-700 text-white flex items-center justify-center transition-colors shadow-xs"
              title="Tạo cuộc trò chuyện mới"
              onClick={() => setShowNewChat(true)}
            >
              <Plus className="w-4 h-4" />
            </button>
            <div
              className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-500 shadow-xs ring-2 ring-emerald-200' : 'bg-rose-500'
                }`}
              title={isConnected ? 'Đang kết nối Realtime' : 'Mất kết nối'}
            />
          </div>
        </div>


        <div className="p-3 border-b border-stone-200/60">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              id="chat-search-input"
              type="text"
              className="w-full pl-9 pr-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-medium text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
              placeholder="Tìm kiếm hội thoại..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>


        <div className="flex-1 overflow-y-auto divide-y divide-stone-100" role="list">
          {filteredConversations.length === 0 && (
            <div className="py-16 text-center text-stone-400 text-xs space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-stone-300 stroke-1" />
              <p>Chưa có cuộc trò chuyện nào</p>
              <button
                className="text-amber-600 hover:underline font-bold"
                onClick={() => setShowNewChat(true)}
              >
                + Bắt đầu chat ngay
              </button>
            </div>
          )}

          {filteredConversations.map(conv => {
            const lastMsg = conv.chatMessages?.[0];
            const isActive = conv.id === activeConvId;
            const unread = lastMsg && !lastMsg.isRead && lastMsg.senderId !== currentUser?.id;

            return (
              <div
                key={conv.id}
                id={`conv-item-${conv.id}`}
                className={`flex items-center gap-3 p-3.5 cursor-pointer transition-all ${isActive
                    ? 'bg-amber-50/90 border-l-4 border-amber-600 text-stone-900'
                    : 'hover:bg-stone-100/70 text-stone-700'
                  }`}
                role="listitem"
                onClick={() => openConversation(conv)}
                tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && openConversation(conv)}
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-xs">
                  {getOtherAvatar(conv)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="font-bold text-stone-900 text-sm truncate">
                      {getOtherParty(conv)}
                    </span>
                    {lastMsg && (
                      <span className="text-[10px] text-stone-400 flex-shrink-0">
                        {formatConvTime(lastMsg.createdAt)}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs truncate ${unread ? 'font-bold text-stone-900' : 'text-stone-500'
                        }`}
                    >
                      {lastMsg ? lastMsg.messageText : 'Bắt đầu cuộc trò chuyện...'}
                    </span>
                    {unread && (
                      <span className="w-2 h-2 rounded-full bg-amber-600 flex-shrink-0" />
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </aside>
      )}


      <main className="flex-1 flex flex-col bg-[#FAF8F5]/30 relative min-w-0" aria-label="Khung chat">
        {!activeConv ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
            <div className="w-16 h-16 rounded-2xl bg-amber-100/80 text-amber-700 flex items-center justify-center shadow-xs">
              <MessageSquare className="w-8 h-8" />
            </div>
            <h2 className="text-lg font-bold text-stone-800">Chọn một hội thoại</h2>
            <p className="text-xs text-stone-500 max-w-sm">
              Chọn cuộc trò chuyện ở cột bên trái hoặc bấm dấu <strong>+</strong> để bắt đầu trao đổi trực tiếp
            </p>
          </div>
        ) : (
          <>

            {!hideHeaderInChat && (
            <header className="px-6 py-3.5 bg-white border-b border-[#EAE4D7] flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                  {getOtherAvatar(activeConv)}
                </div>
                <div>
                  <div className="font-bold text-stone-900 text-sm">{getOtherParty(activeConv)}</div>
                  <div className="text-xs text-stone-500 flex items-center gap-1.5">
                    {typingUser ? (
                      <span className="text-amber-600 font-medium flex items-center gap-1">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-600 animate-bounce" />
                        {typingUser} đang nhập...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-rose-500'
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
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer border border-[#EEDFC6]"
                  onClick={() => setShowVipModal(true)}
                  title="Gửi Thẻ Mời VIP Chiến Dịch Tiếp Thị Độc Quyền"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-100 animate-pulse" />
                  <span>Mời Chiến Dịch VIP</span>
                </button>
              )}
            </header>
            )}


            <div
              className="flex-1 overflow-y-auto p-6 space-y-4"
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
                    className="inline-flex items-center gap-1 px-3 py-1 bg-stone-200/70 hover:bg-stone-300 text-stone-700 text-xs font-semibold rounded-full transition-colors"
                    onClick={loadMore}
                  >
                    <ArrowUp className="w-3 h-3" /> Tải thêm tin nhắn cũ hơn
                  </button>
                </div>
              )}

              {isLoadingMsgs && (
                <div className="py-12 text-center text-stone-400 text-xs flex flex-col items-center gap-2">
                  <div className="w-5 h-5 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                  <span>Đang tải tin nhắn...</span>
                </div>
              )}

              {messages.map((msg, idx) => {
                const isMine = msg.senderId === currentUser?.id;
                const showDate =
                  idx === 0 ||
                  new Date(messages[idx - 1].createdAt).toDateString() !==
                  new Date(msg.createdAt).toDateString();

                return (
                  <div key={msg.id} className="space-y-2">
                    {showDate && (
                      <div className="flex items-center justify-center my-3">
                        <span className="bg-stone-200/80 text-stone-600 text-[11px] font-semibold px-3 py-0.5 rounded-full shadow-2xs">
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
                        <div className="w-7 h-7 rounded-full bg-stone-200 text-stone-700 font-bold text-xs flex items-center justify-center flex-shrink-0 mb-1">
                          {msg.sender.fullName?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}

                      <div className={`max-w-[72%] space-y-1 ${isMine ? 'items-end' : 'items-start'}`}>
                        {!isMine && (
                          <div className="text-[11px] text-stone-500 font-medium pl-1">
                            {msg.sender.fullName}
                          </div>
                        )}

                        {(() => {
                          const card = tryParseCampaignCard(msg.messageText);
                          if (card) {
                            return <CampaignCardBubble card={card} isMine={isMine} />;
                          }

                          return (
                            <div
                              className={`p-3.5 text-sm shadow-xs ${isMine
                                  ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white rounded-2xl rounded-tr-xs'
                                  : 'bg-white text-stone-900 border border-stone-200/80 rounded-2xl rounded-tl-xs'
                                }`}
                            >
                              {msg.mediaUrl && (
                                <img
                                  src={msg.mediaUrl}
                                  alt="media"
                                  className="max-w-xs rounded-lg mb-2 cursor-pointer hover:opacity-95"
                                  onClick={() => window.open(msg.mediaUrl, '_blank')}
                                />
                              )}
                              <p className="whitespace-pre-wrap break-words">{msg.messageText}</p>
                            </div>
                          );
                        })()}

                        <div
                          className={`flex items-center gap-1 text-[10px] text-stone-400 px-1 ${isMine ? 'justify-end' : 'justify-start'
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
                  <div className="w-7 h-7 rounded-full bg-stone-200 text-stone-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                    {typingUser[0]?.toUpperCase()}
                  </div>
                  <div className="px-3.5 py-2 bg-white border border-stone-200 rounded-2xl rounded-tl-xs shadow-xs flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>


            <div className="p-4 bg-white border-t border-stone-200 flex items-center gap-2.5 shadow-xs">
              <button
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-xl transition-colors"
                id="chat-attach-btn"
                title="Đính kèm ảnh"
                onClick={() => fileInputRef.current?.click()}
              >
                <Paperclip className="w-5 h-5" />
              </button>
              {isShop && (
                <button
                  id="btn-composer-vip-invite"
                  className="p-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors cursor-pointer"
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
                className="flex-1 bg-stone-50 border border-stone-200 rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 focus:bg-white resize-none max-h-24 transition-all"
                placeholder="Nhập tin nhắn... (Enter để gửi, Shift+Enter xuống dòng)"
                value={inputText}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
              />
              <button
                id="chat-send-btn"
                className={`p-2.5 rounded-xl transition-all flex items-center justify-center ${inputText.trim() && !isSending
                    ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-xs'
                    : 'bg-stone-100 text-stone-300 cursor-not-allowed'
                  }`}
                onClick={sendMessage}
                disabled={!inputText.trim() || isSending}
                title="Gửi tin nhắn"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </main>


      {successMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 flex-shrink-0" />
          <p className="text-xs font-semibold flex-1 leading-snug">{successMessage}</p>
          <button
            className="text-emerald-200 hover:text-white p-1"
            onClick={() => setSuccessMessage(null)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}


      {errorMessage && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-rose-600 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-200">
          <AlertTriangle className="w-5 h-5 text-rose-200 flex-shrink-0" />
          <p className="text-xs font-semibold flex-1 leading-snug">{errorMessage}</p>
          <button
            className="text-rose-200 hover:text-white p-1"
            onClick={() => setErrorMessage(null)}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}


      {showVipModal && activeConv && (
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
  );
}
