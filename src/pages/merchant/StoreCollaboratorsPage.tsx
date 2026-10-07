import { useEffect, useState } from 'react';
import { useShopCollaboratorTeam, useInviteCollaborator } from '../../hooks/useCollaborators';
import { toast } from '../../utils/toast';

const statusText: Record<string, string> = {
  PENDING: 'Chờ KOL phản hồi',
  APPROVED: 'Đang hoạt động',
  REJECTED: 'Đã từ chối',
  BLOCKED: 'Đã khóa',
};

export default function StoreCollaboratorsPage() {
  const [email, setEmail] = useState('');
  const [showInvite, setShowInvite] = useState(false);

  // ─── Data ────────────────────────────────────────────────────────────────────
  const { data, isLoading, error } = useShopCollaboratorTeam();
  const members = data?.members ?? [];
  const storeName = data?.store?.name ?? 'Cửa hàng';
  const storeId = data?.store?.id ?? '';

  // Lưu storeId vào localStorage để các service khác dùng
  useEffect(() => {
    if (storeId) {
      localStorage.setItem('current_store_id', storeId);
    }
  }, [storeId]);

  // ─── Mutations ───────────────────────────────────────────────────────────────
  const invite = useInviteCollaborator();

  const handleInvite = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!storeId) {
      toast.error('Không xác định được gian hàng của tài khoản hiện tại');
      return;
    }
    invite.mutate(
      { storeId, email },
      {
        onSuccess: (res: any) => {
          toast.success((res?.data || res)?.message || 'Đã gửi lời mời');
          setShowInvite(false);
          setEmail('');
        },
        onError: (e: any) => {
          toast.error(e.message || 'Gửi lời mời thất bại');
        },
      },
    );
  };

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#faf8f5] p-7 text-[#1a1612]">
      <div className="mx-auto max-w-[1520px]">
        <div className="mb-4 flex items-center justify-end">
          <button
            onClick={() => setShowInvite(true)}
            className="rounded-xl bg-[#cfa75d] px-5 py-2.5 font-bold text-white shadow-xs cursor-pointer"
          >
            ＋ Mời KOL mới
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 font-semibold text-red-700">
            {(error as any)?.message || 'Không thể tải đội ngũ CTV'}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-[#ead9bd] bg-white shadow-sm">
          {isLoading ? (
            <div className="p-12 text-center">Đang tải đội ngũ…</div>
          ) : members.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-lg font-bold">Shop chưa có KOL/CTV nào</div>
              <p className="mt-2 text-[#7d715e]">Bấm "Mời KOL mới" và nhập email tài khoản KOL.</p>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-[#f7efe1] text-sm uppercase text-[#806d50]">
                <tr>
                  <th className="p-4">KOL/CTV</th>
                  <th className="p-4">Kênh chính</th>
                  <th className="p-4">Người theo dõi</th>
                  <th className="p-4">Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const channel = m.collaborator.socialChannels?.[0];
                  return (
                    <tr key={m.id} className="border-t border-[#eee3d1]">
                      <td className="p-4">
                        <div className="font-bold">{m.collaborator.fullName}</div>
                        <div className="text-sm text-[#7d715e]">{m.collaborator.email}</div>
                      </td>
                      <td className="p-4">
                        {channel
                          ? `${channel.platformName}${channel.channelName ? ` · ${channel.channelName}` : ''}`
                          : 'Chưa cập nhật'}
                      </td>
                      <td className="p-4">
                        {(
                          channel?.followerCount ||
                          m.collaborator.collaboratorProfile?.totalFollowers ||
                          0
                        ).toLocaleString('vi-VN')}
                      </td>
                      <td className="p-4">
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-bold ${
                            m.status === 'APPROVED'
                              ? 'bg-green-100 text-green-700'
                              : m.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {statusText[m.status]}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal mời KOL */}
      {showInvite && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4">
          <form
            onSubmit={handleInvite}
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 className="text-xl font-extrabold">Mời KOL/CTV vào {storeName}</h2>
            <p className="mt-2 text-sm text-[#7d715e]">
              KOL sẽ nhận lời mời trong trang Thưởng doanh số.
            </p>
            <label className="mt-5 block text-sm font-bold">Email tài khoản KOL</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-[#dcc8a7] p-3 outline-none focus:border-[#b88e4f]"
              placeholder="kol@example.com"
            />
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={() => setShowInvite(false)} className="rounded-xl px-4 py-2">
                Hủy
              </button>
              <button
                disabled={invite.isPending}
                className="rounded-xl bg-[#cfa75d] px-5 py-2 font-bold text-white disabled:opacity-50"
              >
                {invite.isPending ? 'Đang gửi…' : 'Gửi lời mời'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
