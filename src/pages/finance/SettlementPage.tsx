import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { financeService, type MoneyPage, type MoneySettlement } from '../../services/finance.service';
import { money, when, statusLabels } from './money';

export function SettlementDetail({ row }: { row: MoneySettlement }) {
  const labels: Record<string, string> = { grossRevenueVnd: 'Doanh thu', refundVnd: 'Hoàn tiền', sellerDiscountVnd: 'Giảm giá shop chịu', platformSubsidyVnd: 'Trợ giá nền tảng', platformFeeVnd: 'Phí nền tảng', serviceFeeVnd: 'Phí dịch vụ', commissionVnd: 'Hoa hồng KOL', feeBasisVnd: 'Cơ sở tính phí' };
  return <article className="space-y-3 rounded-xl border border-[#EAE4D7] bg-white p-5">
    <div className="flex justify-between gap-3"><strong>{money(row.netAmountVnd)}</strong><span>{statusLabels[row.status] || row.status}</span></div>
    <p className="break-all text-sm text-gray-500">Đơn shop: {row.sellerOrderId}<br />Đối soát: {row.settlementId}</p>
    <dl className="grid grid-cols-2 gap-2 text-sm">{Object.entries(row.breakdown || {}).filter(([, value]) => typeof value === 'number').map(([key, value]) => <div key={key}><dt className="text-gray-500">{labels[key] || key}</dt><dd>{money(value as number)}</dd></div>)}</dl>
    {row.paidAt && <p className="text-sm">Đã ghi có ví shop: {when(row.paidAt)}</p>}
    <details className="text-sm"><summary className="cursor-pointer">Xem bản chụp công thức và cấu hình phí</summary><pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-lg bg-[#FAF8F5] p-3">{JSON.stringify(row.breakdown, null, 2)}</pre></details>
  </article>;
}
export default function SettlementPage() {
  const [params, setParams] = useSearchParams(); const [storeId, setStoreId] = useState(params.get('storeId') || localStorage.getItem('current_store_id') || '');
  const [data, setData] = useState<MoneyPage<MoneySettlement> | null>(null); const [page, setPage] = useState(0); const [error, setError] = useState('');
  useEffect(() => { let live = true; if (!params.get('storeId')) return; void financeService.settlements(params.get('storeId')!, page).then(result => { if (live) { setData(result); setError(''); } }).catch(e => { if (live) setError(e.message); }); return () => { live = false; }; }, [params, page]);
  return <section className="mx-auto max-w-5xl space-y-5 p-6"><h1 className="text-2xl font-bold">Đối soát doanh thu shop</h1>
    <p className="text-gray-600">Đơn đã hoàn tất và hết thời hạn trả hàng mới được đối soát. PAID nghĩa là đã ghi có vào ví shop. Rút về ngân hàng là một giao dịch riêng.</p>
    <form onSubmit={e => { e.preventDefault(); setPage(0); setParams({ storeId }); }} className="flex gap-3"><input aria-label="Mã shop" required value={storeId} onChange={e => setStoreId(e.target.value)} placeholder="Mã shop" className="min-w-0 flex-1 rounded-xl border p-3" /><button className="rounded-xl bg-[#C59B58] px-5 text-white">Xem đối soát</button></form>
    <Link to={`/merchant/wallet?storeId=${encodeURIComponent(storeId)}`} className="block text-[#A77C37] underline">Ví shop và rút tiền</Link>
    {error && <p role="alert" className="text-red-700">{error}</p>}
    {data?.items.length === 0 && <p>Chưa có kỳ đối soát.</p>}
    {data?.items.map(row => <SettlementDetail key={row.settlementId} row={row} />)}
    <div className="flex items-center gap-4"><button disabled={!page} onClick={() => setPage(page - 1)}>Trang trước</button><span>Trang {page + 1}</span><button disabled={!data || (page + 1) * data.size >= data.total} onClick={() => setPage(page + 1)}>Trang sau</button></div>
  </section>;
}
