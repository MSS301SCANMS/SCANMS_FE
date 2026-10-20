import { useEffect, useState } from 'react';
import { Handshake } from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/ui/PageHeader';

/** Biểu thị hợp tác Shop–KOL từ referral links (proxy quan hệ). */
export default function CollaborationsPage({ mode }: { mode: 'shop' | 'admin' }) {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res: any = await api.get('/referrals');
        const list = res?.result ?? res?.data ?? [];
        setRows(Array.isArray(list) ? list : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Không tải được quan hệ hợp tác.');
      }
    })();
  }, []);

  return (
    <div className="flex flex-col gap-4 w-full min-w-0 pb-10">
      <PageHeader
        title={mode === 'shop' ? 'Hợp tác KOL' : 'Hợp tác Shop–KOL'}
        description="Danh sách liên kết referral thể hiện shop đang hợp tác với KOL nào"
        icon={<Handshake className="w-5 h-5" />}
      />
      {error && <p className="text-xs text-rose-700">{error}</p>}
      <div className="rounded-2xl border border-[#EAE4D7] bg-white overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-[#FAF8F5] text-[#7D715E]">
            <tr>
              <th className="px-3 py-2">Referral</th>
              <th className="px-3 py-2">KOL</th>
              <th className="px-3 py-2">Sản phẩm</th>
              <th className="px-3 py-2">Livestream</th>
              <th className="px-3 py-2">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.referralLinkId || r.id} className="border-t border-[#EAE4D7]">
                <td className="px-3 py-2 font-mono text-[10px]">{r.token || r.referralLinkId || r.id}</td>
                <td className="px-3 py-2">{r.collaboratorId || '—'}</td>
                <td className="px-3 py-2">{r.productId || '—'}</td>
                <td className="px-3 py-2">{r.livestreamId || '—'}</td>
                <td className="px-3 py-2">{r.status || 'ACTIVE'}</td>
              </tr>
            ))}
            {!rows.length && !error && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[#7D715E]">
                  Chưa có liên kết hợp tác. KOL tạo referral hoặc shop mời live để xuất hiện tại đây.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
