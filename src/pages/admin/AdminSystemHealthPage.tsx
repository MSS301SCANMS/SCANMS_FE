import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Database,
  KeyRound,
  RefreshCw,
  Server,
  Settings,
  WifiOff,
  X,
  MinusCircle,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  HEALTH_AUTO_REFRESH_MS as AUTO_REFRESH_MS,
  HEALTH_SERVICES as SERVICES,
  KEYCLOAK_ISSUER,
  OVERALL_LABEL,
  fetchApiInfo,
  runHealthCheck,
  type ApiInfo,
  type KafkaProbe,
  type ProbeResult,
} from '../../services/system-health';
import {
  describeCause,
  formatDuration,
  loadHistory,
  saveHistory,
  summarize,
  type ErrorType,
  type HistoryMap,
  type Sample,
  type ServiceHistory,
} from '../../services/system-health-history';

/* ------------------------------------------------------------------ */
/* UI helpers                                                          */
/* ------------------------------------------------------------------ */

type BadgeTone = 'up' | 'down' | 'idle' | 'warn';

const BADGE_STYLES: Record<BadgeTone, string> = {
  up: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  down: 'bg-rose-50 text-rose-700 border-rose-200',
  warn: 'bg-amber-50 text-amber-700 border-amber-200',
  idle: 'bg-[#F4F1EC] text-[#6B6358] border-[#E4DDD2]',
};

function StatusBadge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  const Icon = tone === 'up' ? CheckCircle2 : tone === 'down' ? WifiOff : tone === 'warn' ? AlertCircle : MinusCircle;
  return (
    <span
      className={`inline-flex items-center gap-1.5 shrink-0 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-tight ${BADGE_STYLES[tone]}`}
    >
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {children}
    </span>
  );
}

function StatBox({ label, value, tone }: { label: string; value: ReactNode; tone?: 'up' | 'down' }) {
  const color = tone === 'up' ? 'text-emerald-700' : tone === 'down' ? 'text-rose-700' : 'text-[#1A1612]';
  return (
    <div className="rounded-xl bg-[#FAF8F5] border border-[#F0EBE3] px-3 py-2.5 min-w-0">
      <p className="text-[11px] text-[#8A8175]">{label}</p>
      <p className={`mt-1 text-sm font-bold tabular-nums truncate ${color}`}>{value}</p>
    </div>
  );
}

function Card({
  children,
  className = '',
  onClick,
  selected = false,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}) {
  const interactive = onClick
    ? {
        role: 'button' as const,
        tabIndex: 0,
        'aria-pressed': selected,
        onClick,
        onKeyDown: (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick();
          }
        },
      }
    : {};
  return (
    <div
      {...interactive}
      className={`rounded-2xl border bg-white p-4 shadow-[0_1px_2px_rgba(26,22,18,0.04)] ${
        selected ? 'border-[#B88E4F] ring-2 ring-[#EEDFC6]' : 'border-[#EEE7DC]'
      } ${onClick ? 'cursor-pointer hover:border-[#D9CDB8] transition-colors' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

function IconTile({ children, tone = 'blue' }: { children: ReactNode; tone?: 'blue' | 'purple' | 'gold' }) {
  const cls =
    tone === 'purple'
      ? 'bg-violet-50 text-violet-600 border-violet-100'
      : tone === 'gold'
        ? 'bg-[#FBF5EB] text-[#B88E4F] border-[#EEDFC6]'
        : 'bg-[#E8EEF8] text-[#1E3A5F] border-[#C5D4E8]';
  return <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${cls}`}>{children}</div>;
}

const fmtTime = (d: Date) =>
  `${d.toLocaleTimeString('vi-VN', { hour12: false })} ${d.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })}`;

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

