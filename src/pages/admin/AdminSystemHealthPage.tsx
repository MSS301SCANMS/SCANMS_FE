import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
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
  MinusCircle,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import {
  HEALTH_AUTO_REFRESH_MS as AUTO_REFRESH_MS,
  HEALTH_SERVICES as SERVICES,
  KEYCLOAK_ISSUER,
  OVERALL_LABEL,
  runHealthCheck,
  type ProbeResult,
} from '../../services/system-health';

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

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-[#EEE7DC] bg-white p-4 shadow-[0_1px_2px_rgba(26,22,18,0.04)] ${className}`}>
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
      setCheckedAt(snap.checkedAt);
    } finally {
      runningRef.current = false;
      setLoading(false);
    }
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
      : upCount === total && keycloak?.up
        ? { tone: 'up', label: OVERALL_LABEL.HEALTHY }
        : { tone: 'warn', label: OVERALL_LABEL.DEGRADED };

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
              <Card key={s.id} className="flex flex-col gap-3">
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
              </Card>
            );
          })}
        </div>
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

          {/* Kafka — chưa cấu hình */}
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
              <StatusBadge tone="idle">Chưa cấu hình</StatusBadge>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <StatBox label="Broker" value="—" />
              <StatBox label="Consumer groups" value="—" />
            </div>
            <p className="rounded-xl bg-[#FAF8F5] border border-[#F0EBE3] px-3 py-2 text-xs text-[#6B6358]">
              <span className="font-semibold text-[#1A1612]">Cluster ID:</span> —
            </p>
            <p className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs border bg-[#F4F1EC] text-[#6B6358] border-[#E4DDD2]">
              <MinusCircle className="w-4 h-4" />
              Hệ thống chưa tích hợp Kafka — sẽ hiển thị khi backend cấu hình broker.
            </p>
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
