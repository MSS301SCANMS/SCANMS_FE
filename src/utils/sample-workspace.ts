import type { SampleRequest, SampleRequestStatus } from '@/types/samples.types';

export const SAMPLE_STATUS_LABELS: Record<SampleRequestStatus, string> = {
  PENDING: 'Chờ Shop duyệt',
  APPROVED: 'Đã duyệt',
  REJECTED: 'Bị từ chối',
  SHIPPED: 'Đang giao',
  RECEIVED: 'Cần nộp video',
  VIDEO_SUBMITTED: 'Chờ nghiệm thu',
  REVISION_REQUIRED: 'Cần sửa video',
  COMPLETED: 'Hoàn thành',
  OVERDUE: 'Quá hạn',
  CANCELLED: 'Đã hủy',
  DELIVERY_ISSUE: 'Sự cố giao hàng',
};
export const canSubmitSampleVideo = (status: SampleRequestStatus) =>
  ['RECEIVED', 'REVISION_REQUIRED', 'OVERDUE'].includes(status);
export function sampleDeadline(request: SampleRequest): number | null {
  const raw = request.revisionDeadlineAt || request.deadlineAt;
  const time = raw ? new Date(raw).getTime() : NaN;
  return Number.isFinite(time) ? time : null;
}
export function sampleNeedsAttention(
  request: SampleRequest,
  now = Date.now(),
): boolean {
  if (request.status === 'DELIVERY_ISSUE') return true;
  const deadline = sampleDeadline(request);
  return (
    canSubmitSampleVideo(request.status) &&
    (request.status === 'OVERDUE' ||
      request.status === 'REVISION_REQUIRED' ||
      (deadline !== null && deadline <= now + 3 * 86400000))
  );
}
