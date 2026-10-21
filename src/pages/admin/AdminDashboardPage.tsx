import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Box,
  CheckCircle2,
  RefreshCw,
  ShoppingBag,
  Store,
  TrendingUp,
  Users,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  ReferenceLine,
} from 'recharts';
import { adminStatsService, bucketDate, type AdminStats, type AdminStatsKey, type StatsBucket } from '../../services/admin-stats.service';
import {
  HEALTH_AUTO_REFRESH_MS,
  OVERALL_LABEL,
  runHealthCheck,
  type HealthSnapshot,
  type OverallStatus,
} from '../../services/system-health';

/* ------------------------------------------------------------------ */
/* Types & data loading                                                */
/* ------------------------------------------------------------------ */

type Period = 'day' | 'week' | 'month';

/** Thống kê do BE tổng hợp sẵn (COUNT/GROUP BY trong DB) — FE không tải danh sách để tự đếm. */
type DashboardData = Record<AdminStatsKey, AdminStats | null> & { failed: string[] };

/** Màu theo thực thể (đã kiểm tra CVD/contrast) — dùng thống nhất cho mọi chart. */
const SERIES = [
  { key: 'users', label: 'Người dùng mới', color: '#C0841A' },
  { key: 'products', label: 'Sản phẩm mới', color: '#2563EB' },
  { key: 'orders', label: 'Đơn hàng', color: '#0E9F6E' },
] as const;

const PERIODS: { key: Period; label: string; suffix: string }[] = [
  { key: 'day', label: 'Ngày', suffix: 'hôm nay' },
  { key: 'week', label: 'Tuần', suffix: 'tuần này' },
  { key: 'month', label: 'Tháng', suffix: 'tháng này' },
];

const SOURCE_LABEL: Record<AdminStatsKey, string> = {
  users: 'Người dùng',
  stores: 'Gian hàng',
  products: 'Sản phẩm',
  orders: 'Đơn hàng',
};

