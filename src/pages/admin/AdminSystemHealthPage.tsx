import { useEffect, useState } from 'react';
import { Activity, CheckCircle2, XCircle } from 'lucide-react';
import api from '../../services/api';
import { PageHeader } from '../../components/ui/PageHeader';

type Probe = { name: string; path: string; ok: boolean; ms: number; detail?: string };

const PROBES: { name: string; path: string }[] = [
  { name: 'User service', path: '/users/me' },
  { name: 'Product / stores', path: '/stores/marketplace' },
  { name: 'Order service', path: '/orders' },
  { name: 'Promotion / collaborators', path: '/collaborators' },
  { name: 'Finance wallets', path: '/finance/wallets/me' },
];

/** Giám sát hệ thống: probe các API qua gateway. */
export default function AdminSystemHealthPage() {
  const [probes, setProbes] = useState<Probe[]>([]);
  const [loading, setLoading] = useState(true);

  const run = async () => {
    setLoading(true);
    const results: Probe[] = [];
    for (const p of PROBES) {
      const started = performance.now();
      try {
        await api.get(p.path, { headers: { 'x-skip-cache': 'true' } });
        results.push({ name: p.name, path: p.path, ok: true, ms: Math.round(performance.now() - started) });
      } catch (err: any) {
        results.push({
          name: p.name,
          path: p.path,
          ok: false,
          ms: Math.round(performance.now() - started),
          detail: err?.response?.status ? `HTTP ${err.response.status}` : err?.message || 'error',
        });
      }
    }
    setProbes(results);
    setLoading(false);
  };

  useEffect(() => {
    void run();
  }, []);

  return (
    <div className="flex flex-col gap-4 w-full min-w-0 pb-10">
      <PageHeader
        title="Giám sát hệ thống"
        description="Kiểm tra service qua gateway: tốc độ phản hồi, hoạt động / lỗi"
        icon={<Activity className="w-5 h-5" />}
      />
      <button
        type="button"
        onClick={() => void run()}
        disabled={loading}
        className="self-start rounded-xl border border-[#C5D4E8] bg-[#E8EEF8] px-3 py-2 text-xs font-semibold text-[#1E3A5F] disabled:opacity-60"
      >
        {loading ? 'Đang probe…' : 'Chạy lại kiểm tra'}
      </button>
      <div className="overflow-x-auto rounded-2xl border border-[#C5D4E8] bg-white">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-[#F4F7FC] text-[#6B778C]">
            <tr>
              <th className="px-3 py-2 font-semibold">Service</th>
              <th className="px-3 py-2 font-semibold">Endpoint</th>
              <th className="px-3 py-2 font-semibold">Trạng thái</th>
              <th className="px-3 py-2 font-semibold">Latency</th>
              <th className="px-3 py-2 font-semibold">Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {probes.map((p) => (
              <tr key={p.path} className="border-t border-[#E8EEF8]">
                <td className="px-3 py-2 font-medium text-[#1A1612]">{p.name}</td>
                <td className="px-3 py-2 text-[#6B778C]">{p.path}</td>
                <td className="px-3 py-2">
                  <span className={`inline-flex items-center gap-1 font-semibold ${p.ok ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {p.ok ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {p.ok ? 'Hoạt động' : 'Lỗi / tắt'}
                  </span>
                </td>
                <td className="px-3 py-2 tabular-nums">{p.ms} ms</td>
                <td className="px-3 py-2 text-[#6B778C]">{p.detail || '—'}</td>
              </tr>
            ))}
            {!probes.length && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-[#6B778C]">
                  {loading ? 'Đang kiểm tra…' : 'Chưa có dữ liệu'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
