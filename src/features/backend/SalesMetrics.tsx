import { useEffect, useState } from 'react';
import { formatVnd } from '../../services/domain-model';
import { scanmsService } from '../../services/scanms.service';
import type { LivestreamSalesResponse, StoreDashboardResponse } from '../../types/backend.generated';

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-[#EAE4D7] bg-[#FAF8F5] p-3">
    <dt className="text-xs text-[#7D715E]">{label}</dt>
    <dd className="mt-1 font-bold">{value}</dd>
  </div>;
}

export function StoreMetrics({ storeId }: { storeId: string }) {
  const [data, setData] = useState<StoreDashboardResponse | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError('');
    scanmsService.storeDashboard(storeId, controller.signal)
      .then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(failure => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Không tải được thống kê shop.'); });
    return () => controller.abort();
  }, [storeId]);
  return <section className="space-y-3">
    <h3 className="font-bold">Thống kê gian hàng</h3>
    {error ? <p role="alert" className="text-sm text-red-700">{error}</p>
      : !data ? <p role="status" className="text-sm text-[#7D715E]">Đang tải thống kê…</p>
        : <dl className="grid grid-cols-2 gap-3">
          <Metric label="Doanh thu đã thanh toán" value={formatVnd(data.paidRevenueVnd)} />
          <Metric label="Số đơn" value={data.orderCount} />
          <Metric label="Sản phẩm" value={data.productCount} />
          <Metric label="Livestream" value={data.livestreamCount} />
          <Metric label="Đánh giá trung bình" value={data.ratingAverage ?? 'Chưa có'} />
          <Metric label="Lượt đánh giá" value={data.ratingCount} />
        </dl>}
  </section>;
}

export function LivestreamMetrics({ livestreamId }: { livestreamId: string }) {
  const [data, setData] = useState<LivestreamSalesResponse | null>(null);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setData(null); setError('');
    scanmsService.livestreamSales(livestreamId, controller.signal)
      .then(result => { if (!controller.signal.aborted) setData(result); })
      .catch(failure => { if (!controller.signal.aborted) setError(failure instanceof Error ? failure.message : 'Không tải được doanh số livestream.'); });
    return () => controller.abort();
  }, [livestreamId]);
  return <section className="space-y-3">
    <h3 className="font-bold">Doanh số từ livestream</h3>
    {error ? <p role="alert" className="text-sm text-red-700">{error}</p>
      : !data ? <p role="status" className="text-sm text-[#7D715E]">Đang tải doanh số…</p>
        : <dl className="grid grid-cols-2 gap-3">
          <Metric label="GMV" value={formatVnd(data.gmvVnd)} />
          <Metric label="Doanh thu sau giảm giá" value={formatVnd(data.netSalesVnd)} />
          <Metric label="Khách mua" value={data.buyerCount} />
          <Metric label="Số đơn" value={data.orderCount} />
          <Metric label="Sản phẩm đã bán" value={data.soldQuantity} />
        </dl>}
  </section>;
}
