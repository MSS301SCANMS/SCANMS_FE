/**
 * Lịch sử kiểm tra do trình duyệt này quan sát (lưu localStorage) và phân tích nguyên nhân.
 * Không import module nào khác để test được bằng node và dùng lại cho trang Tổng quan.
 *
 * Giới hạn: chỉ biết những gì trang đã thấy lúc đang mở. Nếu service sập khi trang đóng thì
 * thời điểm ngừng chỉ là "lần đầu quan sát thấy", kèm mốc "còn chạy lần cuối" để người xem
 * biết khoảng không chắc chắn.
 */

export type ErrorType = 'timeout' | 'network' | 'http5xx';

export type Sample = { t: number; up: boolean; ms: number | null; status?: number; err?: ErrorType };

export type Incident = {
  id: string;
  /** Lần đầu quan sát thấy lỗi. */
  startedAt: number;
  /** Lần cuối còn thấy service chạy trước lỗi (nếu có), để biết khoảng sai số. */
  lastUpAt?: number;
  endedAt?: number;
  err: ErrorType;
  status?: number;
};

export type ServiceHistory = { samples: Sample[]; incidents: Incident[] };
export type HistoryMap = Record<string, ServiceHistory>;

export const HISTORY_KEY = 'scanms-system-health-history-v1';
export const MAX_SAMPLES = 120;
export const MAX_INCIDENTS = 20;

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export const emptyHistory = (): ServiceHistory => ({ samples: [], incidents: [] });

export function recordSample(prev: ServiceHistory | undefined, sample: Sample): ServiceHistory {
  const history = prev ?? emptyHistory();
  const before = history.samples[history.samples.length - 1];
  const samples = [...history.samples, sample].slice(-MAX_SAMPLES);
  const incidents = history.incidents.map((i) => ({ ...i }));
  const open = incidents.find((i) => i.endedAt === undefined);

  if (!sample.up) {
    if (!open) {
      incidents.unshift({
        id: `${sample.t}`,
        startedAt: sample.t,
        lastUpAt: before?.up ? before.t : undefined,
        err: sample.err ?? 'network',
        status: sample.status,
      });
    }
  } else if (open) {
    open.endedAt = sample.t;
  }
  return { samples, incidents: incidents.slice(0, MAX_INCIDENTS) };
}

export function loadHistory(storage: StorageLike | undefined): HistoryMap {
  try {
    const raw = storage?.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? (parsed as HistoryMap) : {};
  } catch {
    return {};
  }
}

export function saveHistory(storage: StorageLike | undefined, map: HistoryMap) {
  try {
    storage?.setItem(HISTORY_KEY, JSON.stringify(map));
  } catch {
    /* localStorage đầy hoặc bị chặn: bỏ qua, lịch sử chỉ mất khi tải lại trang. */
  }
}

export type HistorySummary = {
  sampleCount: number;
  firstSampleAt: number | null;
  uptimePct: number | null;
  avgMs: number | null;
  minMs: number | null;
  maxMs: number | null;
  openIncident: Incident | null;
};

export function summarize(history: ServiceHistory | undefined): HistorySummary {
  const samples = history?.samples ?? [];
  const msList = samples.filter((s) => s.up && s.ms != null).map((s) => s.ms as number);
  return {
    sampleCount: samples.length,
    firstSampleAt: samples[0]?.t ?? null,
    uptimePct: samples.length ? Math.round((samples.filter((s) => s.up).length / samples.length) * 1000) / 10 : null,
    avgMs: msList.length ? Math.round(msList.reduce((a, b) => a + b, 0) / msList.length) : null,
    minMs: msList.length ? Math.min(...msList) : null,
    maxMs: msList.length ? Math.max(...msList) : null,
    openIncident: history?.incidents.find((i) => i.endedAt === undefined) ?? null,
  };
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  if (total < 60) return `${total} giây`;
  const m = Math.floor(total / 60);
  if (m < 60) return `${m} phút ${total % 60} giây`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} giờ ${m % 60} phút`;
  return `${Math.floor(h / 24)} ngày ${h % 24} giờ`;
}

export type Cause = { tone: 'down' | 'warn' | 'idle'; title: string; text: string };

type CauseInput = { up: boolean; status?: number; err?: ErrorType };

/**
 * Gợi ý nguyên nhân từ cách lần kiểm tra thất bại. Chỉ là suy luận từ phía trình duyệt,
 * nên mọi câu đều dùng "nhiều khả năng" thay vì khẳng định.
 */
export function describeCause(r: CauseInput, ctx: { isGateway: boolean; gatewayDown: boolean }): Cause | null {
  if (r.up) return null;
  if (ctx.gatewayDown && !ctx.isGateway) {
    return {
      tone: 'idle',
      title: 'Chưa xác định',
      text: 'API Gateway không phản hồi nên không kiểm tra được service này. Hãy xem tình trạng Gateway trước.',
    };
  }
  if (r.err === 'timeout') {
    return {
      tone: 'warn',
      title: 'Không phản hồi kịp',
      text: ctx.isGateway
        ? 'Gateway quá chậm hoặc bị treo, chưa chắc đã tắt.'
        : 'Service quá chậm hoặc bị treo, nhiều khả năng chưa tắt hẳn (nghẽn xử lý, hết bộ nhớ hoặc chờ DB).',
    };
  }
  if (r.err === 'network') {
    return {
      tone: 'down',
      title: 'Không kết nối được',
      text: ctx.isGateway
        ? 'Gateway nhiều khả năng đã tắt, hoặc địa chỉ/cổng sai, hoặc trình duyệt bị chặn (CORS/mạng).'
        : 'Không tới được máy chủ, nhiều khả năng do mạng hoặc trình duyệt bị chặn.',
    };
  }
  if (r.status === 502 || r.status === 503 || r.status === 504) {
    return {
      tone: 'down',
      title: 'Gateway không gọi được service',
      text: `Gateway vẫn chạy nhưng báo HTTP ${r.status} khi chuyển tiếp, nhiều khả năng service đã tắt, đang khởi động lại hoặc quá tải.`,
    };
  }
  return {
    tone: 'warn',
    title: 'Đang chạy nhưng báo lỗi',
    text: `Service phản hồi HTTP ${r.status ?? '5xx'}, nhiều khả năng vẫn chạy nhưng gặp lỗi nội bộ (xem log của service).`,
  };
}
