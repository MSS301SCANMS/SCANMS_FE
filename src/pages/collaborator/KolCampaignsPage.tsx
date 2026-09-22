import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Sparkles,
  Gift,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Store as StoreIcon,
  AlertCircle,
  TrendingUp,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { CampaignParticipant } from '../../types/campaigns';

const STATUS_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: any }
> = {
  INVITED: {
    label: 'Chờ phản hồi',
    badgeClass: 'bg-amber-100/80 text-amber-800 border-amber-300',
    icon: Clock,
  },
  ACCEPTED: {
    label: 'Đã tham gia',
    badgeClass: 'bg-emerald-100/80 text-emerald-800 border-emerald-300',
    icon: CheckCircle2,
  },
  REJECTED: {
    label: 'Đã từ chối',
    badgeClass: 'bg-rose-100/80 text-rose-800 border-rose-300',
    icon: XCircle,
  },
};

const fmtDate = (d: string) => {
  try {
    return format(new Date(d), 'dd/MM/yyyy');
  } catch {
    return d;
  }
};

export default function KolCampaignsPage() {
  const navigate = useNavigate();
  const [invitations, setInvitations] = useState<CampaignParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'ALL' | 'INVITED' | 'ACCEPTED' | 'REJECTED'>('ALL');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadInvitations = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/campaigns/my-invitations');
      const data = res?.data || res || [];
      setInvitations(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Lỗi tải danh sách chiến dịch:', err);
      showToast(err?.response?.data?.message || 'Không thể tải danh sách lời mời.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInvitations();
  }, [loadInvitations]);

  const handleAccept = async (participantId: string, campaignName: string) => {
    setActionLoading(participantId + '-accept');
    try {
      await api.patch(`/campaigns/invitations/${participantId}/accept`, {});
      showToast(`🎉 Đã chấp nhận tham gia chiến dịch "${campaignName}"!`);
      loadInvitations();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Không thể chấp nhận lời mời lúc này.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (participantId: string, campaignName: string) => {
    if (!confirm(`Bạn có chắc chắn muốn từ chối lời mời chiến dịch "${campaignName}"?`)) return;
    setActionLoading(participantId + '-reject');
    try {
      await api.patch(`/campaigns/invitations/${participantId}/reject`, {});
      showToast('Đã gửi thông báo từ chối tới gian hàng đối tác.');
      loadInvitations();
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Không thể từ chối lời mời lúc này.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredInvitations = invitations.filter(item => {
    if (activeTab === 'ALL') return true;
    return item.status === activeTab;
  });

  const pendingCount = invitations.filter(i => i.status === 'INVITED').length;
  const acceptedCount = invitations.filter(i => i.status === 'ACCEPTED').length;
  const rejectedCount = invitations.filter(i => i.status === 'REJECTED').length;

  return (
    <div className="max-w-[1520px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6" id="kol-campaigns-page">

      {toast && (
        <div
          className={`fixed bottom-6 right-6 px-4 py-3 rounded-2xl text-xs font-bold shadow-2xl z-50 border flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-200 ${
            toast.type === 'success'
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-rose-600 text-white border-rose-500'
          }`}
          role="alert"
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-200 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-200 flex-shrink-0" />
          )}
          <span>{toast.msg}</span>
        </div>
      )}


      <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-500 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-black/20 backdrop-blur-xs border border-white/20 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-amber-200" />
            <span>FR-27 • Đặc Quyền Dành Cho Top KOL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Lời Mời Chiến Dịch VIP
          </h1>
          <p className="text-sm text-amber-100 font-medium leading-relaxed">
            Nhận lời mời hợp tác trực tiếp từ các nhãn hàng hàng đầu, hưởng mức hoa hồng thưởng thêm vượt trội và bùng nổ doanh thu tiếp thị.
          </p>
        </div>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-amber-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Chờ Phản Hồi
            </div>
            <div className="text-3xl font-black text-amber-600 mt-1">
              {pendingCount}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-emerald-200/80 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Đang Tham Gia
            </div>
            <div className="text-3xl font-black text-emerald-600 mt-1">
              {acceptedCount}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-stone-500 uppercase tracking-wider">
              Tổng Lời Mời
            </div>
            <div className="text-3xl font-black text-stone-800 mt-1">
              {invitations.length}
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center font-bold">
            <Gift className="w-6 h-6" />
          </div>
        </div>
      </div>


      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          Tất cả ({invitations.length})
        </button>
        <button
          onClick={() => setActiveTab('INVITED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'INVITED'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          Chờ phản hồi ({pendingCount})
        </button>
        <button
          onClick={() => setActiveTab('ACCEPTED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ACCEPTED'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          Đang tham gia ({acceptedCount})
        </button>
        <button
          onClick={() => setActiveTab('REJECTED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'REJECTED'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
          }`}
        >
          Đã từ chối ({rejectedCount})
        </button>
      </div>


      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 py-24 text-stone-500">
          <div className="w-9 h-9 border-3 border-amber-500/20 border-t-amber-500 rounded-full animate-spin" />
          <span className="text-xs font-semibold">Đang tải danh sách lời mời chiến dịch...</span>
        </div>
      ) : filteredInvitations.length === 0 ? (
        <div className="text-center py-20 bg-white border border-stone-200 rounded-3xl p-8 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-3xl bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
            <Gift className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-stone-900">Không có lời mời nào trong mục này</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-md mx-auto">
              Khi các gian hàng đối tác gửi thẻ mời VIP qua khung Chat hoặc hệ thống, các chiến dịch sẽ tự động hiển thị ở đây.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredInvitations.map(inv => {
            const statusInfo = STATUS_CONFIG[inv.status] || STATUS_CONFIG.INVITED;
            const StatusIcon = statusInfo.icon;
            const isPending = inv.status === 'INVITED';
            const isAccepted = inv.status === 'ACCEPTED';
            const campaign = inv.campaign;

            return (
              <div
                key={inv.id}
                id={`invitation-${inv.id}`}
                className="bg-white border-2 border-stone-200 hover:border-amber-300 rounded-3xl p-6 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative"
              >

                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {campaign?.store?.logoUrl ? (
                        <img
                          src={campaign.store.logoUrl}
                          alt={campaign.store.name}
                          className="w-11 h-11 rounded-2xl border border-stone-200 object-cover shadow-2xs"
                        />
                      ) : (
                        <div className="w-11 h-11 rounded-2xl bg-amber-100 border border-amber-200 text-amber-700 flex items-center justify-center font-black text-sm">
                          {campaign?.store?.name?.[0] || 'S'}
                        </div>
                      )}
                      <div>
                        <div className="text-sm font-bold text-stone-900">
                          {campaign?.store?.name || 'Gian hàng đối tác'}
                        </div>
                        <div className="text-[11px] text-stone-500 flex items-center gap-1">
                          <StoreIcon className="w-3 h-3 text-stone-400" />
                          <span>Đối tác chính thức</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${statusInfo.badgeClass}`}
                    >
                      <StatusIcon className="w-3.5 h-3.5" />
                      <span>{statusInfo.label}</span>
                    </span>
                  </div>


                  <div className="space-y-2">
                    <h3 className="text-base font-black text-stone-900 leading-snug">
                      🎯 {campaign?.name}
                    </h3>

                    <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-200 flex items-center justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold text-amber-800">
                          Mức Hoa Hồng Thưởng Thêm
                        </div>
                        <div className="text-2xl font-black text-amber-700 mt-0.5">
                          +{campaign?.bonusCommissionRate}%
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-stone-500 block">Hoa hồng mặc định shop:</span>
                        <span className="text-xs font-bold text-stone-800">
                          {campaign?.store?.defaultCommissionRate || 10}%
                        </span>
                      </div>
                    </div>
                  </div>


                  <div className="flex items-center gap-2 text-xs text-stone-600 bg-stone-50 p-3 rounded-xl border border-stone-200">
                    <Calendar className="w-4 h-4 text-stone-400 flex-shrink-0" />
                    <span>
                      Thời hạn:{' '}
                      <strong className="text-stone-800">
                        {campaign ? fmtDate(campaign.startDate) : ''} →{' '}
                        {campaign ? fmtDate(campaign.endDate) : ''}
                      </strong>
                    </span>
                  </div>
                </div>


                <div className="pt-3 border-t border-stone-100 flex items-center gap-2">
                  {isPending ? (
                    <>
                      <button
                        id={`btn-accept-${inv.id}`}
                        type="button"
                        className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-bold transition shadow-xs disabled:opacity-50 cursor-pointer active:scale-95"
                        onClick={() => handleAccept(inv.id, campaign?.name || '')}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === inv.id + '-accept' ? '⏳ Đang xác nhận...' : '✅ Chấp nhận tham gia'}
                      </button>
                      <button
                        id={`btn-reject-${inv.id}`}
                        type="button"
                        className="py-2.5 px-3.5 rounded-xl bg-stone-100 hover:bg-rose-50 hover:text-rose-700 border border-stone-200 text-stone-700 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
                        onClick={() => handleReject(inv.id, campaign?.name || '')}
                        disabled={!!actionLoading}
                      >
                        {actionLoading === inv.id + '-reject' ? '⏳' : '❌ Từ chối'}
                      </button>
                    </>
                  ) : isAccepted ? (
                    <>
                      <button
                        type="button"
                        onClick={() => navigate('/collaborator/links')}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span>Tạo Link Tiếp Thị Chiến Dịch</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => navigate('/chat')}
                        className="p-2.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition cursor-pointer"
                        title="Mở hội thoại chat với gian hàng"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full py-2 text-center text-xs font-semibold text-stone-500 bg-stone-100 rounded-xl">
                      Đã từ chối tham gia chiến dịch này
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