/** Giám sát hệ thống: probe gateway + microservice + hạ tầng (Keycloak, Kafka). */
export default function AdminSystemHealthPage() {
  const [results, setResults] = useState<Record<string, ProbeResult>>({});
  const [keycloak, setKeycloak] = useState<ProbeResult | null>(null);
  const [kafka, setKafka] = useState<KafkaProbe | null>(null);
  const [history, setHistory] = useState<HistoryMap>({});
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const runningRef = useRef(false);

  const run = useCallback(async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setLoading(true);
    try {
      const snap = await runHealthCheck();
      setResults(snap.services);
      setKeycloak(snap.keycloak);
      setKafka(snap.kafka);
      setHistory(snap.history);
      setCheckedAt(snap.checkedAt);
    } finally {
      runningRef.current = false;
      setLoading(false);
    }
  }, []);

  const clearHistory = useCallback((id: string) => {
    const map = loadHistory(window.localStorage);
    delete map[id];
    saveHistory(window.localStorage, map);
    setHistory(map);
  }, []);

  useEffect(() => {
    void run();
    const id = window.setInterval(() => {
      if (document.visibilityState === 'visible') void run();
    }, AUTO_REFRESH_MS);
    return () => window.clearInterval(id);
  }, [run]);

  const hasData = checkedAt !== null;
  const upCount = SERVICES.filter((s) => results[s.id]?.up).length;
  const total = SERVICES.length;
  const overall: { tone: BadgeTone; label: string } = !hasData
    ? { tone: 'idle', label: 'Đang kiểm tra…' }
    : upCount === 0
      ? { tone: 'down', label: OVERALL_LABEL.DOWN }
      : upCount === total && keycloak?.up && kafka?.state !== 'down'
        ? { tone: 'up', label: OVERALL_LABEL.HEALTHY }
        : { tone: 'warn', label: OVERALL_LABEL.DEGRADED };

  const gateway = results['scanms-gateway'];
  const gatewayDown = !!gateway && !gateway.up && gateway.errorType !== 'http5xx';
  const selected = SERVICES.find((s) => s.id === selectedId) ?? null;

  const realm = KEYCLOAK_ISSUER.split('/realms/')[1] || '—';
  const kcIssuer: string = keycloak?.json?.issuer || KEYCLOAK_ISSUER;

  return (
    <div className="flex flex-col gap-5 w-full min-w-0 pb-10">
      <PageHeader
        title="Giám sát hệ thống"
        description="Theo dõi trạng thái microservice, gateway và hạ tầng"
        icon={<Activity className="w-5 h-5" />}
        actions={
          <button
            type="button"
            onClick={() => void run()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-[#E4DDD2] bg-white px-3.5 py-2 text-xs font-semibold text-[#1A1612] hover:bg-[#FAF8F5] disabled:opacity-60 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        }
      />

      {/* Tổng quan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <p className="flex items-center gap-2 text-xs text-[#6B6358]">
            <Activity className="w-4 h-4" /> Trạng thái tổng thể
          </p>
          <div className="mt-3">
            <StatusBadge tone={overall.tone}>{overall.label}</StatusBadge>
          </div>
        </Card>
        <Card>
          <p className="flex items-center gap-2 text-xs text-[#6B6358]">
            <Server className="w-4 h-4" /> Microservice hoạt động
          </p>
          <p className="mt-2 text-2xl font-bold text-[#1A1612] tabular-nums">
            {hasData ? `${upCount}/${total}` : '—'}
          </p>
        </Card>
        <Card>
          <p className="flex items-center gap-2 text-xs text-[#6B6358]">
            <Clock className="w-4 h-4" /> Lần kiểm tra gần nhất
          </p>
          <p className="mt-3 text-sm font-bold text-[#1A1612] tabular-nums">
            {checkedAt ? fmtTime(checkedAt) : '—'}
          </p>
        </Card>
      </div>

      {/* Microservice */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-[#1A1612]">Trạng thái Microservice</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {SERVICES.map((s) => {
            const r = results[s.id];
            const tone: BadgeTone = !r ? 'idle' : r.up ? 'up' : 'down';
            const label = !r ? 'Đang kiểm tra' : r.up ? 'Hoạt động' : 'Ngừng hoạt động';
            return (
              <Card
                key={s.id}
                className="flex flex-col gap-3"
                onClick={() => setSelectedId(selectedId === s.id ? null : s.id)}
                selected={selectedId === s.id}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <IconTile>
                      <Server className="w-5 h-5" />
                    </IconTile>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-[#1A1612] leading-snug">{s.name}</p>
                      <p className="text-[11px] text-[#8A8175] truncate">{s.id}</p>
                    </div>
                  </div>
                  <StatusBadge tone={tone}>{label}</StatusBadge>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <StatBox label="Thời gian phản hồi" value={r ? (r.ms != null ? `${r.ms} ms` : 'Không có') : '—'} />
                  <StatBox label="Trạng thái" value={label} tone={r ? (r.up ? 'up' : 'down') : undefined} />
                </div>
                <p className="rounded-xl bg-[#FAF8F5] border border-[#F0EBE3] px-3 py-2 text-xs text-[#6B6358]">
                  {r ? r.message : 'Đang kiểm tra…'}
                </p>
                <p className="text-[11px] text-[#8A8175]">{selectedId === s.id ? 'Đang xem chi tiết' : 'Bấm để xem chi tiết'}</p>
              </Card>
            );
          })}
        </div>
        {selected && (
          <ServiceDetail
            key={selected.id}
            def={selected}
            result={results[selected.id]}
            history={history[selected.id]}
            gatewayDown={gatewayDown}
            now={checkedAt}
            onClose={() => setSelectedId(null)}
            onClear={() => clearHistory(selected.id)}
          />
        )}
      </section>

      {/* Hạ tầng */}
      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-[#1A1612]">Trạng thái hạ tầng</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Keycloak */}
          <Card className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <IconTile tone="gold">
                  <KeyRound className="w-5 h-5" />
                </IconTile>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1A1612]">Keycloak</p>
                  <p className="text-[11px] text-[#8A8175]">Identity &amp; access management</p>
                </div>
              </div>
              <StatusBadge tone={!keycloak ? 'idle' : keycloak.up ? 'up' : 'down'}>
                {!keycloak ? 'Đang kiểm tra' : keycloak.up ? 'Hoạt động' : 'Ngừng hoạt động'}
              </StatusBadge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatBox label="Realm" value={realm} />
              <StatBox
                label="Thời gian phản hồi"
                value={keycloak ? (keycloak.ms != null ? `${keycloak.ms} ms` : 'Không có') : '—'}
              />
            </div>
            <p className="rounded-xl bg-[#FAF8F5] border border-[#F0EBE3] px-3 py-2 text-xs text-[#6B6358] truncate">
              <span className="font-semibold text-[#1A1612]">Issuer:</span> {kcIssuer}
            </p>
            {keycloak && (
              <p
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs border ${
                  keycloak.up
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                    : 'bg-rose-50 text-rose-800 border-rose-100'
                }`}
              >
                {keycloak.up ? <CheckCircle2 className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                {keycloak.message}
              </p>
            )}
          </Card>

          {/* Kafka */}
          <Card className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <IconTile tone="purple">
                  <Database className="w-5 h-5" />
                </IconTile>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-[#1A1612]">Apache Kafka</p>
                  <p className="text-[11px] text-[#8A8175]">Message broker</p>
                </div>
              </div>
              <StatusBadge tone={!kafka ? 'idle' : kafka.state === 'up' ? 'up' : kafka.state === 'down' ? 'down' : 'idle'}>
                {!kafka ? 'Đang kiểm tra' : kafka.state === 'up' ? 'Hoạt động' : kafka.state === 'down' ? 'Ngừng hoạt động' : 'Chưa xác định'}
              </StatusBadge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatBox label="Broker" value={kafka?.data?.brokers ?? '—'} />
              <StatBox label="Consumer groups" value={kafka?.data?.consumerGroups ?? '—'} />
              <StatBox
                label="Thời gian phản hồi"
                value={kafka?.ms != null ? `${kafka.ms} ms` : '—'}
              />
              <StatBox
                label={`Lag (${kafka?.data?.groupId ?? 'payment-service'})`}
                value={kafka?.data?.lag ?? '—'}
                tone={kafka?.data?.lag ? 'down' : kafka?.data?.lag === 0 ? 'up' : undefined}
              />
            </div>
            <p className="rounded-xl bg-[#FAF8F5] border border-[#F0EBE3] px-3 py-2 text-xs text-[#6B6358] truncate">
              <span className="font-semibold text-[#1A1612]">Cluster ID:</span> {kafka?.data?.clusterId || '—'}
            </p>
            {kafka?.data?.groupState && (
              <p className="rounded-xl bg-[#FAF8F5] border border-[#F0EBE3] px-3 py-2 text-xs text-[#6B6358] truncate">
                <span className="font-semibold text-[#1A1612]">Topic {kafka.data.topic}:</span> group {kafka.data.groupState} · {kafka.data.groupMembers ?? 0} consumer
              </p>
            )}
            {kafka && (
              <p
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs border ${
                  kafka.state === 'up'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-100'
                    : kafka.state === 'down'
                      ? 'bg-rose-50 text-rose-800 border-rose-100'
                      : 'bg-[#F4F1EC] text-[#6B6358] border-[#E4DDD2]'
                }`}
              >
                {kafka.state === 'up' ? <CheckCircle2 className="w-4 h-4" /> : kafka.state === 'down' ? <WifiOff className="w-4 h-4" /> : <MinusCircle className="w-4 h-4" />}
                {kafka.message}
              </p>
            )}
          </Card>

        </div>
      </section>

      {/* Auto refresh */}
      <div className="flex items-start gap-3 rounded-2xl border border-[#EEDFC6] bg-[#FBF5EB] px-4 py-3">
        <Settings className="w-4 h-4 mt-0.5 text-[#B88E4F] shrink-0" />
        <div>
          <p className="text-sm font-semibold text-[#8A6A3A]">Tự động cập nhật</p>
          <p className="text-xs text-[#9A7B4C]">
            Trạng thái hệ thống được tự động kiểm tra lại mỗi {AUTO_REFRESH_MS / 1000} giây.
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chi tiết một service                                                */
/* ------------------------------------------------------------------ */

const ERROR_LABEL: Record<ErrorType, string> = {
  timeout: 'Hết thời gian chờ',
  network: 'Không kết nối được',
  http5xx: 'Lỗi HTTP 5xx',
};

const fmtClock = (t: number) => {
  const d = new Date(t);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.toLocaleTimeString('vi-VN', { hour12: false })} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
};

const CAUSE_STYLES = {
  down: 'bg-rose-50 text-rose-800 border-rose-100',
  warn: 'bg-amber-50 text-amber-800 border-amber-100',
  idle: 'bg-[#F4F1EC] text-[#6B6358] border-[#E4DDD2]',
} as const;

const LATENCY_STEPS = [50, 100, 200, 300, 500, 1000, 2000, 3000, 5000, 10000];

/** Làm tròn trần trục tung lên mốc dễ đọc để nhãn không bị lẻ. */
function niceMax(value: number) {
  return LATENCY_STEPS.find((step) => step >= value) ?? Math.ceil(value / 1000) * 1000;
}

function LatencyChart({ samples }: { samples: Sample[] }) {
  if (samples.length < 2) {
    return <p className="text-xs text-[#8A8175]">Cần ít nhất 2 lần kiểm tra để vẽ biểu đồ.</p>;
  }
  const H = 96;
  const n = samples.length;
  const values = samples.filter((s) => s.up && s.ms != null).map((s) => s.ms as number);
  const top = niceMax(Math.max(1, ...values));
  const xPct = (i: number) => (i / (n - 1)) * 100;
  const yPct = (v: number) => 100 - (v / top) * 100;
  let path = '';
  let drawing = false;
  samples.forEach((s, i) => {
    if (s.up && s.ms != null) {
      path += `${drawing ? 'L' : 'M'}${xPct(i).toFixed(2)} ${yPct(s.ms).toFixed(2)} `;
      drawing = true;
    } else {
      drawing = false;
    }
  });
  return (
    <div className="flex flex-col gap-1">
      <div className="flex gap-2">
        <div
          className="flex w-14 shrink-0 flex-col justify-between text-right text-[11px] tabular-nums text-[#8A8175]"
          style={{ height: H }}
        >
          <span>{top} ms</span>
          <span>{top / 2} ms</span>
          <span>0 ms</span>
        </div>
        <div className="relative flex-1" style={{ height: H }}>
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label="Biểu đồ thời gian phản hồi (ms)"
          >
            {[0, 50, 100].map((y) => (
              <line
                key={y}
                x1={0}
                x2={100}
                y1={y}
                y2={y}
                strokeWidth={1}
                strokeDasharray="3 3"
                vectorEffect="non-scaling-stroke"
                className="stroke-[#EEE7DC]"
              />
            ))}
            {samples.map((s, i) =>
              s.up ? null : <rect key={s.t} x={xPct(i) - 0.6} y={0} width={1.2} height={100} className="fill-rose-200" />,
            )}
            <path
              d={path}
              fill="none"
              strokeWidth={2}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              className="stroke-[#B88E4F]"
            />
          </svg>
          {samples.map((s, i) =>
            s.up && s.ms != null ? (
              <span
                key={s.t}
                title={`${fmtClock(s.t)} · ${s.ms} ms`}
                className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-[#B88E4F]"
                style={{ left: `${xPct(i)}%`, top: `${yPct(s.ms)}%` }}
              />
            ) : null,
          )}
        </div>
      </div>
      <p className="pl-16 text-[11px] text-[#8A8175]">
        Trục dọc là mili giây (ms), thấp hơn là nhanh hơn. Mỗi chấm là một lần kiểm tra, rê chuột để xem giờ và giá trị.
        Vạch đỏ là lần kiểm tra lỗi.
      </p>
    </div>
  );
}

function ServiceDetail({
  def,
  result,
  history,
  gatewayDown,
  now,
  onClose,
  onClear,
}: {
  def: (typeof SERVICES)[number];
  result: ProbeResult | undefined;
  history: ServiceHistory | undefined;
  gatewayDown: boolean;
  now: Date | null;
  onClose: () => void;
  onClear: () => void;
}) {
  const [api, setApi] = useState<{ state: 'loading' | 'ok' | 'error'; data?: ApiInfo; message?: string }>({
    state: 'loading',
  });

  useEffect(() => {
    let alive = true;
    setApi({ state: 'loading' });
    fetchApiInfo(def)
      .then((data) => alive && setApi({ state: 'ok', data }))
      .catch(
        (e) =>
          alive &&
          setApi({
            state: 'error',
            message: e?.name === 'AbortError' ? 'Quá thời gian phản hồi' : e?.message || 'Không đọc được',
          }),
      );
    return () => {
      alive = false;
    };
  }, [def]);

  const sum = summarize(history);
  const samples = history?.samples ?? [];
  const incidents = history?.incidents ?? [];
  const nowMs = (now ?? new Date()).getTime();
  const isGateway = def.id === 'scanms-gateway';
  const cause = result
    ? describeCause({ up: result.up, status: result.httpStatus, err: result.errorType }, { isGateway, gatewayDown })
    : null;
  const open = sum.openIncident;
  const tone: BadgeTone = !result ? 'idle' : result.up ? 'up' : 'down';
  const label = !result ? 'Đang kiểm tra' : result.up ? 'Hoạt động' : 'Ngừng hoạt động';
  const recent = samples.slice(-60);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-base font-bold text-[#1A1612]">{def.name}</p>
            <StatusBadge tone={tone}>{label}</StatusBadge>
          </div>
          <p className="text-[11px] text-[#8A8175] font-mono">{def.id}</p>
          <p className="mt-1 text-xs text-[#6B6358]">{def.role}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Đóng chi tiết"
          className="shrink-0 rounded-lg border border-[#E4DDD2] p-1.5 text-[#6B6358] hover:bg-[#FAF8F5]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {cause && (
        <div className={`rounded-xl border px-3 py-2.5 text-xs leading-relaxed ${CAUSE_STYLES[cause.tone]}`}>
          <p>
            <span className="font-semibold">{cause.title}.</span> {cause.text}
          </p>
          {open && (
            <p className="mt-1.5">
              Quan sát thấy lỗi từ <span className="font-semibold">{fmtClock(open.startedAt)}</span> (đã{' '}
              {formatDuration(nowMs - open.startedAt)}).
              {open.lastUpAt != null && <> Lần cuối còn thấy chạy: {fmtClock(open.lastUpAt)}.</>}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        <StatBox label="Cổng" value={def.port} />
        <StatBox label="Mã HTTP gần nhất" value={result?.httpStatus ?? '—'} />
        <StatBox label="Phản hồi hiện tại" value={result?.ms != null ? `${result.ms} ms` : '—'} />
        <StatBox label="Chu kỳ kiểm tra" value={`${AUTO_REFRESH_MS / 1000} giây`} />
        <StatBox label="Phản hồi trung bình" value={sum.avgMs != null ? `${sum.avgMs} ms` : '—'} />
        <StatBox label="Nhanh / chậm nhất" value={sum.minMs != null ? `${sum.minMs} / ${sum.maxMs} ms` : '—'} />
        <StatBox
          label="Tỷ lệ hoạt động"
          value={sum.uptimePct != null ? `${sum.uptimePct}%` : '—'}
          tone={sum.uptimePct == null ? undefined : sum.uptimePct >= 99 ? 'up' : sum.uptimePct < 90 ? 'down' : undefined}
        />
        <StatBox label="Số lần kiểm tra" value={sum.sampleCount} />
      </div>
      <p className="-mt-2 text-[11px] text-[#8A8175]">
        Số liệu tính trên các lần kiểm tra mà trình duyệt này đã thấy
        {sum.firstSampleAt ? ` (từ ${fmtClock(sum.firstSampleAt)})` : ''}. Lịch sử được giữ trong trình duyệt nên tải lại
        trang vẫn còn.
      </p>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold text-[#1A1612]">Thời gian phản hồi</h3>
        <LatencyChart samples={samples} />
        <div className="flex gap-0.5" aria-label="Các lần kiểm tra gần nhất">
          {recent.map((s) => (
            <span
              key={s.t}
              title={`${fmtClock(s.t)} · ${s.up ? (s.ms != null ? `${s.ms} ms` : 'OK') : 'Lỗi'}`}
              className={`flex-1 h-4 rounded-sm ${s.up ? 'bg-emerald-300' : 'bg-rose-400'}`}
            />
          ))}
        </div>
        <div className="flex justify-between text-[11px] text-[#8A8175]">
          <span>{recent[0] ? fmtClock(recent[0].t) : '—'}</span>
          <span>{recent.length ? fmtClock(recent[recent.length - 1].t) : '—'}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold text-[#1A1612]">Sự cố đã quan sát</h3>
        {incidents.length === 0 ? (
          <p className="text-xs text-[#6B6358]">Chưa thấy lần ngừng nào kể từ khi bắt đầu ghi lịch sử.</p>
        ) : (
          <ul className="flex flex-col">
            {incidents.map((i) => (
              <li
                key={i.id}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[#F0EBE3] py-2 text-xs"
              >
                <span className="font-mono text-[#6B6358] min-w-[110px]">{fmtClock(i.startedAt)}</span>
                <StatusBadge tone={i.endedAt === undefined ? 'down' : 'warn'}>
                  {i.endedAt === undefined ? 'Đang diễn ra' : formatDuration(i.endedAt - i.startedAt)}
                </StatusBadge>
                <span className="text-[#1A1612]">
                  {ERROR_LABEL[i.err]}
                  {i.status ? ` (HTTP ${i.status})` : ''}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] text-[#8A8175]">
          Thời điểm ngừng là lần đầu trình duyệt thấy lỗi. Nếu trang đóng lúc service sập, thời điểm thật có thể sớm hơn.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-xs font-bold text-[#1A1612]">Tài liệu API</h3>
        {api.state === 'loading' && <p className="text-xs text-[#6B6358]">Đang đọc…</p>}
        {api.state === 'error' && (
          <p className="text-xs text-[#6B6358]">
            Không đọc được tài liệu API: {api.message}
            {result && !result.up ? ' (service đang ngừng hoạt động)' : ''}.
          </p>
        )}
        {api.state === 'ok' && api.data && (
          <>
            <div className={`grid grid-cols-2 gap-2 ${api.data.documents != null ? 'md:grid-cols-3' : 'md:grid-cols-5'}`}>
              <StatBox label="Tên tài liệu" value={api.data.title ?? '—'} />
              <StatBox label="Phiên bản" value={api.data.version ?? '—'} />
              {api.data.documents != null ? (
                <StatBox label="Tài liệu gom" value={api.data.documents} />
              ) : (
                <>
                  <StatBox label="Endpoint" value={api.data.endpoints} />
                  <StatBox label="API (GET, POST…)" value={api.data.operations} />
                  <StatBox label="Nhóm API" value={api.data.tags.length || '—'} />
                </>
              )}
            </div>
            {api.data.documents == null && (
              <p className="text-[11px] text-[#8A8175]">
                Endpoint là địa chỉ URL của service. API là mỗi cách gọi (GET, POST, PUT…) trên endpoint đó. Ví dụ /users có
                GET và POST thì tính 1 endpoint và 2 API.
              </p>
            )}
            {api.data.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {api.data.tags.slice(0, 14).map((t) => (
                  <span
                    key={t}
                    className="rounded-full border border-[#E4DDD2] bg-[#FAF8F5] px-2.5 py-0.5 text-[11px] text-[#6B6358]"
                  >
                    {t}
                  </span>
                ))}
                {api.data.tags.length > 14 && <span className="text-[11px] text-[#8A8175]">+{api.data.tags.length - 14}</span>}
              </div>
            )}
          </>
        )}
      </div>

      <div className="rounded-xl border border-dashed border-[#E4DDD2] bg-[#FAF8F5] px-3 py-2.5 text-xs text-[#6B6358]">
        <p className="font-semibold text-[#1A1612]">Chưa có dữ liệu</p>
        <p className="mt-0.5">
          PID, bộ nhớ, thời điểm khởi động, log hoạt động, log lỗi và lý do tắt chính xác cần backend cung cấp thêm
          (Actuator và bộ theo dõi). Hiện trang chỉ suy luận từ kết quả kiểm tra.
        </p>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onClear}
          className="rounded-xl border border-[#E4DDD2] bg-white px-3 py-1.5 text-xs font-semibold text-[#6B6358] hover:bg-[#FAF8F5]"
        >
          Xóa lịch sử đã ghi
        </button>
      </div>
    </Card>
  );
}
