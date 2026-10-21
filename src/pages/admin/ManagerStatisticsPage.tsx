import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { CalendarDays, ChevronLeft, ChevronRight, RefreshCw, ShoppingBag, Store, Package, Wallet, TrendingUp } from 'lucide-react';
import api from '../../services/api';
import './manager-statistics.css';

type Range = 'week' | 'month' | 'year';
type Ranking = { id: string; name: string | null; orderCount: number; quantity: number; revenueVnd: number };
type Statistics = { range: Range; fromDate: string; toDate: string; generatedAt: string; orderCount: number; paidOrderCount: number; cancelledOrderCount: number; revenueVnd: number; soldQuantity: number; sellingStoreCount: number; daily: { date: string; orderCount: number; paidOrderCount: number; revenueVnd: number }[]; topStores: Ranking[]; topProducts: Ranking[] };
const money = (value: number) => value.toLocaleString('vi-VN') + ' ₫';
const number = (value: number) => value.toLocaleString('vi-VN');
function today() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  return ['year', 'month', 'day'].map(key => parts.find(part => part.type === key)?.value).join('-');
}
function dateLabel(value: string) { const [year, month, day] = value.split('-'); return `${day}/${month}/${year}`; }
function move(anchor: string, range: Range, direction: number) {
  const date = new Date(anchor + 'T12:00:00Z');
  if (range === 'week') date.setUTCDate(date.getUTCDate() + direction * 7);
  else if (range === 'month') { date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + direction); }
  else { date.setUTCMonth(0, 1); date.setUTCFullYear(date.getUTCFullYear() + direction); }
  return date.toISOString().slice(0, 10);
}

