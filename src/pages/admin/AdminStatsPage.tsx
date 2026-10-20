import { useMemo, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Select } from '../../components/ui/Select';

/** Thống kê Top 10 / kỳ — soft UI khi chưa có analytics Nest. */
export default function AdminStatsPage() {
  const [range, setRange] = useState('month');
  const hint = useMemo(() => {
    if (range === 'week') return 'Theo tuần hiện tại';
    if (range === 'year') return 'Theo năm hiện tại';
    return 'Theo tháng hiện tại';
  }, [range]);

  return (
    <div className="flex flex-col gap-4 w-full min-w-0 pb-10">
      <PageHeader
        title="Thống kê & Top 10"
        description="Top shop, mặt hàng, giao dịch / doanh thu theo cửa hàng và hệ thống"
        icon={<TrendingUp className="w-5 h-5" />}
      />
      <div className="flex flex-wrap items-center gap-2">
        <Select className="min-w-[160px]" value={range} onChange={(e) => setRange(e.target.value)}>
          <option value="week">Tuần</option>
          <option value="month">Tháng</option>
          <option value="year">Năm</option>
        </Select>
        <span className="text-xs text-[#6F768A]">{hint}</span>
      </div>
      <div className="rounded-2xl border border-[#D0D4E4] bg-white p-5 text-sm text-[#3E4456]">
        Spring BE chưa có endpoint thống kê Top 10 realtime (Nest `/dashboard/realtime` đã soft-stub).
        Dùng <strong>Dashboard vận hành</strong> để xem số lượng shop/KOL/đơn/live hiện có; khi có API stats sẽ gắn vào trang này.
      </div>
    </div>
  );
}
