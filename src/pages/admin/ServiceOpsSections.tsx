import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { RefreshCw } from 'lucide-react';
import type { KafkaStatus } from '../../services/finance.service';
import {
  opsService,
  type CountRow,
  type GatewayRoutes,
  type OpsErrorEntry,
  type OpsInfo,
  type OpsLogs,
  type PaymentOverview,
} from '../../services/ops.service';
import { classifyOpsError, formatBytes, opsPath, percentOf, type OpsFailure } from '../../services/ops-format';
import { formatDuration } from '../../services/system-health-history';

/* ------------------------------------------------------------------ */
/* Phần dùng chung                                                     */
/* ------------------------------------------------------------------ */

type Tone = 'up' | 'down' | 'warn' | 'idle';

const PILL: Record<Tone, string> = {
  up: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  down: 'bg-rose-50 text-rose-700 border-rose-200',
  warn: 'bg-amber-50 text-amber-700 border-amber-200',
  idle: 'bg-[#F4F1EC] text-[#6B6358] border-[#E4DDD2]',
};

function Pill({ tone = 'idle', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${PILL[tone]}`}>
      {children}
    </span>
  );
}

function Stat({ label, value, tone }: { label: string; value: ReactNode; tone?: 'up' | 'down' | 'warn' }) {
  const color = tone === 'up' ? 'text-emerald-700' : tone === 'down' ? 'text-rose-700' : tone === 'warn' ? 'text-amber-700' : 'text-[#1A1612]';
  return (
    <div className="rounded-xl bg-[#FAF8F5] border border-[#F0EBE3] px-3 py-2.5 min-w-0">
      <p className="text-[11px] text-[#8A8175]">{label}</p>
      <p className={`mt-1 text-sm font-bold tabular-nums truncate ${color}`} title={typeof value === 'string' ? value : undefined}>
        {value}
      </p>
    </div>
  );
}

function Block({
  title,
  onReload,
  loading,
  children,
}: {
  title: string;
  onReload?: () => void;
  loading?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-xs font-bold text-[#1A1612]">{title}</h3>
        {onReload && (
          <button
            type="button"
            onClick={onReload}
            disabled={loading}
            aria-label={`Làm mới ${title}`}
            className="inline-flex items-center gap-1 rounded-lg border border-[#E4DDD2] px-2 py-1 text-[11px] font-semibold text-[#6B6358] hover:bg-[#FAF8F5] disabled:opacity-60"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function Notice({ failure }: { failure: OpsFailure }) {
  const tone = failure.kind === 'unavailable' ? 'down' : failure.kind === 'error' ? 'warn' : 'idle';
  const style =
    tone === 'down'
      ? 'bg-rose-50 text-rose-800 border-rose-100'
      : tone === 'warn'
        ? 'bg-amber-50 text-amber-800 border-amber-100'
        : 'bg-[#F4F1EC] text-[#6B6358] border-[#E4DDD2]';
  return <p className={`rounded-xl border px-3 py-2 text-xs ${style}`}>{failure.message}</p>;
}

/**
 * Gọi một endpoint ops và giữ lại dữ liệu cũ khi tải lại (để danh sách log không nhấp nháy). Gọi lại mỗi khi
 * {@code tick} đổi, tức mỗi lần trang kiểm tra định kỳ.
 */
function useOps<T>(load: () => Promise<T>, tick: unknown) {
  const [state, setState] = useState<{ data: T | null; failure: OpsFailure | null; loading: boolean }>({
    data: null,
    failure: null,
    loading: true,
  });
  const loadRef = useRef(load);
  loadRef.current = load;
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const run = useCallback(async () => {
    setState((s) => ({ ...s, loading: true }));
    try {
      const data = await loadRef.current();
      if (alive.current) setState({ data, failure: null, loading: false });
    } catch (e) {
      if (alive.current) setState({ data: null, failure: classifyOpsError(e), loading: false });
    }
  }, []);

  useEffect(() => {
    void run();
  }, [run, tick]);

  return { ...state, reload: run };
}

const clock = (value: string | number | null | undefined) => {
  if (value == null) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.toLocaleTimeString('vi-VN', { hour12: false })} ${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
};

const number = (value: number | null | undefined) => (value == null ? '—' : value.toLocaleString('vi-VN'));

/* ------------------------------------------------------------------ */
/* Thông tin tiến trình và kết nối phụ thuộc                           */
/* ------------------------------------------------------------------ */

function OpsInfoBlock({ serviceId, tick }: { serviceId: string; tick: unknown }) {
  const { data, failure, loading, reload } = useOps<OpsInfo>(() => opsService.info(serviceId), tick);
  const heapPct = data ? percentOf(data.memory.heapUsedBytes, data.memory.heapMaxBytes) : null;
  return (
    <Block title="Thông tin máy chủ" onReload={reload} loading={loading}>
      {failure && <Notice failure={failure} />}
      {!failure && !data && <p className="text-xs text-[#6B6358]">Đang đọc…</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Stat label="PID" value={data.process.pid} />
            <Stat label="Máy chủ" value={data.process.host ?? '—'} />
            <Stat label="Java" value={data.process.javaVersion} />
            <Stat label="Spring Boot" value={data.process.springBootVersion} />
            <Stat label="Khởi động lúc" value={clock(data.process.startedAt)} />
            <Stat label="Đã chạy" value={formatDuration(data.process.uptimeMs)} />
            <Stat
              label="Bộ nhớ heap"
              value={`${formatBytes(data.memory.heapUsedBytes)} / ${formatBytes(data.memory.heapMaxBytes)}${heapPct != null ? ` (${heapPct}%)` : ''}`}
              tone={heapPct != null && heapPct >= 90 ? 'down' : heapPct != null && heapPct >= 75 ? 'warn' : undefined}
            />
            <Stat label="Luồng (cao nhất)" value={`${data.threads.live} (${data.threads.peak})`} />
          </div>
          <p className="text-[11px] text-[#8A8175]">
            Hệ điều hành: {data.process.os} · Profile: {data.profiles.length ? data.profiles.join(', ') : 'mặc định'}
          </p>
          {data.dependencies.length > 0 && (
            <ul className="flex flex-col">
              {data.dependencies.map((d) => (
                <li key={d.name} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[#F0EBE3] py-2 text-xs">
                  <span className="font-semibold text-[#1A1612] min-w-[90px]">{d.name}</span>
                  <Pill tone={d.status === 'UP' ? 'up' : 'down'}>{d.status === 'UP' ? 'Hoạt động' : 'Lỗi'}</Pill>
                  <span className="tabular-nums text-[#6B6358]">{d.latencyMs} ms</span>
                  {d.detail && <span className="text-[#6B6358]">{d.detail}</span>}
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </Block>
  );
}

/* ------------------------------------------------------------------ */
/* Log hoạt động và lỗi                                                */
/* ------------------------------------------------------------------ */

const LEVELS = ['ALL', 'ERROR', 'WARN', 'INFO'] as const;
const LEVEL_COLOR: Record<string, string> = {
  ERROR: 'text-rose-700',
  WARN: 'text-amber-700',
  INFO: 'text-[#6B6358]',
  DEBUG: 'text-[#8A8175]',
  TRACE: 'text-[#8A8175]',
};

function ErrorItem({ entry }: { entry: OpsErrorEntry }) {
  return (
    <li className="border-b border-[#F0EBE3] py-2 text-xs">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="font-mono text-[#6B6358]">{clock(entry.time)}</span>
        <span className="font-mono text-[11px] text-[#8A8175]">{entry.logger}</span>
      </div>
      <p className="mt-1 text-rose-800 break-words">{entry.message}</p>
      {entry.stackTrace && (
        <details className="mt-1">
          <summary className="cursor-pointer text-[11px] font-semibold text-[#6B6358]">Xem stack trace</summary>
          <pre className="mt-1 max-h-60 overflow-auto rounded-lg bg-[#FAF8F5] border border-[#F0EBE3] p-2 text-[11px] leading-relaxed whitespace-pre-wrap break-words">
            {entry.stackTrace}
          </pre>
        </details>
      )}
    </li>
  );
}

function OpsLogsBlock({ serviceId, tick }: { serviceId: string; tick: unknown }) {
  const { data, failure, loading, reload } = useOps<OpsLogs>(() => opsService.logs(serviceId, 'ALL'), tick);
  const [level, setLevel] = useState<(typeof LEVELS)[number]>('ALL');
  const entries = (data?.entries ?? []).filter((e) => level === 'ALL' || e.level === level);
  const countOf = (l: string) => (data?.entries ?? []).filter((e) => l === 'ALL' || e.level === l).length;
  return (
    <>
      <Block title="Log hoạt động" onReload={reload} loading={loading}>
        {failure && <Notice failure={failure} />}
        {!failure && !data && <p className="text-xs text-[#6B6358]">Đang đọc…</p>}
        {data && (
          <>
            <div className="flex flex-wrap gap-1.5">
              {LEVELS.map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLevel(l)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-semibold ${
                    level === l ? 'border-[#B88E4F] bg-[#FBF5EB] text-[#8A6A3A]' : 'border-[#E4DDD2] text-[#6B6358] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {l === 'ALL' ? 'Tất cả' : l} ({countOf(l)})
                </button>
              ))}
            </div>
            {entries.length === 0 ? (
              <p className="text-xs text-[#6B6358]">Không có dòng log nào ở mức này.</p>
            ) : (
              <div className="max-h-80 overflow-auto rounded-xl border border-[#F0EBE3] bg-white px-3 py-1">
                {entries.map((e, i) => (
                  <div key={`${e.time}-${i}`} className="flex gap-2 border-b border-[#F7F3EC] py-1 font-mono text-[11px] leading-relaxed">
                    <span className="shrink-0 text-[#8A8175]">{new Date(e.time).toLocaleTimeString('vi-VN', { hour12: false })}</span>
                    <span className={`shrink-0 w-11 font-semibold ${LEVEL_COLOR[e.level] ?? 'text-[#6B6358]'}`}>{e.level}</span>
                    <span className="min-w-0 break-words text-[#1A1612]">{e.message}</span>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-[#8A8175]">
              {data.size}/{data.capacity} dòng gần nhất, mới nhất ở trên. Log nằm trong bộ nhớ nên mất khi service khởi động lại,
              và đã che email, token, mật khẩu.
            </p>
          </>
        )}
      </Block>
      {data && (
        <Block title={`Lỗi gần nhất (${data.errors.length})`}>
          {data.errors.length === 0 ? (
            <p className="text-xs text-[#6B6358]">Chưa ghi nhận lỗi ERROR nào kể từ khi service khởi động.</p>
          ) : (
            <ul className="flex flex-col">
              {data.errors.map((e, i) => (
                <ErrorItem key={`${e.time}-${i}`} entry={e} />
              ))}
            </ul>
          )}
        </Block>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Gateway: danh sách route                                            */
/* ------------------------------------------------------------------ */

function GatewayRoutesBlock({ tick }: { tick: unknown }) {
  const { data, failure, loading, reload } = useOps<GatewayRoutes>(() => opsService.gatewayRoutes(), tick);
  return (
    <Block title="Route của Gateway" onReload={reload} loading={loading}>
      {failure && <Notice failure={failure} />}
      {!failure && !data && <p className="text-xs text-[#6B6358]">Đang đọc…</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Số route" value={data.count} />
            <Stat label="Issuer JWT" value={data.jwtIssuer ?? '—'} />
          </div>
          <div className="max-h-72 overflow-auto rounded-xl border border-[#F0EBE3]">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-[#FAF8F5] text-[#6B6358]">
                <tr>
                  <th className="px-3 py-1.5 font-semibold">Route</th>
                  <th className="px-3 py-1.5 font-semibold">Điều kiện</th>
                  <th className="px-3 py-1.5 font-semibold">Đích</th>
                </tr>
              </thead>
              <tbody>
                {data.routes.map((r) => (
                  <tr key={r.id} className="border-t border-[#F0EBE3] align-top">
                    <td className="px-3 py-1.5 font-mono text-[#1A1612]">{r.id}</td>
                    <td className="px-3 py-1.5 break-words text-[#6B6358]">{r.predicate}</td>
                    <td className="px-3 py-1.5 font-mono text-[#6B6358]">{r.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Block>
  );
}

/* ------------------------------------------------------------------ */
/* Payment: cờ cấu hình và số lượng theo trạng thái                    */
/* ------------------------------------------------------------------ */

function Flag({ label, on, good }: { label: string; on: boolean; good?: 'on' }) {
  const text = good ? (on ? 'Đã cấu hình' : 'Chưa cấu hình') : on ? 'Bật' : 'Tắt';
  const tone = good ? (on ? 'up' : 'warn') : undefined;
  return <Stat label={label} value={text} tone={tone} />;
}

function CountPills({ title, rows }: { title: string; rows: CountRow[] }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[11px] text-[#8A8175]">{title}</p>
      <div className="flex flex-wrap gap-1.5">
        {rows.length === 0 ? (
          <span className="text-xs text-[#6B6358]">Chưa có dữ liệu</span>
        ) : (
          rows.map((r) => (
            <Pill key={r.key}>
              {r.key}: {number(r.count)}
            </Pill>
          ))
        )}
      </div>
    </div>
  );
}

function PaymentOverviewBlock({ tick }: { tick: unknown }) {
  const { data, failure, loading, reload } = useOps<PaymentOverview>(() => opsService.paymentOverview(), tick);
  return (
    <Block title="Vận hành thanh toán" onReload={reload} loading={loading}>
      {failure && <Notice failure={failure} />}
      {!failure && !data && <p className="text-xs text-[#6B6358]">Đang đọc…</p>}
      {data && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Flag label="Chế độ sandbox" on={data.config.sandboxEnabled} />
            <Flag label="Tự động chi trả" on={data.config.automaticPayouts} />
            <Stat label="Độ trễ chi trả" value={`${Math.round(data.config.payoutDelayMs / 1000)} giây`} />
            <Stat label="Rút tối thiểu" value={`${number(data.config.minimumWithdrawalVnd)} đ`} />
            <Flag label="payOS thu tiền" on={data.config.paymentProviderConfigured} good="on" />
            <Flag label="payOS chi trả" on={data.config.payoutProviderConfigured} good="on" />
            <Flag label="Khóa mã hóa ngân hàng" on={data.config.bankEncryptionKeyConfigured} good="on" />
            <Flag label="Token dịch vụ" on={data.config.serviceTokenConfigured} good="on" />
            <Stat label="Sự kiện tài chính đang chờ" value={number(data.financeEvents.pending)} tone={data.financeEvents.pending > 0 ? 'warn' : undefined} />
            <Stat label="Sự kiện bị chặn" value={number(data.financeEvents.blocked)} tone={data.financeEvents.blocked > 0 ? 'down' : undefined} />
          </div>
          <CountPills title="Thanh toán theo trạng thái" rows={data.paymentsByStatus} />
          <CountPills title="Yêu cầu rút tiền theo trạng thái" rows={data.withdrawalsByStatus} />
          <CountPills title="Ví theo loại chủ" rows={data.walletsByOwnerType} />
          <p className="text-[11px] text-[#8A8175]">Chỉ gồm cờ cấu hình và số lượng bản ghi, không có khóa, mật khẩu hay số dư.</p>
        </>
      )}
    </Block>
  );
}

/* ------------------------------------------------------------------ */
/* Kafka: topic, partition, consumer                                   */
/* ------------------------------------------------------------------ */

export function KafkaDetailSection({ data }: { data: KafkaStatus }) {
  const topics = data.topics ?? [];
  const partitions = data.partitions ?? [];
  const members = data.members ?? [];
  if (!topics.length && !partitions.length && !members.length) {
    return (
      <p className="rounded-xl border border-[#E4DDD2] bg-[#F4F1EC] px-3 py-2 text-xs text-[#6B6358]">
        Chưa có chi tiết topic. Cần chạy lại payment-service bản mới.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      {topics.length > 0 && (
        <Block title="Topic">
          <ul className="flex flex-col">
            {topics.map((t) => (
              <li key={t.name} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-[#F0EBE3] py-1.5 text-xs">
                <span className="font-mono font-semibold text-[#1A1612]">{t.name}</span>
                <span className="text-[#6B6358]">{t.partitions} partition · {t.replicas} bản sao</span>
              </li>
            ))}
          </ul>
        </Block>
      )}
      {partitions.length > 0 && (
        <Block title={`Lag theo partition (${data.topic ?? 'topic'}, group ${data.groupId ?? ''})`}>
          <div className="overflow-auto rounded-xl border border-[#F0EBE3]">
            <table className="w-full text-left text-[11px]">
              <thead className="bg-[#FAF8F5] text-[#6B6358]">
                <tr>
                  <th className="px-3 py-1.5 font-semibold">Partition</th>
                  <th className="px-3 py-1.5 font-semibold">Offset cuối</th>
                  <th className="px-3 py-1.5 font-semibold">Đã xử lý</th>
                  <th className="px-3 py-1.5 font-semibold">Lag</th>
                </tr>
              </thead>
              <tbody>
                {partitions.map((p) => (
                  <tr key={p.partition} className="border-t border-[#F0EBE3] tabular-nums">
                    <td className="px-3 py-1.5">{p.partition}</td>
                    <td className="px-3 py-1.5">{p.endOffset}</td>
                    <td className="px-3 py-1.5">{p.committedOffset ?? '—'}</td>
                    <td className={`px-3 py-1.5 font-semibold ${p.lag > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{p.lag}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Block>
      )}
      <Block title={`Consumer đang kết nối (${members.length})`}>
        {members.length === 0 ? (
          <p className="text-xs text-[#6B6358]">Chưa có consumer nào trong group.</p>
        ) : (
          <ul className="flex flex-col">
            {members.map((m) => (
              <li key={m.clientId} className="border-b border-[#F0EBE3] py-1.5 text-xs">
                <span className="font-mono font-semibold text-[#1A1612]">{m.clientId}</span>
                <span className="ml-2 text-[#6B6358]">{m.host}</span>
                <p className="mt-0.5 font-mono text-[11px] text-[#6B6358] break-words">{m.partitions.join(', ') || 'chưa được gán partition'}</p>
              </li>
            ))}
          </ul>
        )}
      </Block>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Ghép các phần theo từng service                                     */
/* ------------------------------------------------------------------ */

export function ServiceOpsSections({ serviceId, tick }: { serviceId: string; tick: unknown }) {
  if (opsPath(serviceId, 'scanmsinfo') === null) {
    return (
      <p className="rounded-xl border border-[#E4DDD2] bg-[#F4F1EC] px-3 py-2 text-xs text-[#6B6358]">
        Service này không dùng Spring Boot nên chưa có thông tin máy chủ và log chi tiết. Hiện chỉ có kết quả kiểm tra sức khỏe ở trên.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-4">
      <OpsInfoBlock serviceId={serviceId} tick={tick} />
      {serviceId === 'scanms-gateway' && <GatewayRoutesBlock tick={tick} />}
      {serviceId === 'payment-service' && <PaymentOverviewBlock tick={tick} />}
      <OpsLogsBlock serviceId={serviceId} tick={tick} />
    </div>
  );
}