export default function ManagerStatisticsPage() {
  const [range, setRange] = useState<Range>('month');
  const [anchor, setAnchor] = useState(today);
  const [metric, setMetric] = useState<'revenueVnd' | 'paidOrderCount'>('revenueVnd');
  const [ranking, setRanking] = useState<'stores' | 'products'>('stores');
  const query = useQuery({
    queryKey: ['manager-statistics', range, anchor], retry: false, staleTime: 0, refetchOnWindowFocus: true, refetchInterval: 30000,
    queryFn: async ({ signal }) => {
      const res: any = await api.get('/orders/statistics', { params: { range, anchor }, signal, headers: { 'x-skip-cache': 'true' } });
      const data = res?.result ?? res?.data ?? res;
      if (!data || data.range !== range || !Array.isArray(data.daily) || !Array.isArray(data.topStores) || !Array.isArray(data.topProducts) || !Number.isFinite(data.revenueVnd) || !data.fromDate || !data.toDate)
        throw new Error('Dữ liệu thống kê chưa hợp lệ. Vui lòng tải lại.');
      return data as Statistics;
    },
  });
  const data = query.data;
  const chart = useMemo(() => {
    const buckets = new Map<string, { label: string; revenueVnd: number; paidOrderCount: number }>();
    for (const point of data?.daily || []) {
      const key = range === 'year' ? point.date.slice(0, 7) : point.date;
      const bucket = buckets.get(key) || { label: range === 'year' ? `Tháng ${Number(key.slice(5, 7))}` : `${point.date.slice(8, 10)}/${point.date.slice(5, 7)}`, revenueVnd: 0, paidOrderCount: 0 };
      bucket.revenueVnd += point.revenueVnd; bucket.paidOrderCount += point.paidOrderCount; buckets.set(key, bucket);
    }
    return [...buckets.values()];
  }, [data, range]);
  const top = ranking === 'stores' ? data?.topStores : data?.topProducts;
  const current = today();
  const periods = { week: 'Tuần', month: 'Tháng', year: 'Năm' };
  return <div className="manager-statistics">
    <div className="ms-toolbar">
      <div className="ms-period"><CalendarDays size={18} /><select aria-label="Kỳ thống kê" value={range} onChange={event => setRange(event.target.value as Range)}><option value="week">Theo tuần</option><option value="month">Theo tháng</option><option value="year">Theo năm</option></select></div>
      <div className="ms-period-navigation"><button aria-label="Kỳ trước" disabled={move(anchor, range, -1) < '2000-01-01'} onClick={() => setAnchor(move(anchor, range, -1))}><ChevronLeft size={16} /></button><input aria-label="Ngày trong kỳ thống kê" type="date" min="2000-01-01" max="2100-12-31" value={anchor} onChange={event => { const value = event.target.value; if (/^\d{4}-\d{2}-\d{2}$/.test(value) && value >= '2000-01-01' && value <= '2100-12-31') setAnchor(value); }} /><button aria-label="Kỳ sau" disabled={move(anchor, range, 1) > '2100-12-31'} onClick={() => setAnchor(move(anchor, range, 1))}><ChevronRight size={16} /></button></div>
      <button onClick={() => setAnchor(current)}>{periods[range]} hiện tại</button>
      {data && !query.isError && <div className="ms-period-caption"><span>{dateLabel(data.fromDate)} – {dateLabel(data.toDate)} <small>(giờ Việt Nam)</small></span><small>Cập nhật {new Date(data.generatedAt).toLocaleTimeString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' })}</small></div>}
      <button className="ms-refresh" aria-label="Làm mới thống kê" disabled={query.isFetching} onClick={() => void query.refetch()}><RefreshCw size={15} className={query.isFetching ? 'animate-spin' : ''} />Làm mới</button>
    </div>
    {query.isError ? <div className="ms-state ms-error" role="alert"><strong>Chưa tải được thống kê</strong><p>{(query.error as any)?.response?.status === 404 ? 'Dịch vụ thống kê chưa sẵn sàng. Vui lòng thử lại sau khi cập nhật dịch vụ.' : (query.error as any)?.response?.data?.message || query.error.message}</p><button onClick={() => void query.refetch()}>Thử lại</button></div> : query.isPending ? <div className="ms-state" role="status"><RefreshCw className="animate-spin" size={24} />Đang tổng hợp số liệu…</div> : data && <>
      <div className="ms-summary" aria-label="Số liệu trong kỳ">
        {[
          { label: 'Doanh số đã thanh toán', value: money(data.revenueVnd), hint: 'Giá trị hàng sau giảm giá', icon: Wallet },
          { label: 'Đơn đã thanh toán', value: number(data.paidOrderCount), hint: `${number(data.orderCount)} tổng đơn · ${number(data.cancelledOrderCount)} đơn hủy`, icon: ShoppingBag },
          { label: 'Sản phẩm đã bán', value: number(data.soldQuantity), hint: 'Số lượng trong đơn đã thanh toán', icon: Package },
          { label: 'Gian hàng có doanh số', value: number(data.sellingStoreCount), hint: 'Có dòng hàng được thanh toán trong kỳ', icon: Store },
        ].map(card => <div className="ms-summary-card" key={card.label}><div><span>{card.label}</span><card.icon size={17} /></div><strong>{card.value}</strong><small>{card.hint}</small></div>)}
      </div>
      <section className="ms-chart-card">
        <div className="ms-section-heading"><div><h2>Hiệu quả theo {range === 'year' ? 'tháng' : 'ngày'}</h2><p>Đơn được tính theo ngày tạo trong kỳ đã chọn.</p></div><select aria-label="Chỉ số biểu đồ" value={metric} onChange={event => setMetric(event.target.value as typeof metric)}><option value="revenueVnd">Doanh số đã thanh toán</option><option value="paidOrderCount">Đơn đã thanh toán</option></select></div>
        {!chart.some(point => point[metric] > 0) ? <div className="ms-state ms-chart-empty"><TrendingUp size={28} /><strong>Chưa có {metric === 'revenueVnd' ? 'doanh số' : 'đơn thanh toán'} trong kỳ này</strong><p>Thử chọn kỳ khác để xem dữ liệu.</p></div> : <div className="ms-chart" role="img" aria-label={`Biểu đồ ${metric === 'revenueVnd' ? 'doanh số' : 'đơn đã thanh toán'} theo kỳ`}><ResponsiveContainer width="100%" height="100%"><BarChart data={chart} margin={{ top: 18, right: 16, left: 4, bottom: 0 }}><CartesianGrid vertical={false} stroke="#eee8dd" /><XAxis dataKey="label" tick={{ fill: '#847762', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={22} /><YAxis tick={{ fill: '#847762', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} tickFormatter={value => new Intl.NumberFormat('vi-VN', { notation: 'compact' }).format(value)} /><Tooltip formatter={value => [metric === 'revenueVnd' ? money(Number(value)) : `${number(Number(value))} đơn`, metric === 'revenueVnd' ? 'Doanh số' : 'Đơn thanh toán']} cursor={{ fill: '#fbf5eb' }} /><Bar dataKey={metric} fill="#bc9459" radius={[4, 4, 0, 0]} maxBarSize={38} /></BarChart></ResponsiveContainer></div>}
      </section>
      <section className="ms-ranking">
        <div className="ms-section-heading"><div><h2>Top 10 theo doanh số</h2><p>Xếp hạng trong kỳ đã chọn, từ cao xuống thấp.</p></div><div className="ms-ranking-tabs"><button aria-pressed={ranking === 'stores'} onClick={() => setRanking('stores')}>Gian hàng</button><button aria-pressed={ranking === 'products'} onClick={() => setRanking('products')}>Sản phẩm</button></div></div>
        {!top?.length ? <div className="ms-state"><Store size={26} /><strong>Chưa có dữ liệu xếp hạng trong kỳ này</strong></div> : <div className="ms-ranking-scroll"><table aria-label={`Top 10 ${ranking === 'stores' ? 'gian hàng' : 'sản phẩm'}`}><thead><tr><th>Hạng</th><th>{ranking === 'stores' ? 'Gian hàng' : 'Sản phẩm'}</th><th>Đơn thanh toán</th><th>Số lượng bán</th><th>Doanh số</th></tr></thead><tbody>{top.map((row, index) => <tr key={row.id}><td><span className={`ms-rank ${index < 3 ? 'ms-rank-leading' : ''}`}>{index + 1}</span></td><td><strong>{row.name || `${ranking === 'stores' ? 'Gian hàng' : 'Sản phẩm'} · ${row.id.slice(-8)}`}</strong><small>Mã: {row.id}</small></td><td>{number(row.orderCount)}</td><td>{number(row.quantity)}</td><td className="ms-money">{money(row.revenueVnd)}</td></tr>)}</tbody></table></div>}
      </section>
      <p className="ms-definition">Doanh số lấy từ dòng hàng của đơn đã thanh toán, đang xử lý hoặc hoàn tất; loại phần đơn bị hủy. Giá trị sau giảm giá, chưa trừ tiền hoàn trả và không gồm phí vận chuyển. Tên gian hàng, sản phẩm lấy từ thông tin lưu lúc đặt hàng.</p>
    </>}
  </div>;
}