async function loadDashboard(): Promise<DashboardData> {
  const keys: AdminStatsKey[] = ['users', 'stores', 'products', 'orders'];
  const results = await Promise.all(
    keys.map((k) =>
      adminStatsService
        .get(k)
        .then((stats) => ({ stats, error: null as string | null }))
        .catch((err: any) => {
          const status = err?.status ?? err?.response?.status;
          return { stats: null, error: status ? `HTTP ${status}` : 'không kết nối được' };
        }),
    ),
  );
  const data = { failed: [] as string[] } as unknown as DashboardData;
  keys.forEach((k, i) => {
    data[k] = results[i].stats;
    if (results[i].error) data.failed.push(`${SOURCE_LABEL[k]} (${results[i].error})`);
  });
  return data;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const WEEKDAY = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const pad = (n: number) => String(n).padStart(2, '0');

const newInPeriod = (s: AdminStats | null | undefined, period: Period) =>
  !s ? 0 : period === 'day' ? s.newToday : period === 'week' ? s.newLast7Days : s.newLast30Days;

/** Chọn chuỗi bucket theo kỳ: Ngày = 24 giờ, Tuần = 7 ngày cuối, Tháng = 30 ngày. */
function pickBuckets(s: AdminStats | null, period: Period): StatsBucket[] {
  if (!s) return [];
  if (period === 'day') return s.hourly ?? [];
  const daily = s.daily ?? [];
  return period === 'week' ? daily.slice(-7) : daily;
}

const ddmm = (d: Date) => `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;

/** Nhãn trục X. Theo giờ: mốc 0h hiển thị ngày (vd "21/10") để tách hôm trước / hôm sau. */
function bucketLabel(d: Date, period: Period | 'monthly') {
  if (period === 'monthly') return `Th${d.getMonth() + 1}`;
  if (period === 'day') return d.getHours() === 0 ? ddmm(d) : `${pad(d.getHours())}h`;
  if (period === 'week') return WEEKDAY[d.getDay()];
  return ddmm(d);
}

/** Nhãn đầy đủ cho tooltip. */
function bucketFullLabel(d: Date, period: Period | 'monthly') {
  if (period === 'monthly') return `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`;
  if (period === 'day') {
    const h = d.getHours();
    return `${WEEKDAY[d.getDay()]} ${ddmm(d)} · ${pad(h)}:00 – ${pad((h + 1) % 24)}:00`;
  }
  return `${WEEKDAY[d.getDay()]}, ${ddmm(d)}/${d.getFullYear()}`;
}

/** Gộp các chuỗi users/products/orders (cùng số bucket, cùng mốc) thành dữ liệu chart. */
function mergeSeries(
  data: DashboardData | null,
  pick: (s: AdminStats | null) => StatsBucket[],
  period: Period | 'monthly',
) {
  if (!data) return [];
  const u = pick(data.users);
  const p = pick(data.products);
  const o = pick(data.orders);
  const base = [u, p, o].reduce((a, b) => (b.length > a.length ? b : a), [] as StatsBucket[]);
  return base.map((b, i) => {
    const d = bucketDate(b.start);
    return {
      label: bucketLabel(d, period),
      full: bucketFullLabel(d, period),
      hour: d.getHours(),
      midnight: period === 'day' && d.getHours() === 0 && i > 0,
    users: u[i]?.count ?? 0,
    products: p[i]?.count ?? 0,
      orders: o[i]?.count ?? 0,
    };
  });
}

type ChartRow = ReturnType<typeof mergeSeries>[number];

/** Tooltip hiển thị ngày/giờ đầy đủ thay vì nhãn rút gọn trên trục. */
const fullLabelFormatter = (label: any, payload: readonly any[] | undefined) =>
  (payload?.[0]?.payload as ChartRow | undefined)?.full ?? label;

/** Tick trục X: mốc chuyển ngày được tô đậm màu vàng đồng. */
function AxisTick(props: any) {
  const { x, y, payload, rows } = props;
  const row = (rows as ChartRow[]).find((r) => r.label === payload?.value);
  const strong = row?.midnight;
  return (
    <text x={x} y={y + 12} textAnchor="middle" fontSize={11} fontWeight={strong ? 700 : 400} fill={strong ? '#B88E4F' : '#8A8175'}>
      {payload?.value}
    </text>
  );
}

const fmtNum = (n: number) => n.toLocaleString('vi-VN');
const fmtShort = (d: Date) =>
  `${pad(d.getHours())}:${pad(d.getMinutes())} ${pad(d.getDate())}-${pad(d.getMonth() + 1)}`;

/* ------------------------------------------------------------------ */
/* UI pieces                                                           */
/* ------------------------------------------------------------------ */

function Panel({ title, subtitle, children, className = '' }: { title: string; subtitle?: string; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl border border-[#EEE7DC] bg-white p-5 shadow-[0_1px_2px_rgba(26,22,18,0.04)] min-w-0 ${className}`}>
      <h3 className="text-sm font-bold text-[#1A1612]">{title}</h3>
      {subtitle && <p className="mt-0.5 text-xs text-[#8A8175]">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function KpiCard({
  label,
  value,
  sub,
  icon,
  tint,
  loading,
}: {
  label: string;
  value: number;
  sub: string;
  icon: ReactNode;
  tint: string;
  loading: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[#EEE7DC] bg-white p-4 shadow-[0_1px_2px_rgba(26,22,18,0.04)] min-w-0">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs text-[#6B6358]">{label}</p>
        <div className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${tint}`}>{icon}</div>
      </div>
      <p className="mt-1 text-2xl font-bold text-[#1A1612] tabular-nums">{loading ? '…' : fmtNum(value)}</p>
      <p className="mt-1 text-[11px] text-[#8A8175] truncate">{loading ? ' ' : sub}</p>
    </div>
  );
}

const STATUS_TONE: Record<OverallStatus, { text: string; dot: string }> = {
  HEALTHY: { text: 'text-emerald-700', dot: 'bg-emerald-500' },
  DEGRADED: { text: 'text-amber-700', dot: 'bg-amber-500' },
  DOWN: { text: 'text-rose-700', dot: 'bg-rose-500' },
};

function HealthRow({ label, value, dot, valueClass }: { label: string; value: string; dot: string; valueClass: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-[#FAF8F5] border border-[#F0EBE3] px-3 py-2.5">
      <span className="flex items-center gap-2 text-xs text-[#4A433A]">
        <span className={`w-2 h-2 rounded-full shrink-0 ${dot}`} />
        {label}
      </span>
      <span className={`text-xs font-bold tabular-nums ${valueClass}`}>{value}</span>
    </div>
  );
}

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #EEE7DC',
  boxShadow: '0 4px 16px rgba(26,22,18,0.08)',
  fontSize: 12,
};
const axisTick = { fontSize: 11, fill: '#8A8175' };

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

/** Tổng quan admin: KPI nền tảng, hoạt động theo kỳ, sức khỏe hệ thống, tăng trưởng 6 tháng. */
export default function AdminDashboardPage() {
  const [period, setPeriod] = useState<Period>('week');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState<HealthSnapshot | null>(null);
  const [healthLoading, setHealthLoading] = useState(true);
  const healthRunning = useRef(false);

  const refreshHealth = useCallback(async () => {
    if (healthRunning.current) return;
    healthRunning.current = true;
    setHealthLoading(true);
    try {
      setHealth(await runHealthCheck());
    } finally {
      healthRunning.current = false;
      setHealthLoading(false);
    }
  }, []);

  const dataRunning = useRef(false);
  const refreshData = useCallback(async () => {
    if (dataRunning.current) return;
    dataRunning.current = true;
    setLoading(true);
    try {
      setData(await loadDashboard());
    } finally {
      dataRunning.current = false;
      setLoading(false);
    }
  }, []);

  const refreshAll = () => {
    void refreshData();
    void refreshHealth();
  };

  useEffect(() => {
    void refreshData();
    void refreshHealth();
    // Tự cập nhật số liệu + sức khỏe hệ thống mỗi 30 giây (BE cache thống kê 15 giây).
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      void refreshData();
      void refreshHealth();
    }, HEALTH_AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [refreshData, refreshHealth]);

  const suffix = PERIODS.find((p) => p.key === period)!.suffix;

  const kpis = useMemo(() => {
    const d = data;
    const pendingStores = d?.stores?.byStatus?.PENDING ?? 0;
    return [
      {
        label: 'Tổng người dùng',
        value: d?.users?.total ?? 0,
        sub: `+${fmtNum(newInPeriod(d?.users, period))} ${suffix}`,
        icon: <Users className="w-4 h-4" />,
        tint: 'bg-[#FBF5EB] text-[#B88E4F] border-[#EEDFC6]',
      },
      {
        label: 'Gian hàng',
        value: d?.stores?.total ?? 0,
        sub: `+${fmtNum(newInPeriod(d?.stores, period))} ${suffix}${pendingStores ? ` · ${fmtNum(pendingStores)} chờ duyệt` : ''}`,
        icon: <Store className="w-4 h-4" />,
        tint: 'bg-violet-50 text-violet-600 border-violet-100',
      },
      {
        label: 'Sản phẩm',
        value: d?.products?.total ?? 0,
        sub: `+${fmtNum(newInPeriod(d?.products, period))} ${suffix}`,
        icon: <Box className="w-4 h-4" />,
        tint: 'bg-blue-50 text-blue-600 border-blue-100',
      },
      {
        label: 'Đơn hàng',
        value: d?.orders?.total ?? 0,
        sub: `+${fmtNum(newInPeriod(d?.orders, period))} ${suffix}`,
        icon: <ShoppingBag className="w-4 h-4" />,
        tint: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      },
    ];
  }, [data, period, suffix]);

  const activity = useMemo(() => mergeSeries(data, (s) => pickBuckets(s, period), period), [period, data]);
  const monthly = useMemo(() => mergeSeries(data, (s) => s?.monthly ?? [], 'monthly'), [data]);
  /** Theo giờ: tick mỗi 3 giờ (luôn gồm mốc 0h = ngày mới); tuần: mọi ngày; tháng: để recharts tự giãn. */
  const xTicks = useMemo(
    () =>
      period === 'day'
        ? activity.filter((r) => r.hour % 3 === 0 || r.midnight).map((r) => r.label)
        : period === 'week'
          ? activity.map((r) => r.label)
          : undefined,
    [activity, period],
  );
  const midnightRows = activity.filter((r) => r.midnight);

  const activityTitle =
    period === 'day' ? 'Hoạt động 24 giờ qua' : period === 'week' ? 'Hoạt động 7 ngày qua' : 'Hoạt động 30 ngày qua';

  const overall = health?.overall;
  const tone = overall ? STATUS_TONE[overall] : null;

  return (
    <div className="flex flex-col gap-5 w-full min-w-0 pb-10">
      {/* Hero */}
      <div className="rounded-2xl border border-[#EEDFC6] bg-gradient-to-br from-[#FBF5EB] via-[#FDFAF4] to-white px-5 py-5 sm:px-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shadow-[0_1px_2px_rgba(26,22,18,0.04)]">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-[#B88E4F]">
            <Activity className="w-3.5 h-3.5" /> Trung tâm quản trị
          </p>
          <h1 className="mt-1 text-xl font-bold" style={{ color: '#B88E4F' }}>
            Phân tích hệ thống
          </h1>
          <p className="mt-1 text-xs text-[#6B6358]">Giám sát nền tảng thời gian thực và số liệu tăng trưởng của ScanMS</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="rounded-xl border border-[#EEE7DC] bg-white px-3 py-2">
            <p className={`flex items-center gap-1.5 text-xs font-semibold ${tone ? tone.text : 'text-[#B88E4F]'}`}>
              <span className={`w-2 h-2 rounded-full ${tone ? tone.dot : 'bg-[#B88E4F]'}`} />
              {overall ? `Hệ thống ${OVERALL_LABEL[overall].toLowerCase()}` : 'Đang kiểm tra…'}
            </p>
            <p className="mt-0.5 text-[10px] text-[#8A8175]">
              Cập nhật: {health ? fmtShort(health.checkedAt) : '—'}
            </p>
          </div>
          <button
            type="button"
            onClick={refreshAll}
            disabled={loading && healthLoading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E4DDD2] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#1A1612] hover:bg-[#FAF8F5] disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading || healthLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex items-center gap-2" role="tablist" aria-label="Khoảng thời gian">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            type="button"
            role="tab"
            aria-selected={period === p.key}
            onClick={() => setPeriod(p.key)}
            className={`rounded-full px-4 py-1.5 text-xs font-semibold border transition-colors ${
              period === p.key
                ? 'bg-[#B88E4F] border-[#B88E4F] text-white shadow-sm'
                : 'bg-white border-[#E4DDD2] text-[#4A433A] hover:bg-[#FAF8F5]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {data?.failed.length ? (
        <p className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            Không tải được thống kê: {data.failed.join(', ')}. Kiểm tra user/product/order-service đã được build lại
            &amp; khởi động với API <code className="font-mono">/admin/stats</code> chưa.
          </span>
        </p>
      ) : null}

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <KpiCard key={k.label} {...k} loading={loading && !data} />
        ))}
      </div>

      {/* Activity + Health */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel
          title={activityTitle}
          subtitle="Người dùng mới, sản phẩm mới và đơn hàng phát sinh"
          className="xl:col-span-2"
        >
          <div className="h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={activity} margin={{ top: midnightRows.length ? 22 : 8, right: 12, left: -16, bottom: 0 }}>
                <CartesianGrid stroke="#F0EBE3" vertical={false} />
                <XAxis
                  dataKey="label"
                  ticks={xTicks}
                  interval={xTicks ? 0 : 'preserveStartEnd'}
                  minTickGap={8}
                  tick={(p: any) => <AxisTick {...p} rows={activity} />}
                  tickLine={false}
                  axisLine={{ stroke: '#E4DDD2' }}
                />
                <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
                {midnightRows.map((r) => (
                  <ReferenceLine
                    key={r.label}
                    x={r.label}
                    stroke="#B88E4F"
                    strokeDasharray="4 4"
                    strokeOpacity={0.7}
                    label={({ viewBox }: any) => (
                      <g fontSize={11} fontWeight={600}>
                        <text x={viewBox.x - 6} y={viewBox.y - 8} textAnchor="end" fill="#8A8175">
                          ← Hôm qua
                        </text>
                        <text x={viewBox.x + 6} y={viewBox.y - 8} textAnchor="start" fill="#B88E4F">
                          Hôm nay →
                        </text>
                      </g>
                    )}
                  />
                ))}
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={fullLabelFormatter}
                  cursor={{ stroke: '#CDB58C', strokeDasharray: '4 4' }}
                />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                {SERIES.map((s) => (
                  <Line
                    key={s.key}
                    type="monotone"
                    dataKey={s.key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Sức khỏe hệ thống" subtitle="Trạng thái microservice và hạ tầng">
          <div className="flex flex-col gap-2">
            <HealthRow
              label="Service hoạt động"
              value={health ? `${health.upCount}/${health.total}` : '…'}
              dot={!health ? 'bg-[#CDB58C]' : health.upCount === health.total ? 'bg-emerald-500' : 'bg-amber-500'}
              valueClass={!health ? 'text-[#8A8175]' : health.upCount === health.total ? 'text-emerald-700' : 'text-amber-700'}
            />
            <HealthRow
              label="Thời gian phản hồi TB"
              value={health ? (health.avgMs != null ? `${fmtNum(health.avgMs)}ms` : '—') : '…'}
              dot={!health || health.avgMs == null ? 'bg-[#CDB58C]' : health.avgMs > 1000 ? 'bg-amber-500' : 'bg-emerald-500'}
              valueClass={!health || health.avgMs == null ? 'text-[#8A8175]' : health.avgMs > 1000 ? 'text-amber-700' : 'text-emerald-700'}
            />
            <HealthRow
              label="Keycloak"
              value={health ? (health.keycloak.up ? 'UP' : 'DOWN') : '…'}
              dot={!health ? 'bg-[#CDB58C]' : health.keycloak.up ? 'bg-emerald-500' : 'bg-rose-500'}
              valueClass={!health ? 'text-[#8A8175]' : health.keycloak.up ? 'text-emerald-700' : 'text-rose-700'}
            />
            <HealthRow label="Kafka" value="CHƯA CẤU HÌNH" dot="bg-[#C9C1B5]" valueClass="text-[#8A8175]" />
            <HealthRow
              label="Trạng thái tổng"
              value={overall ?? '…'}
              dot={tone ? tone.dot : 'bg-[#CDB58C]'}
              valueClass={tone ? tone.text : 'text-[#8A8175]'}
            />
            {health && (
              <div
                className={`mt-1 flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-xs ${
                  overall === 'HEALTHY'
                    ? 'bg-emerald-50 border-emerald-100 text-emerald-800'
                    : overall === 'DOWN'
                      ? 'bg-rose-50 border-rose-100 text-rose-800'
                      : 'bg-amber-50 border-amber-100 text-amber-800'
                }`}
              >
                <span className="flex items-center gap-2">
                  {overall === 'HEALTHY' ? <CheckCircle2 className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  {overall === 'HEALTHY'
                    ? 'Tất cả thành phần hoạt động bình thường'
                    : overall === 'DOWN'
                      ? 'Hệ thống không phản hồi'
                      : 'Một số thành phần cần được kiểm tra'}
                </span>
                <Link to="/admin/system-health" className="inline-flex items-center gap-1 font-semibold shrink-0 hover:underline">
                  Chi tiết <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </div>
        </Panel>
      </div>

      {/* Monthly growth */}
      <Panel title="Tăng trưởng hàng tháng" subtitle="Người dùng mới, sản phẩm mới và đơn hàng trong 6 tháng gần nhất">
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 8, right: 12, left: -16, bottom: 0 }} barGap={2} barCategoryGap="28%">
              <CartesianGrid stroke="#F0EBE3" vertical={false} />
              <XAxis dataKey="label" tick={axisTick} tickLine={false} axisLine={{ stroke: '#E4DDD2' }} />
              <YAxis allowDecimals={false} tick={axisTick} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} labelFormatter={fullLabelFormatter} cursor={{ fill: 'rgba(205,181,140,0.12)' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
              {SERIES.map((s) => (
                <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} maxBarSize={22} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>
    </div>
  );
}
