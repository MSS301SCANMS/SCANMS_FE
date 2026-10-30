import { serverDate } from './server-date';

export function livestreamLifecycle(raw: any, now = Date.now()): { status: string; lifecycleReason?: string } {
  const status = raw?.status || 'SCHEDULED';
  const reason = raw?.participantRefs?.lifecycle?.reason || raw?.lifecycleReason;
  if (!['SCHEDULED', 'LIVE', 'PENDING_CREATOR'].includes(status)) return { status, lifecycleReason: reason };
  const end = Date.parse(serverDate(raw?.participantRefs?.endsAt || raw?.endsAt) || '');
  if (!Number.isFinite(end) || end > now) return { status, lifecycleReason: reason };
  const broadcast = status === 'LIVE' || Boolean(raw?.startedAt);
  return { status: broadcast ? 'ENDED' : 'CANCELLED', lifecycleReason: broadcast ? 'TIME_LIMIT_REACHED' : 'SCHEDULE_EXPIRED' };
}

export function livestreamStatusLabel(status: string, lifecycleReason?: string) {
  if (status === 'CANCELLED' && lifecycleReason === 'SCHEDULE_EXPIRED') return 'Đã hết lịch';
  return ({ SCHEDULED: 'Đã lên lịch', PENDING_CREATOR: 'Chờ KOL', PAUSED: 'Tạm dừng', LIVE: 'Đang live', ENDED: 'Đã kết thúc', CANCELLED: 'Đã hủy' } as Record<string, string>)[status] || status;
}
