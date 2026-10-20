import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, X, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../utils/toast';
import { getPendingSampleReport, hasSampleDeadlineViolation, type SampleModerationRequest } from '../../utils/sampleModeration';
import './SampleViolationAction.css';

export default function SampleViolationAction({ request, blocked, onSuccess }: { request: SampleModerationRequest; blocked?: boolean; onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const report = getPendingSampleReport(request);
  if (blocked) return <span className="sample-violation-state">Admin đã khóa quyền nhận mẫu</span>;
  if (report) return <span className="sample-violation-state" title={report.details?.reason}>Đã báo cáo · Chờ Admin xét duyệt</span>;
  const canReport = hasSampleDeadlineViolation(request);
  if (!canReport) {
    if (!['RECEIVED', 'REVISION_REQUIRED'].includes(request.status)) return null;
    const deadline = request.revisionDeadlineAt || request.deadlineAt;
    const deadlineLabel = deadline ? new Date(deadline).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : null;
    return <div className="sample-violation-unavailable">
      <button type="button" disabled className="sample-violation-button" title={deadlineLabel ? `Có thể báo cáo khi KOL chưa nộp video sau hạn ${deadlineLabel}.` : 'Chưa xác lập hạn nộp video.'}><ShieldAlert size={14} />Báo cáo quá hạn</button>
      <small>{deadlineLabel ? `Chưa quá hạn · ${deadlineLabel}` : 'Chưa xác lập hạn video'}</small>
    </div>;
  }

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (saving || !reason.trim()) return;
    setSaving(true);
    try {
      await api.post(`/sample-requests/${request.id}/report-violation`, { reason: reason.trim() });
      toast.success('Đã gửi báo cáo để Admin xem xét.');
      setOpen(false);
      setReason('');
      onSuccess();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || 'Không thể gửi báo cáo.');
    } finally { setSaving(false); }
  };

  return <>
    <button type="button" className="sample-violation-button" onClick={() => setOpen(true)}><ShieldAlert size={14} />Báo cáo quá hạn</button>
    {open && createPortal(<div className="sample-violation-overlay" onKeyDown={event => { if (event.key === 'Escape' && !saving) setOpen(false); }}>
      <form className="sample-violation-dialog" role="dialog" aria-modal="true" aria-labelledby="sample-violation-title" onSubmit={submit}>
        <header><span className="sample-violation-modal-icon"><ShieldAlert size={19} /></span><div><h2 id="sample-violation-title">Đề nghị xử lý KOL quá hạn</h2><p>Yêu cầu mẫu #{request.id.slice(0, 8).toUpperCase()}</p></div><button type="button" aria-label="Đóng báo cáo" disabled={saving} onClick={() => setOpen(false)}><X size={18} /></button></header>
        <p className="sample-violation-explanation">Admin sẽ kiểm tra bằng chứng và quyết định khóa, gia hạn hoặc không chấp nhận báo cáo. Gửi báo cáo chưa khóa quyền nhận mẫu của KOL.</p>
        <label htmlFor="sample-violation-reason">Lý do và bằng chứng <span>*</span></label>
        <textarea autoFocus id="sample-violation-reason" required maxLength={500} rows={4} value={reason} onChange={event => setReason(event.target.value)} placeholder="Mô tả việc quá hạn, trao đổi với KOL và đường dẫn bằng chứng (nếu có)…" />
        <small>{reason.length}/500 ký tự</small>
        <footer><button type="button" disabled={saving} onClick={() => setOpen(false)}>Hủy bỏ</button><button type="submit" disabled={saving || !reason.trim()}>{saving && <Loader2 size={14} className="animate-spin" />}{saving ? 'Đang gửi…' : 'Gửi Admin xét duyệt'}</button></footer>
      </form>
    </div>, document.body)}
  </>;
}
