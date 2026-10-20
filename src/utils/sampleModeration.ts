export interface SampleModerationEvent {
  action: string;
  createdAt: string;
  details?: { reason?: string; late?: boolean } | null;
}

export interface SampleModerationRequest {
  id: string;
  status: string;
  deadlineAt?: string | null;
  revisionDeadlineAt?: string | null;
  videoSubmittedAt?: string | null;
  events?: SampleModerationEvent[];
}

export function getPendingSampleReport(request: SampleModerationRequest) {
  const latest = [...(request.events || [])]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .find(event => ['SAMPLE_VIOLATION_REPORTED', 'SAMPLE_REQUESTS_BLOCKED', 'SAMPLE_VIOLATION_DISMISSED', 'SAMPLE_ADMIN_DEADLINE_EXTENDED', 'SAMPLE_ADMIN_OBLIGATION_CANCELLED'].includes(event.action));
  return latest?.action === 'SAMPLE_VIOLATION_REPORTED' ? latest : null;
}

export function hasSampleDeadlineViolation(request: SampleModerationRequest) {
  if (request.status === 'OVERDUE') return true;
  const deadline = request.revisionDeadlineAt || request.deadlineAt;
  if (['RECEIVED', 'REVISION_REQUIRED'].includes(request.status)) return Boolean(deadline && Date.parse(deadline) <= Date.now());
  return request.status === 'VIDEO_SUBMITTED' && Boolean(
    (deadline && request.videoSubmittedAt && Date.parse(request.videoSubmittedAt) > Date.parse(deadline)) ||
    request.events?.some(event => event.action === 'SAMPLE_VIDEO_SUBMITTED' && event.details?.late),
  );
}
