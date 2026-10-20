import { useEffect, useState } from 'react';
import { Percent } from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/ui/PageHeader';

export default function AdminCommissionPoliciesPage() {
  const [rows, setRows] = useState<any[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res: any = await api.get('/commission-policies');
        const list = res?.result ?? res?.data ?? [];
        setRows(Array.isArray(list) ? list : []);
      } catch (err: any) {
        setError(err?.response?.data?.message || err?.message || 'Không tải được chính sách hoa hồng.');
      }
    })();
  }, []);

  return (
    <div className="flex flex-col gap-4 w-full min-w-0 pb-10">
      <PageHeader
        title="Chiết khấu hoa hồng hệ thống"
        description="CommissionPolicy theo scope PLATFORM / STORE / PRODUCT / …"
        icon={<Percent className="w-5 h-5" />}
      />
      {error && <p className="text-xs text-rose-700">{error}</p>}
      <div className="rounded-2xl border border-[#D0D4E4] bg-white overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="bg-[#F6F7FB] text-[#6F768A]">
            <tr>
              <th className="px-3 py-2">Tên</th>
              <th className="px-3 py-2">Scope</th>
              <th className="px-3 py-2">Rate (%)</th>
              <th className="px-3 py-2">Return days</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.policyId || p.id} className="border-t border-[#ECEEF6]">
                <td className="px-3 py-2 font-medium">{p.policyName || p.name}</td>
                <td className="px-3 py-2">{p.scopeType}</td>
                <td className="px-3 py-2 tabular-nums">{p.commissionRate}</td>
                <td className="px-3 py-2">{p.returnWindowDays}</td>
                <td className="px-3 py-2">{p.status}</td>
              </tr>
            ))}
            {!rows.length && !error && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[#6F768A]">
                  Chưa có policy. Tạo qua API `/commission-policies`.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
