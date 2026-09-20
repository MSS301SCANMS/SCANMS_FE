import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import api from '../../services/api';
import type { Campaign } from '../../types/campaigns';


const STATUS_LABEL: Record<string, string> = {
  INVITED: 'Đã mời',
  ACCEPTED: 'Đã tham gia',
  REJECTED: 'Từ chối',
};

const STATUS_CLASS: Record<string, string> = {
  INVITED: 'bg-amber-50 text-amber-700 border border-amber-200',
  ACCEPTED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  REJECTED: 'bg-rose-50 text-rose-700 border border-rose-200',
};

const fmtDate = (d: string) => format(new Date(d), 'dd/MM/yyyy');
const isExpired = (endDate: string) => new Date(endDate) < new Date();


function CreateCampaignModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [form, setForm] = useState({ name: '', bonusCommissionRate: 5, startDate: '', endDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post('/campaigns', form);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tạo chiến dịch thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white border border-[#EAE4D7] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#EAE4D7] flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#1A1612]">🎯 Tạo Chiến Dịch Mới</h2>
          <button
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#7D715E] hover:bg-[#F3EFE6] transition cursor-pointer"
            onClick={onClose}
            id="btn-close-create-campaign"
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Tên chiến dịch</label>
            <input
              id="campaign-name"
              className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] outline-none focus:border-[#B88E4F]"
              placeholder="VD: Flash Sale Tháng 9 — Dành riêng Top KOL"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="text-xs font-bold text-[#1A1612] block mb-1.5">% Hoa hồng thưởng thêm</label>
            <div className="flex items-center bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl overflow-hidden focus-within:border-[#B88E4F]">
              <input
                id="campaign-rate"
                className="flex-1 bg-transparent px-3.5 py-2.5 text-xs text-[#1A1612] outline-none"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={form.bonusCommissionRate}
                onChange={(e) => setForm((f) => ({ ...f, bonusCommissionRate: +e.target.value }))}
                required
              />
              <span className="px-3.5 text-xs font-bold text-[#7D715E] bg-[#F3EFE6] py-2.5 border-l border-[#EAE4D7]">
                %
              </span>
            </div>
            <small className="text-[11px] text-[#7D715E] mt-1 block">
              Mức hoa hồng thưởng thêm ngoài % mặc định của cửa hàng
            </small>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Ngày bắt đầu</label>
              <input
                id="campaign-start"
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] outline-none focus:border-[#B88E4F]"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="text-xs font-bold text-[#1A1612] block mb-1.5">Ngày kết thúc</label>
              <input
                id="campaign-end"
                className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] outline-none focus:border-[#B88E4F]"
                type="date"
                value={form.endDate}
                min={form.startDate}
                onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                required
              />
            </div>
          </div>
          {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">{error}</div>}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl border border-[#EAE4D7] text-xs font-bold text-[#7D715E] hover:bg-[#F3EFE6] transition cursor-pointer"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              id="btn-create-campaign"
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-extrabold transition shadow-xs cursor-pointer disabled:opacity-50"
              disabled={loading}
            >
              {loading ? '⏳ Đang tạo...' : '🚀 Tạo chiến dịch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function InviteKolModal({
  campaign,
  onClose,
  onSuccess,
}: {
  campaign: Campaign;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [collaboratorId, setCollaboratorId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.post(`/campaigns/${campaign.id}/invite`, { collaboratorId: collaboratorId.trim() });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gửi lời mời thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50" onClick={onClose}>
      <div
        className="bg-white border border-[#EAE4D7] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-[#EAE4D7] flex items-center justify-between">
          <h2 className="text-base font-extrabold text-[#1A1612]">💌 Mời KOL / CTV Hợp Tác</h2>
          <button
            type="button"
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#7D715E] hover:bg-[#F3EFE6] transition cursor-pointer"
            onClick={onClose}
            id="btn-close-invite"
          >
            ✕
          </button>
        </div>

        <div className="p-4 mx-6 mt-4 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] space-y-1">
          <div className="text-xs font-bold text-[#1A1612]">🎯 {campaign.name}</div>
          <div className="text-sm font-extrabold text-[#B88E4F]">
            +{campaign.bonusCommissionRate}% hoa hồng thưởng
          </div>
          <div className="text-[11px] text-[#7D715E]">
            {fmtDate(campaign.startDate)} → {fmtDate(campaign.endDate)}
          </div>
        </div>

        <form onSubmit={handleInvite} className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-[#1A1612] block mb-1.5">
              ID của KOL/CTV muốn mời
            </label>
            <input
              id="invite-collaborator-id"
              className="w-full bg-[#FAF8F5] border border-[#EAE4D7] rounded-xl px-3.5 py-2.5 text-xs text-[#1A1612] outline-none focus:border-[#B88E4F]"
              placeholder="Dán UUID của KOL vào đây..."
              value={collaboratorId}
              onChange={(e) => setCollaboratorId(e.target.value)}
              required
            />
            <small className="text-[11px] text-[#7D715E] mt-1 block">
              Thẻ mời VIP sẽ được gửi thẳng vào hộp chat realtime của KOL này
            </small>
          </div>
          {error && <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 p-2.5 rounded-xl">{error}</div>}
          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              className="px-4 py-2.5 rounded-xl border border-[#EAE4D7] text-xs font-bold text-[#7D715E] hover:bg-[#F3EFE6] transition cursor-pointer"
              onClick={onClose}
            >
              Hủy
            </button>
            <button
              id="btn-send-invite"
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-extrabold transition shadow-xs cursor-pointer disabled:opacity-50"
              disabled={loading || !collaboratorId.trim()}
            >
              {loading ? '⏳ Đang gửi...' : '💌 Gửi thẻ mời VIP'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


function CampaignCard({ campaign, onInvite }: { campaign: Campaign; onInvite: (c: Campaign) => void }) {
  const expired = isExpired(campaign.endDate);
  const accepted = campaign.participants?.filter((p) => p.status === 'ACCEPTED').length || 0;
  const invited = campaign.participants?.filter((p) => p.status === 'INVITED').length || 0;

  return (
    <div
      className={`bg-white border rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between ${
        expired ? 'border-[#EAE4D7] opacity-75' : 'border-[#EEDFC6]'
      }`}
      id={`campaign-${campaign.id}`}
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl flex-shrink-0">🎯</span>
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-[#1A1612] truncate">{campaign.name}</div>
              <div className="text-[11px] text-[#7D715E]">
                {fmtDate(campaign.startDate)} → {fmtDate(campaign.endDate)}
              </div>
            </div>
          </div>
          <span
            className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex-shrink-0 ${
              expired
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
            }`}
          >
            {expired ? '🔴 Đã kết thúc' : '🟢 Đang chạy'}
          </span>
        </div>

        <div className="my-3 p-3 rounded-xl bg-[#FBF5EB] border border-[#EEDFC6] flex items-center justify-between">
          <span className="text-xs font-semibold text-[#7D715E]">Hoa hồng thưởng thêm</span>
          <span className="text-xl font-black text-[#B88E4F]">+{campaign.bonusCommissionRate}%</span>
        </div>

        <div className="grid grid-cols-2 gap-2 my-3 text-center">
          <div className="p-2 rounded-xl bg-[#F3EFE6] border border-[#EAE4D7]">
            <div className="text-base font-black text-[#1A1612]">{accepted}</div>
            <div className="text-[10px] font-bold text-[#7D715E]">Đã tham gia</div>
          </div>
          <div className="p-2 rounded-xl bg-[#FAF8F5] border border-[#EAE4D7]">
            <div className="text-base font-black text-[#B88E4F]">{invited}</div>
            <div className="text-[10px] font-bold text-[#7D715E]">Chờ phản hồi</div>
          </div>
        </div>


        {(campaign.participants?.length || 0) > 0 && (
          <div className="space-y-1.5 my-3 pt-2 border-t border-[#EAE4D7]">
            {campaign.participants?.slice(0, 4).map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-2 text-xs p-1.5 rounded-lg bg-[#FAF8F5]"
                id={`participant-${p.id}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded-full bg-[#EEDFC6] text-[#B88E4F] font-bold flex items-center justify-center text-[10px] flex-shrink-0">
                    {p.collaborator?.fullName?.[0] || '?'}
                  </div>
                  <span className="text-xs font-semibold text-[#1A1612] truncate">
                    {p.collaborator?.fullName}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex-shrink-0 ${STATUS_CLASS[p.status]}`}>
                  {STATUS_LABEL[p.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-[#EAE4D7] mt-2">
        <button
          id={`btn-invite-${campaign.id}`}
          type="button"
          className="w-full py-2.5 rounded-xl bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-extrabold transition shadow-xs cursor-pointer disabled:opacity-50"
          onClick={() => onInvite(campaign)}
          disabled={expired}
        >
          💌 Mời KOL Tham Gia
        </button>
      </div>
    </div>
  );
}


export default function ShopCampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [inviteTarget, setInviteTarget] = useState<Campaign | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await api.get('/campaigns/shop');
      setCampaigns(res.data || []);
    } catch {

    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="max-w-[1520px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6" id="shop-campaigns-page">

      {toast && (
        <div
          className="fixed bottom-6 right-6 px-4 py-3 rounded-xl bg-white border border-[#EEDFC6] text-[#B88E4F] text-xs font-extrabold shadow-lg z-50"
          role="alert"
        >
          {toast}
        </div>
      )}


      <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap pb-2 border-b border-[#EAE4D7]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#1A1612] flex items-center gap-2.5">
            <span>🎯</span> Chiến Dịch Tiếp Thị Liên Kết
          </h1>
          <p className="text-sm text-[#7D715E] mt-1">
            Tạo chiến dịch hoa hồng thưởng và mời Top KOL quảng bá sản phẩm cho gian hàng
          </p>
        </div>
        <button
          id="btn-new-campaign"
          type="button"
          className="px-4 py-2.5 rounded-full bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-extrabold transition shadow-xs cursor-pointer flex items-center gap-1.5"
          onClick={() => setShowCreate(true)}
        >
          <span>+</span> Tạo Chiến Dịch Mới
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center gap-3 p-20 text-[#7D715E]">
          <div className="w-8 h-8 border-3 border-[#C59B58]/20 border-t-[#C59B58] rounded-full animate-spin" />
          <span className="text-sm font-semibold">Đang tải danh sách chiến dịch...</span>
        </div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#EAE4D7] rounded-2xl text-[#7D715E] p-8 shadow-xs">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="text-base font-bold text-[#1A1612]">Chưa có chiến dịch nào</h3>
          <p className="text-xs text-[#7D715E] mt-1 max-w-md mx-auto mb-4">
            Tạo chiến dịch hoa hồng thưởng đầu tiên để thu hút KOL có tầm ảnh hưởng tham gia đẩy số cho gian hàng.
          </p>
          <button
            type="button"
            className="px-4 py-2 rounded-full bg-[#C59B58] hover:bg-[#B88E4F] text-white text-xs font-extrabold transition shadow-xs cursor-pointer"
            onClick={() => setShowCreate(true)}
          >
            + Tạo Chiến Dịch Ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((c) => (
            <CampaignCard
              key={c.id}
              campaign={c}
              onInvite={(target) => {
                setInviteTarget(target);
              }}
            />
          ))}
        </div>
      )}

      {showCreate && (
        <CreateCampaignModal
          onClose={() => setShowCreate(false)}
          onSuccess={() => {
            load();
            showToast('✅ Đã tạo chiến dịch thành công!');
          }}
        />
      )}
      {inviteTarget && (
        <InviteKolModal
          campaign={inviteTarget}
          onClose={() => setInviteTarget(null)}
          onSuccess={() => {
            load();
            showToast('💌 Đã gửi thẻ mời VIP vào chat của KOL!');
          }}
        />
      )}
    </div>
  );
}

