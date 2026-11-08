import { serverDate } from './server-date';

export function livestreamLifecycle(raw: any, now = Date.now()): { status: string; lifecycleReason?: string } {
  const status = raw?.status || 'SCHEDULED';
  const reason = raw?.participantRefs?.lifecycle?.reason || raw?.lifecycleReason;
  if (status !== 'LIVE') return { status, lifecycleReason: reason };
  const end = Date.parse(serverDate(raw?.participantRefs?.endsAt || raw?.endsAt) || '');
  if (!Number.isFinite(end) || end > now) return { status, lifecycleReason: reason };
  return { status: 'ENDED', lifecycleReason: 'TIME_LIMIT_REACHED' };
}

export function livestreamStatusLabel(status: string, lifecycleReason?: string) {
  if (status === 'CANCELLED' && lifecycleReason === 'SCHEDULE_EXPIRED') return 'Đã hết lịch';
  return ({ SCHEDULED: 'Đã lên lịch', PENDING_CREATOR: 'Chờ KOL', PAUSED: 'Tạm dừng', LIVE: 'Đang live', ENDED: 'Đã kết thúc', CANCELLED: 'Đã hủy' } as Record<string, string>)[status] || status;
}

type SortableLivestream = {
  id: string;
  status: string;
  inviteStatus?: string;
  startsAt?: string;
  endsAt?: string;
};

function sessionPriority(session: SortableLivestream): number {
  if (session.status === 'ENDED' || session.status === 'CANCELLED') return 3;
  if (session.status === 'LIVE' || session.status === 'PAUSED') return 0;
  return session.inviteStatus === 'PENDING' ? 1 : 2;
}

/** Keep actionable sessions above history without mutating the source list. */
export function sortLivestreamSessions<T extends SortableLivestream>(sessions: readonly T[]): T[] {
  return [...sessions].sort((left, right) => {
    const priority = sessionPriority(left) - sessionPriority(right);
    if (priority) return priority;
    const history = sessionPriority(left) === 3;
    const leftTime = Date.parse(serverDate(history ? left.endsAt || left.startsAt : left.startsAt) || '');
    const rightTime = Date.parse(serverDate(history ? right.endsAt || right.startsAt : right.startsAt) || '');
    if (Number.isFinite(leftTime) !== Number.isFinite(rightTime)) return Number.isFinite(leftTime) ? -1 : 1;
    if (Number.isFinite(leftTime) && leftTime !== rightTime) return history ? rightTime - leftTime : leftTime - rightTime;
    return left.id.localeCompare(right.id);
  });
}
