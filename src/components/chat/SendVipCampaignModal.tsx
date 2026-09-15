import { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Gift,
  Calendar,
  Percent,
  CheckCircle2,
  AlertCircle,
  Send,
  Loader2,
  Crown,
} from 'lucide-react';
import api from '../../services/api';
import type { Campaign } from '../../types/campaigns';

interface SendVipCampaignModalProps {
  conversationId: string;
  collaboratorName: string;
  onClose: () => void;
  onSuccess: (chatMessage: any) => void;
}

export function SendVipCampaignModal({
  conversationId,
  collaboratorName,
  onClose,
  onSuccess,
}: SendVipCampaignModalProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [personalMessage, setPersonalMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchShopCampaigns();
  }, []);

  const fetchShopCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await api.get('/campaigns/shop');
      const data = res?.data || res || [];
      const list = Array.isArray(data) ? data : [];

      const now = new Date();
      const activeList = list.filter((c: Campaign) => {
        const end = new Date(c.endDate);
        return c.isActive && end >= now;
      });
      setCampaigns(activeList);
      if (activeList.length > 0) {
        setSelectedCampaignId(activeList[0].id);
      }
    } catch (err: any) {
      console.error('Lỗi tải danh sách chiến dịch:', err);
      setError(err?.response?.data?.message || 'Không thể tải danh sách chiến dịch của cửa hàng.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedCampaignId) {
      setError('Vui lòng chọn một chiến dịch để gửi thẻ mời VIP.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const res: any = await api.post(`/campaigns/chat/${conversationId}/invite`, {
        campaignId: selectedCampaignId,
        personalMessage: personalMessage.trim() || undefined,
      });

      const result = res?.data || res;
      onSuccess(result?.chatMessage);
      onClose();
    } catch (err: any) {
      console.error('Lỗi gửi thẻ mời VIP:', err);
      setError(err?.response?.data?.message || 'Có lỗi xảy ra khi gửi thẻ mời VIP. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCampaign = campaigns.find(c => c.id === selectedCampaignId);

  return (
    <div
      className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-amber-200/80 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={e => e.stopPropagation()}
      >

        <div className="relative px-6 py-5 bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center shadow-inner border border-white/30">
              <Crown className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-black uppercase tracking-wider px-2 py-0.5 bg-black/20 rounded-md">
                  FR-27 VIP
                </span>
                <h3 className="font-extrabold text-base tracking-tight text-white">
                  Mời Chiến Dịch Độc Quyền
                </h3>
              </div>
              <p className="text-xs text-amber-100 mt-0.5">
                Gửi Thẻ Mời VIP trực tiếp tới <strong>{collaboratorName}</strong>
              </p>
            </div>
          </div>
          <button
            className="w-8 h-8 rounded-full hover:bg-white/20 text-white/90 hover:text-white flex items-center justify-center transition-colors"
            onClick={onClose}
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>


        <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-stone-50/50">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-stone-500 gap-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <span className="text-xs font-semibold">Đang tải danh sách chiến dịch tiếp thị...</span>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="py-8 px-4 text-center bg-white border border-stone-200 rounded-2xl space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 mx-auto flex items-center justify-center">
                <Gift className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-stone-800 text-sm">Chưa có chiến dịch nào đang hoạt động</h4>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                  Bạn cần tạo chiến dịch tiếp thị mới trong mục Quản lý Chiến dịch trước khi gửi thẻ mời VIP cho KOL.
                </p>
              </div>
            </div>
          ) : (
            <>

              <div className="space-y-2.5">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  1. Chọn chiến dịch gửi mời <span className="text-rose-500">*</span>
                </label>
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {campaigns.map(c => {
                    const isSelected = c.id === selectedCampaignId;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setSelectedCampaignId(c.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-amber-50/80 border-amber-400 ring-2 ring-amber-400/20 shadow-xs'
                            : 'bg-white border-stone-200 hover:border-amber-200 hover:bg-stone-50/80'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-amber-600 border-amber-600 text-white'
                                : 'border-stone-300 bg-white'
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-sm font-bold text-stone-900 truncate">
                              🎯 {c.name}
                            </h5>
                            <div className="flex items-center gap-3 text-[11px] text-stone-500 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3 text-stone-400" />
                                {new Date(c.startDate).toLocaleDateString('vi-VN')} →{' '}
                                {new Date(c.endDate).toLocaleDateString('vi-VN')}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex-shrink-0 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                            <Percent className="w-3 h-3" />+{c.bonusCommissionRate}%
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>


              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider">
                  2. Lời nhắn riêng gửi kèm (Tùy chọn)
                </label>
                <textarea
                  className="w-full bg-white border border-stone-200 rounded-2xl p-3 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 resize-none transition-all"
                  rows={2}
                  placeholder={`Chào ${collaboratorName}, Shop trân trọng mời bạn tham gia chiến dịch đặc biệt này với hoa hồng thưởng hấp dẫn!`}
                  value={personalMessage}
                  onChange={e => setPersonalMessage(e.target.value)}
                />
              </div>


              {selectedCampaign && (
                <div className="p-3.5 bg-gradient-to-br from-amber-100/70 via-orange-50/80 to-amber-50 border border-amber-300/80 rounded-2xl shadow-xs space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                    <span className="inline-flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" /> Xem trước Thẻ Mời VIP
                    </span>
                    <span className="text-[10px] text-amber-700 bg-white/80 px-2 py-0.5 rounded-full border border-amber-200">
                      Hiển thị trong chat
                    </span>
                  </div>
                  <div className="text-xs text-stone-800 font-semibold">
                    🎯 {selectedCampaign.name}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-800 font-bold">
                      Thưởng thêm: +{selectedCampaign.bonusCommissionRate}% hoa hồng
                    </span>
                    <span className="text-[11px] text-stone-600">
                      Hạn:{' '}
                      {new Date(selectedCampaign.endDate).toLocaleDateString('vi-VN')}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>


        <div className="px-6 py-4 bg-white border-t border-stone-200 flex items-center justify-end gap-3 shadow-inner">
          <button
            type="button"
            className="px-4 py-2 text-xs font-bold text-stone-600 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors"
            onClick={onClose}
            disabled={submitting}
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-md active:scale-95 ${
              campaigns.length > 0 && selectedCampaignId && !submitting
                ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 shadow-amber-500/20'
                : 'bg-stone-300 text-stone-500 cursor-not-allowed'
            }`}
            onClick={handleSubmit}
            disabled={campaigns.length === 0 || !selectedCampaignId || submitting}
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Đang gửi thẻ mời...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Gửi Thẻ Mời VIP Ngay</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
