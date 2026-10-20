import { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/ui/PageHeader';

export default function AdminSystemWalletPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res: any = await api.get('/wallets').catch(() => api.get('/finance/wallets/me'));
        const payload = res?.result ?? res?.data ?? res;
        setRows(Array.isArray(payload) ? payload : payload ? [payload] : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Không tải được ví hệ thống.');
      }
    })();
  }, []);

  return (
    <div className="flex flex-col gap-4 w-full min-w-0 pb-10">
      <PageHeader title="Ví hệ thống" description="Theo dõi ví / số dư liên quan vận hành sàn" icon={<Wallet className="w-5 h-5" />} />
      {error && <p className="text-xs text-rose-700">{error}</p>}
      <div className="rounded-2xl border border-[#C5D4E8] bg-white overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-xs">
          <thead className="bg-[#F4F7FC] text-[#6B778C]">
            <tr>
              <th className="px-3 py-2">ID</th>
              <th className="px-3 py-2">Owner</th>
              <th className="px-3 py-2">Số dư</th>
              <th className="px-3 py-2">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((w, i) => (
              <tr key={w.walletId || w.id || i} className="border-t border-[#E8EEF8]">
                <td className="px-3 py-2 font-mono text-[10px]">{w.walletId || w.id || '—'}</td>
                <td className="px-3 py-2">{w.ownerRefId || w.collaboratorId || w.storeId || '—'}</td>
                <td className="px-3 py-2 tabular-nums">
                  {Number(w.availableBalanceVnd ?? w.balance ?? w.availableBalance ?? 0).toLocaleString('vi-VN')} ₫
                </td>
                <td className="px-3 py-2">{w.status || 'ACTIVE'}</td>
              </tr>
            ))}
            {!rows.length && !error && (
              <tr>
                <td colSpan={4} className="px-3 py-6 text-center text-[#6B778C]">
                  Chưa có dữ liệu ví (BE có thể chỉ hỗ trợ ví theo owner).
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
